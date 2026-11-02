from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role, require_participant_self_access, require_study_access
from app.models.screening import ScreeningResultResponse
from app.services.screening_service import run_screening
from app.repositories import screening as screening_repo

router = APIRouter()

@router.post("/run", response_model=ScreeningResultResponse)
def execute_screening(participant_id: str, study_id: str, db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PRINCIPAL_INVESTIGATOR", "PLATFORM_ADMIN"))):
    require_study_access(current_user, study_id, db)
    require_participant_self_access(current_user, participant_id, db)
    return run_screening(db, participant_id, study_id)

@router.get("/{participant_id}/{study_id}", response_model=ScreeningResultResponse)
def read_screening(participant_id: str, study_id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_participant_self_access(current_user, participant_id, db)
    if current_user["role"] != "PARTICIPANT":
        require_study_access(current_user, study_id, db)
    sr = screening_repo.get_by_participant_study(db, participant_id, study_id)
    if not sr:
        raise HTTPException(status_code=404, detail="Screening result not found")
    return sr
