from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role, clinical_record_scope, require_clinical_record_access, require_study_access, require_participant_self_access
from app.models.visit import VisitResponse, VisitCreate
from app.repositories import visits as visit_repo

router = APIRouter()

@router.get("/", response_model=List[VisitResponse])
def get_visits(participant_id: str = None, study_id: str = None, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = clinical_record_scope(current_user, db)
    filters = {}
    if participant_id: filters['participant_id'] = participant_id
    if study_id: filters['study_id'] = study_id
    records = list(db.visits.find({'$and': [query, filters]}))
    for record in records: record['_id'] = str(record['_id'])
    return records

@router.post("/", response_model=VisitResponse)
def create_visit(v_in: VisitCreate, db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PRINCIPAL_INVESTIGATOR"))):
    require_study_access(current_user, v_in.study_id, db)
    require_participant_self_access(current_user, v_in.participant_id, db)
    return visit_repo.create(db, v_in.model_dump())

@router.put("/{id}")
def update_visit(id: str, update_data: dict, db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PRINCIPAL_INVESTIGATOR"))):
    require_clinical_record_access(current_user, db.visits, id, db)
    if update_data.get('study_id'): require_study_access(current_user, update_data['study_id'], db)
    if update_data.get('participant_id'): require_participant_self_access(current_user, update_data['participant_id'], db)
    success = visit_repo.update(db, id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"status": "success"}
