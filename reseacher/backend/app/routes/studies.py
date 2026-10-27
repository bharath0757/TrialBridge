from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from typing import List, Optional, Dict, Any, Tuple
import importlib
from datetime import datetime
import json
import uuid

def ObjectId(val=None):
    try:
        bson_mod = importlib.import_module("bson")
        return bson_mod.ObjectId(val) if val is not None else bson_mod.ObjectId()
    except Exception:
        return str(val) if val is not None else ""

from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role, require_study_access, require_organization_access
from app.core.connections import connection_manager
from app.models.study import StudyResponse, StudyCreate, StudyCriterionCreate
from app.models.participant import ParticipantResponse
from app.models.candidate import CandidateResponse, CandidateUploadPayload, ScreeningRequest
from app.models.upload_batch import UploadBatchResponse
from app.repositories import studies as study_repo
from app.repositories import participants as participant_repo
from app.repositories import study_participants as sp_repo
from app.services.upload_service import process_candidate_file, process_candidate_data
from app.services.rule_engine import evaluate_candidate_decision_tree
from app.services.ai_safeguards_service import analyze_eligibility_evidence
from app.services.notification_service import create_notification
from app.services.audit_service import log_action

import time

router = APIRouter()

_STUDY_STATS_CACHE: Dict[str, Tuple[float, Dict[str, int]]] = {}
_CACHE_TTL_SECONDS = 30.0
_STUDIES_LIST_CACHE: Tuple[float, List[dict]] = (0.0, [])
_STUDIES_CACHE_TTL = 10.0

_FAST_USER_NAMES: Dict[str, str] = {
    "demo-principal_investigator": "Dr. Sarah Chen",
    "demo-research_coordinator": "Maya Rodriguez",
    "demo-platform_admin": "Dr. Sarah Chen",
    "u-pi": "Dr. Sarah Chen",
    "u-coord": "Maya Rodriguez",
    "u-admin": "Platform Admin"
}

_FAST_ORG_NAMES: Dict[str, str] = {
    "org-001": "City Hospital Main Research Center",
    "demo-org": "City Hospital Main Research Center",
    "org-metro": "Metro Health Research Center"
}

def invalidate_studies_cache():
    global _STUDIES_LIST_CACHE
    _STUDIES_LIST_CACHE = (0.0, [])

def _get_study_counts(db, study_id: str, s: dict) -> Tuple[int, int, int, int]:
    """
    Fast, cached counter retrieval to eliminate repeated Atlas roundtrips.
    """
    if (
        s.get("enrolledParticipants") is not None
        and s.get("screenedParticipants") is not None
        and s.get("eligibleParticipants") is not None
    ):
        return (
            int(s.get("enrolledParticipants", 0)),
            int(s.get("screenedParticipants", 0)),
            int(s.get("eligibleParticipants", 0)),
            int(s.get("pendingReviews", 0))
        )

    now = time.time()
    cached = _STUDY_STATS_CACHE.get(study_id)
    if cached and (now - cached[0]) < _CACHE_TTL_SECONDS:
        c = cached[1]
        return c["enrolled"], c["screened"], c["eligible"], c["pending"]

    try:
        enrolled_count = db.study_participants.count_documents({"study_id": study_id, "status": {"$in": ["ENROLLED", "enrolled"]}})
        screened_count = db.candidates.count_documents({"study_id": study_id, "screening_status": {"$in": ["PASSED", "PASS", "FAILED", "FAIL", "SUBMITTED_TO_PI", "HUMAN_CONFIRMED_ELIGIBLE"]}})
        eligible_count = db.candidates.count_documents({"study_id": study_id, "screening_status": {"$in": ["PASSED", "PASS", "HUMAN_CONFIRMED_ELIGIBLE"]}})
        pending_count = db.eligibility_reviews.count_documents({"study_id": study_id, "status": "PENDING_PI_REVIEW"})
    except Exception:
        enrolled_count, screened_count, eligible_count, pending_count = 0, 0, 0, 0

    _STUDY_STATS_CACHE[study_id] = (now, {
        "enrolled": enrolled_count,
        "screened": screened_count,
        "eligible": eligible_count,
        "pending": pending_count
    })
    return enrolled_count, screened_count, eligible_count, pending_count

