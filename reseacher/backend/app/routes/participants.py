from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role, require_study_access, require_participant_self_access, linked_participant_ids, find_record
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
    study_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    notes: Optional[str] = None

def _identifier_variants(values):
    from bson import ObjectId
    result = set()
    for value in values:
        if value is None:
            continue
        text = str(value)
        result.add(text)
        if ObjectId.is_valid(text):
            result.add(ObjectId(text))
    return list(result)


def _enrich_participants(db, participants):
    """Fetch related records once per collection instead of once per participant."""
    if not participants:
        return []
    participant_ids = _identifier_variants(p.get('_id') or p.get('id') for p in participants)
    user_ids = _identifier_variants(p.get('user_id') for p in participants)
    emails = [p['email'] for p in participants if p.get('email')]
    users = list(db.users.find({'$or': [{'_id': {'$in': user_ids}}, {'email': {'$in': emails}}]}))
    memberships = list(db.study_participants.find({'participant_id': {'$in': participant_ids}}))
    membership_map = {}
    for membership in memberships:
        membership_map.setdefault(str(membership.get('participant_id')), membership)
    study_ids = _identifier_variants(
        [m.get('study_id') for m in memberships] + [p.get('study_id') for p in participants]
    )
    studies = list(db.studies.find({'$or': [{'_id': {'$in': study_ids}}, {'id': {'$in': study_ids}}, {'study_code': {'$in': study_ids}}]}))
    study_map = {}
    for study in studies:
        for key in ('_id', 'id', 'study_code'):
            if study.get(key) is not None:
                study_map[str(study[key])] = study
    consents = list(db.consents.find({'participant_id': {'$in': participant_ids}}))
    consent_map = {}
    for consent in consents:
        consent_map.setdefault((str(consent.get('participant_id')), str(consent.get('study_id'))), consent)
    related = {
        'users': {str(u['_id']): u for u in users},
        'emails': {u.get('email'): u for u in users if u.get('email')},
        'memberships': membership_map,
        'studies': study_map,
        'consents': consent_map,
    }
    return [_enrich_participant(db, p, related) for p in participants]


def _enrich_participant(db, p: dict, related=None) -> dict:
    from bson import ObjectId
    p["id"] = str(p.get("_id") or p.get("id"))
    p["_id"] = p["id"]
    
    # User details
    u_id = p.get("user_id")
    u_doc = None
    if related is not None:
        u_doc = related['users'].get(str(u_id)) or related['emails'].get(p.get('email'))
    else:
        u_doc = find_record(db.users, str(u_id)) if u_id else None
        if not u_doc and p.get('email'):
            u_doc = db.users.find_one({'email': p['email']})

    p["name"] = u_doc.get("name") if u_doc else p.get("name", f"Participant {p.get('participant_code', '')}")
    p["email"] = u_doc.get("email") if u_doc else p.get("email", "")
    
    # Clinical attributes
    clin = p.get("clinical_attributes") or {}
    p["age"] = clin.get("age", p.get("age"))
    p["gender"] = clin.get("gender") or p.get("gender")
    p["phone"] = p.get("phone")
    p["location"] = p.get("location")
    p["clinicalData"] = p.get("clinicalData") or clin.get("clinicalData") or (clin if "baselineHba1c" in clin or "doseMg" in clin else None)

    # Study connection
    sp = (related['memberships'].get(p['id']) if related is not None else
          db.study_participants.find_one({'participant_id': {'$in': _identifier_variants([p['id']])}}))
    study_id = sp.get('study_id') if sp else p.get('study_id')
    study_name = 'Clinical Trial'
    if study_id:
        s_doc = (related['studies'].get(str(study_id)) if related is not None else
                 find_record(db.studies, str(study_id)))
        if s_doc:
            study_name = s_doc.get('title') or s_doc.get('name', 'Clinical Trial')

    p["studyId"] = str(study_id) if study_id else None
    p["study_id"] = str(study_id) if study_id else None
    p["studyName"] = study_name
    p["study_name"] = study_name
    
    # Statuses
    p["enrollmentStatus"] = str(sp.get("status", "not_enrolled") if sp else p.get("enrollmentStatus", "not_enrolled")).lower()
    p["screeningStatus"] = p.get("screeningStatus") or p.get("screening_status") or "candidate"
    consent = (related['consents'].get((p['id'], str(study_id))) if related is not None else
               db.consents.find_one({'participant_id': p['id'], 'study_id': str(study_id)})) if study_id else None
    p["consentStatus"] = str(consent.get("status", "not_started") if consent else p.get("consentStatus", "not_started")).lower()
    activity = p.get("lastActivity") or p.get("updated_at") or p.get("created_at")
    p["lastActivity"] = activity.isoformat() if hasattr(activity, 'isoformat') else str(activity) if activity else None
    return p

