from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.models.notification import NotificationResponse
from app.repositories import notifications as notif_repo

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_notifs(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return notif_repo.list_by_recipient(db, current_user["id"])

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from app.core.connections import connection_manager

class NotificationActionRequest(BaseModel):
    action: str

@router.patch("/{id}/read")
def mark_read(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    success = notif_repo.mark_read(db, id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "success"}

@router.patch("/read-all")
def mark_all_read(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    notif_repo.mark_all_read(db, current_user["id"])
    return {"status": "success"}

@router.post("/{id}/action")
def take_notification_action(
    id: str,
    body: NotificationActionRequest,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    action = body.action.upper()
    if action not in ('ACCEPT', 'REJECT'):
        raise HTTPException(status_code=422, detail='Action must be ACCEPT or REJECT')
    try:
        from bson import ObjectId
    except ImportError:
        ObjectId = None

    notif = None
    notif_filter = {"$or": [{"_id": id}, {"id": id}]}
    if ObjectId:
        try:
            notif_filter = {"$or": [{"_id": ObjectId(id)}, {"_id": id}, {"id": id}]}
        except Exception:
            pass

    if db is not None:
        notif = db.notifications.find_one(notif_filter)

    if not notif:
        raise HTTPException(status_code=404, detail='Notification not found')
    if str(notif.get('recipient_id')) != current_user['id']:
        raise HTTPException(status_code=403, detail='This notification belongs to another user')
    if notif.get('action_taken'):
        if notif['action_taken'] != action:
            raise HTTPException(status_code=409, detail='This invitation has already been answered')
        # Resume the same choice idempotently after an interrupted response.
    if notif.get('type') != 'TRIAL_INVITATION':
        raise HTTPException(status_code=400, detail='This notification is not a trial invitation')
    if not (notif.get('metadata') or {}).get('participant_id') or not ((notif.get('metadata') or {}).get('study_id') or notif.get('entity_id')):
        raise HTTPException(status_code=400, detail='The trial invitation is missing participant or study details')

    participant_id = notif["metadata"]["participant_id"]
    study_id = notif["metadata"].get("study_id") or notif["entity_id"]
    from app.core.permissions import require_participant_self_access
    if current_user["role"] != "PARTICIPANT":
        raise HTTPException(403, "Only participants can answer invitations")
    require_participant_self_access(current_user, participant_id, db)
    # Commit the choice once. Same-choice retries can finish any interrupted writes.
    chosen = db.notifications.update_one(
        {"_id": notif["_id"], "action_taken": {"$in": [None, action]}},
        {"$set": {"action_taken": action, "read": True, "updated_at": datetime.utcnow()}},
    )
    if not chosen.matched_count:
        raise HTTPException(409, "This invitation has already been answered")

    if action == "ACCEPT":
        # Auto-schedule baseline visit
        visit_date = (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d")
        visit_doc = {
            "participant_id": participant_id,
            "participantId": participant_id,
            "study_id": str(study_id),
            "studyId": str(study_id),
            "studyName": "Type 2 Diabetes Renal Dynamics Study",
            "visit_name": "Baseline Clinical Intake & Physical Exam",
            "type": "Baseline Clinical Intake",
            "date": visit_date,
            "time": "10:00 AM",
            "location": "Clinical Trial Unit - Suite 302",
            "status": "scheduled",
            "notes": "Automated baseline visit created upon participant trial acceptance.",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        visit_id = f"v-{int(datetime.utcnow().timestamp())}"
        if db is not None:
            visit_id = "baseline-" + str(notif["_id"])
            db.visits.update_one({"_id": visit_id}, {"$setOnInsert": visit_doc}, upsert=True)
            # Update participant status
            db.study_participants.update_one(
                {"participant_id": participant_id, "study_id": str(study_id)},
                {"$set": {"status": "ENROLLED", "updated_at": datetime.utcnow()}},
                upsert=True
            )

        # Broadcast real-time event
        event_payload = {
            "event": "TRIAL_DECISION_ACCEPTED",
            "participant_id": participant_id,
            "study_id": str(study_id),
            "visit": {
                "id": visit_id,
                "visit_name": "Baseline Clinical Intake & Physical Exam",
                "date": visit_date,
                "time": "10:00 AM",
                "status": "scheduled",
                "location": "Clinical Trial Unit - Suite 302"
            }
        }
        connection_manager.dispatch_personal_message_sync(current_user["id"], event_payload)

        return {
            "status": "success",
            "action_taken": "ACCEPT",
            "notification_id": id,
            "message": "Trial invitation accepted. Baseline visit scheduled.",
            "visit": {
                "id": visit_id,
                "date": visit_date,
                "time": "10:00 AM",
                "location": "Clinical Trial Unit - Suite 302",
                "status": "scheduled"
            }
        }
    else:
        # REJECT
        if db is not None:
            db.study_participants.update_one(
                {"participant_id": participant_id, "study_id": str(study_id)},
                {"$set": {"status": "NOT_ENROLLED", "updated_at": datetime.utcnow()}},
                upsert=True
            )
        return {
            "status": "success",
            "action_taken": "REJECT",
            "notification_id": id,
            "message": "Trial invitation declined."
        }

