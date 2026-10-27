from bson import ObjectId
from typing import List

def create(db, audit_data: dict) -> dict:
    result = db.audit_logs.insert_one(audit_data)
    audit_data["_id"] = str(result.inserted_id)
    return audit_data

def list_all(db) -> List[dict]:
    logs = list(db.audit_logs.find().sort("timestamp", -1))
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs

def list_by_entity(db, entity_type: str, entity_id: str) -> List[dict]:
    logs = list(db.audit_logs.find({"entity_type": entity_type, "entity_id": entity_id}).sort("timestamp", -1))
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs
