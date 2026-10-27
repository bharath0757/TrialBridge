import os, sys, hashlib, random, uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv

def seed_security():
    load_dotenv()
    sys.path.insert(0, os.path.dirname(__file__))
    from app.db.mongodb import startup_connect, get_db
    startup_connect()
    db = get_db()
    
    collections_to_drop = [
        'security_events', 'security_alerts', 'login_events', 'access_events', 
        'consent_events', 'immutable_audit_logs', 'compliance_controls', 'backup_status'
    ]
    for coll in collections_to_drop:
        db[coll].drop()
    
    print("Dropped old security collections.")
    
    users = list(db.users.find())
    if not users:
        print("No users found! Please run seed.py first.")
        return
        
    participants = list(db.participants.find())
    studies = list(db.studies.find())
    organizations = list(db.organizations.find())

    users_by_role = {}
    for u in users:
        role = u.get("role", "UNKNOWN")
        users_by_role.setdefault(role, []).append(u)
        
    all_user_ids = [str(u["_id"]) for u in users]
    
    now = datetime.utcnow()
    
    def random_time(start_days_ago=7, end_days_ago=0):
        start = now - timedelta(days=start_days_ago)
        end = now - timedelta(days=end_days_ago)
        return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

    # Helpers
    def random_ip(internal=False):
        if internal:
            return f"10.0.1.{random.randint(1, 254)}"
        return f"{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"

    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

    # --- Login Events (200+) ---
    login_events = []
    
    # 150+ successful logins
    for _ in range(160):
        u = random.choice(users)
        login_events.append({
            "user_id": str(u["_id"]),
            "email": u["email"],
            "status": "SUCCESS",
            "ip_address": random_ip(internal=True),
            "user_agent": ua,
            "timestamp": random_time()
        })
        
    # 30+ failed logins
    # 5 brute force from unknown
    brute_time = random_time()
    for i in range(5):
        login_events.append({
            "user_id": None,
            "email": "unknown@hacker.com",
            "status": "FAILED",
            "reason": "INVALID_CREDENTIALS",
            "ip_address": "185.143.223.11",
            "user_agent": ua,
            "timestamp": brute_time + timedelta(seconds=i*15)
        })
        
    # 10 failed for sarah.chen
    sarah = next((u for u in users if u["email"] == "sarah.chen@trialbridge.io"), users[0])
    for _ in range(10):
        login_events.append({
            "user_id": str(sarah["_id"]),
            "email": sarah["email"],
            "status": "FAILED",
            "reason": "INVALID_PASSWORD",
            "ip_address": random_ip(),
            "user_agent": ua,
            "timestamp": random_time()
        })
        
    # 15 scattered failures
    for _ in range(15):
        u = random.choice(users)
        login_events.append({
            "user_id": str(u["_id"]),
            "email": u["email"],
            "status": "FAILED",
            "reason": "INVALID_PASSWORD",
            "ip_address": random_ip(),
            "user_agent": ua,
            "timestamp": random_time()
        })
        
    db.login_events.insert_many(login_events)
    print(f"Inserted {len(login_events)} login events.")

    # --- Security Events (500+) ---
    security_events = []
    
    # 300+ PHI_ACCESS
    for _ in range(320):
        u = random.choice(users)
        security_events.append({
            "event_type": "PHI_ACCESS",
            "user_id": str(u["_id"]),
            "role": u.get("role"),
            "resource": random.choice(["participant", "consent"]),
            "action": "READ",
            "status": "SUCCESS",
            "ip_address": random_ip(internal=True),
            "timestamp": random_time()
        })
        
    # 50+ ACCESS_DENIED (403)
    for _ in range(55):
        u = random.choice(users)
        security_events.append({
            "event_type": "ACCESS_DENIED",
            "user_id": str(u["_id"]),
            "role": u.get("role"),
            "resource": random.choice(["/api/eligibility/approve", "/api/admin", "/api/studies"]),
            "action": "EXECUTE",
            "status": "BLOCKED",
            "ip_address": random_ip(internal=True),
            "timestamp": random_time()
        })
        
    # 20+ LOGIN_FAILED
    for ev in login_events:
        if ev["status"] == "FAILED":
            security_events.append({
                "event_type": "LOGIN_FAILED",
                "user_id": ev["user_id"],
                "email": ev["email"],
                "ip_address": ev["ip_address"],
                "timestamp": ev["timestamp"]
            })
            if len(security_events) >= 320 + 55 + 25:
                break
                
    # 5 CROSS_TENANT_ATTEMPT
    for _ in range(5):
        coord = random.choice(users_by_role.get("RESEARCH_COORDINATOR", users))
        security_events.append({
            "event_type": "CROSS_TENANT_ATTEMPT",
            "user_id": str(coord["_id"]),
            "role": "RESEARCH_COORDINATOR",
            "resource": "participant_other_org",
            "status": "BLOCKED",
            "ip_address": random_ip(internal=True),
            "timestamp": random_time()
        })
        
    # 3 TRIAL_BLINDING_VIOLATION
    for _ in range(3):
        coord = random.choice(users_by_role.get("RESEARCH_COORDINATOR", users))
        security_events.append({
            "event_type": "TRIAL_BLINDING_VIOLATION",
            "user_id": str(coord["_id"]),
            "role": "RESEARCH_COORDINATOR",
            "resource": "/api/studies/{id}/treatment-arm",
            "status": "BLOCKED",
            "ip_address": random_ip(internal=True),
            "timestamp": random_time()
        })
        
    # 10 AI_OVERRIDE
    for _ in range(10):
        pi = random.choice(users_by_role.get("PRINCIPAL_INVESTIGATOR", users))
        security_events.append({
            "event_type": "AI_OVERRIDE",
            "user_id": str(pi["_id"]),
            "role": "PRINCIPAL_INVESTIGATOR",
            "resource": "screening_recommendation",
            "status": "SUCCESS",
            "justification": "Clinical judgment override",
            "timestamp": random_time()
        })
        
    # 20 CONSENT_EVENT
    for _ in range(20):
        security_events.append({
            "event_type": "CONSENT_EVENT",
            "user_id": random.choice(all_user_ids),
            "action": random.choice(["SIGNED", "VERIFIED", "WITHDRAWN"]),
            "timestamp": random_time()
        })
        
    # 5 ROLE_CHANGED
    for _ in range(5):
        admin = random.choice(users_by_role.get("PLATFORM_ADMIN", users))
        security_events.append({
            "event_type": "ROLE_CHANGED",
            "user_id": str(admin["_id"]),
            "role": "PLATFORM_ADMIN",
            "target_user_id": random.choice(all_user_ids),
            "timestamp": random_time()
        })
        
    # 10 DOCUMENT_ACCESS
    for _ in range(10):
        security_events.append({
            "event_type": "DOCUMENT_ACCESS",
            "user_id": random.choice(all_user_ids),
            "resource": "protocol_doc.pdf",
            "timestamp": random_time()
        })
        
    # 50 API_ERROR
    for _ in range(50):
        security_events.append({
            "event_type": "API_ERROR",
            "user_id": random.choice(all_user_ids),
            "resource": "/api/data",
            "status": "ERROR_500",
            "timestamp": random_time()
        })
        
    # 10 BULK_EXPORT
    for _ in range(10):
        pi = random.choice(users_by_role.get("PRINCIPAL_INVESTIGATOR", users))
        security_events.append({
            "event_type": "BULK_EXPORT",
            "user_id": str(pi["_id"]),
            "role": "PRINCIPAL_INVESTIGATOR",
            "resource": "participants_data",
            "timestamp": random_time()
        })
        
    # 2 RATE_LIMIT_EXCEEDED
    for _ in range(2):
        security_events.append({
            "event_type": "RATE_LIMIT_EXCEEDED",
            "user_id": random.choice(all_user_ids),
            "timestamp": random_time()
        })

    db.security_events.insert_many(security_events)
    print(f"Inserted {len(security_events)} security events.")

    # --- Security Alerts (25) ---
    alerts = []
    
    # 3 CRITICAL
    alerts.extend([
        {"title": "Audit integrity mismatch", "severity": "CRITICAL", "status": "RESOLVED", "resolved_at": random_time(), "resolution_notes": "False positive due to timezone clock drift. NTP fixed.", "timestamp": random_time(7, 4)},
        {"title": "Privileged account anomaly", "severity": "CRITICAL", "status": "OPEN", "timestamp": random_time(2, 0)},
        {"title": "Bulk PHI export detected", "severity": "CRITICAL", "status": "RESOLVED", "resolved_at": random_time(), "resolution_notes": "Authorized export by PI for sponsor report.", "timestamp": random_time(6, 3)}
    ])
    
    # 7 HIGH
    alerts.extend([
        {"title": "Cross-tenant access attempt", "severity": "HIGH", "status": "OPEN", "timestamp": random_time()},
        {"title": "Cross-tenant access attempt", "severity": "HIGH", "status": "OPEN", "timestamp": random_time()},
        {"title": "Cross-tenant access attempt", "severity": "HIGH", "status": "RESOLVED", "resolved_at": random_time(), "resolution_notes": "User misconfigured URL.", "timestamp": random_time()},
        {"title": "Cross-tenant access attempt", "severity": "HIGH", "status": "RESOLVED", "resolved_at": random_time(), "resolution_notes": "User misconfigured URL.", "timestamp": random_time()},
        {"title": "Cross-tenant access attempt", "severity": "HIGH", "status": "RESOLVED", "resolved_at": random_time(), "resolution_notes": "User misconfigured URL.", "timestamp": random_time()},
        {"title": "Blinding violation attempt", "severity": "HIGH", "status": "OPEN", "timestamp": random_time()},
        {"title": "Blinding violation attempt", "severity": "HIGH", "status": "OPEN", "timestamp": random_time()}
    ])
    
    # 10 MEDIUM
    for i in range(10):
        status = "RESOLVED" if i < 5 else "OPEN"
        alert = {"title": "Failed login cluster", "severity": "MEDIUM", "status": status, "timestamp": random_time()}
        if status == "RESOLVED":
            alert["resolved_at"] = random_time()
            alert["resolution_notes"] = "User forgot password."
        alerts.append(alert)
        
    # 5 LOW
    for _ in range(5):
        alerts.append({"title": "Dormant account detected", "severity": "LOW", "status": "OPEN", "timestamp": random_time()})

    db.security_alerts.insert_many(alerts)
    print(f"Inserted {len(alerts)} security alerts.")

    # --- Access Events (300+) ---
    access_events = []
    role_counts = {
        "PLATFORM_ADMIN": 50,
        "PRINCIPAL_INVESTIGATOR": 100,
        "RESEARCH_COORDINATOR": 100,
        "ORGANIZATION": 30,
        "PARTICIPANT": 20
    }
    
    for role, count in role_counts.items():
        role_users = users_by_role.get(role, users)
        if not role_users:
            continue
        for _ in range(count):
            u = random.choice(role_users)
            access_events.append({
                "user_id": str(u["_id"]),
                "role": role,
                "resource_type": random.choice(["participant", "consent", "study", "document", "organization"]),
                "action": "READ",
                "ip_address": random_ip(internal=True),
                "timestamp": random_time()
            })
            
    db.access_events.insert_many(access_events)
    print(f"Inserted {len(access_events)} access events.")

    # --- Consent Events (50+) ---
    consent_events = []
    actions = ["SIGNED"] * 30 + ["VERIFIED"] * 10 + ["WITHDRAWN"] * 5 + ["REQUESTED"] * 5
    for action in actions:
        consent_events.append({
            "participant_id": str(random.choice(participants)["_id"]) if participants else None,
            "action": action,
            "study_id": str(random.choice(studies)["_id"]) if studies else None,
            "timestamp": random_time()
        })
    db.consent_events.insert_many(consent_events)
    print(f"Inserted {len(consent_events)} consent events.")

    # --- Immutable Audit Logs (1000+) ---
    audit_entries = []
    
    audit_config = [
        ("STUDY_CREATED", 10), ("STUDY_UPDATED", 10),
        ("PARTICIPANT_CREATED", 50), ("SCREENING_COMPLETED", 50),
        ("ELIGIBILITY_SUBMITTED", 30), ("ELIGIBILITY_APPROVED", 25), ("ELIGIBILITY_REJECTED", 5),
        ("CONSENT_REQUESTED", 30), ("CONSENT_SIGNED", 30), ("CONSENT_VERIFIED", 25), ("CONSENT_WITHDRAWN", 3),
        ("ENROLLMENT_APPROVED", 20), ("VISIT_SCHEDULED", 40), ("VISIT_COMPLETED", 30),
        ("DOCUMENT_UPLOADED", 20), ("DOCUMENT_ACCESSED", 30),
        ("USER_CREATED", 7), ("ROLE_CHANGED", 3),
        ("CROSS_TENANT_ACCESS_BLOCKED", 5), ("AI_RECOMMENDATION_OVERRIDDEN", 10),
        ("SECURITY_ALERT_CREATED", 15), ("SECURITY_ALERT_RESOLVED", 10)
    ]
    
    # Generate entries
    for action, count in audit_config:
        for _ in range(count):
            u = random.choice(users)
            audit_entries.append({
                "user_id": str(u["_id"]),
                "role": u.get("role", "UNKNOWN"),
                "action": action,
                "entity_type": random.choice(["study", "participant", "consent", "document", "user"]),
                "entity_id": str(uuid.uuid4()),
                "old_value": None,
                "new_value": "test_data",
                "reason": "Routine operation",
                "organization_id": u.get("organization_id"),
                "study_id": str(random.choice(studies)["_id"]) if studies else None,
                "participant_id": str(random.choice(participants)["_id"]) if participants else None,
                "ip_address": random_ip(internal=True),
                "user_agent": ua,
                "request_id": str(uuid.uuid4()),
                "timestamp": random_time()
            })
            
    # Add more to reach 1000
    while len(audit_entries) < 1000:
        u = random.choice(users)
        audit_entries.append({
            "user_id": str(u["_id"]),
            "role": u.get("role", "UNKNOWN"),
            "action": "RECORD_VIEWED",
            "entity_type": "participant",
            "entity_id": str(uuid.uuid4()),
            "old_value": None,
            "new_value": None,
            "reason": None,
            "organization_id": None,
            "study_id": None,
            "participant_id": None,
            "ip_address": random_ip(internal=True),
            "user_agent": ua,
            "request_id": str(uuid.uuid4()),
            "timestamp": random_time()
        })
        
    # Sort chronologically
    audit_entries.sort(key=lambda x: x["timestamp"])

    def create_chained_audit(db, entries):
        previous_hash = '0' * 64
        for entry in entries:
            timestamp = entry['timestamp']
            
            # Stringify for hash
            hash_input = f"{previous_hash}{timestamp}{entry['user_id']}{entry['action']}{entry['entity_type']}{entry['entity_id']}{entry.get('old_value', '')}{entry.get('new_value', '')}"
            event_hash = hashlib.sha256(hash_input.encode()).hexdigest()
            
            entry['event_hash'] = event_hash
            entry['previous_event_hash'] = previous_hash
            
            db.immutable_audit_logs.insert_one(entry)
            previous_hash = event_hash

    create_chained_audit(db, audit_entries)
    print(f"Inserted {len(audit_entries)} immutable audit logs with valid chains.")

    # --- Compliance Controls (20) ---
    controls = []
    
    # 21 CFR Part 11
    cfr_titles = ["Audit Trail", "E-Signatures", "Record Integrity", "Timestamp Integrity", "User Authentication"]
    for t in cfr_titles:
        controls.append({"framework": "21_CFR_PART_11", "control_name": t, "status": "ACTIVE", "last_checked": random_time(1,0)})
        
    # HIPAA
    hipaa_titles = [("PHI Access Logging", "ACTIVE"), ("Encryption at Rest", "ACTIVE"), ("Access Controls", "ACTIVE"), ("Audit Controls", "ACTIVE"), ("Minimum Necessary", "WARNING")]
    for t, s in hipaa_titles:
        c = {"framework": "HIPAA", "control_name": t, "status": s, "last_checked": random_time(1,0)}
        if s == "WARNING":
            c["notes"] = "Review API response filtering"
        controls.append(c)
        
    # ICH GCP
    gcp_titles = ["Protocol Management", "Informed Consent", "Safety Reporting", "Source Data Verification", "Record Retention"]
    for t in gcp_titles:
        controls.append({"framework": "ICH_GCP", "control_name": t, "status": "ACTIVE", "last_checked": random_time(1,0)})
        
    # SOC2 Readiness
    soc2_titles = ["Access Control", "Encryption", "Monitoring", "Incident Response", "Backup & Recovery"]
    for t in soc2_titles:
        controls.append({"framework": "SOC2_READINESS", "control_name": t, "status": "ACTIVE", "last_checked": random_time(1,0)})

    db.compliance_controls.insert_many(controls)
    print(f"Inserted {len(controls)} compliance controls.")

    # --- Backup Status ---
    backup = {
        "last_backup": now - timedelta(minutes=45),
        "status": "VALID",
        "pitr_enabled": True,
        "replication": "HEALTHY",
        "backup_size_gb": 2.3,
        "database": "trialbridge",
        "timestamp": now
    }
    db.backup_status.insert_one(backup)
    print("Inserted backup status.")

    print("\n--- SEEDING SECURITY DATA COMPLETE ---")
    print(f"Login Events: {db.login_events.count_documents({})}")
    print(f"Security Events: {db.security_events.count_documents({})}")
    print(f"Security Alerts: {db.security_alerts.count_documents({})}")
    print(f"Access Events: {db.access_events.count_documents({})}")
    print(f"Consent Events: {db.consent_events.count_documents({})}")
    print(f"Immutable Audit Logs: {db.immutable_audit_logs.count_documents({})}")
    print(f"Compliance Controls: {db.compliance_controls.count_documents({})}")
    print(f"Backup Status: {db.backup_status.count_documents({})}")


if __name__ == '__main__':
    seed_security()
