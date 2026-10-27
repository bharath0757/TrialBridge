from bson import ObjectId
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

def normalize_id(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def insert_security_event(db, event_data: dict) -> dict:
    event_data["created_at"] = datetime.utcnow()
    result = db.security_events.insert_one(event_data)
    event_data["_id"] = str(result.inserted_id)
    return event_data

def insert_login_event(db, event_data: dict) -> dict:
    event_data["created_at"] = datetime.utcnow()
    result = db.login_events.insert_one(event_data)
    event_data["_id"] = str(result.inserted_id)
    return event_data

def insert_access_event(db, event_data: dict) -> dict:
    event_data["created_at"] = datetime.utcnow()
    result = db.access_events.insert_one(event_data)
    event_data["_id"] = str(result.inserted_id)
    return event_data

def insert_consent_event(db, event_data: dict) -> dict:
    event_data["created_at"] = datetime.utcnow()
    result = db.consent_events.insert_one(event_data)
    event_data["_id"] = str(result.inserted_id)
    return event_data

def insert_security_alert(db, alert_data: dict) -> dict:
    alert_data["created_at"] = datetime.utcnow()
    if "status" not in alert_data:
        alert_data["status"] = "OPEN"
    result = db.security_alerts.insert_one(alert_data)
    alert_data["_id"] = str(result.inserted_id)
    return alert_data

def insert_immutable_audit(db, audit_data: dict) -> dict:
    if "timestamp" not in audit_data:
        audit_data["timestamp"] = datetime.utcnow()
    result = db.immutable_audit_logs.insert_one(audit_data)
    audit_data["_id"] = str(result.inserted_id)
    return audit_data

def get_security_events(db, filters: dict = None, skip: int = 0, limit: int = 50) -> List[dict]:
    query = filters or {}
    events = list(db.security_events.find(query).sort("created_at", -1).skip(skip).limit(limit))
    return [normalize_id(e) for e in events]

def count_security_events(db, filters: dict = None) -> int:
    query = filters or {}
    return db.security_events.count_documents(query)

def get_security_alerts(db, status: str = None, severity: str = None, skip: int = 0, limit: int = 50) -> List[dict]:
    query = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    alerts = list(db.security_alerts.find(query).sort("created_at", -1).skip(skip).limit(limit))
    return [normalize_id(a) for a in alerts]

def count_alerts_by_status(db) -> dict:
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    results = list(db.security_alerts.aggregate(pipeline))
    counts = {"OPEN": 0, "INVESTIGATING": 0, "RESOLVED": 0, "DISMISSED": 0}
    for r in results:
        counts[r["_id"]] = r["count"]
    return counts

def count_alerts_by_severity(db) -> dict:
    pipeline = [{"$group": {"_id": "$severity", "count": {"$sum": 1}}}]
    results = list(db.security_alerts.aggregate(pipeline))
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for r in results:
        counts[r["_id"]] = r["count"]
    return counts

def resolve_alert(db, alert_id: str, resolved_by: str, resolution_notes: str) -> bool:
    result = db.security_alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {
            "status": "RESOLVED",
            "resolved_at": datetime.utcnow(),
            "resolved_by": resolved_by,
            "resolution_notes": resolution_notes
        }}
    )
    return result.modified_count > 0

def get_login_events(db, hours: int = 24, email: str = None, success: bool = None) -> List[dict]:
    query = {"created_at": {"$gte": datetime.utcnow() - timedelta(hours=hours)}}
    if email is not None:
        query["email"] = email
    if success is not None:
        query["success"] = success
    events = list(db.login_events.find(query).sort("created_at", -1))
    return [normalize_id(e) for e in events]

