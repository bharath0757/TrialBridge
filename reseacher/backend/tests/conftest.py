import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
# Test-only secret; tests must never read or connect to a production database.
os.environ['JWT_SECRET'] = 'test-only-signing-secret-not-for-production-2026'
os.environ['MONGODB_URI'] = ''

import pytest

@pytest.fixture(autouse=True)
def isolated_database():
    from test_signup_lock_unlock import InMemoryDatabase
    from app.db.mongodb import db_instance
    from app.core.rate_limiter import login_rate_limiter
    database = InMemoryDatabase()
    for role in ['platform_admin', 'research_coordinator', 'participant']:
        database.users.insert_one({'_id': 'test-' + role, 'role': role.upper(), 'email': role + '@example.com', 'is_active': True})
    db_instance.db = database
    db_instance.is_connected = True
    login_rate_limiter._email_tracker.clear()
    login_rate_limiter._ip_tracker.clear()
    yield database
    db_instance.db = None
    db_instance.is_connected = False

os.environ['CORS_ORIGINS'] = 'http://localhost:5173,https://trialbridge-in-5443.web.app'
