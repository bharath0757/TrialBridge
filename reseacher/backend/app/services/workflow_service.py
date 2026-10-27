from bson import ObjectId
from datetime import datetime
from app.services.audit_service import log_action
from app.services.notification_service import create_notification
from fastapi import HTTPException

def submit_consent(db, consent_id: str, participant_id: str):
    consent = db.consents.find_one({"_id": ObjectId(consent_id)})
    if not consent or consent["participant_id"] != participant_id:
        raise HTTPException(status_code=404, detail="Consent not found")
        
    db.consents.update_one(
        {"_id": ObjectId(consent_id)},
        {"$set": {"status": "SIGNED", "signed_at": datetime.utcnow()}}
    )
    
    # Notify coordinators/PI
    study = db.studies.find_one({"_id": ObjectId(consent["study_id"])})
    if study:
        create_notification(
            db, study["principal_investigator_id"], "CONSENT_SIGNED",
            "Consent Signed", f"Participant {participant_id} signed consent",
            "consent", consent_id
        )
        
    log_action(db, participant_id, "PARTICIPANT", "SIGN_CONSENT", "consent", consent_id, "PENDING", "SIGNED")
    return True

def verify_consent(db, consent_id: str, coordinator_id: str):
    consent = db.consents.find_one({"_id": ObjectId(consent_id)})
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found")
        
    db.consents.update_one(
        {"_id": ObjectId(consent_id)},
        {"$set": {"status": "VERIFIED", "verified_at": datetime.utcnow(), "verified_by": coordinator_id}}
    )
    
    db.study_participants.update_one(
        {"participant_id": consent["participant_id"], "study_id": consent["study_id"]},
        {"$set": {"status": "CONSENTED"}}
    )
    
    log_action(db, coordinator_id, "RESEARCH_COORDINATOR", "VERIFY_CONSENT", "consent", consent_id, "SIGNED", "VERIFIED")
    return True

def approve_enrollment(db, enrollment_id: str, pi_id: str):
    enrollment = db.enrollments.find_one({"_id": ObjectId(enrollment_id)})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
        
    # Check pre-requisites
    pid = enrollment["participant_id"]
    sid = enrollment["study_id"]
    
    er = db.eligibility_reviews.find_one({"participant_id": pid, "study_id": sid, "status": "APPROVED"})
    if not er:
        raise HTTPException(status_code=400, detail="Eligibility must be APPROVED first")
        
    cons = db.consents.find_one({"participant_id": pid, "study_id": sid, "status": "VERIFIED"})
    if not cons:
        raise HTTPException(status_code=400, detail="Consent must be VERIFIED first")
        
    db.enrollments.update_one(
        {"_id": ObjectId(enrollment_id)},
        {"$set": {"status": "APPROVED", "approved_at": datetime.utcnow(), "approved_by": pi_id}}
    )
    
    db.study_participants.update_one(
        {"participant_id": pid, "study_id": sid},
        {"$set": {"status": "ENROLLED"}}
    )
    
    log_action(db, pi_id, "PRINCIPAL_INVESTIGATOR", "APPROVE_ENROLLMENT", "enrollment", enrollment_id, "PENDING_APPROVAL", "APPROVED")
    return True
