from pymongo import ASCENDING, DESCENDING, IndexModel

def create_indexes(db):
    # Users
    db.users.create_indexes([
        IndexModel([("email", ASCENDING)], unique=True),
        IndexModel([("organization_id", ASCENDING)]),
        IndexModel([("role", ASCENDING)])
    ])
    
    # Organizations
    db.organizations.create_indexes([
        IndexModel([("name", ASCENDING)], unique=True),
        IndexModel([("status", ASCENDING)])
    ])
    
    # Research Sites
    db.research_sites.create_indexes([
        IndexModel([("organization_id", ASCENDING)]),
        IndexModel([("principal_investigator_id", ASCENDING)])
    ])
    
    # Studies
    db.studies.create_indexes([
        IndexModel([("organization_id", ASCENDING)]),
        IndexModel([("principal_investigator_id", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
        IndexModel([("study_code", ASCENDING)], unique=True)
    ])
    
    # Participants
    db.participants.create_indexes([
        IndexModel([("participant_code", ASCENDING)], unique=True),
        IndexModel([("organization_id", ASCENDING)]),
        IndexModel([("site_id", ASCENDING)])
    ])
    
    # Study Participants
    db.study_participants.create_indexes([
        IndexModel([("participant_id", ASCENDING), ("study_id", ASCENDING)], unique=True),
        IndexModel([("status", ASCENDING)])
    ])
    
    # Eligibility Reviews
    db.eligibility_reviews.create_indexes([
        IndexModel([("study_id", ASCENDING)]),
        IndexModel([("participant_id", ASCENDING)]),
        IndexModel([("assigned_to_pi", ASCENDING)]),
        IndexModel([("status", ASCENDING)])
    ])
    
    # Consents
    db.consents.create_indexes([
        IndexModel([("participant_id", ASCENDING)]),
        IndexModel([("study_id", ASCENDING)]),
        IndexModel([("status", ASCENDING)])
    ])
    
    # Enrollments
    db.enrollments.create_indexes([
        IndexModel([("participant_id", ASCENDING)]),
        IndexModel([("study_id", ASCENDING)]),
        IndexModel([("status", ASCENDING)])
    ])
    
    # Candidates
    db.candidates.create_indexes([
        IndexModel([("study_id", ASCENDING)]),
        IndexModel([("batch_id", ASCENDING)]),
        IndexModel([("screening_status", ASCENDING)]),
        IndexModel([("participant_code", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)])
    ])

    # Upload Batches
    db.upload_batches.create_indexes([
        IndexModel([("study_id", ASCENDING)]),
        IndexModel([("uploaded_at", DESCENDING)])
    ])
    
    # Notifications
    db.notifications.create_indexes([
        IndexModel([("recipient_id", ASCENDING)]),
        IndexModel([("read", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)])
    ])
    
    # Audit Logs
    db.audit_logs.create_indexes([
        IndexModel([("user_id", ASCENDING)]),
        IndexModel([("entity_type", ASCENDING)]),
        IndexModel([("entity_id", ASCENDING)]),
        IndexModel([("timestamp", DESCENDING)])
    ])
    
    # Screening Results
    db.screening_results.create_indexes([
        IndexModel([("participant_id", ASCENDING)]),
        IndexModel([("study_id", ASCENDING)])
    ])
    
    # Visits
    db.visits.create_indexes([
        IndexModel([("participant_id", ASCENDING)]),
        IndexModel([("study_id", ASCENDING)]),
        IndexModel([("date", DESCENDING)]),
        IndexModel([("status", ASCENDING)])
    ])
    
    # Tasks
    db.tasks.create_indexes([
        IndexModel([("assignee_id", ASCENDING)]),
        IndexModel([("study_id", ASCENDING)]),
        IndexModel([("status", ASCENDING)])
    ])
    
    # Messages
    db.messages.create_indexes([
        IndexModel([("from_id", ASCENDING)]),
        IndexModel([("to_id", ASCENDING)]),
        IndexModel([("read", ASCENDING)])
    ])
    
    # Simulations
    db.simulations.create_indexes([
        IndexModel([("study_id", ASCENDING)]),
        IndexModel([("created_by", ASCENDING)])
    ])

    # --- Security & Compliance Collections ---

    # Security Events
    db.security_events.create_indexes([
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("event_type", ASCENDING)]),
        IndexModel([("severity", ASCENDING)]),
        IndexModel([("category", ASCENDING)]),
        IndexModel([("user_id", ASCENDING)]),
        IndexModel([("organization_id", ASCENDING)]),
        IndexModel([("status_code", ASCENDING)])
    ])

    # Security Alerts
    db.security_alerts.create_indexes([
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("status", ASCENDING)]),
        IndexModel([("severity", ASCENDING)]),
        IndexModel([("category", ASCENDING)])
    ])

    # Login Events
    db.login_events.create_indexes([
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("email", ASCENDING)]),
        IndexModel([("success", ASCENDING)]),
        IndexModel([("ip_address", ASCENDING)]),
        IndexModel([("user_id", ASCENDING)])
    ])

    # Access Events
    db.access_events.create_indexes([
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("user_id", ASCENDING)]),
        IndexModel([("role", ASCENDING)]),
        IndexModel([("resource_type", ASCENDING)]),
        IndexModel([("organization_id", ASCENDING)])
    ])

    # Consent Events
    db.consent_events.create_indexes([
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("participant_id", ASCENDING)]),
        IndexModel([("study_id", ASCENDING)]),
        IndexModel([("action", ASCENDING)]),
        IndexModel([("consent_id", ASCENDING)])
    ])

    # Immutable Audit Logs (hash-chained)
    db.immutable_audit_logs.create_indexes([
        IndexModel([("timestamp", ASCENDING)]),
        IndexModel([("user_id", ASCENDING)]),
        IndexModel([("action", ASCENDING)]),
        IndexModel([("entity_type", ASCENDING)]),
        IndexModel([("entity_id", ASCENDING)]),
        IndexModel([("organization_id", ASCENDING)]),
        IndexModel([("study_id", ASCENDING)]),
        IndexModel([("event_hash", ASCENDING)])
    ])

    # Compliance Controls
    db.compliance_controls.create_indexes([
        IndexModel([("framework", ASCENDING)]),
        IndexModel([("status", ASCENDING)])
    ])
