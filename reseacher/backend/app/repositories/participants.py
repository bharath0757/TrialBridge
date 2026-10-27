from bson import ObjectId
from typing import List, Optional

def create(db, p_data: dict) -> dict:
    result = db.participants.insert_one(p_data)
    p_data["_id"] = str(result.inserted_id)
    return p_data

def get_by_id(db, p_id: str) -> Optional[dict]:
    p = db.participants.find_one({"_id": ObjectId(p_id)})
    if p:
        p["_id"] = str(p["_id"])
    return p

def get_by_code(db, code: str) -> Optional[dict]:
    p = db.participants.find_one({"participant_code": code})
    if p:
        p["_id"] = str(p["_id"])
    return p

def list_all(db) -> List[dict]:
    ps = list(db.participants.find())
    for p in ps:
        p["_id"] = str(p["_id"])
    return ps

def list_by_org(db, org_id: str) -> List[dict]:
    ps = list(db.participants.find({"organization_id": org_id}))
    for p in ps:
        p["_id"] = str(p["_id"])
    return ps

def list_by_study(db, study_id: str) -> List[dict]:
    # Need to join with study_participants
    sps = list(db.study_participants.find({"study_id": study_id}))
    p_ids = [ObjectId(sp["participant_id"]) for sp in sps]
    ps = list(db.participants.find({"_id": {"$in": p_ids}}))
    for p in ps:
        p["_id"] = str(p["_id"])
    return ps

def update(db, p_id: str, update_data: dict) -> bool:
    result = db.participants.update_one({"_id": ObjectId(p_id)}, {"$set": update_data})
    return result.modified_count > 0
