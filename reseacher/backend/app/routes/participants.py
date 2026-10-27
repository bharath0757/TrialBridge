from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role, require_participant_self_access
from app.core.connections import connection_manager
from app.services.notification_service import create_notification
from app.models.participant import ParticipantResponse, ParticipantCreate
from app.models.study import StudyResponse
from app.repositories import participants as participant_repo
from app.repositories import study_participants as sp_repo
from app.repositories import studies as study_repo

router = APIRouter()

class TrialDecisionRequest(BaseModel):
    decision: str
    study_id: Optional[str] = None
    notification_id: Optional[str] = None

class ScreeningApproveRequest(BaseModel):
    reviewer_name: Optional[str] = None
    notes: Optional[str] = None

def _enrich_participant(db, p: dict) -> dict:
    from bson import ObjectId
    p["id"] = str(p.get("_id") or p.get("id"))
    
    # User details
    u_id = p.get("user_id")
    u_doc = None
    if u_id:
        try:
            u_doc = db.users.find_one({"_id": ObjectId(u_id)})
        except Exception:
            u_doc = db.users.find_one({"_id": u_id})
    if not u_doc and p.get("email"):
        u_doc = db.users.find_one({"email": p["email"]})
        
    p["name"] = u_doc.get("name") if u_doc else p.get("name", f"Participant {p.get('participant_code', '')}")
    p["email"] = u_doc.get("email") if u_doc else p.get("email", "")
    
    # Clinical attributes
    clin = p.get("clinical_attributes") or {}
    p["age"] = clin.get("age") or p.get("age", 45)
    p["gender"] = clin.get("gender") or p.get("gender", "Male")
    p["phone"] = p.get("phone", "+91 98765 43210")
    p["location"] = p.get("location", "Main Site")
    p["clinicalData"] = p.get("clinicalData") or clin.get("clinicalData") or (clin if "baselineHba1c" in clin or "doseMg" in clin else None)

    # Study connection
    sp = None
    try:
        p_oid = ObjectId(p["id"])
        sp = db.study_participants.find_one({"participant_id": {"$in": [p["id"], str(p_oid)]}})
    except Exception:
        sp = db.study_participants.find_one({"participant_id": p["id"]})
        
    study_id = sp.get("study_id") if sp else p.get("study_id")
    study_name = "Clinical Trial"
    if study_id:
        try:
            s_doc = db.studies.find_one({"_id": ObjectId(study_id)})
        except Exception:
            s_doc = db.studies.find_one({"_id": study_id})
        if s_doc:
            study_name = s_doc.get("title") or s_doc.get("name", "Clinical Trial")
            
    p["studyId"] = str(study_id) if study_id else "ST-001"
    p["study_id"] = str(study_id) if study_id else "ST-001"
    p["studyName"] = study_name
    p["study_name"] = study_name
    
    # Statuses
    p["enrollmentStatus"] = (sp.get("status") if sp else "enrolled").lower()
    p["screeningStatus"] = "approved"
    p["consentStatus"] = "consented"
    p["lastActivity"] = "2026-09-10"
    return p

