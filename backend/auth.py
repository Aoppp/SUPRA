import hmac
import os
import secrets
import sys
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

if not ADMIN_PASSWORD:
    print("[auth] WARNING: ADMIN_PASSWORD not set; generating random one — admin login will be impossible until you set it.", file=sys.stderr)
    ADMIN_PASSWORD = secrets.token_urlsafe(32)

if not JWT_SECRET:
    print("[auth] WARNING: JWT_SECRET not set; generating ephemeral one — all tokens invalidate on restart.", file=sys.stderr)
    JWT_SECRET = secrets.token_urlsafe(48)

security = HTTPBearer(auto_error=False)


def verify_password(password: str) -> bool:
    return hmac.compare_digest(password.encode(), ADMIN_PASSWORD.encode())


def create_token() -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {"exp": expire, "admin": True}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return True
