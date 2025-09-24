import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse
from .chat import manager
from .schemas import ChatMessage, HealthCheck, ConnectionStatus
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Create router for API endpoints
api_router = APIRouter()


@api_router.get("/", response_class=HTMLResponse)
async def get_chat_page():
    """Serve the main chat interface"""
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


@api_router.websocket("/ws/{user_name}")
async def websocket_endpoint(websocket: WebSocket, user_name: str):
    """WebSocket endpoint for real-time chat communication"""
    
    # Validate username length
    if len(user_name) > settings.max_username_length:
        await websocket.close(code=1008, reason="Username too long")
        return
    
    if not user_name.strip():
        await websocket.close(code=1008, reason="Username cannot be empty")
        return
    
    user = None
    try:
        # Connect user to chat
        user = await manager.connect(websocket, user_name.strip())
        logger.info(f"WebSocket connection established for user: {user_name}")
        
        # Listen for messages
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Validate message content
                message_content = message_data.get("message", "").strip()
                if not message_content:
                    continue
                    
                if len(message_content) > settings.max_message_length:
                    await manager.send_personal_message(
                        json.dumps({"error": "Message too long"}),
                        websocket
                    )
                    continue
                
                # Create and broadcast chat message
                chat_message = ChatMessage(
                    type="chat_message",
                    user_name=user.user_name,
                    message=message_content,
                    timestamp=time.time()
                )
                
                await manager.broadcast_to_room(chat_message)
                logger.debug(f"Message from {user_name}: {message_content}")
                
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from {user_name}")
                await manager.send_personal_message(
                    json.dumps({"error": "Invalid message format"}),
                    websocket
                )
            except Exception as e:
                logger.error(f"Error processing message from {user_name}: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user: {user_name}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_name}: {e}")
    finally:
        # Clean up connection
        if user:
            manager.disconnect(websocket)


@api_router.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    stats = manager.get_connection_stats()
    
    return HealthCheck(
        status="healthy",
        active_connections=stats["active_users"],
        version=settings.version,
        timestamp=time.time()
    )


@api_router.get("/stats")
async def get_stats():
    """Get chat statistics"""
    return manager.get_connection_stats()


@api_router.get("/room/{room_id}/stats")
async def get_room_stats(room_id: str):
    """Get statistics for a specific room"""
    return manager.get_room_stats(room_id)