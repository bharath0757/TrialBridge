from datetime import datetime
from typing import Optional, List, Dict, Any
from app.core.connections import connection_manager

def create_notification(
    db,
    recipient_id: str,
    type: str,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    requires_action: bool = False,
    actions: Optional[List[str]] = None,
    action_taken: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    notif_data = {
        "recipient_id": str(recipient_id),
        "type": type,
        "title": title,
        "message": message,
        "entity_type": entity_type,
        "entity_id": str(entity_id) if entity_id else None,
        "read": False,
        "requires_action": requires_action,
        "actions": actions or [],
        "action_taken": action_taken,
        "metadata": metadata or {},
        "created_at": datetime.utcnow()
    }
    inserted_id = None
    if db is not None:
        try:
            result = db.notifications.insert_one(notif_data)
            inserted_id = str(result.inserted_id)
            notif_data["id"] = inserted_id
            notif_data["_id"] = inserted_id
        except Exception as e:
            print(f"Warning: Failed saving notification to db: {e}")
            inserted_id = f"notif-{int(datetime.utcnow().timestamp())}"
            notif_data["id"] = inserted_id
    else:
        inserted_id = f"notif-{int(datetime.utcnow().timestamp())}"
        notif_data["id"] = inserted_id

    # Dispatch real-time WebSocket event to recipient
    event_payload = {
        "event": "NOTIFICATION_RECEIVED",
        "notification": {
            **notif_data,
            "id": inserted_id,
            "created_at": notif_data["created_at"].isoformat() if isinstance(notif_data["created_at"], datetime) else str(notif_data["created_at"])
        }
    }
    connection_manager.dispatch_personal_message_sync(str(recipient_id), event_payload)
    return inserted_id

def notify_role_for_study(
    db,
    study_id: str,
    role: str,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    if db is None:
        return
    study = None
    try:
        try:
            from bson import ObjectId
            study = db.studies.find_one({"_id": {"$in": [study_id, ObjectId(study_id)]}})
        except Exception:
            study = db.studies.find_one({"_id": study_id})
    except Exception:
        study = None
    if not study:
        return
    
    if role == "PRINCIPAL_INVESTIGATOR":
        pi_id = study.get("principal_investigator_id")
        if pi_id:
            create_notification(db, str(pi_id), "STUDY_UPDATE", title, message, entity_type, entity_id, metadata=metadata)
    elif role == "RESEARCH_COORDINATOR":
        # Check assigned coordinator or study members
        coord_id = study.get("coordinator_id")
        if coord_id:
            create_notification(db, str(coord_id), "STUDY_UPDATE", title, message, entity_type, entity_id, metadata=metadata)
        else:
            # Broadcast to all coordinators
            connection_manager.dispatch_role_message_sync("RESEARCH_COORDINATOR", {
                "event": "ROLE_BROADCAST",
                "title": title,
                "message": message,
                "study_id": str(study_id)
            })
