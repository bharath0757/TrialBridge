from bson import ObjectId
from typing import List, Optional

def create(db, sr_data: dict) -> dict:
    result = db.screening_results.insert_one(sr_data)
    sr_data["_id"] = str(result.inserted_id)
    return sr_data

def get_by_participant_study(db, participant_id: str, study_id: str) -> Optional[dict]:
    sr = db.screening_results.find_one({"participant_id": participant_id, "study_id": study_id})
    if sr:
        sr["_id"] = str(sr["_id"])
    return sr

def list_by_study(db, study_id: str) -> List[dict]:
    srs = list(db.screening_results.find({"study_id": study_id}))
    for sr in srs:
        sr["_id"] = str(sr["_id"])
    return srs
