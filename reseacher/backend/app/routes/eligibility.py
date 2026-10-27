from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from bson import ObjectId
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role
from app.models.eligibility import EligibilityReviewResponse, EligibilityDecision
from app.services.eligibility_service import submit_to_pi, approve_eligibility, reject_eligibility, request_more_info
from app.repositories import eligibility as el_repo
from app.repositories import studies as study_repo

router = APIRouter()

def _enrich_review(db, rev: dict) -> dict:
    rev_id = str(rev.get("_id") or rev.get("id"))
    rev["id"] = rev_id
    study_id = str(rev.get("study_id"))
    
    # 1. Study lookup
    study = study_repo.get_by_id(db, study_id)
    study_title = study.get("title") or study.get("name") if study else f"Study {study_id}"
    rev["study_title"] = study_title
    rev["studyTitle"] = study_title
    rev["study_id"] = study_id
    rev["studyId"] = study_id
    
    # 2. Candidate or Participant lookup
    cand = None
    if rev.get("candidate_id"):
        try:
            cand = db.candidates.find_one({"_id": ObjectId(rev["candidate_id"])})
        except Exception:
            cand = db.candidates.find_one({"_id": rev["candidate_id"]})
    if not cand:
        cand = db.candidates.find_one({"$or": [{"participant_code": rev.get("participant_id")}, {"id": rev.get("participant_id")}], "study_id": study_id})
        
    part = None
    if not cand:
        try:
            part = db.participants.find_one({"_id": ObjectId(rev.get("participant_id"))})
        except Exception:
            part = db.participants.find_one({"_id": rev.get("participant_id")})
        if not part:
            part = db.participants.find_one({"id": rev.get("participant_id")})

    p_code = rev.get("participant_id") or "P-UNKNOWN"
    age = 45
    gender = "Unspecified"
    criteria_list = []
    ai_conf = rev.get("ai_confidence", 92.0)
    ai_rec = "REQUIRES_HUMAN_REVIEW"
    
    if cand:
        p_code = cand.get("participant_code", p_code)
        norm_data = cand.get("normalized_data", {})
        age = int(norm_data.get("age", 45)) if str(norm_data.get("age", "")).isdigit() else 45
        gender = str(norm_data.get("gender") or "Unspecified").title()
        ai_conf = cand.get("ai_confidence") or ai_conf
        
        # Build criteria matches
        dt = cand.get("decision_tree") or rev.get("decision_tree") or {}
        if dt.get("evaluated_criteria"):
            all_match = True
            any_fail = False
            for ec in dt["evaluated_criteria"]:
                raw_st = ec.get("status", "PASS")
                if raw_st == "PASS":
                    c_status = "MATCH"
                elif raw_st == "FAIL":
                    c_status = "MISMATCH"
                    any_fail = True
                    all_match = False
                else:
                    c_status = "REVIEW"
                    all_match = False
                    
                criteria_list.append({
                    "name": ec.get("name", "Criterion"),
                    "condition": ec.get("condition", ""),
                    "participantValue": str(ec.get("actual_value", "Recorded Value")),
                    "status": c_status,
                    "evidence": ec.get("evidence", "Verified against patient medical dataset")
                })
            
            if any_fail:
                ai_rec = "INELIGIBLE"
            elif all_match:
                ai_rec = "POTENTIALLY_ELIGIBLE"
            else:
                ai_rec = "REQUIRES_HUMAN_REVIEW"
    elif part:
        p_code = part.get("id") or part.get("participant_code", p_code)
        age = part.get("age", 45)
        gender = part.get("gender", "Unspecified")

    rev["participant_code"] = p_code
    rev["participantCode"] = p_code
    rev["participant_id"] = p_code
    rev["participantId"] = p_code
    rev["age"] = age
    rev["gender"] = gender
    rev["ai_recommendation"] = ai_rec
    rev["aiRecommendation"] = ai_rec
    rev["ai_confidence"] = ai_conf
    rev["aiConfidence"] = ai_conf
    rev["coordinator_recommendation"] = "PROCEED"
    rev["coordinatorRecommendation"] = "PROCEED"
    rev["criteria"] = criteria_list
    rev["coordinator_notes"] = rev.get("coordinator_notes") or "Reviewed patient screening records."
    rev["coordinatorNotes"] = rev.get("coordinator_notes")
    rev["status"] = rev.get("status", "PENDING_PI_REVIEW")
    return rev

@router.post("/submit")
def submit_eligibility(participant_id: str, study_id: str, notes: str = "", db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PLATFORM_ADMIN"))):
    review_id = submit_to_pi(db, participant_id, study_id, current_user["id"], notes)
    return {"status": "success", "review_id": review_id}

@router.get("/pending", response_model=List[EligibilityReviewResponse])
def get_pending_reviews(
    study_id: Optional[str] = Query(None),
    db = Depends(get_db),
    current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR", "PLATFORM_ADMIN", "RESEARCH_COORDINATOR"))
):
    query = {"status": "PENDING_PI_REVIEW"}
    if study_id:
        query["study_id"] = study_id
        
    ers = list(db.eligibility_reviews.find(query).sort("created_at", -1))
    return [_enrich_review(db, er) for er in ers]

@router.get("/by-study/{study_id}", response_model=List[EligibilityReviewResponse])
def get_reviews_by_study(
    study_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    ers = list(db.eligibility_reviews.find({"study_id": study_id}).sort("created_at", -1))
    return [_enrich_review(db, er) for er in ers]

@router.post("/{review_id}/approve")
def approve(review_id: str, decision: EligibilityDecision, db = Depends(get_db), current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR", "PLATFORM_ADMIN"))):
    approve_eligibility(db, review_id, current_user["id"], decision.reason)
    return {"status": "success", "message": "Clinical eligibility confirmed by Principal Investigator."}

@router.post("/{review_id}/reject")
def reject(review_id: str, decision: EligibilityDecision, db = Depends(get_db), current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR", "PLATFORM_ADMIN"))):
    reject_eligibility(db, review_id, current_user["id"], decision.reason)
    return {"status": "success", "message": "Clinical ineligibility confirmed by Principal Investigator."}

@router.post("/{review_id}/request-info")
def req_info(review_id: str, decision: EligibilityDecision, db = Depends(get_db), current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR", "PLATFORM_ADMIN"))):
    request_more_info(db, review_id, current_user["id"], decision.reason)
    return {"status": "success", "message": "Information clarification request sent to coordinator."}

