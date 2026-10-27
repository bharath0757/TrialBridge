from fastapi import APIRouter, Depends
from app.db.mongodb import get_db
from app.core.security import get_current_user

router = APIRouter()

@router.get("/dashboard/{role}")
def get_dashboard(role: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    active_studies = db.studies.count_documents({"status": {"$in": ["ACTIVE", "active", "recruiting", "screening"]}})
    total_participants = db.participants.count_documents({})
    pending_reviews = db.eligibility_reviews.count_documents({"status": {"$in": ["PENDING", "PENDING_PI_REVIEW", "human_review"]}})
    scheduled_visits = db.visits.count_documents({"status": {"$in": ["scheduled", "SCHEDULED"]}})

    return {
        "active_studies": active_studies,
        "total_participants": total_participants,
        "pending_reviews": pending_reviews,
        "scheduled_visits": scheduled_visits,
        "role": role
    }

@router.get("/enrollment")
def get_enrollment_report(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    enrolled = db.enrollments.count_documents({"status": {"$in": ["APPROVED", "approved", "enrolled", "ENROLLED"]}})
    total_participants = db.participants.count_documents({})
    rate = round((enrolled / max(1, total_participants)) * 100, 1)
    return {
        "enrolled": enrolled,
        "total_participants": total_participants,
        "enrollment_rate": rate
    }

@router.get("/screening")
def get_screening_report(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    total_screened = db.screening_results.count_documents({})
    approved_reviews = db.eligibility_reviews.count_documents({"status": {"$in": ["APPROVED", "approved"]}})
    return {
        "total_screened": total_screened,
        "approved_eligible": approved_reviews
    }

@router.get("/analytics")
def get_full_analytics(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # 1. Funnel
    total_p = db.participants.count_documents({})
    screened_count = db.screening_results.count_documents({})
    eligible_count = db.eligibility_reviews.count_documents({"status": {"$in": ["APPROVED", "approved"]}})
    consented_count = db.consents.count_documents({"status": {"$in": ["SIGNED", "VERIFIED", "consented"]}})
    enrolled_count = db.enrollments.count_documents({"status": {"$in": ["APPROVED", "enrolled"]}})

    # 2. Studies breakdown
    studies = list(db.studies.find({}, {"title": 1, "name": 1, "study_code": 1, "target_participants": 1}))
    study_stats = []
    for s in studies:
        s_id = str(s["_id"])
        enrolled_in_study = db.study_participants.count_documents({"study_id": s_id, "status": "ENROLLED"})
        study_stats.append({
            "id": s_id,
            "name": s.get("title") or s.get("name") or s.get("study_code", "Study"),
            "enrolled": enrolled_in_study,
            "target": s.get("target_participants", 100)
        })

    return {
        "funnel": {
            "candidates": total_p,
            "screened": screened_count,
            "eligible": eligible_count,
            "consented": consented_count,
            "enrolled": enrolled_count
        },
        "studies": study_stats
    }

@router.get("/clinical-trial-metrics")
def get_clinical_trial_metrics(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    participants = list(db.participants.find({}))
    data = []
    for p in participants:
        clin = p.get("clinical_attributes") or {}
        cd = p.get("clinicalData") or clin.get("clinicalData") or clin
        if "baselineHba1c" in cd or "doseMg" in cd:
            data.append(cd)

    if not data:
        return {"count": 0, "message": "No clinical trial data available"}

    total = len(data)
    mean_baseline_hba1c = round(sum(d.get("baselineHba1c", 0) for d in data) / total, 2)
    mean_week12_hba1c = round(sum(d.get("week12Hba1c", 0) for d in data) / total, 2)
    mean_hba1c_drop = round(sum(d.get("hba1cChange", 0) for d in data) / total, 2)

    mean_baseline_fpg = round(sum(d.get("baselineFpg", 0) for d in data) / total, 1)
    mean_week12_fpg = round(sum(d.get("week12Fpg", 0) for d in data) / total, 1)
    mean_fpg_drop = round(sum(d.get("fpgChange", 0) for d in data) / total, 1)

    mean_clearance = round(sum(d.get("clearanceLh", 0) for d in data) / total, 2)
    mean_renal_excretion = round(sum(d.get("renalExcretion", 0) for d in data) / total, 1)
    mean_half_life = round(sum(d.get("halfLifeH", 0) for d in data) / total, 2)

    ae_count = sum(1 for d in data if d.get("adverseEvent"))
    hypo_count = sum(1 for d in data if d.get("hypoglycemiaEvent"))

    doses = sorted(list(set(d.get("doseMg", 0) for d in data if d.get("doseMg"))))
    dose_cohorts = []
    for dose in doses:
        sub = [d for d in data if d.get("doseMg") == dose]
        if sub:
            dose_cohorts.append({
                "dose": dose,
                "count": len(sub),
                "meanBaselineHba1c": round(sum(d.get("baselineHba1c", 0) for d in sub) / len(sub), 2),
                "meanWeek12Hba1c": round(sum(d.get("week12Hba1c", 0) for d in sub) / len(sub), 2),
                "meanDrop": round(sum(d.get("hba1cChange", 0) for d in sub) / len(sub), 2),
                "meanCmax": round(sum(d.get("cmax", 0) for d in sub) / len(sub), 1),
                "meanAuc": round(sum(d.get("auc024", 0) for d in sub) / len(sub), 1),
                "meanClearance": round(sum(d.get("clearanceLh", 0) for d in sub) / len(sub), 2),
                "aeCount": sum(1 for d in sub if d.get("adverseEvent")),
                "hypoCount": sum(1 for d in sub if d.get("hypoglycemiaEvent")),
            })

    return {
        "study": "ST-001 (Type 2 Diabetes · C4H11N5)",
        "condition": "Type 2 Diabetes",
        "formula": "C4H11N5",
        "affectedOrgan": "Kidneys",
        "totalParticipants": total,
        "efficacy": {
            "meanBaselineHba1c": mean_baseline_hba1c,
            "meanWeek12Hba1c": mean_week12_hba1c,
            "meanHba1cDrop": mean_hba1c_drop,
            "meanBaselineFpg": mean_baseline_fpg,
            "meanWeek12Fpg": mean_week12_fpg,
            "meanFpgDrop": mean_fpg_drop,
        },
        "pharmacokinetics": {
            "meanClearanceLh": mean_clearance,
            "meanRenalExcretion": mean_renal_excretion,
            "meanHalfLifeH": mean_half_life,
            "dominantRoute": "Renal-dominant (OCT2 Tubular Secretion)",
        },
        "safety": {
            "adverseEvents": ae_count,
            "hypoglycemiaEvents": hypo_count,
            "aeFreeRate": round(((total - ae_count) / total) * 100, 1),
            "liverToxicityEvents": 0,
        },
        "doseCohorts": dose_cohorts,
    }
