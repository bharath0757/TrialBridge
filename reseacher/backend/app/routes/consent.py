from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role
from app.models.consent import ConsentResponse, ConsentCreate
from app.services.workflow_service import submit_consent, verify_consent
from app.repositories import consent as consent_repo

router = APIRouter()

@router.get("/")
def list_consents(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    if current_user["role"] == "PARTICIPANT":
        p = db.participants.find_one({"user_id": current_user["id"]})
        pid = str(p["_id"]) if p else current_user["id"]
        consents = consent_repo.list_by_participant(db, pid)
    else:
        consents = consent_repo.list_all(db)

    enriched = []
    for c in consents:
        c_id = str(c.get("_id") or c.get("id"))
        p_id = str(c.get("participant_id") or c.get("participantId") or "")
        s_id = str(c.get("study_id") or c.get("studyId") or "")
        
        p_name = c.get("participantName") or c.get("participant_name")
        if not p_name and p_id:
            try:
                p_doc = db.participants.find_one({"_id": ObjectId(p_id)})
            except Exception:
                p_doc = db.participants.find_one({"_id": p_id})
            if p_doc:
                u_doc = None
                if p_doc.get("user_id"):
                    try:
                        u_doc = db.users.find_one({"_id": ObjectId(p_doc["user_id"])})
                    except Exception:
                        u_doc = db.users.find_one({"_id": p_doc["user_id"]})
                p_name = u_doc.get("name") if u_doc else p_doc.get("participant_code")
                
        s_name = c.get("studyName") or c.get("study_name")
        if not s_name and s_id:
            try:
                s_doc = db.studies.find_one({"_id": ObjectId(s_id)})
            except Exception:
                s_doc = db.studies.find_one({"_id": s_id})
            if s_doc:
                s_name = s_doc.get("title") or s_doc.get("name")

        item = {
            "id": c_id,
            "_id": c_id,
            "participantId": p_id,
            "participant_id": p_id,
            "participantName": p_name or "Participant",
            "studyId": s_id,
            "study_id": s_id,
            "studyName": s_name or "Clinical Study",
            "version": c.get("version", "1.0"),
            "consentVersion": c.get("consentVersion") or c.get("version", "1.0"),
            "status": str(c.get("status", "pending")).lower(),
            "dateSent": str(c.get("created_at", ""))[:10] if c.get("created_at") else None,
            "dateSigned": str(c.get("signed_at", ""))[:10] if c.get("signed_at") else None,
            "created_at": c.get("created_at"),
            "signed_at": c.get("signed_at"),
            "verified_at": c.get("verified_at"),
            "verified_by": c.get("verified_by"),
            "document_url": c.get("document_url")
        }
        enriched.append(item)
    return enriched

@router.get("/{id}")
def get_consent(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    consent = consent_repo.get_by_id(db, id)
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found")
    return consent

@router.post("/request", response_model=ConsentResponse)
def req_consent(c_in: ConsentCreate, db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PRINCIPAL_INVESTIGATOR", "PLATFORM_ADMIN"))):
    return consent_repo.create(db, c_in.model_dump())

@router.post("/{id}/submit")
def do_submit_consent(id: str, db = Depends(get_db), current_user: dict = Depends(require_role("PARTICIPANT"))):
    # we need participant_id which is linked to user. In reality, get participant_id from user.
    participant_id = current_user["id"] # assuming user id == participant id for simplicity, or look it up
    
    # lookup real participant id
    p = db.participants.find_one({"user_id": current_user["id"]})
    pid = str(p["_id"]) if p else current_user["id"]
    
    submit_consent(db, id, pid)
    return {"status": "success"}

@router.post("/{id}/verify")
def do_verify_consent(id: str, db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR"))):
    verify_consent(db, id, current_user["id"])
    return {"status": "success"}

@router.post("/{id}/withdraw")
def withdraw_consent(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    consent = consent_repo.get_by_id(db, id)
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found")
    consent_repo.update_status(db, id, {"status": "WITHDRAWN"})
    # Need to update study_participant status to WITHDRAWN
    db.study_participants.update_one(
        {"participant_id": consent["participant_id"], "study_id": consent["study_id"]},
        {"$set": {"status": "WITHDRAWN"}}
    )
    return {"status": "success"}
