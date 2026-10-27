from app.core.security import create_access_token
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest
from datetime import datetime
from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import app
from app.db.mongodb import db_instance
from app.core.rate_limiter import login_rate_limiter

class InMemoryCollection:
    def __init__(self):
        self.docs = []

    def insert_one(self, doc):
        d = dict(doc)
        if "_id" not in d:
            d["_id"] = ObjectId()
        self.docs.append(d)
        result = type("InsertResult", (), {"inserted_id": d["_id"]})()
        return result

    def find_one(self, query):
        for d in self.docs:
            match = True
            for k, v in query.items():
                if k == "$or":
                    or_match = any(
                        all(d.get(sub_k) == sub_v or str(d.get(sub_k)) == str(sub_v) for sub_k, sub_v in condition.items())
                        for condition in v
                    )
                    if not or_match:
                        match = False
                        break
                elif d.get(k) != v and str(d.get(k)) != str(v):
                    match = False
                    break
            if match:
                return dict(d)
        return None

    def find(self, query=None):
        if not query:
            return [dict(d) for d in self.docs]
        res = []
        for d in self.docs:
            match = True
            for k, v in query.items():
                if d.get(k) != v and str(d.get(k)) != str(v):
                    match = False
                    break
            if match:
                res.append(dict(d))
        return res

    def count_documents(self, query=None):
        return len(self.find(query))

    def update_one(self, query, update):
        for d in self.docs:
            match = True
            for k, v in query.items():
                if d.get(k) != v and str(d.get(k)) != str(v):
                    match = False
                    break
            if match:
                if "$set" in update:
                    d.update(update["$set"])
                if "$unset" in update:
                    for un_k in update["$unset"]:
                        d.pop(un_k, None)
                return type("UpdateResult", (), {"modified_count": 1})()
        return type("UpdateResult", (), {"modified_count": 0})()

    def update_many(self, query, update):
        count = 0
        for d in self.docs:
            if "$set" in update:
                d.update(update["$set"])
            count += 1
        return type("UpdateResult", (), {"modified_count": count})()

class InMemoryDatabase:
    def __init__(self):
        self.users = InMemoryCollection()
        self.participants = InMemoryCollection()
        self.security_alerts = InMemoryCollection()
        self.security_events = InMemoryCollection()
        self.login_events = InMemoryCollection()
        self.audit_logs = InMemoryCollection()
        self.access_events = InMemoryCollection()
        self.consent_events = InMemoryCollection()
        self.studies = InMemoryCollection()
        self.study_participants = InMemoryCollection()

client = TestClient(app)

class TestParticipantSignupAndLockout(unittest.TestCase):
    def setUp(self):
        self.mock_db = InMemoryDatabase()
        self.mock_db.users.insert_one({'_id': 'test-platform_admin', 'role': 'PLATFORM_ADMIN', 'email': 'admin@example.com', 'is_active': True})
        db_instance.db = self.mock_db
        db_instance.is_connected = True
        login_rate_limiter._email_tracker.clear()
        login_rate_limiter._ip_tracker.clear()

    def tearDown(self):
        db_instance.db = None
        db_instance.is_connected = False

    def test_participant_signup_lockout_and_admin_unlock(self):
        test_email = "new.participant@trialbridge.io"
        test_pwd = "ParticipantSecret123!"

        # 1. PARTICIPANT SIGN-UP via /api/auth/register
        reg_res = client.post("/api/auth/register", json={
            "name": "Alex Rivera",
            "email": test_email,
            "password": test_pwd,
            "role": "PARTICIPANT"
        })
        self.assertEqual(reg_res.status_code, 200, f"Registration failed: {reg_res.text}")
        reg_data = reg_res.json()
        self.assertEqual(reg_data["email"], test_email)
        self.assertEqual(reg_data["role"], "PARTICIPANT")
        self.assertFalse(reg_data.get("is_locked", False))

        # Verify participant was created in db.participants
        part_doc = self.mock_db.participants.find_one({"email": test_email})
        self.assertIsNotNone(part_doc)
        self.assertTrue(part_doc["participant_code"].startswith("P-"))
        self.assertEqual(part_doc["name"], "Alex Rivera")

        # Verify registration audit log
        reg_audit = self.mock_db.audit_logs.find_one({"action": "USER_REGISTERED"})
        self.assertIsNotNone(reg_audit)

        # 2. SUCCESSFUL LOGIN with initial credentials
        login_res = client.post("/api/auth/login", json={
            "email": test_email,
            "password": test_pwd
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertIn("access_token", login_res.json())

        # 3. SIMULATE 5 CONSECUTIVE FAILED ATTEMPTS (BRUTE-FORCE ATTACK)
        for i in range(1, 6):
            fail_res = client.post("/api/auth/login", json={
                "email": test_email,
                "password": f"WrongAttempt_{i}"
            })
            # 1-4 returns 400, 5th triggers lockout (400 or 429)
            self.assertIn(fail_res.status_code, [400, 429])

        # 4. VERIFY ACCOUNT IS PERMANENTLY LOCKED IN DATABASE
        user_in_db = self.mock_db.users.find_one({"email": test_email})
        self.assertIsNotNone(user_in_db)
        self.assertTrue(user_in_db.get("is_locked"), "User must be locked in MongoDB users collection")
        self.assertIn("5 consecutive failed", user_in_db.get("locked_reason", ""))

        # Verify a HIGH security alert was logged in Security Center
        alert = self.mock_db.security_alerts.find_one({"target_user_email": test_email, "status": "OPEN"})
        self.assertIsNotNone(alert)
        self.assertEqual(alert["severity"], "HIGH")

        # 5. ATTEMPT LOGIN WITH CORRECT PASSWORD WHILE LOCKED -> MUST BE REJECTED
        locked_attempt = client.post("/api/auth/login", json={
            "email": test_email,
            "password": test_pwd
        })
        self.assertIn(locked_attempt.status_code, [423, 429])
        self.assertTrue(
            "locked" in locked_attempt.text.lower() or "administrator" in locked_attempt.text.lower(),
            f"Expected locked account message, got: {locked_attempt.text}"
        )

        # 6. PLATFORM ADMIN UNLOCKS THE ACCOUNT VIA SECURITY CENTER
        admin_token = create_access_token({'sub': 'test-platform_admin', 'role': 'PLATFORM_ADMIN', 'email': 'test@example.com'})
        unlock_res = client.post(
            "/api/admin/security/unlock-account",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"email": test_email, "reason": "Verified user identity"}
        )
        self.assertEqual(unlock_res.status_code, 200)
        self.assertEqual(unlock_res.json()["status"], "success")

        # Verify user is unlocked in DB
        unlocked_user = self.mock_db.users.find_one({"email": test_email})
        self.assertFalse(unlocked_user.get("is_locked", True))

        # Verify audit log was written for account unlock
        unlock_audit = self.mock_db.audit_logs.find_one({"action": "USER_ACCOUNT_UNLOCKED"})
        self.assertIsNotNone(unlock_audit)
        self.assertEqual(unlock_audit["details"]["unlocked_email"], test_email)

        # 7. USER CAN NOW SUCCESSFULLY LOG IN AGAIN
        final_login = client.post("/api/auth/login", json={
            "email": test_email,
            "password": test_pwd
        })
        self.assertEqual(final_login.status_code, 200)
        self.assertIn("access_token", final_login.json())
        print("\nPASS: Complete Participant Sign Up -> 5-Attempt Lockout -> Admin Unlock Lifecycle Verified!")

if __name__ == "__main__":
    unittest.main()
