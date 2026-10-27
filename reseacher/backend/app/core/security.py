from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8')[:72], hashed.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    if len(settings.JWT_SECRET) < 32:
        raise HTTPException(status_code=503, detail='Authentication is not configured.')
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    if len(settings.JWT_SECRET) < 32:
        raise HTTPException(status_code=503, detail='Authentication is not configured.')
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if not payload.get('sub') or not payload.get('exp') or payload.get('role') not in {'PLATFORM_ADMIN', 'ORGANIZATION', 'PRINCIPAL_INVESTIGATOR', 'RESEARCH_COORDINATOR', 'PARTICIPANT'}:
            raise JWTError('Invalid claims')
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    user_id: str = payload.get("sub")
    role: str = payload.get("role")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    from app.db.mongodb import get_db
    from app.repositories.users import get_by_id
    user = get_by_id(get_db(), user_id)
    if not user or user.get('is_locked') or not user.get('is_active', True):
        raise HTTPException(status_code=401, detail='Account is unavailable')
    return {'id': str(user['_id']), 'role': user['role'], 'email': user.get('email'),
            'organization_id': user.get('organization_id'), 'name': user.get('name', 'User')}
