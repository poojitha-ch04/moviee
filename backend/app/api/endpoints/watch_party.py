from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.movie import Movie

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps movie_id -> list of active websockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, movie_id: int):
        await websocket.accept()
        if movie_id not in self.active_connections:
            self.active_connections[movie_id] = []
        self.active_connections[movie_id].append(websocket)

    def disconnect(self, websocket: WebSocket, movie_id: int):
        if movie_id in self.active_connections and websocket in self.active_connections[movie_id]:
            self.active_connections[movie_id].remove(websocket)

    async def broadcast(self, message: str, movie_id: int, sender: WebSocket = None):
        if movie_id in self.active_connections:
            for connection in self.active_connections[movie_id]:
                if sender and connection == sender:
                    continue
                await connection.send_text(message)

    def get_active_parties(self):
        parties = []
        for movie_id, conns in self.active_connections.items():
            if len(conns) > 0:
                parties.append({"movie_id": movie_id, "viewers": len(conns)})
        return parties

manager = ConnectionManager()

@router.get("/active")
def get_active_parties(db: Session = Depends(get_db)):
    parties = manager.get_active_parties()
    if not parties:
        return []
        
    movie_ids = [p["movie_id"] for p in parties]
    movies = db.query(Movie).filter(Movie.id.in_(movie_ids)).all()
    movie_map = {m.id: m for m in movies}
    
    result = []
    for p in parties:
        movie = movie_map.get(p["movie_id"])
        if movie:
            result.append({
                "movie": movie,
                "viewers": p["viewers"]
            })
    return result

@router.websocket("/ws/{movie_id}")
async def websocket_endpoint(websocket: WebSocket, movie_id: int):
    await manager.connect(websocket, movie_id)
    try:
        import json
        while True:
            data = await websocket.receive_text()
            try:
                parsed_data = json.loads(data)
                event_type = parsed_data.get("type", "").upper()
                if event_type in ("PLAY", "PAUSE", "SEEK"):
                    # Broadcast to peers except sender for play/pause/seek to avoid bounce loops
                    # Or broadcast to everyone, but the instruction just says "broadcast them to peers"
                    await manager.broadcast(data, movie_id, websocket)
                elif event_type == "CHAT":
                    await manager.broadcast(data, movie_id, websocket)
                else:
                    await manager.broadcast(data, movie_id, websocket)
            except json.JSONDecodeError:
                await manager.broadcast(data, movie_id, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, movie_id)
        import json
        msg = json.dumps({"type": "chat", "message": "A user disconnected.", "user": "System"})
        await manager.broadcast(msg, movie_id)
