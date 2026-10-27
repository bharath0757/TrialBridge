import json
import logging
import asyncio
from typing import Dict, Set, Optional, Any, List
from fastapi import WebSocket

logger = logging.getLogger("connections")

class ConnectionManager:
    """
    Structured real-time WebSocket connection manager.
    Maintains active connections mapped by user_id and role for targeted routing.
    """
    def __init__(self):
        # Maps user_id -> Set of active WebSocket connections (allows multiple tabs/devices)
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Maps role -> Set of active WebSocket connections
        self.role_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

        if role not in self.role_connections:
            self.role_connections[role] = set()
        self.role_connections[role].add(websocket)
        logger.info(f"WebSocket connected: user={user_id}, role={role}. Active total for user={len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str, role: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        if role in self.role_connections:
            self.role_connections[role].discard(websocket)
            if not self.role_connections[role]:
                del self.role_connections[role]
        logger.info(f"WebSocket disconnected: user={user_id}, role={role}")

    def _serialize(self, message: Any) -> str:
        if isinstance(message, str):
            return message
        return json.dumps(message, default=str)

    async def send_personal_message(self, user_id: str, message: dict):
        """Send message directly to all active sockets of a specific user."""
        if user_id not in self.active_connections:
            return
        dead_sockets = []
        payload = self._serialize(message)
        for ws in list(self.active_connections[user_id]):
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed sending to user {user_id}: {e}")
                dead_sockets.append(ws)
        for ws in dead_sockets:
            self.active_connections[user_id].discard(ws)

    async def send_to_users(self, user_ids: List[str], message: dict):
        """Send message to multiple specified user IDs."""
        for uid in user_ids:
            if uid:
                await self.send_personal_message(str(uid), message)

    async def broadcast_to_role(self, role: str, message: dict):
        """Broadcast message to all connected users belonging to a specific role."""
        if role not in self.role_connections:
            return
        dead_sockets = []
        payload = self._serialize(message)
        for ws in list(self.role_connections[role]):
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed broadcasting to role {role}: {e}")
                dead_sockets.append(ws)
        for ws in dead_sockets:
            self.role_connections[role].discard(ws)

    async def broadcast_all(self, message: dict):
        """Broadcast message to all connected clients."""
        payload = self._serialize(message)
        all_sockets = set()
        for s_set in self.active_connections.values():
            all_sockets.update(s_set)
        for ws in list(all_sockets):
            try:
                await ws.send_text(payload)
            except Exception:
                pass

    def dispatch_personal_message_sync(self, user_id: str, message: dict):
        """Helper to safely schedule message dispatch from synchronous contexts."""
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.send_personal_message(user_id, message))
        except RuntimeError:
            try:
                asyncio.run(self.send_personal_message(user_id, message))
            except Exception as e:
                logger.warning(f"Error in sync message dispatch: {e}")

    def dispatch_role_message_sync(self, role: str, message: dict):
        """Helper to safely schedule role broadcast from synchronous contexts."""
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast_to_role(role, message))
        except RuntimeError:
            try:
                asyncio.run(self.broadcast_to_role(role, message))
            except Exception as e:
                logger.warning(f"Error in sync role broadcast: {e}")

    def dispatch_users_message_sync(self, user_ids: List[str], message: dict):
        """Helper to safely schedule multi-user message dispatch from synchronous contexts."""
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.send_to_users(user_ids, message))
        except RuntimeError:
            try:
                asyncio.run(self.send_to_users(user_ids, message))
            except Exception as e:
                logger.warning(f"Error in sync multi-user dispatch: {e}")

# Global singleton connection manager instance
connection_manager = ConnectionManager()


