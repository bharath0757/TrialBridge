from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.models.message import MessageResponse, MessageCreate
from app.core.permissions import find_record
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
    msg = find_record(db.messages, id)
    if not msg:
        raise HTTPException(status_code=404, detail="Not found")
    if str(current_user['id']) not in {str(msg.get('from_id')), str(msg.get('to_id'))}:
        raise HTTPException(status_code=403, detail='Not authorized to read this message')
    msg['_id'] = str(msg['_id'])
    return msg

@router.patch("/{id}/read")
def mark_msg_read(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    msg = find_record(db.messages, id)
    if not msg:
        raise HTTPException(status_code=404, detail='Not found')
    if str(msg.get('to_id')) != str(current_user['id']):
        raise HTTPException(status_code=403, detail='Only the recipient can mark a message read')
    success = msg_repo.mark_read(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "success"}
