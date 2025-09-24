from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class MessageBase(BaseModel):
    """Base message schema"""
    message: str = Field(..., max_length=500, description="Message content")


class ChatMessage(BaseModel):
    """Chat message schema for WebSocket communication"""
    type: Literal["chat_message", "user_joined", "user_left", "system"] = Field(
        ..., description="Type of message"
    )
    user_name: str = Field(..., max_length=20, description="Username")
    message: str = Field(..., description="Message content")
    timestamp: float = Field(..., description="Message timestamp")


class UserInfo(BaseModel):
    """User information schema"""
    user_id: str = Field(..., description="Unique user identifier")
    user_name: str = Field(..., max_length=20, description="Display name")
    connection_time: float = Field(..., description="Connection timestamp")


class ConnectionStatus(BaseModel):
    """WebSocket connection status"""
    connected: bool = Field(..., description="Connection status")
    user_count: int = Field(..., description="Number of connected users")
    last_activity: Optional[float] = Field(None, description="Last activity timestamp")


class HealthCheck(BaseModel):
    """Health check response schema"""
    status: str = Field(..., description="Application status")
    active_connections: int = Field(..., description="Number of active connections")
    version: str = Field(..., description="Application version")
    timestamp: float = Field(..., description="Check timestamp")