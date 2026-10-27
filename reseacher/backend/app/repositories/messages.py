from bson import ObjectId
from typing import List, Optional

def create(db, msg_data: dict) -> dict:
    result = db.messages.insert_one(msg_data)
    msg_data["_id"] = str(result.inserted_id)
    return msg_data

def get_by_id(db, msg_id: str) -> Optional[dict]:
    msg = db.messages.find_one({"_id": ObjectId(msg_id)})
    if msg:
        msg["_id"] = str(msg["_id"])
    return msg

def list_by_user(db, user_id: str) -> List[dict]:
    msgs = list(db.messages.find({"$or": [{"from_id": user_id}, {"to_id": user_id}]}).sort("sent_at", -1))
    for m in msgs:
        m["_id"] = str(m["_id"])
    return msgs

def mark_read(db, msg_id: str) -> bool:
    result = db.messages.update_one({"_id": ObjectId(msg_id)}, {"$set": {"read": True}})
    return result.modified_count > 0