@router.get("/", response_model=List[ParticipantResponse])
def read_participants(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    if current_user["role"] == "PARTICIPANT":
        uid = current_user["id"]
        try:
            p = db.participants.find_one({"$or": [{"user_id": uid}, {"user_id": ObjectId(uid)}]})
        except Exception:
            p = db.participants.find_one({"user_id": uid})
        if not p and current_user.get("email"):
            u = db.users.find_one({"email": current_user["email"]})
            if u:
                u_str_id = str(u["_id"])
                p = db.participants.find_one({"$or": [{"user_id": u_str_id}, {"user_id": u["_id"]}]})
        if not p:
            # Fallback to first participant in DB for participant user
            p = db.participants.find_one()
        if p:
            p["_id"] = str(p["_id"])
            return [_enrich_participant(db, p)]
        return []
    elif current_user["role"] == "ORGANIZATION":
        ps = participant_repo.list_by_org(db, current_user.get("organization_id"))
    else:
        ps = participant_repo.list_all(db)
    return [_enrich_participant(db, p) for p in ps]

@router.post("/", response_model=ParticipantResponse)
def create_participant(p_in: ParticipantCreate, db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN", "ORGANIZATION", "RESEARCH_COORDINATOR"))):
    return participant_repo.create(db, p_in.model_dump())

@router.get("/{id}", response_model=ParticipantResponse)
def read_participant(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_participant_self_access(current_user, id, db)
    p = participant_repo.get_by_id(db, id)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    return p

@router.get("/{id}/studies", response_model=List[StudyResponse])
def read_participant_studies(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_participant_self_access(current_user, id, db)
    sps = sp_repo.list_by_participant(db, id)
    studies = []
    for sp in sps:
        s = study_repo.get_by_id(db, sp["study_id"])
        if s:
            s["status"] = sp["status"] # override status for context
            studies.append(s)
    return studies

@router.post("/{id}/approve-screening")
def approve_participant_screening(
    id: str,
    body: Optional[ScreeningApproveRequest] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_role("PLATFORM_ADMIN", "RESEARCH_COORDINATOR", "PRINCIPAL_INVESTIGATOR"))
):
    try:
        from bson import ObjectId
    except ImportError:
        ObjectId = None

    p_doc = None
    if ObjectId:
        try:
            p_doc = db.participants.find_one({"_id": ObjectId(id)})
        except Exception:
            p_doc = db.participants.find_one({"_id": id})
    else:
        p_doc = db.participants.find_one({"_id": id})

    if not p_doc:
        p_doc = db.participants.find_one({"id": id})
    if not p_doc:
        raise HTTPException(status_code=404, detail="Participant not found")

    user_id = p_doc.get("user_id") or id
    study_id = p_doc.get("study_id") or "ST-001"

    query_filter = {"id": id}
    if ObjectId:
        try:
            query_filter = {"$or": [{"_id": ObjectId(id)}, {"_id": id}, {"id": id}]}
        except Exception:
            pass

    db.participants.update_one(
        query_filter,
        {"$set": {"screening_status": "APPROVED", "updated_at": datetime.utcnow()}}
    )

    db.study_participants.update_one(
        {"participant_id": id},
        {"$set": {"screening_status": "APPROVED", "status": "ELIGIBLE", "updated_at": datetime.utcnow()}},
        upsert=True
    )

    # Create Actionable Notification for participant to Accept/Reject
    notif_id = create_notification(
        db=db,
        recipient_id=str(user_id),
        type="TRIAL_INVITATION",
        title="Trial Eligibility Confirmed",
        message="Congratulations! You are eligible for the clinical trial: Type 2 Diabetes Study (C4H11N5 Renal Dynamics). Please confirm your participation decision.",
        entity_type="study",
        entity_id=str(study_id),
        requires_action=True,
        actions=["ACCEPT", "REJECT"],
        metadata={"participant_id": id, "study_id": str(study_id)}
    )

    # Direct message to participant
    try:
        db.messages.insert_one({
            "from_user_id": current_user["id"],
            "to_user_id": str(user_id),
            "sender_name": current_user.get("name", "Research Coordinator"),
            "recipient_name": p_doc.get("name", "Participant"),
            "sender_role": current_user["role"],
            "subject": "Screening Approved & Trial Invitation",
            "content": "You have been approved as eligible for our clinical trial! Please accept or reject participation in your portal.",
            "read": False,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Warning: Insert message error: {e}")

    return {"status": "success", "screening_status": "APPROVED", "notification_id": notif_id}

@router.post("/{id}/trial-decision")
def record_trial_decision(
    id: str,
    body: TrialDecisionRequest,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        from bson import ObjectId
    except ImportError:
        ObjectId = None

    decision = body.decision.upper()
    if decision not in ["ACCEPT", "REJECT"]:
        raise HTTPException(status_code=400, detail="Decision must be ACCEPT or REJECT")

    p_doc = None
    if ObjectId:
        try:
            p_doc = db.participants.find_one({"_id": ObjectId(id)})
        except Exception:
            p_doc = db.participants.find_one({"_id": id})
    else:
        p_doc = db.participants.find_one({"_id": id})

    if not p_doc:
        p_doc = db.participants.find_one({"id": id})

    study_id = body.study_id
    if not study_id and p_doc:
        study_id = p_doc.get("study_id")
    if not study_id:
        sp = db.study_participants.find_one({"participant_id": id})
        if sp:
            study_id = sp.get("study_id")
    if not study_id:
        study_id = "ST-001"

    participant_name = p_doc.get("name", f"Participant {id}") if p_doc else f"Participant {id}"
    user_id = p_doc.get("user_id") if p_doc else current_user.get("id")

    query_filter = {"id": id}
    if ObjectId:
        try:
            query_filter = {"$or": [{"_id": ObjectId(id)}, {"_id": id}, {"id": id}]}
        except Exception:
            pass

    if decision == "ACCEPT":
        # 1. Update participant and study_participants
        try:
            db.participants.update_one(
                query_filter,
                {"$set": {"status": "ENROLLED", "enrollment_status": "ENROLLED", "updated_at": datetime.utcnow()}}
            )
        except Exception:
            pass

        db.study_participants.update_one(
            {"participant_id": id, "study_id": str(study_id)},
            {"$set": {"status": "ENROLLED", "updated_at": datetime.utcnow()}},
            upsert=True
        )

        # 2. Update notification if provided
        if body.notification_id:
            try:
                notif_filter = {"id": body.notification_id}
                if ObjectId:
                    notif_filter = {"$or": [{"_id": ObjectId(body.notification_id)}, {"_id": body.notification_id}, {"id": body.notification_id}]}
                db.notifications.update_one(
                    notif_filter,
                    {"$set": {"action_taken": "ACCEPT", "read": True, "updated_at": datetime.utcnow()}}
                )
            except Exception:
                pass
        else:
            db.notifications.update_many(
                {"recipient_id": str(user_id), "type": "TRIAL_INVITATION"},
                {"$set": {"action_taken": "ACCEPT", "read": True}}
            )

        # 3. Automatically schedule baseline visit (3 days in future at 10:00 AM)
        visit_date = (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d")
        visit_doc = {
            "participant_id": id,
            "participantId": id,
            "participant_name": participant_name,
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
        v_res = db.visits.insert_one(visit_doc)
        visit_id = str(v_res.inserted_id)
        visit_doc["id"] = visit_id
        visit_doc["_id"] = visit_id

        # 4. Insert message in db.messages
        study_doc = None
        if ObjectId:
            try:
                study_doc = db.studies.find_one({"_id": ObjectId(study_id)})
            except Exception:
                study_doc = db.studies.find_one({"_id": study_id})
        else:
            study_doc = db.studies.find_one({"_id": study_id})

        pi_id = study_doc.get("principal_investigator_id") if study_doc else None

        try:
            db.messages.insert_one({
                "from_user_id": str(user_id),
                "to_user_id": str(pi_id) if pi_id else "investigator",
                "sender_name": participant_name,
                "recipient_name": "Principal Investigator",
                "sender_role": "PARTICIPANT",
                "subject": "Trial Acceptance Confirmation",
                "content": f"I have accepted the invitation for the clinical trial. Baseline visit automatically scheduled for {visit_date} at 10:00 AM.",
                "read": False,
                "created_at": datetime.utcnow()
            })
        except Exception as e:
            print(f"Warning: Message insert failed: {e}")

        # 5. Emit notification to PI and coordinator
        admin_message = f"Participant {participant_name} has accepted the trial invitation! A baseline clinical visit has been automatically scheduled for {visit_date}."
        if pi_id:
            create_notification(
                db=db,
                recipient_id=str(pi_id),
                type="TRIAL_ACCEPTED",
                title="Participant Trial Accepted",
                message=admin_message,
                entity_type="visit",
                entity_id=visit_id,
                metadata={"participant_id": id, "study_id": str(study_id), "visit_date": visit_date}
            )

        # Broadcast real-time WebSocket event
        event_payload = {
            "event": "TRIAL_DECISION_ACCEPTED",
            "participant_id": id,
            "participant_name": participant_name,
            "study_id": str(study_id),
            "visit": {
                "id": visit_id,
                "visit_name": "Baseline Clinical Intake & Physical Exam",
                "type": "Baseline Clinical Intake",
                "date": visit_date,
                "time": "10:00 AM",
                "status": "scheduled",
                "location": "Clinical Trial Unit - Suite 302"
            }
        }
        connection_manager.dispatch_role_message_sync("PRINCIPAL_INVESTIGATOR", event_payload)
        connection_manager.dispatch_role_message_sync("RESEARCH_COORDINATOR", event_payload)
        connection_manager.dispatch_personal_message_sync(str(user_id), event_payload)

        return {
            "status": "success",
            "decision": "ACCEPT",
            "message": "Trial invitation accepted. Baseline visit scheduled.",
            "participant_id": id,
            "visit": {
                "id": visit_id,
                "type": "Baseline Clinical Intake",
                "date": visit_date,
                "time": "10:00 AM",
                "location": "Clinical Trial Unit - Suite 302",
                "status": "scheduled"
            }
        }
    else:
        # REJECT
        try:
            db.participants.update_one(
                query_filter,
                {"$set": {"status": "DECLINED", "enrollment_status": "DECLINED", "updated_at": datetime.utcnow()}}
            )
        except Exception:
            pass

        db.study_participants.update_one(
            {"participant_id": id, "study_id": str(study_id)},
            {"$set": {"status": "NOT_ENROLLED", "updated_at": datetime.utcnow()}},
            upsert=True
        )

        if body.notification_id:
            try:
                notif_filter = {"id": body.notification_id}
                if ObjectId:
                    notif_filter = {"$or": [{"_id": ObjectId(body.notification_id)}, {"_id": body.notification_id}, {"id": body.notification_id}]}
                db.notifications.update_one(
                    notif_filter,
                    {"$set": {"action_taken": "REJECT", "read": True, "updated_at": datetime.utcnow()}}
                )
            except Exception:
                pass

        # Notify researcher
        decline_message = f"Participant {participant_name} declined the clinical trial invitation."
        connection_manager.dispatch_role_message_sync("PRINCIPAL_INVESTIGATOR", {
            "event": "TRIAL_DECISION_REJECTED",
            "participant_id": id,
            "participant_name": participant_name,
            "message": decline_message
        })
        connection_manager.dispatch_role_message_sync("RESEARCH_COORDINATOR", {
            "event": "TRIAL_DECISION_REJECTED",
            "participant_id": id,
            "participant_name": participant_name,
            "message": decline_message
        })

        return {
            "status": "success",
            "decision": "REJECT",
            "message": "Trial invitation declined.",
            "participant_id": id
        }

