from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration settings"""
    
    # Application settings
    app_name: str = "Real-time Chat Application"
    version: str = "1.0.0"
    debug: bool = True
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 5000
    reload: bool = True
    
    # WebSocket settings
    max_connections: int = 100
    connection_timeout: int = 30
    max_reconnection_attempts: int = 5
    
    # Message settings
    max_username_length: int = 20
    max_message_length: int = 500
    
    # Security settings
    session_secret: Optional[str] = None
    
    class Config:
        env_file = ".env"


settings = Settings()