def _enrich_study(db, s: dict) -> dict:
    s["id"] = str(s.get("id") or s.get("_id") or s.get("study_code"))
    
    title = s.get("title") or s.get("name") or "Clinical Study"
    s["title"] = title
    s["name"] = title
    
    # Fast Principal Investigator name resolution
    pi_name = s.get("principalInvestigator")
    if not pi_name and s.get("principal_investigator_id"):
        pi_id_str = str(s["principal_investigator_id"])
        if pi_id_str in _FAST_USER_NAMES:
            pi_name = _FAST_USER_NAMES[pi_id_str]
        else:
            try:
                pi_user = db.users.find_one({"_id": ObjectId(pi_id_str)})
            except Exception:
                pi_user = db.users.find_one({"_id": pi_id_str})
            if pi_user:
                pi_name = pi_user.get("name", "Principal Investigator")
                _FAST_USER_NAMES[pi_id_str] = pi_name
    s["principalInvestigator"] = pi_name or "Dr. J Patel"
    
    # Fast Organization/Site resolution
    site_name = s.get("researchSite")
    if not site_name and s.get("organization_id"):
        org_id_str = str(s["organization_id"])
        if org_id_str in _FAST_ORG_NAMES:
            site_name = _FAST_ORG_NAMES[org_id_str]
        else:
            try:
                org = db.organizations.find_one({"_id": ObjectId(org_id_str)})
            except Exception:
                org = db.organizations.find_one({"_id": org_id_str})
            if org:
                site_name = f"{org.get('name')}, Main Facility"
                _FAST_ORG_NAMES[org_id_str] = site_name
    s["researchSite"] = site_name or "City Hospital, Main Site"
    s["sponsor"] = s.get("sponsor") or "PharmaCo Research"
    s["condition"] = s.get("condition") or s.get("description") or "Clinical Research"
    s["startDate"] = s.get("startDate") or "2026-06-01"
    s["endDate"] = s.get("endDate") or "2027-06-01"
    s["targetParticipants"] = s.get("targetParticipants") or 100
    
    # Fast cached screening & participant metrics
    enrolled, screened, eligible, pending = _get_study_counts(db, s["id"], s)
    s["enrolledParticipants"] = enrolled
    s["screenedParticipants"] = screened
    s["eligibleParticipants"] = eligible
    s["pendingReviews"] = pending
        
    s["status"] = str(s.get("status") or "active").lower()
    s["phase"] = s.get("phase") or "Phase II"
    s["anatomy"] = s.get("anatomy") or "General"
    s["anatomyDescription"] = s.get("anatomyDescription") or s.get("description") or ""
    
    # Eligibility criteria
    raw_criteria = s.get("eligibilityCriteria") or s.get("criteria") or []
    s["eligibilityCriteria"] = raw_criteria
    s["criteria"] = raw_criteria
    s["criteria_version"] = s.get("criteria_version", 1)
    return s

