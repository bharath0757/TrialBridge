from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import clinical_record_scope, require_clinical_record_access, require_participant_self_access, require_study_access
from app.models.document import DocumentResponse, DocumentCreate
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[DocumentResponse])
def list_docs(study_id: str = None, participant_id: str = None, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {}
    if study_id: query["study_id"] = study_id
    if participant_id: query["participant_id"] = participant_id
    
    docs = list(db.documents.find({"$and": [query, clinical_record_scope(current_user, db)]}))
    for d in docs: d["_id"] = str(d["_id"])
    return docs

@router.post("/", response_model=DocumentResponse)
def create_doc(d_in: DocumentCreate, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'PARTICIPANT':
        if not d_in.participant_id:
            raise HTTPException(status_code=403, detail='A participant profile is required.')
        require_participant_self_access(current_user, d_in.participant_id, db)
    elif d_in.study_id:
        require_study_access(current_user, d_in.study_id, db)
    if d_in.participant_id: require_participant_self_access(current_user, d_in.participant_id, db)
    d_data = d_in.model_dump()
    d_data["uploaded_by"] = current_user["id"]
    d_data["created_at"] = datetime.utcnow()
    res = db.documents.insert_one(d_data)
    d_data["_id"] = str(res.inserted_id)
    return d_data

@router.get("/{id}", response_model=DocumentResponse)
def get_doc(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    d = require_clinical_record_access(current_user, db.documents, id, db)
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    d["_id"] = str(d["_id"])
    return d
