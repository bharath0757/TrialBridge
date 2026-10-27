from datetime import datetime

def log_action(db, user_id: str, role: str, action: str, entity_type: str, entity_id: str, old_status: str = None, new_status: str = None, reason: str = None):
    audit_data = {
        "user_id": user_id,
        "role": role,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "old_status": old_status,
        "new_status": new_status,
        "reason": reason,
        "timestamp": datetime.utcnow()
    }
    result = db.audit_logs.insert_one(audit_data)
    return str(result.inserted_id)
