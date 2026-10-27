"""CI-only fixture server. Never use this module as the production entrypoint."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import mongomock
from datetime import datetime
from app.core.security import hash_password
from app.db.mongodb import db_instance
import app.main as main

def connect_test_database():
    db_instance.db = mongomock.MongoClient().trialbridge_e2e
    db_instance.is_connected = True
    for role in ['PLATFORM_ADMIN', 'ORGANIZATION', 'PRINCIPAL_INVESTIGATOR', 'RESEARCH_COORDINATOR', 'PARTICIPANT']:
        db_instance.db.users.insert_one({'_id': 'e2e-' + role, 'name': 'E2E ' + role, 'email': role.lower() + '@example.com', 'role': role, 'organization_id': 'e2e-org', 'is_active': True, 'hashed_password': hash_password('E2E-password-998!')})

    db_instance.db.studies.insert_one({'_id': 'e2e-study', 'study_code': 'E2E-STUDY', 'title': 'Verified Research Study', 'organization_id': 'e2e-org', 'principal_investigator_id': 'e2e-PRINCIPAL_INVESTIGATOR', 'created_at': datetime.utcnow()})
    db_instance.db.participants.insert_one({'_id': 'e2e-participant-profile', 'participant_code': 'E2E-PARTICIPANT', 'user_id': 'e2e-PARTICIPANT', 'email': 'participant@example.com', 'organization_id': 'e2e-org', 'created_at': datetime.utcnow()})
    db_instance.db.study_participants.insert_one({'participant_id': 'e2e-participant-profile', 'study_id': 'e2e-study', 'status': 'ENROLLED'})
    db_instance.db.visits.insert_one({'participant_id': 'e2e-participant-profile', 'study_id': 'e2e-study', 'visit_name': 'Verified baseline appointment', 'date': datetime(2027, 1, 20, 10, 30), 'status': 'SCHEDULED'})

main.startup_connect = connect_test_database
app = main.app
