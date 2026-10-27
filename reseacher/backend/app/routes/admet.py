from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.db.mongodb import get_db
from app.core.connections import connection_manager
from app.services.notification_service import create_notification
from app.services.audit_service import log_action
from app.models.admet import (
    AdmetAnalyzeRequest,
    AdmetAnalyzeResponse,
    DoseComparisonRequest,
    DoseComparisonResponse,
    AdmetReviewRequest,
    AdmetReviewResponse,
)
from app.services.admet_service import AdmetAnalysisEngine

router = APIRouter()

class AdmetRequestReviewModel(BaseModel):
    analysis_id: str
    study_id: Optional[str] = "DB-101"
    coordinator_name: Optional[str] = "Research Coordinator"
    notes: Optional[str] = ""

# In-memory storage cache for audit history when DB is starting up or in testing
_IN_MEMORY_ANALYSES: Dict[str, Dict[str, Any]] = {}
_IN_MEMORY_REVIEWS: Dict[str, Dict[str, Any]] = {}

@router.post("/analyze", response_model=AdmetAnalyzeResponse)
def analyze_admet(req: AdmetAnalyzeRequest, db=Depends(get_db)):
    """
    Run compound-level or participant-adjusted ADMET simulation.
    Non-destructive, transparent, explainable research support.
    """
    response = AdmetAnalysisEngine.calculate_analysis(req)
    doc = response.model_dump()
    
    # Store in memory fallback
    _IN_MEMORY_ANALYSES[response.analysis_id] = doc

    # Store in MongoDB if available
    if db is not None:
        try:
            db.admet_analyses.insert_one(doc.copy())
        except Exception as e:
            print(f"MongoDB ADMET store warning: {e}")

    return response

@router.post("/dose-comparison", response_model=DoseComparisonResponse)
def compare_doses(req: DoseComparisonRequest):
    """
    Evaluate multiple protocol dose levels for non-linear exposure and ADMET alterations.
    """
    return AdmetAnalysisEngine.compare_doses(req.model_dump())

@router.get("/analysis/{id}", response_model=AdmetAnalyzeResponse)
def get_analysis_by_id(id: str, db=Depends(get_db)):
    """
    Fetch an existing versioned analysis record by ID.
    """
    if db is not None:
        try:
            doc = db.admet_analyses.find_one({"analysis_id": id})
            if doc:
                doc.pop("_id", None)
                return doc
        except Exception as e:
            print(f"MongoDB fetch warning: {e}")

    if id in _IN_MEMORY_ANALYSES:
        return _IN_MEMORY_ANALYSES[id]

    raise HTTPException(status_code=404, detail="Analysis record not found.")

@router.get("/history", response_model=List[AdmetAnalyzeResponse])
def get_analysis_history(
    participant_id: Optional[str] = Query(None),
    compound_id: Optional[str] = Query(None),
    limit: int = Query(50),
    db=Depends(get_db)
):
    """
    Retrieve auditable versioned history of prior analyses.
    """
    results = []
    query: Dict[str, Any] = {}
    if participant_id:
        query["participant_context.participant_id"] = participant_id
    if compound_id:
        query["compound_id"] = compound_id

    if db is not None:
        try:
            cursor = db.admet_analyses.find(query).sort("created_at", -1).limit(limit)
            for doc in cursor:
                doc.pop("_id", None)
                results.append(doc)
        except Exception as e:
            print(f"MongoDB history query warning: {e}")

    if not results:
        # Fallback to in-memory records
        mem_docs = list(_IN_MEMORY_ANALYSES.values())
        if participant_id:
            mem_docs = [
                d for d in mem_docs
                if d.get("participant_context") and d["participant_context"].get("participant_id") == participant_id
            ]
        if compound_id:
            mem_docs = [d for d in mem_docs if d.get("compound_id") == compound_id]
        mem_docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        results = mem_docs[:limit]

    return results

@router.get("/history/{participant_id}", response_model=List[AdmetAnalyzeResponse])
def get_participant_history(participant_id: str, db=Depends(get_db)):
    """
    Retrieve participant-specific versioned analysis history.
    """
    return get_analysis_history(participant_id=participant_id, db=db)

