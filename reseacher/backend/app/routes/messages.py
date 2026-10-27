from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.models.message import MessageResponse, MessageCreate
from app.repositories import messages as msg_repo

router = APIRouter()

@router.get("/", response_model=List[MessageResponse])
def get_messages(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return msg_repo.list_by_user(db, current_user["id"])

@router.post("/", response_model=MessageResponse)
def send_message(m_in: MessageCreate, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    m_data = m_in.model_dump()
    m_data["from_id"] = current_user["id"]
    return msg_repo.create(db, m_data)

@router.get("/{id}", response_model=MessageResponse)
def get_message(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    msg = msg_repo.get_by_id(db, id)
    if not msg:
        raise HTTPException(status_code=404, detail="Not found")
    return msg

@router.patch("/{id}/read")
def mark_msg_read(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    success = msg_repo.mark_read(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "success"}