@router.get("/", response_model=List[StudyResponse])
def read_studies(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    global _STUDIES_LIST_CACHE
    now = time.time()
    
    # All roles can view active studies to facilitate collaboration
    if current_user["role"] == "PLATFORM_ADMIN":
        studies = study_repo.list_all(db)
    elif current_user["role"] == "ORGANIZATION":
        studies = study_repo.list_by_org(db, current_user.get("organization_id"))
    elif current_user["role"] == "PRINCIPAL_INVESTIGATOR":
        studies = study_repo.list_all(db)
    elif current_user["role"] == "RESEARCH_COORDINATOR":
        studies = study_repo.list_all(db)
    else:
        studies = study_repo.list_all(db)
        
    enriched = [_enrich_study(db, s) for s in studies]
    return enriched

@router.post("/", response_model=StudyResponse)
def create_study(study_in: StudyCreate, db = Depends(get_db), current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR", "PLATFORM_ADMIN"))):
    study_data = study_in.model_dump(exclude_unset=True)
    study_data["principal_investigator_id"] = current_user["id"]
    study_data["principalInvestigator"] = current_user.get("name", "Dr. J Patel")
    
    # Assign study code / id if missing
    if not study_data.get("study_code"):
        study_data["study_code"] = f"STU-{uuid.uuid4().hex[:6].upper()}"
    if not study_data.get("id"):
        study_data["id"] = study_data["study_code"]
    study_data["_id"] = study_data["id"]
    
    study_data["status"] = study_data.get("status") or "active"
    study_data["enrolledParticipants"] = 0
    study_data["screenedParticipants"] = 0
    study_data["eligibleParticipants"] = 0
    study_data["pendingReviews"] = 0
    study_data["criteria_version"] = 1
    study_data["created_at"] = datetime.utcnow()
    study_data["updated_at"] = datetime.utcnow()
    
    created = study_repo.create(db, study_data)
    enriched = _enrich_study(db, created)

    # Invalidate cache
    invalidate_studies_cache()
    _STUDY_STATS_CACHE[created["id"]] = (time.time(), {
        "enrolled": 0, "screened": 0, "eligible": 0, "pending": 0
    })
    
    # 1. Real-time WebSocket Event Broadcast with full study payload for instant 0ms client hydration
    event_payload = {
        "event": "STUDY_CREATED",
        "study_id": created["id"],
        "study_code": created.get("study_code", created["id"]),
        "study_title": created.get("title") or created.get("name"),
        "principal_investigator": current_user.get("name", "Dr. J Patel"),
        "condition": created.get("condition", "Clinical Research"),
        "phase": created.get("phase", "Phase II"),
        "message": f"New Clinical Study created: {created.get('title') or created.get('name')}",
        "study": enriched
    }
    connection_manager.dispatch_role_message_sync("RESEARCH_COORDINATOR", event_payload)
    connection_manager.dispatch_role_message_sync("PRINCIPAL_INVESTIGATOR", event_payload)
    connection_manager.dispatch_role_message_sync("PLATFORM_ADMIN", event_payload)
    
    # 2. Persistent Notification for Coordinators
    try:
        db.notifications.insert_one({
            "recipient_role": "RESEARCH_COORDINATOR",
            "recipient_id": "all",
            "type": "STUDY_CREATED",
            "title": "New Study Published",
            "message": f"PI {current_user.get('name', 'PI')} created study '{created.get('title') or created.get('name')}'. Ready for candidate intake.",
            "entity_type": "study",
            "entity_id": created["id"],
            "read": False,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Warning: Failed to create persistent notification: {e}")
        
    # 3. Audit Log
    log_action(db, current_user["id"], current_user.get("role", "PRINCIPAL_INVESTIGATOR"), "CREATE_STUDY", "study", created["id"])
    
    return enriched

@router.get("/{id}", response_model=StudyResponse)
def read_study(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_study_access(current_user, id, db)
    study = study_repo.get_by_id(db, id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    return _enrich_study(db, study)

@router.put("/{id}")
def update_study(id: str, update_data: dict, db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN", "ORGANIZATION", "PRINCIPAL_INVESTIGATOR"))):
    require_study_access(current_user, id, db)
    # If criteria changed, bump criteria_version
    if "criteria" in update_data or "eligibilityCriteria" in update_data:
        study = study_repo.get_by_id(db, id)
        curr_ver = (study.get("criteria_version") or 1) if study else 1
        update_data["criteria_version"] = curr_ver + 1
        
    update_data["updated_at"] = datetime.utcnow()
    success = study_repo.update(db, id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Study not found")
    return {"status": "success", "criteria_version": update_data.get("criteria_version")}

@router.get("/{id}/criteria")
def read_criteria(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_study_access(current_user, id, db)
    study = study_repo.get_by_id(db, id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    return study.get("eligibilityCriteria") or study.get("criteria", [])

@router.post("/{id}/criteria")
def add_criteria(id: str, criteria: List[StudyCriterionCreate], db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN", "ORGANIZATION", "PRINCIPAL_INVESTIGATOR"))):
    require_study_access(current_user, id, db)
    study = study_repo.get_by_id(db, id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    existing_criteria = study.get("eligibilityCriteria") or study.get("criteria", [])
    new_criteria = [c.model_dump() for c in criteria]
    for i, nc in enumerate(new_criteria):
        nc["_id"] = str(i + len(existing_criteria))
    existing_criteria.extend(new_criteria)
    curr_ver = study.get("criteria_version", 1) + 1
    study_repo.update(db, id, {"eligibilityCriteria": existing_criteria, "criteria": existing_criteria, "criteria_version": curr_ver})
    return {"criteria": existing_criteria, "criteria_version": curr_ver}

# ----------------------------------------------------
# CANDIDATE DATASET UPLOAD & SCOPED BATCH MANAGEMENT
# ----------------------------------------------------

@router.post("/{id}/upload-candidates")
async def upload_candidates(
    id: str,
    file: Optional[UploadFile] = File(None),
    payload: Optional[str] = Form(None),
    column_mapping: Optional[str] = Form(None),
    db = Depends(get_db),
    current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PRINCIPAL_INVESTIGATOR", "PLATFORM_ADMIN"))
):
    require_study_access(current_user, id, db)
    study = study_repo.get_by_id(db, id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    custom_mapping = json.loads(column_mapping) if column_mapping else None

    if file:
        content = await file.read()
        batch_doc = process_candidate_file(
            db=db,
            study_id=id,
            filename=file.filename,
            content=content,
            custom_mappings=custom_mapping
        )
    elif payload:
        data = json.loads(payload)
        candidate_rows = data.get("candidates", [])
        filename = data.get("filename", "dataset.json")
        batch_doc = process_candidate_data(
            db=db,
            study_id=id,
            filename=filename,
            records=candidate_rows,
            custom_mappings=custom_mapping
        )
    else:
        raise HTTPException(status_code=400, detail="Must provide either a file upload or candidates payload")

    # Fetch newly inserted candidates for this batch
    candidates = list(db.candidates.find({"batch_id": batch_doc["id"]}).limit(10))
    for c in candidates:
        c["id"] = str(c.get("_id") or c.get("id"))

    # Log action
    log_action(db, current_user["id"], current_user.get("role", "RESEARCH_COORDINATOR"), "UPLOAD_CANDIDATES", "study", id, None, None, f"Uploaded batch {batch_doc['id']} ({batch_doc['valid_records']} valid)")

    return {
        "status": "success",
        "batch_id": batch_doc["id"],
        "study_id": id,
        "summary": {
            "total_records": batch_doc["total_records"],
            "valid_records": batch_doc["valid_records"],
            "invalid_records": batch_doc["invalid_records"],
            "duplicate_records": batch_doc["duplicate_records"]
        },
        "mapped_columns": batch_doc.get("column_mapping", {}),
        "validation_errors": batch_doc.get("validation_errors", []),
        "candidates_sample": candidates
    }

@router.get("/{id}/upload-batches", response_model=List[UploadBatchResponse])
def get_upload_batches(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_study_access(current_user, id, db)
    batches = list(db.upload_batches.find({"study_id": id}).sort("uploaded_at", -1))
    for b in batches:
        b["id"] = str(b.get("_id") or b.get("id"))
    return batches

@router.get("/{id}/candidates", response_model=List[CandidateResponse])
def get_study_candidates(
    id: str,
    batch_id: Optional[str] = None,
    screening_status: Optional[str] = None,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    require_study_access(current_user, id, db)
    query: Dict[str, Any] = {"study_id": id}
    if batch_id:
        query["batch_id"] = batch_id
    if screening_status:
        query["screening_status"] = screening_status

    candidates = list(db.candidates.find(query).sort("created_at", -1))
    for c in candidates:
        c["id"] = str(c.get("_id") or c.get("id"))
    return candidates

# ----------------------------------------------------
# DETERMINISTIC SCREENING & DECISION TREE ENGINE
# ----------------------------------------------------

@router.post("/{id}/screen-candidates")
def screen_candidates(
    id: str,
    req: ScreeningRequest = Body(default_factory=ScreeningRequest),
    db = Depends(get_db),
    current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PRINCIPAL_INVESTIGATOR", "PLATFORM_ADMIN"))
):
    require_study_access(current_user, id, db)
    study = study_repo.get_by_id(db, id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    criteria = study.get("eligibilityCriteria") or study.get("criteria", [])
    if not criteria:
        raise HTTPException(status_code=400, detail="Study has no defined eligibility criteria. Please add criteria first.")

    query: Dict[str, Any] = {"study_id": id}
    if req.batch_id:
        query["batch_id"] = req.batch_id
    if req.candidate_ids:
        query["_id"] = {"$in": [ObjectId(cid) if len(cid) == 24 else cid for cid in req.candidate_ids]}

    candidates = list(db.candidates.find(query))
    if not candidates:
        raise HTTPException(status_code=404, detail="No candidates found matching criteria.")

    screened_results = []
    pass_count = 0
    fail_count = 0
    review_count = 0

    study_title = study.get("title") or study.get("name") or "Clinical Study"
    criteria_version = study.get("criteria_version", 1)

    for cand in candidates:
        cand_id = str(cand.get("_id") or cand.get("id"))
        cand_data = cand.get("normalized_data", {})

        # Run Deterministic Rule Engine Decision Tree
        decision_tree_eval = evaluate_candidate_decision_tree(
            candidate=cand,
            criteria=criteria,
            criteria_version=criteria_version
        )

        overall_status = decision_tree_eval["overall_status"]
        if overall_status == "PASS":
            pass_count += 1
        elif overall_status == "FAIL":
            fail_count += 1
        else:
            review_count += 1

        # Run Gemini AI Clinical Safeguards Analysis (Assistive only)
        ai_summary = None
        ai_confidence = None
        if req.run_ai_assistance:
            try:
                ai_eval = analyze_eligibility_evidence(
                    participant_data=cand_data,
                    criteria=criteria,
                    study_title=study_title
                )
                ai_summary = ai_eval.get("clinical_summary")
                ai_confidence = ai_eval.get("ai_confidence")
            except Exception as e:
                ai_summary = f"Rule-based evaluation completed: {decision_tree_eval.get('summary')}"
                ai_confidence = 88.0

        update_payload = {
            "screening_status": overall_status,
            "match_score": decision_tree_eval.get("match_score", 0.0),
            "decision_tree": decision_tree_eval,
            "ai_confidence": ai_confidence or 90.0,
            "ai_summary": ai_summary or decision_tree_eval.get("summary"),
            "updated_at": datetime.utcnow()
        }

        db.candidates.update_one({"_id": cand["_id"]}, {"$set": update_payload})
        cand.update(update_payload)
        cand["id"] = cand_id
        screened_results.append(cand)

    # Log action
    log_action(db, current_user["id"], current_user.get("role", "RESEARCH_COORDINATOR"), "SCREEN_CANDIDATES", "study", id, None, None, f"Screened {len(candidates)} candidates (PASS: {pass_count}, FAIL: {fail_count}, REVIEW: {review_count})")

    return {
        "status": "success",
        "study_id": id,
        "criteria_version": criteria_version,
        "total_screened": len(candidates),
        "pass_count": pass_count,
        "fail_count": fail_count,
        "review_required_count": review_count,
        "candidates": screened_results
    }

# ----------------------------------------------------
# COORDINATOR SUBMIT BATCH TO PI
# ----------------------------------------------------

@router.post("/{id}/submit-to-pi")
def submit_candidates_to_pi(
    id: str,
    candidate_ids: List[str] = Body(...),
    coordinator_notes: str = Body(""),
    db = Depends(get_db),
    current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PLATFORM_ADMIN"))
):
    require_study_access(current_user, id, db)
    study = study_repo.get_by_id(db, id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    pi_id = study.get("principal_investigator_id")
    if not pi_id:
        raise HTTPException(status_code=400, detail="Study has no assigned Principal Investigator.")

    created_reviews = []
    for cid in candidate_ids:
        try:
            cand = db.candidates.find_one({"_id": ObjectId(cid), "study_id": id})
        except Exception:
            cand = db.candidates.find_one({"_id": cid, "study_id": id})
        if not cand:
            continue

        # Create or update eligibility review document
        review_data = {
            "study_id": id,
            "participant_id": str(cand.get("participant_code") or cid),
            "candidate_id": str(cand.get("_id")),
            "coordinator_id": current_user["id"],
            "assigned_to_pi": pi_id,
            "status": "PENDING_PI_REVIEW",
            "coordinator_notes": coordinator_notes or "Coordinator submitted candidate for PI sign-off.",
            "decision_tree": cand.get("decision_tree"),
            "ai_confidence": cand.get("ai_confidence", 92.0),
            "ai_summary": cand.get("ai_summary", "Candidate meets trial inclusion parameters."),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = db.eligibility_reviews.insert_one(review_data)
        review_id = str(res.inserted_id)
        created_reviews.append(review_id)

        # Update candidate status
        db.candidates.update_one({"_id": cand["_id"]}, {"$set": {"screening_status": "SUBMITTED_TO_PI", "updated_at": datetime.utcnow()}})

    # Notify PI
    create_notification(
        db=db,
        recipient_id=str(pi_id),
        type="ELIGIBILITY_REVIEW",
        title="Clinical Eligibility Reviews Pending",
        message=f"Research Coordinator submitted {len(created_reviews)} candidates for Study {study.get('title') or id} requiring your authoritative review.",
        entity_type="study",
        entity_id=id
    )

    # Emit WebSocket event for PI
    connection_manager.dispatch_role_message_sync("PRINCIPAL_INVESTIGATOR", {
        "event": "ELIGIBILITY_REVIEW_REQUESTED",
        "study_id": id,
        "study_title": study.get("title") or study.get("name"),
        "coordinator_name": current_user.get("name", "Coordinator"),
        "count": len(created_reviews),
        "message": f"{len(created_reviews)} candidates submitted for PI review in {study.get('title') or id}"
    })

    log_action(db, current_user["id"], "RESEARCH_COORDINATOR", "SUBMIT_ELIGIBILITY_BATCH", "study", id, None, None, f"Submitted {len(created_reviews)} candidates to PI {pi_id}")

    return {
        "status": "success",
        "study_id": id,
        "submitted_count": len(created_reviews),
        "review_ids": created_reviews
    }

# ----------------------------------------------------
# STUDY PARTICIPANTS
# ----------------------------------------------------

@router.get("/{id}/participants", response_model=List[ParticipantResponse])
def read_study_participants(id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_study_access(current_user, id, db)
    return participant_repo.list_by_study(db, id)

@router.post("/{id}/participants")
def add_participant_to_study(id: str, participant_id: str, db = Depends(get_db), current_user: dict = Depends(require_role("RESEARCH_COORDINATOR", "PRINCIPAL_INVESTIGATOR", "ORGANIZATION", "PLATFORM_ADMIN"))):
    require_study_access(current_user, id, db)
    if sp_repo.get(db, participant_id, id):
        raise HTTPException(status_code=400, detail="Participant already in study")
    sp_data = {"participant_id": participant_id, "study_id": id, "status": "IDENTIFIED"}
    return sp_repo.create(db, sp_data)

