from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from .routes import api_router
from .config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description="A real-time chat application built with FastAPI and WebSockets",
        debug=settings.debug
    )
    
    # Mount static files
    app.mount("/static", StaticFiles(directory="app/static"), name="static")
    
    # Include API routes
    app.include_router(api_router)
    
    @app.on_event("startup")
    async def startup_event():
        logger.info(f"Starting {settings.app_name} v{settings.version}")
        logger.info(f"Debug mode: {settings.debug}")
    
    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Shutting down application")
    
    return app


# Create the app instance
app = create_app()