def get_failed_logins_by_hour(db, hours: int = 24) -> List[dict]:
    start_time = datetime.utcnow() - timedelta(hours=hours)
    pipeline = [
        {"$match": {"success": False, "created_at": {"$gte": start_time}}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"},
                    "day": {"$dayOfMonth": "$created_at"},
                    "hour": {"$hour": "$created_at"}
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    results = list(db.login_events.aggregate(pipeline))
    formatted = []
    for r in results:
        try:
            dt = datetime(r["_id"]["year"], r["_id"]["month"], r["_id"]["day"], r["_id"]["hour"])
            formatted.append({"hour": dt.isoformat(), "count": r["count"]})
        except Exception:
            pass
    return formatted

def count_failed_logins(db, email: str = None, ip: str = None, minutes: int = 5) -> int:
    query = {
        "success": False,
        "created_at": {"$gte": datetime.utcnow() - timedelta(minutes=minutes)}
    }
    if email:
        query["email"] = email
    if ip:
        query["ip_address"] = ip
    return db.login_events.count_documents(query)

def get_access_events(db, hours: int = 24, resource_type: str = None, role: str = None) -> List[dict]:
    query = {"created_at": {"$gte": datetime.utcnow() - timedelta(hours=hours)}}
    if resource_type:
        query["resource_type"] = resource_type
    if role:
        query["role"] = role
    events = list(db.access_events.find(query).sort("created_at", -1))
    return [normalize_id(e) for e in events]

def count_phi_access(db, hours: int = 24) -> int:
    query = {
        "resource_type": {"$in": ["participant", "consent"]},
        "created_at": {"$gte": datetime.utcnow() - timedelta(hours=hours)}
    }
    return db.access_events.count_documents(query)

def get_phi_access_by_role(db, hours: int = 24) -> List[dict]:
    query = {
        "resource_type": {"$in": ["participant", "consent"]},
        "created_at": {"$gte": datetime.utcnow() - timedelta(hours=hours)}
    }
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]
    results = list(db.access_events.aggregate(pipeline))
    return [{"role": r["_id"], "count": r["count"]} for r in results if r["_id"]]

def get_phi_access_by_org(db, hours: int = 24) -> List[dict]:
    query = {
        "resource_type": {"$in": ["participant", "consent"]},
        "created_at": {"$gte": datetime.utcnow() - timedelta(hours=hours)}
    }
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$organization_id", "count": {"$sum": 1}}}
    ]
    results = list(db.access_events.aggregate(pipeline))
    return [{"organization_id": r["_id"], "count": r["count"]} for r in results if r["_id"]]

def get_consent_events(db, hours: int = 24, action: str = None) -> List[dict]:
    query = {"created_at": {"$gte": datetime.utcnow() - timedelta(hours=hours)}}
    if action:
        query["action"] = action
    events = list(db.consent_events.find(query).sort("created_at", -1))
    return [normalize_id(e) for e in events]

def get_immutable_audits(db, filters: dict = None, skip: int = 0, limit: int = 50) -> List[dict]:
    query = filters or {}
    audits = list(db.immutable_audit_logs.find(query).sort("timestamp", -1).skip(skip).limit(limit))
    return [normalize_id(a) for a in audits]

def count_immutable_audits(db, filters: dict = None) -> int:
    query = filters or {}
    return db.immutable_audit_logs.count_documents(query)

def get_last_audit_hash(db) -> str:
    last_audit = db.immutable_audit_logs.find_one({}, sort=[("timestamp", -1)])
    if last_audit and "event_hash" in last_audit:
        return last_audit["event_hash"]
    return "0" * 64

def verify_audit_chain(db) -> dict:
    import hashlib
    audits = list(db.immutable_audit_logs.find({}).sort("timestamp", 1))
    
    total = len(audits)
    verified = 0
    invalid = 0
    first_invalid_id = None
    
    current_expected_prev = "0" * 64
    for audit in audits:
        prev_hash = audit.get("previous_event_hash", "")
        if prev_hash != current_expected_prev:
            invalid += 1
            if not first_invalid_id:
                first_invalid_id = str(audit["_id"])
            continue
            
        timestamp = str(audit.get("timestamp", ""))
        user_id = str(audit.get("user_id", ""))
        action = str(audit.get("action", ""))
        entity_type = str(audit.get("entity_type", ""))
        entity_id = str(audit.get("entity_id", ""))
        old_value = str(audit.get("old_value", "")) if audit.get("old_value") is not None else "None"
        new_value = str(audit.get("new_value", "")) if audit.get("new_value") is not None else "None"
        
        computed_hash = hashlib.sha256(
            f"{prev_hash}{timestamp}{user_id}{action}{entity_type}{entity_id}{old_value}{new_value}".encode()
        ).hexdigest()
        
        if computed_hash != audit.get("event_hash"):
            invalid += 1
            if not first_invalid_id:
                first_invalid_id = str(audit["_id"])
        else:
            verified += 1
            current_expected_prev = computed_hash
            
    return {
        "status": "PASSED" if invalid == 0 else "FAILED",
        "total": total,
        "verified": verified,
        "invalid": invalid,
        "first_invalid_id": first_invalid_id,
        "verified_at": datetime.utcnow()
    }
