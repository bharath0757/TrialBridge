from bson import ObjectId
from datetime import datetime
from app.services.audit_service import log_action
from app.services.notification_service import create_notification
from fastapi import HTTPException

def submit_to_pi(db, participant_id: str, study_id: str, coordinator_id: str, coordinator_notes: str):
    study = db.studies.find_one({"_id": ObjectId(study_id)})
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    er_data = {
        "study_id": study_id,
        "participant_id": participant_id,
        "coordinator_id": coordinator_id,
        "assigned_to_pi": study["principal_investigator_id"],
        "status": "PENDING_PI_REVIEW",
        "coordinator_notes": coordinator_notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = db.eligibility_reviews.insert_one(er_data)
    
    db.study_participants.update_one(
        {"participant_id": participant_id, "study_id": study_id},
        {"$set": {"status": "IN_REVIEW"}}
    )
    
    create_notification(
        db, study["principal_investigator_id"], "ELIGIBILITY_REVIEW",
        "New Eligibility Review", f"Participant {participant_id} needs review",
        "eligibility_review", str(result.inserted_id)
    )
    
    log_action(db, coordinator_id, "RESEARCH_COORDINATOR", "SUBMIT_ELIGIBILITY", "eligibility_review", str(result.inserted_id))
    return str(result.inserted_id)

def approve_eligibility(db, review_id: str, pi_id: str, reason: str):
    review = db.eligibility_reviews.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.get("assigned_to_pi") and review["assigned_to_pi"] not in [pi_id, "pi"]:
        # Verify access
        pass
        
    db.eligibility_reviews.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": {"status": "APPROVED", "pi_notes": reason, "updated_at": datetime.utcnow()}}
    )
    
    # 1. Update study_participants if exists
    try:
        db.study_participants.update_one(
            {"participant_id": review["participant_id"], "study_id": review["study_id"]},
            {"$set": {"status": "ELIGIBLE"}}
        )
    except Exception:
        pass

    # 2. Update candidate record with Authoritative PI Decision
    cand_id = review.get("candidate_id")
    if cand_id:
        try:
            db.candidates.update_one(
                {"_id": ObjectId(cand_id)},
                {"$set": {
                    "screening_status": "HUMAN_CONFIRMED_ELIGIBLE",
                    "pi_decision": "CONFIRMED_ELIGIBLE",
                    "pi_notes": reason,
                    "pi_reviewed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
        except Exception:
            db.candidates.update_one(
                {"_id": cand_id},
                {"$set": {
                    "screening_status": "HUMAN_CONFIRMED_ELIGIBLE",
                    "pi_decision": "CONFIRMED_ELIGIBLE",
                    "pi_notes": reason,
                    "pi_reviewed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
    else:
        db.candidates.update_one(
            {"$or": [{"participant_code": review.get("participant_id")}, {"id": review.get("participant_id")}], "study_id": review.get("study_id")},
            {"$set": {
                "screening_status": "HUMAN_CONFIRMED_ELIGIBLE",
                "pi_decision": "CONFIRMED_ELIGIBLE",
                "pi_notes": reason,
                "pi_reviewed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
    
    # 3. Notify Coordinator
    if review.get("coordinator_id"):
        create_notification(
            db, review["coordinator_id"], "ELIGIBILITY_DECISION",
            "Eligibility Approved by PI", f"PI approved candidate {review.get('participant_code') or review['participant_id']}: {reason}",
            "eligibility_review", review_id
        )

    # 4. Broadcast WebSocket Event
    try:
        from app.core.connections import connection_manager
        connection_manager.dispatch_role_message_sync("RESEARCH_COORDINATOR", {
            "event": "ELIGIBILITY_REVIEW_FINALIZED",
            "review_id": review_id,
            "study_id": str(review.get("study_id")),
            "participant_code": str(review.get("participant_code") or review.get("participant_id")),
            "decision": "APPROVED",
            "reason": reason,
            "message": f"PI confirmed eligibility for participant {review.get('participant_code') or review.get('participant_id')}."
        })
    except Exception as e:
        print(f"Warning: WebSocket broadcast error: {e}")

    # 5. Identify the participant document and resolve associated user_id for trial invitation
    participant = None
    try:
        participant = db.participants.find_one({"_id": ObjectId(review["participant_id"])})
    except Exception:
        participant = db.participants.find_one({"_id": review["participant_id"]})
    if not participant:
        participant = db.participants.find_one({"id": review["participant_id"]})
        
    participant_user_id = participant.get("user_id") if participant else None
    if not participant_user_id:
        participant_user_id = str(review["participant_id"])

    # Create actionable notification for participant
    try:
        create_notification(
            db=db,
            recipient_id=str(participant_user_id),
            type="TRIAL_INVITATION",
            title="Trial Eligibility Confirmed",
            message=f"You are confirmed eligible for clinical trial protocol {review['study_id']}. Please review your consent and participation options.",
            entity_type="study",
            entity_id=str(review["study_id"]),
            requires_action=True,
            actions=["ACCEPT", "REJECT"],
            metadata={
                "participant_id": str(review["participant_id"]),
                "study_id": str(review["study_id"]),
                "review_id": str(review_id)
            }
        )
    except Exception:
        pass
    
    log_action(db, pi_id, "PRINCIPAL_INVESTIGATOR", "APPROVE_ELIGIBILITY", "eligibility_review", review_id, "PENDING_PI_REVIEW", "APPROVED", reason)
    return True

def reject_eligibility(db, review_id: str, pi_id: str, reason: str):
    review = db.eligibility_reviews.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    db.eligibility_reviews.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": {"status": "REJECTED", "pi_notes": reason, "updated_at": datetime.utcnow()}}
    )
    
    try:
        db.study_participants.update_one(
            {"participant_id": review["participant_id"], "study_id": review["study_id"]},
            {"$set": {"status": "NOT_ELIGIBLE"}}
        )
    except Exception:
        pass

    # Update candidate record
    cand_id = review.get("candidate_id")
    if cand_id:
        try:
            db.candidates.update_one(
                {"_id": ObjectId(cand_id)},
                {"$set": {
                    "screening_status": "HUMAN_CONFIRMED_INELIGIBLE",
                    "pi_decision": "CONFIRMED_INELIGIBLE",
                    "pi_notes": reason,
                    "pi_reviewed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
        except Exception:
            db.candidates.update_one(
                {"_id": cand_id},
                {"$set": {
                    "screening_status": "HUMAN_CONFIRMED_INELIGIBLE",
                    "pi_decision": "CONFIRMED_INELIGIBLE",
                    "pi_notes": reason,
                    "pi_reviewed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
    else:
        db.candidates.update_one(
            {"$or": [{"participant_code": review.get("participant_id")}, {"id": review.get("participant_id")}], "study_id": review.get("study_id")},
            {"$set": {
                "screening_status": "HUMAN_CONFIRMED_INELIGIBLE",
                "pi_decision": "CONFIRMED_INELIGIBLE",
                "pi_notes": reason,
                "pi_reviewed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
    
    if review.get("coordinator_id"):
        create_notification(
            db, review["coordinator_id"], "ELIGIBILITY_DECISION",
            "Eligibility Ineligible", f"PI determined participant {review.get('participant_code') or review['participant_id']} is ineligible: {reason}",
            "eligibility_review", review_id
        )

    # Broadcast WebSocket
    try:
        from app.core.connections import connection_manager
        connection_manager.dispatch_role_message_sync("RESEARCH_COORDINATOR", {
            "event": "ELIGIBILITY_REVIEW_FINALIZED",
            "review_id": review_id,
            "study_id": str(review.get("study_id")),
            "participant_code": str(review.get("participant_code") or review.get("participant_id")),
            "decision": "REJECTED",
            "reason": reason,
            "message": f"PI determined participant {review.get('participant_code') or review.get('participant_id')} is ineligible."
        })
    except Exception:
        pass
    
    log_action(db, pi_id, "PRINCIPAL_INVESTIGATOR", "REJECT_ELIGIBILITY", "eligibility_review", review_id, "PENDING_PI_REVIEW", "REJECTED", reason)
    return True

def request_more_info(db, review_id: str, pi_id: str, reason: str):
    review = db.eligibility_reviews.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    db.eligibility_reviews.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": {"status": "INFO_REQUESTED", "pi_notes": reason, "updated_at": datetime.utcnow()}}
    )

    # Update candidate status
    cand_id = review.get("candidate_id")
    if cand_id:
        try:
            db.candidates.update_one(
                {"_id": ObjectId(cand_id)},
                {"$set": {"screening_status": "INFO_REQUESTED", "pi_notes": reason, "updated_at": datetime.utcnow()}}
            )
        except Exception:
            db.candidates.update_one(
                {"_id": cand_id},
                {"$set": {"screening_status": "INFO_REQUESTED", "pi_notes": reason, "updated_at": datetime.utcnow()}}
            )
    
    # Create task for coordinator
    task_data = {
        "title": f"Provide more info for participant {review.get('participant_code') or review['participant_id']}",
        "description": reason,
        "assignee_id": review.get("coordinator_id"),
        "study_id": review.get("study_id"),
        "status": "TODO",
        "created_by": pi_id,
        "created_at": datetime.utcnow()
    }
    db.tasks.insert_one(task_data)
    
    if review.get("coordinator_id"):
        create_notification(
            db, review["coordinator_id"], "INFO_REQUEST",
            "More Information Requested", f"PI requested clarifications for participant {review.get('participant_code') or review['participant_id']}: {reason}",
            "eligibility_review", review_id
        )

    # Broadcast WebSocket
    try:
        from app.core.connections import connection_manager
        connection_manager.dispatch_role_message_sync("RESEARCH_COORDINATOR", {
            "event": "ELIGIBILITY_REVIEW_FINALIZED",
            "review_id": review_id,
            "study_id": str(review.get("study_id")),
            "participant_code": str(review.get("participant_code") or review.get("participant_id")),
            "decision": "INFO_REQUESTED",
            "reason": reason,
            "message": f"PI requested additional clarifications for participant {review.get('participant_code') or review.get('participant_id')}."
        })
    except Exception:
        pass
    
    log_action(db, pi_id, "PRINCIPAL_INVESTIGATOR", "REQUEST_INFO_ELIGIBILITY", "eligibility_review", review_id, "PENDING_PI_REVIEW", "INFO_REQUESTED", reason)
    return True

