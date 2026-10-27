from bson import ObjectId
from typing import List, Optional

def create(db, v_data: dict) -> dict:
    result = db.visits.insert_one(v_data)
    v_data["_id"] = str(result.inserted_id)
    return v_data

def get_by_id(db, v_id: str) -> Optional[dict]:
    v = db.visits.find_one({"_id": ObjectId(v_id)})
    if v:
        v["_id"] = str(v["_id"])
    return v

def list_all(db) -> List[dict]:
    vs = list(db.visits.find())
    for v in vs:
        v["_id"] = str(v["_id"])
    return vs

def list_by_participant(db, participant_id: str) -> List[dict]:
    vs = list(db.visits.find({"participant_id": participant_id}))
    for v in vs:
        v["_id"] = str(v["_id"])
    return vs

def list_by_study(db, study_id: str) -> List[dict]:
    vs = list(db.visits.find({"study_id": study_id}))
    for v in vs:
        v["_id"] = str(v["_id"])
    return vs

def update(db, v_id: str, update_data: dict) -> bool:
    result = db.visits.update_one({"_id": ObjectId(v_id)}, {"$set": update_data})
    return result.modified_count > 0