@router.get("/", response_model=List[ParticipantResponse])
def read_participants(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    if current_user["role"] == "PARTICIPANT":
        identifiers = linked_participant_ids(current_user, db)
        return _enrich_participants(db, [find_record(db.participants, pid) for pid in identifiers])
    elif current_user["role"] == "ORGANIZATION":
        org = current_user.get("organization_id")
        ps = participant_repo.list_by_org(db, org) if org else []
    elif current_user['role'] == 'PLATFORM_ADMIN':
        ps = participant_repo.list_all(db)
    else:
        org_id = current_user.get('organization_id')
        ps = participant_repo.list_by_org(db, org_id) if org_id else []
    return _enrich_participants(db, ps)

@router.post("/", response_model=ParticipantResponse)
def create_participant(p_in: ParticipantCreate, db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN", "ORGANIZATION", "RESEARCH_COORDINATOR"))):
    data = p_in.model_dump()
    if current_user["role"] != "PLATFORM_ADMIN":
        org = current_user.get("organization_id")
        if not org or (data.get("organization_id") and data["organization_id"] != org):
            raise HTTPException(403, "Cannot create participants outside your organization")
        data["organization_id"] = org
        if data.get("user_id"):
            account = find_record(db.users, data["user_id"])
            if not account or account.get("role") != "PARTICIPANT" or account.get("organization_id") != org:
                raise HTTPException(403, "Cannot link that participant account")
    return participant_repo.create(db, data)

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
    require_participant_self_access(current_user, id, db)
    p_doc = find_record(db.participants, id)
    if not p_doc:
        raise HTTPException(404, "Participant not found")
    user_id = p_doc.get("user_id")
    if not user_id:
        raise HTTPException(409, "Participant needs a linked account to receive the invitation")
    study_id = (body.study_id if body else None) or p_doc.get("study_id")
    if not study_id:
        assignments = db.study_participants.distinct("study_id", {"participant_id": id})
        if len(assignments) != 1:
            raise HTTPException(422, "Select a study for this invitation")
        study_id = assignments[0]
    require_study_access(current_user, study_id, db)
    query_filter = {"_id": p_doc["_id"]}
    db.participants.update_one(
        query_filter,
        {"$set": {"screening_status": "APPROVED", "updated_at": datetime.utcnow()}}
    )

    db.study_participants.update_one(
        {"participant_id": id, "study_id": study_id},
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
    from bson import ObjectId
    from app.routes.notifications import NotificationActionRequest, take_notification_action

    if current_user["role"] != "PARTICIPANT":
        raise HTTPException(403, "Only participants can answer their invitations")
    require_participant_self_access(current_user, id, db)
    query = {"recipient_id": current_user["id"], "type": "TRIAL_INVITATION", "metadata.participant_id": id}
    if body.study_id:
        query["metadata.study_id"] = body.study_id
    if body.notification_id:
        keys = [body.notification_id]
        if ObjectId.is_valid(body.notification_id):
            keys.append(ObjectId(body.notification_id))
        query["$or"] = [{"_id": {"$in": keys}}, {"id": body.notification_id}]
    invitations = list(db.notifications.find(query).sort("created_at", -1).limit(2))
    if not invitations:
        raise HTTPException(404, "Trial invitation not found")
    if len(invitations) > 1 and not body.notification_id and not body.study_id:
        raise HTTPException(422, "Select the invitation to answer")
    result = take_notification_action(str(invitations[0]["_id"]), NotificationActionRequest(action=body.decision), db, current_user)
    return {**result, "decision": body.decision.upper(), "participant_id": id}
