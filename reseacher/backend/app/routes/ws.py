import json
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.connections import connection_manager
from app.core.security import verify_token

logger = logging.getLogger("ws")
router = APIRouter()

def resolve_user_and_role(token: Optional[str], fallback_user_id=None, fallback_role=None):
    # Identity and role always come from a signed token, never query parameters.
    payload = verify_token(token or '')
    return str(payload['sub']), payload['role']

@router.websocket("/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
):
    try:
        resolved_user_id, resolved_role = resolve_user_and_role(token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await connection_manager.connect(websocket, resolved_user_id, resolved_role)
    try:
        # Send initial confirmation
        await websocket.send_text(json.dumps({
            "event": "WS_CONNECTED",
            "user_id": resolved_user_id,
            "role": resolved_role,
            "timestamp": datetime.utcnow().isoformat()
        }))

        while True:
            data = await websocket.receive_text()
            # Support ping keepalives
            if data == "ping":
                await websocket.send_text(json.dumps({"event": "pong", "timestamp": datetime.utcnow().isoformat()}))
                continue
            try:
                msg = json.loads(data)
                if msg.get("action") == "ping" or msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"event": "pong", "timestamp": datetime.utcnow().isoformat()}))
            except Exception:
                pass
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, resolved_user_id, resolved_role)
    except Exception as e:
        logger.warning(f"WebSocket session error for {resolved_user_id}: {e}")
        connection_manager.disconnect(websocket, resolved_user_id, resolved_role)
