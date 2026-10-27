from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user, hash_password
from app.core.permissions import require_role
from app.models.user import UserResponse, UserCreate
from app.repositories import users as user_repo

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def read_users(db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN", "ORGANIZATION"))):
    records = user_repo.list_all(db)
    if current_user['role'] == 'ORGANIZATION':
        org_id = current_user.get('organization_id')
        return [u for u in records if org_id and str(u.get('organization_id')) == str(org_id)]
    return records

@router.post("/", response_model=UserResponse)
def create_user(user_in: UserCreate, db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN", "ORGANIZATION"))):
    if current_user['role'] == 'ORGANIZATION':
        org_id = current_user.get('organization_id')
        if not org_id or user_in.role not in {'PRINCIPAL_INVESTIGATOR', 'RESEARCH_COORDINATOR', 'PARTICIPANT'}:
            raise HTTPException(status_code=403, detail='Organizations can only create users within their research team.')
        if user_in.organization_id and str(user_in.organization_id) != str(org_id):
            raise HTTPException(status_code=403, detail='Cannot create users in another organization.')
        user_in.organization_id = str(org_id)
    user_in.email = str(user_in.email).strip().lower()
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
    same_org = current_user.get('organization_id') and str(current_user.get('organization_id')) == str(user.get('organization_id'))
    if str(user['_id']) != str(current_user['id']) and current_user['role'] != 'PLATFORM_ADMIN' and not (current_user['role'] == 'ORGANIZATION' and same_org):
        raise HTTPException(status_code=403, detail='Not authorized to access this user.')
    return user

@router.put("/{id}")
def update_user(id: str, update_data: dict, db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN"))):
    success = user_repo.update(db, id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success"}
