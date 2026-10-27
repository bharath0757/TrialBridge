"""CI-only fixture server. Never use this module as the production entrypoint."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import mongomock
from app.core.security import hash_password
from app.db.mongodb import db_instance
import app.main as main

def connect_test_database():
    db_instance.db = mongomock.MongoClient().trialbridge_e2e
    db_instance.is_connected = True
    for role in ['PLATFORM_ADMIN', 'ORGANIZATION', 'PRINCIPAL_INVESTIGATOR', 'RESEARCH_COORDINATOR', 'PARTICIPANT']:
        db_instance.db.users.insert_one({'_id': 'e2e-' + role, 'name': 'E2E ' + role, 'email': role.lower() + '@example.com', 'role': role, 'organization_id': 'e2e-org', 'is_active': True, 'hashed_password': hash_password('E2E-password-998!')})

main.startup_connect = connect_test_database
app = main.app
