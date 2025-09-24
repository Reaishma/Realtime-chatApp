import json
import asyncio
import time
from typing import Dict, List
from fastapi import WebSocket
from .models import User, ChatRoom
from .schemas import ChatMessage
from .config import settings
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and chat functionality"""
    
    def __init__(self):
        self.rooms: Dict[str, ChatRoom] = {}
        self.connection_count = 0
        
    def get_room(self, room_id: str = "main") -> ChatRoom:
        """Get or create a chat room"""
        if room_id not in self.rooms:
            self.rooms[room_id] = ChatRoom(room_id)
        return self.rooms[room_id]
    
    async def connect(self, websocket: WebSocket, user_name: str, room_id: str = "main"):
        """Connect a user to the chat"""
        try:
            await websocket.accept()
            self.connection_count += 1
            
            # Create user and add to room
            user = User(user_name, websocket)
            room = self.get_room(room_id)
            room.add_user(user)
            
            logger.info(f"User {user_name} connected to room {room_id}")
            
            # Notify room about new user
            join_message = ChatMessage(
                type="user_joined",
                user_name=user_name,
                message=f"{user_name} joined the chat",
                timestamp=time.time()
            )
            
            await self.broadcast_to_room(join_message, room_id)
            return user
            
        except Exception as e:
            logger.error(f"Error connecting user {user_name}: {e}")
            self.connection_count = max(0, self.connection_count - 1)
            raise
    
    def disconnect(self, websocket: WebSocket, room_id: str = "main"):
        """Disconnect a user from the chat"""
        try:
            room = self.get_room(room_id)
            user = room.remove_user(websocket)
            self.connection_count = max(0, self.connection_count - 1)
            
            if user:
                logger.info(f"User {user.user_name} disconnected from room {room_id}")
                
                # Notify room about user leaving
                leave_message = ChatMessage(
                    type="user_left",
                    user_name=user.user_name,
                    message=f"{user.user_name} left the chat",
                    timestamp=time.time()
                )
                
                # Use asyncio.create_task for fire-and-forget async operation
                asyncio.create_task(self.broadcast_to_room(leave_message, room_id))
                return user
                
        except Exception as e:
            logger.error(f"Error disconnecting user: {e}")
        
        return None
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific user"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def broadcast_to_room(self, message: ChatMessage, room_id: str = "main"):
        """Broadcast a message to all users in a room"""
        room = self.get_room(room_id)
        message_text = message.model_dump_json()
        disconnected_users = []
        
        for websocket, user in room.users.items():
            try:
                await websocket.send_text(message_text)
                user.update_activity()
            except Exception as e:
                logger.warning(f"Failed to send message to user {user.user_name}: {e}")
                disconnected_users.append(websocket)
        
        # Clean up disconnected users
        for websocket in disconnected_users:
            self.disconnect(websocket, room_id)
        
        # Update message count
        if message.type == "chat_message":
            room.increment_message_count()
    
    def get_room_stats(self, room_id: str = "main") -> Dict:
        """Get statistics for a room"""
        room = self.get_room(room_id)
        return {
            "room_id": room_id,
            "user_count": room.get_user_count(),
            "message_count": room.message_count,
            "created_at": room.created_at,
            "users": [user.to_dict() for user in room.get_all_users()]
        }
    
    def get_connection_stats(self) -> Dict:
        """Get overall connection statistics"""
        total_users = sum(room.get_user_count() for room in self.rooms.values())
        total_messages = sum(room.message_count for room in self.rooms.values())
        
        return {
            "total_connections": self.connection_count,
            "active_users": total_users,
            "total_rooms": len(self.rooms),
            "total_messages": total_messages,
            "rooms": list(self.rooms.keys())
        }


# Global connection manager instance
manager = ConnectionManager()