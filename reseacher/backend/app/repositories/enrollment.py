from bson import ObjectId
from typing import List, Optional

def create(db, e_data: dict) -> dict:
    result = db.enrollments.insert_one(e_data)
    e_data["_id"] = str(result.inserted_id)
    return e_data

def get_by_id(db, e_id: str) -> Optional[dict]:
    e = db.enrollments.find_one({"_id": ObjectId(e_id)})
    if e:
        e["_id"] = str(e["_id"])
    return e

def get_by_participant_study(db, participant_id: str, study_id: str) -> Optional[dict]:
    e = db.enrollments.find_one({"participant_id": participant_id, "study_id": study_id})
    if e:
        e["_id"] = str(e["_id"])
    return e

def update_status(db, e_id: str, update_data: dict) -> bool:
    result = db.enrollments.update_one({"_id": ObjectId(e_id)}, {"$set": update_data})
    return result.modified_count > 0
