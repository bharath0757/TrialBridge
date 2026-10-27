from bson import ObjectId
from typing import List, Optional

def create(db, org_data: dict) -> dict:
    result = db.organizations.insert_one(org_data)
    org_data["_id"] = str(result.inserted_id)
    return org_data

def get_by_id(db, org_id: str) -> Optional[dict]:
    org = db.organizations.find_one({"_id": ObjectId(org_id)})
    if org:
        org["_id"] = str(org["_id"])
    return org

def list_all(db) -> List[dict]:
    orgs = list(db.organizations.find())
    for org in orgs:
        org["_id"] = str(org["_id"])
    return orgs

def update(db, org_id: str, update_data: dict) -> bool:
    result = db.organizations.update_one({"_id": ObjectId(org_id)}, {"$set": update_data})
    return result.modified_count > 0

def update_status(db, org_id: str, status: str) -> bool:
    result = db.organizations.update_one({"_id": ObjectId(org_id)}, {"$set": {"status": status}})
    return result.modified_count > 0
