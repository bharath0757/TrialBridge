from bson import ObjectId
from typing import List, Optional

def create(db, study_data: dict) -> dict:
    result = db.studies.insert_one(study_data)
    study_data["_id"] = str(result.inserted_id)
    return study_data

def get_by_id(db, study_id: str) -> Optional[dict]:
    study = None
    try:
        study = db.studies.find_one({"_id": ObjectId(study_id)})
    except Exception:
        pass
    if not study:
        study = db.studies.find_one({"_id": study_id})
    if not study:
        study = db.studies.find_one({"id": study_id})
    if not study:
        study = db.studies.find_one({"study_code": study_id})
    if study:
        study["_id"] = str(study["_id"])
        study["id"] = str(study.get("id") or study["_id"])
    return study

def list_all(db) -> List[dict]:
    studies = list(db.studies.find())
    for s in studies:
        s["_id"] = str(s["_id"])
        s["id"] = str(s.get("id") or s["_id"])
    return studies

def list_by_org(db, org_id: str) -> List[dict]:
    studies = list(db.studies.find({"organization_id": org_id}))
    for s in studies:
        s["_id"] = str(s["_id"])
        s["id"] = str(s.get("id") or s["_id"])
    return studies

def list_by_pi(db, pi_id: str) -> List[dict]:
    studies = list(db.studies.find({"$or": [{"principal_investigator_id": pi_id}, {"principalInvestigator": pi_id}]}))
    for s in studies:
        s["_id"] = str(s["_id"])
        s["id"] = str(s.get("id") or s["_id"])
    return studies

def update(db, study_id: str, update_data: dict) -> bool:
    try:
        query = {"$or": [{"_id": ObjectId(study_id)}, {"_id": study_id}, {"id": study_id}, {"study_code": study_id}]}
    except Exception:
        query = {"$or": [{"_id": study_id}, {"id": study_id}, {"study_code": study_id}]}
    result = db.studies.update_one(query, {"$set": update_data})
    return result.modified_count > 0 or result.matched_count > 0
