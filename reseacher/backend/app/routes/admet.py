from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.permissions import require_role, require_study_access
from app.db.mongodb import get_db
from app.models.admet import (
    AdmetAnalyzeRequest, AdmetAnalyzeResponse, DoseComparisonRequest,
    DoseComparisonResponse, AdmetReviewRequest, AdmetReviewResponse,
)
from app.repositories.studies import get_by_id as get_study
from app.services.admet_service import AdmetAnalysisEngine
from app.services.notification_service import create_notification


staff = require_role("PLATFORM_ADMIN", "PRINCIPAL_INVESTIGATOR", "RESEARCH_COORDINATOR")
router = APIRouter(dependencies=[Depends(staff)])


class AdmetRequestReviewModel(BaseModel):
    analysis_id: str
    study_id: str
    notes: str = Field(default="", max_length=4000)


def visible_analyses(user):
    if user["role"] == "PLATFORM_ADMIN":
        return {}
    return {"$or": [{"created_by": user["id"]}, {"assigned_pi": user["id"]}]}


@router.post("/analyze", response_model=AdmetAnalyzeResponse)
def analyze_admet(req: AdmetAnalyzeRequest, user=Depends(staff), db=Depends(get_db)):
    response = AdmetAnalysisEngine.calculate_analysis(req)
    db.admet_analyses.insert_one({**response.model_dump(), "created_by": user["id"]})
    return response


@router.post("/dose-comparison", response_model=DoseComparisonResponse)
def compare_doses(req: DoseComparisonRequest):
    return AdmetAnalysisEngine.compare_doses(req.model_dump())


@router.get("/analysis/{id}", response_model=AdmetAnalyzeResponse)
def get_analysis_by_id(id: str, user=Depends(staff), db=Depends(get_db)):
    doc = db.admet_analyses.find_one({**visible_analyses(user), "analysis_id": id})
    if not doc:
        raise HTTPException(404, "Analysis not found")
    return doc


@router.get("/history", response_model=list[AdmetAnalyzeResponse])
def get_analysis_history(participant_id: Optional[str] = None, compound_id: Optional[str] = None,
                         review_status: Optional[Literal["DRAFT", "PENDING_PI_REVIEW", "REVIEWED"]] = None,
                         limit: int = Query(50, ge=1, le=100), user=Depends(staff), db=Depends(get_db)):
    query = visible_analyses(user)
    if participant_id:
        query["participant_context.participant_id"] = participant_id
    if compound_id:
        query["compound_id"] = compound_id
    if review_status:
        query["review_status"] = review_status
    return list(db.admet_analyses.find(query).sort("created_at", -1).limit(limit))


@router.get("/history/{participant_id}", response_model=list[AdmetAnalyzeResponse])
def get_participant_history(participant_id: str, user=Depends(staff), db=Depends(get_db)):
    return get_analysis_history(participant_id, limit=50, user=user, db=db)


@router.post("/request-review")
def request_admet_review(req: AdmetRequestReviewModel, user=Depends(require_role("RESEARCH_COORDINATOR")), db=Depends(get_db)):
    require_study_access(user, req.study_id, db)
    study = get_study(db, req.study_id)
    pi_id = study.get("principal_investigator_id")
    if not pi_id:
        raise HTTPException(409, "This study needs an assigned investigator")
    result = db.admet_analyses.update_one(
        {"analysis_id": req.analysis_id, "created_by": user["id"], "review_status": "DRAFT"},
        {"$set": {"review_status": "PENDING_PI_REVIEW", "assigned_pi": str(pi_id),
                  "study_id": req.study_id, "coordinator_notes": req.notes}},
    )
    if not result.matched_count:
        raise HTTPException(409, "This draft is unavailable for submission")
    create_notification(db, str(pi_id), "ADMET_REVIEW", "Simulation ready for review",
                        req.notes, "admet_analysis", req.analysis_id)
    return {"status": "success", "analysis_id": req.analysis_id, "review_status": "PENDING_PI_REVIEW"}


@router.post("/review", response_model=AdmetReviewResponse)
def review_analysis(req: AdmetReviewRequest, user=Depends(require_role("PRINCIPAL_INVESTIGATOR")), db=Depends(get_db)):
    query = {"analysis_id": req.analysis_id, "assigned_pi": user["id"], "review_status": "PENDING_PI_REVIEW"}
    analysis = db.admet_analyses.find_one(query)
    if not analysis:
        raise HTTPException(404, "Assigned pending review not found")
    require_study_access(user, analysis["study_id"], db)
    review = AdmetReviewResponse(review_id=f"REV-{uuid4().hex}", analysis_id=req.analysis_id,
                                 reviewer_name=user["name"], reviewer_role=user["role"], decision=req.decision,
                                 review_notes=req.review_notes, timestamp=datetime.now(timezone.utc).isoformat(), status="RECORDED")
    result = db.admet_analyses.update_one(query, {"$set": {"review_status": "REVIEWED", "reviewer_id": user["id"],
                                                           "review_details": review.model_dump()}})
    if not result.matched_count:
        raise HTTPException(409, "This analysis has already been reviewed")
    create_notification(db, analysis["created_by"], "ADMET_REVIEW_COMPLETED", "Investigator review recorded",
                        req.decision, "admet_analysis", req.analysis_id)
    return review
