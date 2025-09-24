from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json
import logging
from typing import List
import asyncio
import uuid

app = FastAPI(title="Real-time Chat Application")

# Connection manager to handle WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: dict = {}  # websocket -> user_info mapping

    async def connect(self, websocket: WebSocket, user_name: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        user_id = str(uuid.uuid4())
        self.user_connections[websocket] = {
            "user_id": user_id,
            "user_name": user_name
        }
        
        # Notify all users that someone joined
        await self.broadcast_message({
            "type": "user_joined",
            "user_name": user_name,
            "message": f"{user_name} joined the chat",
            "timestamp": asyncio.get_event_loop().time()
        })

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            user_info = self.user_connections.get(websocket, {})
            user_name = user_info.get("user_name", "Unknown user")
            
            self.active_connections.remove(websocket)
            if websocket in self.user_connections:
                del self.user_connections[websocket]
            
            # Notify remaining users that someone left
            asyncio.create_task(self.broadcast_message({
                "type": "user_left",
                "user_name": user_name,
                "message": f"{user_name} left the chat",
                "timestamp": asyncio.get_event_loop().time()
            }))

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_message(self, message: dict):
        message_text = json.dumps(message)
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_text)
            except:
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection)

# Create connection manager instance
manager = ConnectionManager()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def get_chat_page():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Real-time Chat</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/static/style.css">
    </head>
    <body>
        <div class="container">
            <div class="chat-header">
                <h1>Real-time Chat</h1>
                <div id="onlineUsers">Users online: <span id="userCount">0</span></div>
            </div>
            
            <div id="loginForm" class="login-form">
                <input type="text" id="usernameInput" placeholder="Enter your username" maxlength="20">
                <button onclick="joinChat()">Join Chat</button>
            </div>
            
            <div id="chatContainer" class="chat-container" style="display: none;">
                <div id="messages" class="messages"></div>
                <div class="message-input">
                    <input type="text" id="messageInput" placeholder="Type your message..." maxlength="500">
                    <button onclick="sendMessage()">Send</button>
                </div>
            </div>
        </div>
        
        <script src="/static/chat.js"></script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.websocket("/ws/{user_name}")
async def websocket_endpoint(websocket: WebSocket, user_name: str):
    await manager.connect(websocket, user_name)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Broadcast the message to all connected clients
            user_info = manager.user_connections.get(websocket, {})
            broadcast_message = {
                "type": "chat_message",
                "user_name": user_info.get("user_name", user_name),
                "message": message_data.get("message", ""),
                "timestamp": asyncio.get_event_loop().time()
            }
            
            await manager.broadcast_message(broadcast_message)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "active_connections": len(manager.active_connections)}
