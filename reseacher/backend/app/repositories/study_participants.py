from bson import ObjectId
from typing import List, Optional

def create(db, sp_data: dict) -> dict:
    result = db.study_participants.insert_one(sp_data)
    sp_data["_id"] = str(result.inserted_id)
    return sp_data

def get(db, participant_id: str, study_id: str) -> Optional[dict]:
    sp = db.study_participants.find_one({"participant_id": participant_id, "study_id": study_id})
    if sp:
        sp["_id"] = str(sp["_id"])
    return sp

def list_by_study(db, study_id: str) -> List[dict]:
    sps = list(db.study_participants.find({"study_id": study_id}))
    for sp in sps:
        sp["_id"] = str(sp["_id"])
    return sps

def list_by_participant(db, participant_id: str) -> List[dict]:
    sps = list(db.study_participants.find({"participant_id": participant_id}))
    for sp in sps:
        sp["_id"] = str(sp["_id"])
    return sps

def update_status(db, participant_id: str, study_id: str, status: str) -> bool:
    result = db.study_participants.update_one(
        {"participant_id": participant_id, "study_id": study_id},
        {"$set": {"status": status}}
    )
    return result.modified_count > 0
