from bson import ObjectId
from typing import List

def create(db, notif_data: dict) -> dict:
    result = db.notifications.insert_one(notif_data)
    notif_data["_id"] = str(result.inserted_id)
    return notif_data

def list_by_recipient(db, recipient_id: str) -> List[dict]:
    notifs = list(db.notifications.find({"recipient_id": recipient_id}).sort("created_at", -1))
    for n in notifs:
        n["_id"] = str(n["_id"])
    return notifs

def mark_read(db, notif_id: str) -> bool:
    result = db.notifications.update_one({"_id": ObjectId(notif_id)}, {"$set": {"read": True}})
    return result.modified_count > 0

def mark_all_read(db, recipient_id: str) -> bool:
    result = db.notifications.update_many({"recipient_id": recipient_id, "read": False}, {"$set": {"read": True}})
    return result.modified_count > 0

def count_unread(db, recipient_id: str) -> int:
    return db.notifications.count_documents({"recipient_id": recipient_id, "read": False})
