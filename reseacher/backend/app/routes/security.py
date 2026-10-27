from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.mongodb import get_db
from app.core.permissions import require_role
from app.services import security_service
from app.repositories import security_repository as sec_repo

router = APIRouter()

class AlertResolveRequest(BaseModel):
    resolution_notes: str

# All routes require PLATFORM_ADMIN authorization
admin_dependency = Depends(require_role("PLATFORM_ADMIN"))

@router.get("/overview", dependencies=[admin_dependency])
def get_security_overview(db = Depends(get_db)):
    return security_service.generate_security_overview(db)

@router.get("/score", dependencies=[admin_dependency])
def get_security_score(db = Depends(get_db)):
    return security_service.compute_security_score(db)

@router.get("/events", dependencies=[admin_dependency])
def get_security_events(
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    db = Depends(get_db)
):
    query = {}
    if event_type:
        query["event_type"] = event_type
    if severity:
        query["severity"] = severity
    if category:
        query["category"] = category
        
    events = list(db.security_events.find(query).sort("timestamp", -1).skip(skip).limit(limit))
    for evt in events:
        evt["_id"] = str(evt["_id"])
        
    total = db.security_events.count_documents(query)
    return {"events": events, "total": total}

@router.get("/alerts", dependencies=[admin_dependency])
def get_security_alerts(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    db = Depends(get_db)
):
    query = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
        
    alerts = list(db.security_alerts.find(query).sort("timestamp", -1).skip(skip).limit(limit))
    for alert in alerts:
        alert["_id"] = str(alert["_id"])
        
    total_by_status = {}
    for st in db.security_alerts.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]):
        total_by_status[st["_id"]] = st["count"]
        
    total_by_severity = {}
    for sv in db.security_alerts.aggregate([{"$group": {"_id": "$severity", "count": {"$sum": 1}}}]):
        total_by_severity[sv["_id"]] = sv["count"]
        
    return {
        "alerts": alerts,
        "total_by_status": total_by_status,
        "total_by_severity": total_by_severity
    }

class UnlockAccountRequest(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None
    reason: Optional[str] = "Unlocked by Platform Administrator"

@router.post("/alerts/{alert_id}/resolve", dependencies=[admin_dependency])
def resolve_security_alert(
    alert_id: str, 
    request: AlertResolveRequest, 
    current_user: dict = admin_dependency,
    db = Depends(get_db)
):
    from bson import ObjectId
    import re
    # Fetch alert before resolving to check if it's an account lockout
    alert = None
    try:
        alert = db.security_alerts.find_one({"_id": ObjectId(alert_id)})
    except Exception:
        alert = db.security_alerts.find_one({"_id": alert_id})

    # Call repository to resolve the alert
    result = sec_repo.resolve_alert(db, alert_id, request.resolution_notes, current_user["id"])
    
    # If this was an account lockout alert, automatically unlock the target user
    if alert:
        email = alert.get("email") or alert.get("target_user_email")
        if not email and alert.get("description"):
            match = re.search(r"account '([^']+)'", alert["description"])
            if match:
                email = match.group(1)
        
        if email:
            email_clean = email.strip().lower()
            db.users.update_one(
                {"email": email_clean},
                {
                    "$set": {"is_locked": False, "unlocked_at": datetime.utcnow()},
                    "$unset": {"locked_at": "", "locked_reason": ""}
                }
            )
            from app.core.rate_limiter import login_rate_limiter
            login_rate_limiter.unlock_account(email_clean)

    # Create immutable audit log for ALERT_RESOLVED
    audit_log = {
        "action": "ALERT_RESOLVED",
        "entity_type": "security_alert",
        "entity_id": alert_id,
        "user_id": current_user["id"],
        "timestamp": datetime.utcnow(),
        "details": {"resolution_notes": request.resolution_notes}
    }
    db.audit_logs.insert_one(audit_log)
    
    return {"status": "success", "resolved_alert_id": alert_id}

@router.post("/unlock-account", dependencies=[admin_dependency])
def unlock_account(
    req: UnlockAccountRequest,
    current_user: dict = admin_dependency,
    db = Depends(get_db)
):
    from bson import ObjectId
    user = None
    if req.email:
        user = db.users.find_one({"email": req.email.strip().lower()})
    elif req.user_id:
        try:
            user = db.users.find_one({"_id": ObjectId(req.user_id)})
        except Exception:
            user = db.users.find_one({"_id": req.user_id})

    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    user_email = user.get("email", "").strip().lower()
    
    # 1. Clear lock in db.users
    db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"is_locked": False, "unlocked_at": datetime.utcnow()},
            "$unset": {"locked_at": "", "locked_reason": ""}
        }
    )

    # 2. Reset in-memory rate limiter
    from app.core.rate_limiter import login_rate_limiter
    login_rate_limiter.unlock_account(user_email)

    # 3. Resolve any open brute-force/lockout alerts for this user
    db.security_alerts.update_many(
        {
            "$or": [
                {"email": user_email},
                {"target_user_email": user_email},
                {"description": {"$regex": user_email, "$options": "i"}}
            ],
            "status": "OPEN"
        },
        {
            "$set": {
                "status": "RESOLVED",
                "resolved_at": datetime.utcnow(),
                "resolution_notes": f"Account unlocked by Platform Admin: {req.reason}",
                "resolved_by": current_user["id"]
            }
        }
    )

    # 4. Immutable audit log
    audit_log = {
        "action": "USER_ACCOUNT_UNLOCKED",
        "entity_type": "user",
        "entity_id": str(user["_id"]),
        "user_id": current_user["id"],
        "timestamp": datetime.utcnow(),
        "details": {
            "unlocked_email": user_email,
            "reason": req.reason,
            "admin_id": current_user["id"]
        }
    }
    db.audit_logs.insert_one(audit_log)

    return {
        "status": "success",
        "message": f"Account '{user_email}' has been successfully unlocked.",
        "email": user_email,
        "user_id": str(user["_id"])
    }

