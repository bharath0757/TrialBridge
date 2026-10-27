from bson import ObjectId
from typing import List, Optional

def create(db, task_data: dict) -> dict:
    result = db.tasks.insert_one(task_data)
    task_data["_id"] = str(result.inserted_id)
    return task_data

def get_by_id(db, task_id: str) -> Optional[dict]:
    task = db.tasks.find_one({"_id": ObjectId(task_id)})
    if task:
        task["_id"] = str(task["_id"])
    return task

def list_all(db) -> List[dict]:
    tasks = list(db.tasks.find())
    for t in tasks:
        t["_id"] = str(t["_id"])
    return tasks

def list_by_assignee(db, assignee_id: str) -> List[dict]:
    tasks = list(db.tasks.find({"assignee_id": assignee_id}))
    for t in tasks:
        t["_id"] = str(t["_id"])
    return tasks

def update_status(db, task_id: str, status: str) -> bool:
    result = db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": {"status": status}})
    return result.modified_count > 0
