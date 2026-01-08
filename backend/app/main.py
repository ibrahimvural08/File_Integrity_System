"""
FastAPI main application.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.config import get_settings
from app.routes import auth, files

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Create upload directory on startup
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    yield
    
    # Cleanup on shutdown (if needed)




app = FastAPI(
    title="File Integrity System",
    description="Secure file upload and integrity verification system using SHA-256 hashing",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(files.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "File Integrity System API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
