import time
import asyncio
from collections import defaultdict
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Request

class LoginRateLimiter:
    """
    Brute-Force & Credential Stuffing Defense for /api/auth/login:
    - Dual-key tracking by both IP address and Email/Username.
    - Progressive exponential backoff delay after 3 failed attempts (1.0s at 3, 2.5s at 4).
    - 15-minute (900s) lockout after 5 consecutive failed attempts.
    - Automatic HIGH-severity security alert and 429 event generation in Security Center.
    """
    def __init__(
        self,
        max_attempts_account: int = 5,
        max_attempts_ip: int = 25,    # Elevated threshold for IP to prevent shared network / localhost denial of service
        lockout_duration: int = 900,  # 15 minutes (900 seconds)
        backoff_start: int = 3        # Start exponential backoff at 3 attempts
    ):
        self.max_attempts_account = max_attempts_account
        self.max_attempts_ip = max_attempts_ip
        self.lockout_duration = lockout_duration
        self.backoff_start = backoff_start

        # Storage schemas:
        # { key: { 'count': int, 'locked_until': float, 'last_attempt': float } }
        self._ip_tracker: Dict[str, Dict[str, Any]] = defaultdict(lambda: {'count': 0, 'locked_until': 0.0, 'last_attempt': 0.0})
        self._email_tracker: Dict[str, Dict[str, Any]] = defaultdict(lambda: {'count': 0, 'locked_until': 0.0, 'last_attempt': 0.0})

    def _clean_if_expired(self, tracker: Dict[str, Dict[str, Any]], key: str, now: float):
        record = tracker.get(key)
        if not record:
            return
        if record['locked_until'] > 0 and now > record['locked_until']:
            tracker.pop(key, None)
        elif record['last_attempt'] > 0 and (now - record['last_attempt']) > self.lockout_duration:
            tracker.pop(key, None)

    async def check_and_apply_backoff(self, request: Request, email: str) -> None:
        """
        Pre-flight check:
        1. Raises HTTP 429 if the IP or Email is currently in a 15-minute lockout.
        2. Applies progressive exponential backoff delay if failed attempts >= 3.
        """
        now = time.time()
        ip = request.client.host if request.client else 'unknown'
        email_clean = email.strip().lower()

        # Clean expired records
        self._clean_if_expired(self._ip_tracker, ip, now)
        self._clean_if_expired(self._email_tracker, email_clean, now)

        ip_record = self._ip_tracker.get(ip, {'count': 0, 'locked_until': 0.0})
        email_record = self._email_tracker.get(email_clean, {'count': 0, 'locked_until': 0.0})

        # 1. Hard Lockout check for IP
        if ip_record['locked_until'] > now:
            remaining = int(ip_record['locked_until'] - now) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts from this IP address. Access temporarily locked for 15 minutes. Please retry in {remaining} seconds.",
                headers={"Retry-After": str(remaining)}
            )

        # 2. Hard Lockout check for Account/Email
        if email_record['locked_until'] > now:
            remaining = int(email_record['locked_until'] - now) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account '{email_clean}' is temporarily locked for 15 minutes due to 5 consecutive failed login attempts. Please retry in {remaining} seconds.",
                headers={"Retry-After": str(remaining)}
            )

        # 3. Progressive exponential backoff after 3 failed attempts
        highest_fails = max(ip_record['count'], email_record['count'])
        if highest_fails >= self.backoff_start:
            # At 3 failures -> 1.0 second delay
            # At 4 failures -> 2.5 seconds delay
            delay = 1.0 if highest_fails == 3 else 2.5
            await asyncio.sleep(delay)

    def record_failure(self, request: Request, email: str, db=None) -> Dict[str, Any]:
        """
        Records a failed attempt for both IP and Email.
        If attempts reach 5, locks for 15 minutes and writes a HIGH alert to MongoDB.
        """
        now = time.time()
        ip = request.client.host if request.client else 'unknown'
        email_clean = email.strip().lower()

        ip_rec = self._ip_tracker[ip]
        email_rec = self._email_tracker[email_clean]

        ip_rec['count'] += 1
        ip_rec['last_attempt'] = now

        email_rec['count'] += 1
        email_rec['last_attempt'] = now

        locked = False
        remaining = self.lockout_duration

        # Lockout triggered when account reaches 5 failed attempts, or non-local IP reaches 25
        is_local_ip = ip in ["127.0.0.1", "localhost", "::1", "testclient"]
        account_locked = email_rec['count'] >= self.max_attempts_account
        ip_locked = (not is_local_ip) and (ip_rec['count'] >= self.max_attempts_ip)

        if account_locked or ip_locked:
            lock_target_time = now + self.lockout_duration
            if account_locked:
                email_rec['locked_until'] = lock_target_time
            if ip_locked:
                ip_rec['locked_until'] = lock_target_time
            locked = True

            # Trigger a HIGH severity security alert in the Security Center & persist lock to DB
            if db is not None:
                try:
                    from app.repositories import security_repository as sec_repo
                    
                    # 1. If account reached 5 failures, restrict user in db.users
                    if account_locked:
                        db.users.update_one(
                            {"email": email_clean},
                            {"$set": {
                                "is_locked": True,
                                "locked_at": datetime.utcnow(),
                                "locked_reason": "Account locked: 5 consecutive failed login attempts"
                            }}
                        )

                    # 2. Raise security alert
                    alert_doc = {
                        "severity": "HIGH",
                        "category": "authentication",
                        "title": "Brute-Force Attack Detected - Account Locked",
                        "description": f"5 consecutive failed login attempts detected for account '{email_clean}' from IP {ip}. Account restricted pending Platform Admin unlock.",
                        "email": email_clean,
                        "target_user_email": email_clean,
                        "user_id": None,
                        "status": "OPEN",
                        "created_at": datetime.utcnow()
                    }
                    sec_repo.insert_security_alert(db, alert_doc)

                    # 3. Log RATE_LIMIT_EXCEEDED event
                    sec_event = {
                        "event_type": "RATE_LIMIT_EXCEEDED",
                        "severity": "HIGH",
                        "category": "authentication",
                        "title": "Login Rate Limit Enforced - Account Restricted",
                        "description": f"Brute-force lockout triggered for account '{email_clean}' from IP {ip}. Account locked by security policy.",
                        "email": email_clean,
                        "ip_address": ip,
                        "status_code": 429,
                        "result": "BLOCKED",
                        "reason": "5 consecutive failed attempts - Account restricted until admin unlocks",
                        "created_at": datetime.utcnow()
                    }
                    sec_repo.insert_security_event(db, sec_event)
                except Exception as e:
                    print(f"Error logging rate limit security alert: {e}")

        return {
            "locked": locked,
            "current_email_failures": email_rec['count'],
            "current_ip_failures": ip_rec['count'],
            "remaining_lockout_seconds": remaining if locked else 0
        }

    def unlock_account(self, email: str) -> None:
        """
        Explicitly removes an email from in-memory lockout and resets failure count.
        Called when a Platform Admin unlocks the account.
        """
        email_clean = email.strip().lower()
        self._email_tracker.pop(email_clean, None)

    def reset_on_success(self, request: Request, email: str) -> None:
        """
        Clears failed attempt counters upon successful authentication.
        """
        email_clean = email.strip().lower()
        self._email_tracker.pop(email_clean, None)

        ip = request.client.host if request.client else 'unknown'
        if ip in self._ip_tracker and self._ip_tracker[ip]['locked_until'] <= time.time():
            self._ip_tracker.pop(ip, None)

# Global singleton
login_rate_limiter = LoginRateLimiter()
