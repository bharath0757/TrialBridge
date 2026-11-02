from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_db
from app.core.security import get_current_user
from datetime import datetime
from app.core.permissions import require_role, require_study_access, require_participant_self_access, require_study_record
from app.models.enrollment import EnrollmentResponse, EnrollmentCreate
from app.services.workflow_service import approve_enrollment
from app.repositories import enrollment as enroll_repo

router = APIRouter()

@router.post("/request", response_model=EnrollmentResponse)
def req_enroll(e_in: EnrollmentCreate, db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR"))):
    require_study_access(current_user, e_in.study_id, db)
    require_participant_self_access(current_user, e_in.participant_id, db)
    e_data = e_in.model_dump()
    e_data.update(status="PENDING_APPROVAL", created_at=datetime.utcnow())
    e_data["enrolled_by"] = current_user["id"]
    return enroll_repo.create(db, e_data)

@router.post("/{id}/approve")
def app_enroll(id: str, db = Depends(get_db), current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR"))):
    require_study_record(current_user, db.enrollments, id, db)
    approve_enrollment(db, id, current_user["id"])
    return {"status": "success"}
