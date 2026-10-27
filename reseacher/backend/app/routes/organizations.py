from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role, require_organization_access
from app.models.organization import OrganizationResponse, OrganizationCreate
from app.repositories import organizations as org_repo

router = APIRouter()

@router.get("/", response_model=List[OrganizationResponse])
def read_orgs(db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN"))):
    return org_repo.list_all(db)

@router.post("/", response_model=OrganizationResponse)
def create_org(org_in: OrganizationCreate, db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN"))):
    return org_repo.create(db, org_in.model_dump())

@router.get("/{id}", response_model=OrganizationResponse)
def read_org(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_organization_access(current_user, id)
    org = org_repo.get_by_id(db, id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.put("/{id}")
def update_org(id: str, update_data: dict, db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN", "ORGANIZATION"))):
    require_organization_access(current_user, id)
    success = org_repo.update(db, id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {"status": "success"}

@router.patch("/{id}/status")
def update_org_status(id: str, status: str, db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN"))):
    success = org_repo.update_status(db, id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {"status": "success"}
