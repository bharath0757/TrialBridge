from bson import ObjectId
from typing import List, Optional

def create(db, consent_data: dict) -> dict:
    result = db.consents.insert_one(consent_data)
    consent_data["_id"] = str(result.inserted_id)
    return consent_data

def get_by_id(db, consent_id: str) -> Optional[dict]:
    try:
        query = {"_id": ObjectId(consent_id)}
    except Exception:
        query = {"_id": consent_id}
    consent = db.consents.find_one(query)
    if consent:
        consent["_id"] = str(consent["_id"])
    return consent

def list_all(db) -> List[dict]:
    consents = list(db.consents.find())
    for c in consents:
        c["_id"] = str(c["_id"])
    return consents

def list_by_participant(db, participant_id: str) -> List[dict]:
    consents = list(db.consents.find({"participant_id": participant_id}))
    for c in consents:
        c["_id"] = str(c["_id"])
    return consents

def get_by_participant_study(db, participant_id: str, study_id: str) -> Optional[dict]:
    consent = db.consents.find_one({"participant_id": participant_id, "study_id": study_id})
    if consent:
        consent["_id"] = str(consent["_id"])
    return consent

def update_status(db, consent_id: str, update_data: dict) -> bool:
    try:
        query = {"_id": ObjectId(consent_id)}
    except Exception:
        query = {"_id": consent_id}
    result = db.consents.update_one(query, {"$set": update_data})
    return result.modified_count > 0
