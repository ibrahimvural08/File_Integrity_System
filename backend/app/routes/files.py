"""
File management routes for upload, download, and integrity verification.
"""
import os
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from app.security import get_current_user
from app.file_utils import (
    save_upload_file,
    delete_file,
    verify_file_integrity,
    compute_sha256_hash
)
from app.config import get_settings

router = APIRouter(prefix="/api/files", tags=["Files"])
settings = get_settings()


@router.post("/upload", response_model=schemas.FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file and compute its SHA-256 hash."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    try:
        # Save file and get hash
        storage_path, sha256_hash, file_size = await save_upload_file(file)
        
        # Create file record
        db_file = models.File(
            filename=os.path.basename(storage_path),
            original_filename=file.filename,
            file_size=file_size,
            content_type=file.content_type,
            sha256_hash=sha256_hash,
            storage_path=storage_path,
            owner_id=current_user.id,
            is_verified=True,
            last_verified_at=datetime.utcnow()
        )
        
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        # Create integrity log for upload
        integrity_log = models.IntegrityLog(
            file_id=db_file.id,
            check_type="upload",
            original_hash=sha256_hash,
            computed_hash=sha256_hash,
            is_valid=True
        )
        db.add(integrity_log)
        db.commit()
        
        return db_file
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/", response_model=schemas.FileListResponse)
async def list_files(
    skip: int = 0,
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files for the current user."""
    total = db.query(func.count(models.File.id)).filter(
        models.File.owner_id == current_user.id
    ).scalar()
    
    files = db.query(models.File).filter(
        models.File.owner_id == current_user.id
    ).order_by(models.File.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"files": files, "total": total}


@router.get("/{file_id}", response_model=schemas.FileResponse)
async def get_file_info(
    file_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file information by ID."""
    file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.owner_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return file


@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a file and verify its integrity."""
    file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.owner_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if not os.path.exists(file.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage"
        )
    
    # Verify integrity before download
    try:
        is_valid, computed_hash = verify_file_integrity(file.storage_path, file.sha256_hash)
        
        # Log the integrity check
        integrity_log = models.IntegrityLog(
            file_id=file.id,
            check_type="download",
            original_hash=file.sha256_hash,
            computed_hash=computed_hash,
            is_valid=is_valid,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(integrity_log)
        
        # Update file record
        file.download_count += 1
        file.last_verified_at = datetime.utcnow()
        file.is_verified = is_valid
        
        db.commit()
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="File integrity check failed. The file may have been corrupted or tampered with."
            )
        
        return FileResponse(
            path=file.storage_path,
            filename=file.original_filename,
            media_type=file.content_type
        )
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage"
        )


@router.post("/{file_id}/verify", response_model=schemas.IntegrityCheckResponse)
async def verify_file(
    file_id: int,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually verify a file's integrity."""
    file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.owner_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if not os.path.exists(file.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage"
        )
    
    try:
        is_valid, computed_hash = verify_file_integrity(file.storage_path, file.sha256_hash)
        
        # Log the integrity check
        integrity_log = models.IntegrityLog(
            file_id=file.id,
            check_type="manual",
            original_hash=file.sha256_hash,
            computed_hash=computed_hash,
            is_valid=is_valid,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(integrity_log)
        
        # Update file record
        file.last_verified_at = datetime.utcnow()
        file.is_verified = is_valid
        
        db.commit()
        
        message = "File integrity verified successfully." if is_valid else "File integrity check failed! The file may have been corrupted or tampered with."
        
        return schemas.IntegrityCheckResponse(
            file_id=file.id,
            filename=file.original_filename,
            original_hash=file.sha256_hash,
            computed_hash=computed_hash,
            is_valid=is_valid,
            checked_at=integrity_log.checked_at,
            message=message
        )
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage"
        )


@router.get("/{file_id}/history", response_model=schemas.FileIntegrityHistory)
async def get_file_history(
    file_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file information with integrity check history."""
    file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.owner_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    logs = db.query(models.IntegrityLog).filter(
        models.IntegrityLog.file_id == file_id
    ).order_by(models.IntegrityLog.checked_at.desc()).limit(50).all()
    
    return schemas.FileIntegrityHistory(file=file, integrity_logs=logs)


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file_endpoint(
    file_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file."""
    file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.owner_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete physical file
    delete_file(file.storage_path)
    
    # Delete database record (cascade will delete integrity logs)
    db.delete(file)
    db.commit()
    
    return None


@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for the current user."""
    # Total files
    total_files = db.query(func.count(models.File.id)).filter(
        models.File.owner_id == current_user.id
    ).scalar() or 0
    
    # Total size
    total_size = db.query(func.sum(models.File.file_size)).filter(
        models.File.owner_id == current_user.id
    ).scalar() or 0
    
    # Verified files
    verified_files = db.query(func.count(models.File.id)).filter(
        models.File.owner_id == current_user.id,
        models.File.is_verified == True
    ).scalar() or 0
    
    # Corrupted files
    corrupted_files = db.query(func.count(models.File.id)).filter(
        models.File.owner_id == current_user.id,
        models.File.is_verified == False
    ).scalar() or 0
    
    # Total downloads
    total_downloads = db.query(func.sum(models.File.download_count)).filter(
        models.File.owner_id == current_user.id
    ).scalar() or 0
    
    # Recent integrity checks
    user_file_ids = db.query(models.File.id).filter(
        models.File.owner_id == current_user.id
    ).subquery()
    
    recent_checks = db.query(models.IntegrityLog).filter(
        models.IntegrityLog.file_id.in_(user_file_ids)
    ).order_by(models.IntegrityLog.checked_at.desc()).limit(10).all()
    
    return schemas.DashboardStats(
        total_files=total_files,
        total_size=total_size,
        verified_files=verified_files,
        corrupted_files=corrupted_files,
        total_downloads=total_downloads,
        recent_checks=recent_checks
    )
