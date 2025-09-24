# New modular entry point for the FastAPI application
from app.main import app

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    )