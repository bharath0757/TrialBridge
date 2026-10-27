import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

from app.db.mongodb import startup_connect, get_db

def seed_notifications():
    startup_connect()
    db = get_db()
    if db is None:
        print("DB not available")
        return

    # Find Rahul Mehta and Study
    rahul = db.users.find_one({"email": "rahul.mehta@email.com"})
    rahul_id = str(rahul["_id"]) if rahul else "demo-participant"
    study = db.studies.find_one({"study_code": "DB-101"}) or db.studies.find_one()
    study_id = str(study["_id"]) if study else "DB-101"

    # Find participant doc
    p = db.participants.find_one({"email": "rahul.mehta@email.com"}) or db.participants.find_one()
    p_id = str(p.get("_id") or p.get("id")) if p else "P00124"

    # Insert actionable trial invitation notification for Rahul Mehta
    invitations = [
        {
            "recipient_id": rahul_id,
            "type": "TRIAL_INVITATION",
            "title": "Clinical Trial Eligibility Confirmed",
            "message": "Congratulations! You have been screened and confirmed eligible for: Type 2 Diabetes Study (C4H11N5 Renal Dynamics). Please confirm your decision to participate.",
            "entity_type": "study",
            "entity_id": study_id,
            "read": False,
            "requires_action": True,
            "actions": ["ACCEPT", "REJECT"],
            "action_taken": None,
            "metadata": {"participant_id": p_id, "study_id": study_id, "study_title": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)"},
            "created_at": datetime.utcnow()
        },
        {
            "recipient_id": "demo-participant",
            "type": "TRIAL_INVITATION",
            "title": "Clinical Trial Eligibility Confirmed",
            "message": "Congratulations! You have been screened and confirmed eligible for: Type 2 Diabetes Study (C4H11N5 Renal Dynamics). Please confirm your decision to participate.",
            "entity_type": "study",
            "entity_id": study_id,
            "read": False,
            "requires_action": True,
            "actions": ["ACCEPT", "REJECT"],
            "action_taken": None,
            "metadata": {"participant_id": p_id, "study_id": study_id, "study_title": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)"},
            "created_at": datetime.utcnow()
        }
    ]

    for inv in invitations:
        # Check if already exists
        exists = db.notifications.find_one({"recipient_id": inv["recipient_id"], "type": "TRIAL_INVITATION", "action_taken": None})
        if not exists:
            db.notifications.insert_one(inv)
            print(f"Inserted trial invitation for {inv['recipient_id']}")
        else:
            print(f"Trial invitation already exists for {inv['recipient_id']}")

    print("Notification seeding complete.")

if __name__ == "__main__":
    seed_notifications()
