"""
Application configuration settings.
Uses environment variables for security.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:eren123@localhost:5432/file_integrity_db"
    
    # JWT Settings
    SECRET_KEY: str = "your-super-secret-key-change-in-production-use-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Upload Settings
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"


settings = Settings()


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
