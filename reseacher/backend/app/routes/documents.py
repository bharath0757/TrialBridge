from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.models.document import DocumentResponse, DocumentCreate
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[DocumentResponse])
def list_docs(study_id: str = None, participant_id: str = None, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {}
    if study_id: query["study_id"] = study_id
    if participant_id: query["participant_id"] = participant_id
    
    docs = list(db.documents.find(query))
    for d in docs: d["_id"] = str(d["_id"])
    return docs

@router.post("/", response_model=DocumentResponse)
def create_doc(d_in: DocumentCreate, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    d_data = d_in.model_dump()
    d_data["uploaded_by"] = current_user["id"]
    d_data["created_at"] = datetime.utcnow()
    res = db.documents.insert_one(d_data)
    d_data["_id"] = str(res.inserted_id)
    return d_data

@router.get("/{id}", response_model=DocumentResponse)
def get_doc(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    d = db.documents.find_one({"_id": ObjectId(id)})
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    d["_id"] = str(d["_id"])
    return d
