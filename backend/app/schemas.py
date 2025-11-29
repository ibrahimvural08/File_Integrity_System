"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List


# ==================== User Schemas ====================

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Token Schemas ====================

class Token(BaseModel):
    """JWT token response schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    user_id: Optional[int] = None
    email: Optional[str] = None


# ==================== File Schemas ====================

class FileBase(BaseModel):
    """Base file schema."""
    original_filename: str
    file_size: int
    content_type: Optional[str] = None


class FileUploadResponse(FileBase):
    """Response after file upload."""
    id: int
    filename: str
    sha256_hash: str
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class FileResponse(FileBase):
    """Detailed file response."""
    id: int
    filename: str
    sha256_hash: str
    is_verified: bool
    upload_count: int
    download_count: int
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    """List of files response."""
    files: List[FileResponse]
    total: int


# ==================== Integrity Schemas ====================

class IntegrityCheckResponse(BaseModel):
    """Response for integrity check."""
    file_id: int
    filename: str
    original_hash: str
    computed_hash: str
    is_valid: bool
    checked_at: datetime
    message: str


class IntegrityLogResponse(BaseModel):
    """Integrity log entry response."""
    id: int
    check_type: str
    original_hash: str
    computed_hash: str
    is_valid: bool
    checked_at: datetime
    
    class Config:
        from_attributes = True


class FileIntegrityHistory(BaseModel):
    """File with its integrity check history."""
    file: FileResponse
    integrity_logs: List[IntegrityLogResponse]


# ==================== Dashboard Schemas ====================

class DashboardStats(BaseModel):
    """Dashboard statistics."""
    total_files: int
    total_size: int
    verified_files: int
    corrupted_files: int
    total_downloads: int
    recent_checks: List[IntegrityLogResponse]
