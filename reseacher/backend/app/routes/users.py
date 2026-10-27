from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user, hash_password
from app.core.permissions import require_role
from app.models.user import UserResponse, UserCreate
from app.repositories import users as user_repo

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def read_users(db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN"))):
    return user_repo.list_all(db)

@router.post("/", response_model=UserResponse)
def create_user(user_in: UserCreate, db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN", "ORGANIZATION"))):
    if user_repo.get_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_data = user_in.model_dump(exclude={"password"})
    user_data["hashed_password"] = hash_password(user_in.password)
    return user_repo.create(db, user_data)

@router.get("/{id}", response_model=UserResponse)
def read_user(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = user_repo.get_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{id}")
def update_user(id: str, update_data: dict, db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN"))):
    success = user_repo.update(db, id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success"}
