from typing import Dict, List
from fastapi import WebSocket
import uuid
import time
from .schemas import UserInfo


class User:
    """User model for chat participants"""
    
    def __init__(self, user_name: str, websocket: WebSocket):
        self.user_id = str(uuid.uuid4())
        self.user_name = user_name
        self.websocket = websocket
        self.connection_time = time.time()
        self.last_activity = time.time()
    
    def to_dict(self) -> Dict:
        """Convert user to dictionary"""
        return {
            "user_id": self.user_id,
            "user_name": self.user_name,
            "connection_time": self.connection_time,
            "last_activity": self.last_activity
        }
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = time.time()


class ChatRoom:
    """Chat room model for managing multiple users"""
    
    def __init__(self, room_id: str = "main"):
        self.room_id = room_id
        self.users: Dict[WebSocket, User] = {}
        self.created_at = time.time()
        self.message_count = 0
    
    def add_user(self, user: User) -> bool:
        """Add user to chat room"""
        if user.websocket not in self.users:
            self.users[user.websocket] = user
            return True
        return False
    
    def remove_user(self, websocket: WebSocket) -> User | None:
        """Remove user from chat room"""
        return self.users.pop(websocket, None)
    
    def get_user(self, websocket: WebSocket) -> User | None:
        """Get user by websocket"""
        return self.users.get(websocket)
    
    def get_user_count(self) -> int:
        """Get number of users in room"""
        return len(self.users)
    
    def get_all_users(self) -> List[User]:
        """Get list of all users"""
        return list(self.users.values())
    
    def increment_message_count(self):
        """Increment message counter"""
        self.message_count += 1