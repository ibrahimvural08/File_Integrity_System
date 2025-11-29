"""
File handling utilities including SHA-256 hash computation.
"""
import os
import hashlib
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile
from app.config import get_settings

settings = get_settings()


def ensure_upload_dir() -> Path:
    """Ensure the upload directory exists."""
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename to prevent collisions."""
    ext = Path(original_filename).suffix
    unique_name = f"{uuid.uuid4().hex}{ext}"
    return unique_name


def compute_sha256_hash(file_path: str) -> str:
    """Compute SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    
    with open(file_path, "rb") as f:
        # Read file in chunks for memory efficiency
        for chunk in iter(lambda: f.read(8192), b""):
            sha256_hash.update(chunk)
    
    return sha256_hash.hexdigest()


def compute_sha256_from_bytes(data: bytes) -> str:
    """Compute SHA-256 hash from bytes."""
    return hashlib.sha256(data).hexdigest()


async def save_upload_file(upload_file: UploadFile) -> tuple[str, str, int]:
    """
    Save an uploaded file and return its path, hash, and size.
    
    Returns:
        Tuple of (storage_path, sha256_hash, file_size)
    """
    ensure_upload_dir()
    
    # Generate unique filename
    unique_filename = generate_unique_filename(upload_file.filename)
    storage_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # Read file content
    content = await upload_file.read()
    file_size = len(content)
    
    # Validate file size
    if file_size > settings.MAX_FILE_SIZE:
        raise ValueError(f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE} bytes")
    
    # Compute hash from content
    sha256_hash = compute_sha256_from_bytes(content)
    
    # Save file
    async with aiofiles.open(storage_path, 'wb') as f:
        await f.write(content)
    
    # Reset file position for potential re-read
    await upload_file.seek(0)
    
    return storage_path, sha256_hash, file_size


def delete_file(storage_path: str) -> bool:
    """Delete a file from storage."""
    try:
        if os.path.exists(storage_path):
            os.remove(storage_path)
            return True
        return False
    except Exception:
        return False


def verify_file_integrity(storage_path: str, original_hash: str) -> tuple[bool, str]:
    """
    Verify file integrity by comparing hashes.
    
    Returns:
        Tuple of (is_valid, computed_hash)
    """
    if not os.path.exists(storage_path):
        raise FileNotFoundError(f"File not found: {storage_path}")
    
    computed_hash = compute_sha256_hash(storage_path)
    is_valid = computed_hash == original_hash
    
    return is_valid, computed_hash


def get_file_size(storage_path: str) -> int:
    """Get the size of a file in bytes."""
    return os.path.getsize(storage_path)
