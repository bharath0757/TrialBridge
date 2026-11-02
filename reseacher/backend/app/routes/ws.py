import asyncio
import time
import json
from fastapi.concurrency import run_in_threadpool
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.connections import connection_manager
from app.core.security import verify_token, get_current_user

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
        claims = verify_token(token or "")
        account = await run_in_threadpool(get_current_user, token)
        resolved_user_id, resolved_role = account["id"], account["role"]
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

        next_check = time.monotonic() + 30
        while True:
            remaining = claims["exp"] - time.time()
            if remaining <= 0:
                await websocket.close(code=1008)
                break
            if time.monotonic() >= next_check:
                try:
                    account = await run_in_threadpool(get_current_user, token)
                    if account["role"] != resolved_role:
                        raise ValueError("Role changed")
                except Exception:
                    await websocket.close(code=1008)
                    break
                next_check = time.monotonic() + 30
            try:
                data = await asyncio.wait_for(websocket.receive_text(), min(remaining, next_check - time.monotonic()))
            except asyncio.TimeoutError:
                continue
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
        pass
    except Exception as e:
        logger.warning(f"WebSocket session error for {resolved_user_id}: {e}")
    finally:
        connection_manager.disconnect(websocket, resolved_user_id, resolved_role)