@router.get("/audit", dependencies=[admin_dependency])
def get_audit_explorer(
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    organization_id: Optional[str] = Query(None),
    study_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    db = Depends(get_db)
):
    query = {}
    if action:
        query["action"] = action
    if entity_type:
        query["entity_type"] = entity_type
    if user_id:
        query["user_id"] = user_id
    if organization_id:
        query["organization_id"] = organization_id
    if study_id:
        query["study_id"] = study_id
        
    audits = list(db.audit_logs.find(query).sort("timestamp", -1).skip(skip).limit(limit))
    for audit in audits:
        audit["_id"] = str(audit["_id"])
        
    total = db.audit_logs.count_documents(query)
    return {"audits": audits, "total": total}

@router.post("/audit/verify", dependencies=[admin_dependency])
def verify_audit_chain(db = Depends(get_db)):
    result = sec_repo.verify_audit_chain(db)
    
    if not result.get("is_valid", True):
        # Create CRITICAL security alert
        alert = {
            "title": "Audit Chain Verification Failed",
            "severity": "CRITICAL",
            "status": "OPEN",
            "timestamp": datetime.utcnow(),
            "details": result.get("invalid_details", {})
        }
        db.security_alerts.insert_one(alert)
        
    return result

@router.get("/authentication", dependencies=[admin_dependency])
def get_authentication_summary(db = Depends(get_db)):
    return security_service.get_authentication_summary(db)

@router.get("/access", dependencies=[admin_dependency])
def get_access_events(
    resource_type: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    hours: int = Query(24),
    db = Depends(get_db)
):
    # This might use a service, but the prompt says returns {events: [...], total_phi_access: int, by_role: [...], by_org: [...]}
    # We will assume this logic is handled by a repository or service, or we implement basic querying.
    # The prompt explicitly specifies the return fields, we'll implement a basic version or call the service if it existed.
    # Given the specificity, let's implement the DB query here.
    query = {}
    if resource_type:
        query["resource_type"] = resource_type
    if role:
        query["role"] = role
        
    # We will just fetch events, though proper aggregation would be ideal.
    events = list(db.access_events.find(query).sort("timestamp", -1).limit(100))
    for evt in events:
        evt["_id"] = str(evt["_id"])
        
    total_phi = db.access_events.count_documents(query)
    
    by_role = list(db.access_events.aggregate([
        {"$match": query},
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]))
    
    by_org = list(db.access_events.aggregate([
        {"$match": query},
        {"$group": {"_id": "$organization_id", "count": {"$sum": 1}}}
    ]))
    
    return {
        "events": events,
        "total_phi_access": total_phi,
        "by_role": by_role,
        "by_org": by_org
    }

@router.get("/rbac", dependencies=[admin_dependency])
def get_rbac_health(db = Depends(get_db)):
    return security_service.get_rbac_health(db)

@router.get("/consent", dependencies=[admin_dependency])
def get_consent_events(
    action: Optional[str] = Query(None),
    hours: int = Query(24),
    db = Depends(get_db)
):
    query = {}
    if action:
        query["action"] = action
        
    events = list(db.consent_events.find(query).sort("timestamp", -1).limit(100))
    for evt in events:
        evt["_id"] = str(evt["_id"])
        
    withdrawals_24h = db.consent_events.count_documents({"action": "WITHDRAWN"})
    pending_enforcement = db.consent_events.count_documents({"status": "PENDING_ENFORCEMENT"})
    
    return {
        "events": events,
        "withdrawals_24h": withdrawals_24h,
        "pending_enforcement": pending_enforcement
    }

@router.get("/tenant-isolation", dependencies=[admin_dependency])
def get_tenant_isolation_status(db = Depends(get_db)):
    return security_service.get_tenant_isolation_status(db)

@router.get("/compliance", dependencies=[admin_dependency])
def check_compliance_controls(db = Depends(get_db)):
    return security_service.check_compliance_controls(db)

@router.get("/encryption", dependencies=[admin_dependency])
def get_encryption_status():
    return security_service.get_encryption_status()

@router.get("/backups", dependencies=[admin_dependency])
def get_backup_status(db = Depends(get_db)):
    return security_service.get_backup_status(db)

@router.get("/api-monitoring", dependencies=[admin_dependency])
def get_api_monitoring(db = Depends(get_db)):
    return security_service.get_api_monitoring(db)

@router.get("/ai-monitoring", dependencies=[admin_dependency])
def get_ai_monitoring_summary(db = Depends(get_db)):
    return security_service.get_ai_monitoring_summary(db)

@router.get("/blinding", dependencies=[admin_dependency])
def get_blinding_status(db = Depends(get_db)):
    return security_service.get_blinding_status(db)

@router.post("/report/export", dependencies=[admin_dependency])
def export_security_report(current_user: dict = admin_dependency, db = Depends(get_db)):
    result = security_service.export_security_report(db)
    
    # Create immutable audit log for SECURITY_REPORT_EXPORTED
    audit_log = {
        "action": "SECURITY_REPORT_EXPORTED",
        "entity_type": "security_report",
        "user_id": current_user["id"],
        "timestamp": datetime.utcnow(),
        "details": {"report_format": "PDF/CSV"}
    }
    db.audit_logs.insert_one(audit_log)
    
    return result