@router.post("/request-review")
def request_admet_review(req: AdmetRequestReviewModel, db=Depends(get_db)):
    """
    Coordinator requests Principal Investigator review on an ADMET simulation.
    Dispatches real-time WebSocket alert and notification directly to the PI.
    """
    # 1. Update status
    if req.analysis_id in _IN_MEMORY_ANALYSES:
        _IN_MEMORY_ANALYSES[req.analysis_id]["review_status"] = "PENDING_PI_REVIEW"

    if db is not None:
        try:
            db.admet_analyses.update_one(
                {"analysis_id": req.analysis_id},
                {"$set": {"review_status": "PENDING_PI_REVIEW", "coordinator_notes": req.notes}}
            )
        except Exception as e:
            print(f"MongoDB update error: {e}")

    # 2. Find PI for the study
    pi_id = None
    if db is not None:
        try:
            s = db.studies.find_one({"id": req.study_id})
            if not s:
                try:
                    from bson import ObjectId
                    s = db.studies.find_one({"_id": ObjectId(req.study_id)})
                except Exception:
                    pass
            if s:
                pi_id = str(s.get("principal_investigator_id"))
        except Exception:
            pass

    # 3. Create Notification for PI
    notif_id = create_notification(
        db=db,
        recipient_id=pi_id or "demo-principal_investigator",
        type="ADMET_REVIEW",
        title="ADMET Simulation Review Requested",
        message=f"{req.coordinator_name} submitted ADMET simulation {req.analysis_id} for your review. Notes: {req.notes or 'None'}",
        entity_type="admet_analysis",
        entity_id=req.analysis_id,
        requires_action=True,
        actions=["APPROVE", "REJECT"],
        metadata={"analysis_id": req.analysis_id, "study_id": req.study_id}
    )

    # 4. Broadcast real-time WebSocket event
    event_payload = {
        "event": "ADMET_REVIEW_REQUESTED",
        "analysis_id": req.analysis_id,
        "study_id": req.study_id,
        "coordinator_name": req.coordinator_name,
        "notes": req.notes,
        "notification_id": notif_id
    }
    connection_manager.dispatch_role_message_sync("PRINCIPAL_INVESTIGATOR", event_payload)

    return {
        "status": "success",
        "analysis_id": req.analysis_id,
        "review_status": "PENDING_PI_REVIEW",
        "notification_id": notif_id,
        "message": "ADMET simulation review request submitted to Principal Investigator."
    }

@router.post("/review", response_model=AdmetReviewResponse)
def review_analysis(req: AdmetReviewRequest, db=Depends(get_db)):
    """
    Record an investigator review decision and audit sign-off for an analysis.
    Human-in-the-loop workflow gate: ensures simulation outputs are reviewed by clinicians.
    Terminates the review lifecycle at the Principal Investigator without onward forwarding.
    """
    now_str = datetime.utcnow().isoformat() + "Z"
    review_id = f"REV-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    review_doc = {
        "review_id": review_id,
        "analysis_id": req.analysis_id,
        "reviewer_name": req.reviewer_name,
        "reviewer_role": req.reviewer_role,
        "decision": req.decision,
        "review_notes": req.review_notes,
        "timestamp": now_str,
        "status": "RECORDED",
    }

    _IN_MEMORY_REVIEWS[review_id] = review_doc

    if req.analysis_id in _IN_MEMORY_ANALYSES:
        _IN_MEMORY_ANALYSES[req.analysis_id]["review_status"] = "REVIEWED"
        _IN_MEMORY_ANALYSES[req.analysis_id]["review_details"] = review_doc

    if db is not None:
        try:
            db.admet_reviews.insert_one(review_doc.copy())
            db.admet_analyses.update_one(
                {"analysis_id": req.analysis_id},
                {"$set": {"review_status": "REVIEWED", "review_details": review_doc}}
            )
            # Mark corresponding notification action taken
            db.notifications.update_many(
                {"entity_id": req.analysis_id, "type": "ADMET_REVIEW"},
                {"$set": {"action_taken": req.decision, "read": True}}
            )
            # Log action into audit trail
            try:
                log_action(
                    db,
                    user_id=req.reviewer_name,
                    role=req.reviewer_role,
                    action="ADMET_SIMULATION_REVIEW",
                    entity_type="admet_analysis",
                    entity_id=req.analysis_id,
                    old_status="PENDING_PI_REVIEW",
                    new_status="REVIEWED",
                    reason=f"{req.decision}: {req.review_notes}"
                )
            except Exception as e:
                print(f"Audit log warning: {e}")
        except Exception as e:
            print(f"MongoDB review store warning: {e}")

    # Emit completion event to coordinator & PI (terminating at PI)
    completion_event = {
        "event": "ADMET_REVIEW_COMPLETED",
        "analysis_id": req.analysis_id,
        "decision": req.decision,
        "reviewer_name": req.reviewer_name,
        "notes": req.review_notes,
        "terminates_at": "PRINCIPAL_INVESTIGATOR",
        "timestamp": now_str
    }
    connection_manager.dispatch_role_message_sync("RESEARCH_COORDINATOR", completion_event)
    connection_manager.dispatch_role_message_sync("PRINCIPAL_INVESTIGATOR", completion_event)

    return AdmetReviewResponse(**review_doc)


