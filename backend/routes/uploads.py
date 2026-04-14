"""
File Upload Routes
Handles image and video uploads
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from fastapi.responses import FileResponse
from pathlib import Path
import uuid
import os

from auth import get_current_user

router = APIRouter(prefix="/api", tags=["Uploads"])

# Create uploads directory - use relative path that works in both local and Docker
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

def get_base_url(request: Request) -> str:
    """Get the base URL from the request, handling proxies and env vars"""
    # Check forwarded headers first (set by reverse proxies like nginx/ingress)
    forwarded_proto = request.headers.get("x-forwarded-proto", "")
    forwarded_host = request.headers.get("x-forwarded-host", "")
    if forwarded_proto and forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}"
    # Fall back to env vars
    backend_url = os.environ.get("REACT_APP_BACKEND_URL", "")
    if not backend_url:
        backend_url = os.environ.get("BACKEND_URL", "")
    if backend_url:
        return backend_url
    # Final fallback to request URL
    return str(request.base_url).rstrip("/")

@router.post("/upload/image")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload an image file and return the URL"""
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.")
    
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    base_url = get_base_url(request)
    image_url = f"{base_url}/api/uploads/{unique_filename}"
    
    return {"url": image_url, "filename": unique_filename}

@router.post("/upload/document")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload a document file (PDF, images) and return the URL"""
    allowed_types = [
        "application/pdf",
        "image/jpeg", "image/png", "image/gif", "image/webp"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, JPEG, PNG, GIF, and WebP are allowed.")
    
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
    unique_filename = f"doc_{uuid.uuid4()}.{ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    base_url = get_base_url(request)
    doc_url = f"{base_url}/api/uploads/{unique_filename}"
    
    return {"url": doc_url, "filename": unique_filename, "content_type": file.content_type}

@router.post("/upload/video")
async def upload_video(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload a video file and return the URL"""
    allowed_types = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/mpeg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only MP4, WebM, MOV, AVI, and MPEG are allowed.")
    
    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")
    
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'mp4'
    unique_filename = f"video_{uuid.uuid4()}.{ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    base_url = get_base_url(request)
    video_url = f"{base_url}/api/uploads/{unique_filename}"
    
    return {"url": video_url, "filename": unique_filename}

@router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
