"""
SQLAlchemy database models.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship with files
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")


class File(Base):
    """File model storing file metadata and hash."""
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    content_type = Column(String(100))
    sha256_hash = Column(String(64), nullable=False, index=True)
    storage_path = Column(String(500), nullable=False)
    is_verified = Column(Boolean, default=True)
    upload_count = Column(Integer, default=1)
    download_count = Column(Integer, default=0)
    last_verified_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign key to user
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationship
    owner = relationship("User", back_populates="files")
    integrity_logs = relationship("IntegrityLog", back_populates="file", cascade="all, delete-orphan")


class IntegrityLog(Base):
    """Log of all integrity checks performed on files."""
    __tablename__ = "integrity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    check_type = Column(String(50), nullable=False)  # 'upload', 'download', 'manual'
    original_hash = Column(String(64), nullable=False)
    computed_hash = Column(String(64), nullable=False)
    is_valid = Column(Boolean, nullable=False)
    checked_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    
    # Relationship
    file = relationship("File", back_populates="integrity_logs")
