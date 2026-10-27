import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.mongodb import startup_connect, get_db
from app.core.security import hash_password
from datetime import datetime


def seed():
    # Ensure env variables are loaded (using python-dotenv)
    from dotenv import load_dotenv
    load_dotenv()
    
    startup_connect()
    db = get_db()
    
    # Drop existing databases (for clean state in demo)
    for coll in db.list_collection_names():
        db[coll].drop()

    # 1. Organizations
    orgs_data = [
        {"name": "City Hospital", "type": "HOSPITAL", "status": "ACTIVE"},
        {"name": "Sunshine Medical Center", "type": "CLINIC", "status": "ACTIVE"},
        {"name": "Metro Care Research", "type": "RESEARCH_SITE", "status": "ACTIVE"},
        {"name": "Global Health University", "type": "UNIVERSITY", "status": "ACTIVE"},
        {"name": "LifeCare Hospital", "type": "HOSPITAL", "status": "ACTIVE"}
    ]
    org_ids = {}
    for o in orgs_data:
        res = db.organizations.insert_one(o)
        org_ids[o["name"]] = str(res.inserted_id)

    # 2. Users
    users_data = [
        {"email": "sarah.chen@trialbridge.io", "name": "Sarah Chen", "role": "PLATFORM_ADMIN", "password": "demo123"},
        {"email": "m.torres@pharmaco.com", "name": "Maria Torres", "role": "ORGANIZATION", "organization_id": org_ids["City Hospital"], "password": "demo123"},
        {"email": "j.patel@cityhospital.org", "name": "Dr. J Patel", "role": "PRINCIPAL_INVESTIGATOR", "organization_id": org_ids["City Hospital"], "password": "demo123"},
        {"email": "a.sharma@sunshine.org", "name": "Dr. A Sharma", "role": "PRINCIPAL_INVESTIGATOR", "organization_id": org_ids["Sunshine Medical Center"], "password": "demo123"},
        {"email": "maya.r@trialbridge.io", "name": "Maya R", "role": "RESEARCH_COORDINATOR", "organization_id": org_ids["City Hospital"], "password": "demo123"},
        {"email": "rahul.mehta@email.com", "name": "Rahul Mehta", "role": "PARTICIPANT", "password": "demo123"},
        {"email": "deepa.raj@email.com", "name": "Deepa Raj", "role": "PARTICIPANT", "password": "demo123"}
    ]
    user_ids = {}
    for u in users_data:
        pwd = u.pop("password")
        u["hashed_password"] = hash_password(pwd)
        u["is_active"] = True
        u["created_at"] = datetime.utcnow()
        res = db.users.insert_one(u)
        user_ids[u["email"]] = str(res.inserted_id)

    # 3. Research Sites
    sites_data = [
        {"name": "City Hospital Main", "organization_id": org_ids["City Hospital"], "principal_investigator_id": user_ids["j.patel@cityhospital.org"], "address": "123 Main St", "status": "ACTIVE"},
        {"name": "Sunshine Branch", "organization_id": org_ids["Sunshine Medical Center"], "principal_investigator_id": user_ids["a.sharma@sunshine.org"], "address": "456 Sun St", "status": "ACTIVE"}
    ]
    site_ids = []
    for s in sites_data:
        res = db.research_sites.insert_one(s)
        site_ids.append(str(res.inserted_id))

    # 4. Studies (Only Type 2 Diabetes study with formula C4H11N5 and Kidneys)
    studies_data = [
        {
            "study_code": "DB-101",
            "title": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
            "description": "A Phase III clinical evaluation of C4H11N5 (Metformin) renal tubular clearance, filtration safety, and glycemic response in Type 2 Diabetes patients.",
            "condition": "Type 2 Diabetes",
            "formula": "C4H11N5",
            "affected_organ": "Kidneys",
            "organization_id": org_ids["City Hospital"],
            "principal_investigator_id": user_ids["j.patel@cityhospital.org"],
            "status": "ACTIVE",
            "phase": "Phase 3",
            "criteria": [
                {"name": "HbA1c", "type": "lab", "description": "HbA1c >= 7.0%", "operator": ">=", "value": "7.0", "is_inclusion": True},
                {"name": "eGFR", "type": "lab", "description": "eGFR >= 45 mL/min", "operator": ">=", "value": "45", "is_inclusion": True},
                {"name": "Condition", "type": "diagnosis", "description": "Type 2 Diabetes", "operator": "==", "value": "Type 2 Diabetes", "is_inclusion": True}
            ]
        }
    ]
    study_ids = {}
    for s in studies_data:
        s["created_at"] = datetime.utcnow()
        res = db.studies.insert_one(s)
        study_ids[s["study_code"]] = str(res.inserted_id)

    # 5. Participants (Load all 50 clinical trial participants)
    import json
    scratch_path = os.path.join(os.path.dirname(__file__), "..", "scratch_participants.json")
    if not os.path.exists(scratch_path):
        scratch_path = os.path.join(os.path.dirname(__file__), "scratch_participants.json")
    if not os.path.exists(scratch_path):
        scratch_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "scratch_participants.json")

    participants_raw = []
    if os.path.exists(scratch_path):
        with open(scratch_path, "r", encoding="utf-8") as f:
            participants_raw = json.load(f)

    # Fallback to generate 50 if file not loaded
    if not participants_raw:
        for i in range(1, 51):
            dose = 50 if i <= 12 else (100 if i <= 36 else 150)
            participants_raw.append({
                "id": f"PT-{i:03d}",
                "name": f"Trial Participant {i}",
                "age": 35 + (i % 30),
                "gender": "Male" if i % 2 == 0 else "Female",
                "email": f"pt{i:03d}@trialbridge.io",
                "phone": f"+91 98000{i:05d}",
                "location": "City Hospital Main",
                "clinicalData": {
                    "doseMg": dose,
                    "baselineHba1c": round(7.2 + (i % 15) * 0.15, 2),
                    "week12Hba1c": round(6.5 + (i % 10) * 0.1, 2),
                    "hba1cChange": round(-0.6 - (dose / 100) * 0.5, 2),
                    "baselineFpg": 160 + (i % 20),
                    "week12Fpg": 130 + (i % 15),
                    "fpgChange": round(-25 - (dose / 100) * 10, 1),
                    "cmax": round(dose * 2.1, 1),
                    "auc024": round(dose * 18.2, 1),
                    "clearanceLh": 11.75,
                    "renalExcretion": 35.1,
                    "halfLifeH": 4.02,
                    "adverseEvent": (i % 4 == 0),
                    "hypoglycemiaEvent": (i % 6 == 0)
                }
            })

    p_ids = []
    for i, p_info in enumerate(participants_raw):
        p_code = p_info.get("id", f"PT-{i+1:03d}")
        u_email = p_info.get("email", f"pt{i+1:03d}@trialbridge.io")
        user_id = user_ids.get(u_email)
        if not user_id and i == 0:
            user_id = user_ids.get("rahul.mehta@email.com")
        elif not user_id and i == 1:
            user_id = user_ids.get("deepa.raj@email.com")

        p_doc = {
            "participant_code": p_code,
            "organization_id": org_ids["City Hospital"],
            "site_id": site_ids[0],
            "user_id": user_id,
            "status": "ACTIVE",
            "name": p_info.get("name"),
            "email": u_email,
            "phone": p_info.get("phone", "+91 9800000000"),
            "location": p_info.get("location", "City Hospital Main"),
            "clinical_attributes": p_info.get("clinicalData", {}),
            "clinicalData": p_info.get("clinicalData", {}),
            "screeningStatus": "approved",
            "consentStatus": "consented",
            "enrollmentStatus": "enrolled",
            "created_at": datetime.utcnow()
        }
        res = db.participants.insert_one(p_doc)
        p_id_str = str(res.inserted_id)
        p_ids.append(p_id_str)

        # 6. Study Participant mapping
        db.study_participants.insert_one({
            "participant_id": p_id_str,
            "study_id": study_ids["DB-101"],
            "status": "ENROLLED",
            "added_at": datetime.utcnow()
        })

        # 7. Screening, Consent, and Enrollment records
        clin = p_info.get("clinicalData", {})
        db.screening_results.insert_one({
            "participant_id": p_id_str,
            "study_id": study_ids["DB-101"],
            "match_score": 90.0 + (i % 10),
            "ai_confidence": p_info.get("aiConfidence", 88.0),
            "run_at": datetime.utcnow(),
            "results": [
                {"criterion_id": "1", "name": "HbA1c >= 7.0%", "status": "MATCH", "evidence": f"Baseline {clin.get('baselineHba1c', 7.5)}%"},
                {"criterion_id": "2", "name": "eGFR >= 45 mL/min", "status": "MATCH", "evidence": f"Preserved clearance {clin.get('clearanceLh', 11.5)} L/h"},
                {"criterion_id": "3", "name": "Type 2 Diabetes", "status": "MATCH", "evidence": "EHR Confirmed"}
            ]
        })

        db.eligibility_reviews.insert_one({
            "study_id": study_ids["DB-101"],
            "participant_id": p_id_str,
            "coordinator_id": user_ids["maya.r@trialbridge.io"],
            "assigned_to_pi": user_ids["j.patel@cityhospital.org"],
            "status": "APPROVED",
            "pi_notes": f"Titration cohort {clin.get('doseMg', 100)}mg approved. Renal safety confirmed.",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        db.consents.insert_one({
            "participant_id": p_id_str,
            "study_id": study_ids["DB-101"],
            "status": "VERIFIED",
            "version": "1.0",
            "created_at": datetime.utcnow(),
            "signed_at": datetime.utcnow(),
            "verified_at": datetime.utcnow(),
            "verified_by": user_ids["maya.r@trialbridge.io"]
        })

        db.enrollments.insert_one({
            "participant_id": p_id_str,
            "study_id": study_ids["DB-101"],
            "status": "APPROVED",
            "enrolled_by": user_ids["maya.r@trialbridge.io"],
            "approved_at": datetime.utcnow(),
            "approved_by": user_ids["j.patel@cityhospital.org"],
            "created_at": datetime.utcnow()
        })
    
    # 8. Visits, Tasks, Documents, Messages, Notifications, Audit
    s_id = study_ids.get("DB-101", "")
    p_id = p_ids[0] if p_ids else ""

    db.visits.insert_one({"participant_id": p_id, "study_id": s_id, "visit_name": "Baseline", "date": datetime.utcnow(), "status": "COMPLETED", "created_at": datetime.utcnow()})
    
    db.tasks.insert_one({"title": "Review P-002", "description": "Review screening", "assignee_id": user_ids["maya.r@trialbridge.io"], "study_id": s_id, "status": "TODO", "created_by": user_ids["j.patel@cityhospital.org"], "created_at": datetime.utcnow()})
    
    db.documents.insert_one({"title": "Protocol", "type": "PROTOCOL", "file_url": "s3://doc.pdf", "study_id": s_id, "uploaded_by": user_ids["j.patel@cityhospital.org"], "created_at": datetime.utcnow()})
    
    db.messages.insert_one({"from_id": user_ids["maya.r@trialbridge.io"], "to_id": user_ids["j.patel@cityhospital.org"], "content": "Please review P-002", "read": False, "sent_at": datetime.utcnow()})
    
    db.notifications.insert_one({"recipient_id": user_ids["j.patel@cityhospital.org"], "type": "TASK", "title": "New Task", "message": "Review P-002", "read": False, "created_at": datetime.utcnow()})
    
    db.audit_logs.insert_one({"user_id": user_ids["maya.r@trialbridge.io"], "role": "RESEARCH_COORDINATOR", "action": "LOGIN", "entity_type": "user", "entity_id": user_ids["maya.r@trialbridge.io"], "timestamp": datetime.utcnow()})

    print("Seeding complete.")

if __name__ == "__main__":
    seed()
