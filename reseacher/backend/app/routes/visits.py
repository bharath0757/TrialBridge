from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role
from app.models.visit import VisitResponse, VisitCreate
from app.repositories import visits as visit_repo

router = APIRouter()

@router.get("/", response_model=List[VisitResponse])
def get_visits(participant_id: str = None, study_id: str = None, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if participant_id:
        return visit_repo.list_by_participant(db, participant_id)
    elif study_id:
        return visit_repo.list_by_study(db, study_id)
    return visit_repo.list_all(db)

@router.post("/", response_model=VisitResponse)
def create_visit(v_in: VisitCreate, db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PRINCIPAL_INVESTIGATOR"))):
    return visit_repo.create(db, v_in.model_dump())

@router.put("/{id}")
def update_visit(id: str, update_data: dict, db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PRINCIPAL_INVESTIGATOR"))):
    success = visit_repo.update(db, id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"status": "success"}
