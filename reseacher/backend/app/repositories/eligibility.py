from bson import ObjectId
from typing import List, Optional

def create(db, er_data: dict) -> dict:
    result = db.eligibility_reviews.insert_one(er_data)
    er_data["_id"] = str(result.inserted_id)
    return er_data

def get_by_id(db, er_id: str) -> Optional[dict]:
    er = db.eligibility_reviews.find_one({"_id": ObjectId(er_id)})
    if er:
        er["_id"] = str(er["_id"])
    return er

def list_pending_for_pi(db, pi_id: str) -> List[dict]:
    ers = list(db.eligibility_reviews.find({"assigned_to_pi": pi_id, "status": "PENDING_PI_REVIEW"}))
    for er in ers:
        er["_id"] = str(er["_id"])
    return ers

def list_by_study(db, study_id: str) -> List[dict]:
    ers = list(db.eligibility_reviews.find({"study_id": study_id}))
    for er in ers:
        er["_id"] = str(er["_id"])
    return ers

def update_decision(db, er_id: str, status: str, notes: str) -> bool:
    from datetime import datetime
    result = db.eligibility_reviews.update_one(
        {"_id": ObjectId(er_id)},
        {"$set": {"status": status, "pi_notes": notes, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0
