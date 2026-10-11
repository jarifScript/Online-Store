import logging

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import supabase

bearer = HTTPBearer()
log = logging.getLogger("uvicorn.error")


def require_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    """Any logged-in user."""
    try:
        user = supabase.auth.get_user(creds.credentials).user
    except Exception as e:
        log.error("Auth failed: %s: %s", type(e).__name__, e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def require_admin(user=Depends(require_user)):
    """Only users whose app_metadata role is 'admin'."""
    role = (user.app_metadata or {}).get("role")
    if role != "admin":
        log.error("Admin auth failed: user has role %r", role)
        raise HTTPException(status_code=403, detail="Admins only")
    return user


def optional_user(request: Request):
    """The logged-in user if there is a valid token, otherwise None (guest)."""
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        return None
    try:
        return supabase.auth.get_user(header[7:].strip()).user
    except Exception:
        return None