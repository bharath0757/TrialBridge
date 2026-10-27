from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role
from app.models.enrollment import EnrollmentResponse, EnrollmentCreate
from app.services.workflow_service import approve_enrollment
from app.repositories import enrollment as enroll_repo

router = APIRouter()

@router.post("/request", response_model=EnrollmentResponse)
def req_enroll(e_in: EnrollmentCreate, db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR"))):
    e_data = e_in.model_dump()
    e_data["enrolled_by"] = current_user["id"]
    return enroll_repo.create(db, e_data)

@router.post("/{id}/approve")
def app_enroll(id: str, db = Depends(get_db), current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR"))):
    approve_enrollment(db, id, current_user["id"])
    return {"status": "success"}
