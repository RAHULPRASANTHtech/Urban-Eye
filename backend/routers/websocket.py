from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect


router = APIRouter(
    tags=["WebSocket"]
)


# ============================================================
# WEBSOCKET CONNECTION MANAGER
# ============================================================

class ConnectionManager:

    def __init__(self):
        self.active_connections: List[WebSocket] = []


    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)


    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)


    async def broadcast(self, message: dict):

        disconnected_connections = []

        for connection in self.active_connections:

            try:
                await connection.send_json(message)

            except Exception:
                disconnected_connections.append(connection)


        # Remove dead connections safely
        for connection in disconnected_connections:
            self.disconnect(connection)


# ============================================================
# GLOBAL CONNECTION MANAGER
# ============================================================

manager = ConnectionManager()


# ============================================================
# WEBSOCKET ENDPOINT
# ============================================================

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await manager.connect(websocket)

    try:

        while True:
            # Keep the connection alive and allow future
            # client-to-server messages.
            await websocket.receive_text()

    except WebSocketDisconnect:

        manager.disconnect(websocket)

    except Exception:

        manager.disconnect(websocket)