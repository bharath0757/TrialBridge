from app.core.security import create_access_token
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import hashlib
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

from app.main import app
from app.models.security_models import (
    SecurityEventCreate,
    SecurityAlertCreate,
    LoginEventCreate,
    AccessEventCreate,
    ConsentEventCreate,
    ImmutableAuditLogCreate,
    ComplianceControl,
    SecurityScoreComponent
)
from app.services import security_service
from app.repositories import security_repository as sec_repo

client = TestClient(app)

ADMIN_TOKEN = create_access_token({'sub': 'test-platform_admin', 'role': 'PLATFORM_ADMIN', 'email': 'test@example.com'})
COORDINATOR_TOKEN = create_access_token({'sub': 'test-research_coordinator', 'role': 'RESEARCH_COORDINATOR', 'email': 'test@example.com'})
PARTICIPANT_TOKEN = create_access_token({'sub': 'test-participant', 'role': 'PARTICIPANT', 'email': 'test@example.com'})

def test_security_models_validation():
    sec_event = SecurityEventCreate(
        event_type='ACCESS_DENIED',
        severity='HIGH',
        category='authorization',
        title='Unauthorized Access Attempt',
        description='User attempted to access restricted endpoint',
        endpoint='/api/admin/security/overview',
        http_method='GET',
        status_code=403,
        result='BLOCKED'
    )
    assert sec_event.event_type == 'ACCESS_DENIED'
    assert sec_event.severity == 'HIGH'

    alert = SecurityAlertCreate(
        severity='CRITICAL',
        category='audit',
        title='Audit Chain Tampered',
        description='Hash mismatch detected in audit log #42'
    )
    assert alert.status == 'OPEN'
    assert alert.severity == 'CRITICAL'

    login = LoginEventCreate(
        email='test@trialbridge.io',
        success=False,
        failure_reason='Invalid credentials',
        risk_score=25
    )
    assert login.success is False
    assert login.risk_score == 25

    audit = ImmutableAuditLogCreate(
        user_id='u-admin',
        role='PLATFORM_ADMIN',
        action='ALERT_RESOLVED',
        entity_type='security_alert',
        entity_id='alt-123',
        event_hash='abc',
        previous_event_hash='0' * 64,
        timestamp=datetime.utcnow()
    )
    assert audit.action == 'ALERT_RESOLVED'

def test_non_admin_cannot_access_security_endpoints():
    res_no_auth = client.get('/api/admin/security/overview')
    assert res_no_auth.status_code in [401, 403]

    res_coord = client.get(
        '/api/admin/security/overview',
        headers={'Authorization': f'Bearer {COORDINATOR_TOKEN}'}
    )
    assert res_coord.status_code == 403

    res_part = client.get(
        '/api/admin/security/overview',
        headers={'Authorization': f'Bearer {PARTICIPANT_TOKEN}'}
    )
    assert res_part.status_code == 403

def test_admin_can_access_encryption_endpoint():
    res = client.get(
        '/api/admin/security/encryption',
        headers={'Authorization': f'Bearer {ADMIN_TOKEN}'}
    )
    assert res.status_code == 200
    data = res.json()
    assert 'jwt_algorithm' in data
    assert 'timestamp_source' in data
    assert data['jwt_algorithm'] == 'HS256'

def test_audit_hash_chain_integrity_verification():
    mock_db = MagicMock()
    prev_hash = '0' * 64
    logs = []
    for i in range(3):
        ts = str(datetime.utcnow())
        u_id = f'user-{i}'
        action = 'STUDY_CREATED'
        e_type = 'study'
        e_id = f'st-{i}'
        old_val = 'None'
        new_val = f'title-{i}'
        
        expected_hash = hashlib.sha256(
            f'{prev_hash}{ts}{u_id}{action}{e_type}{e_id}{old_val}{new_val}'.encode()
        ).hexdigest()
        
        logs.append({
            '_id': f'log-{i}',
            'previous_event_hash': prev_hash,
            'event_hash': expected_hash,
            'timestamp': ts,
            'user_id': u_id,
            'action': action,
            'entity_type': e_type,
            'entity_id': e_id,
            'old_value': None,
            'new_value': new_val
        })
        prev_hash = expected_hash

    mock_db.immutable_audit_logs.find.return_value.sort.return_value = [dict(x) for x in logs]
    verification = sec_repo.verify_audit_chain(mock_db)
    assert verification['status'] == 'PASSED'
    assert verification['total'] == 3
    assert verification['verified'] == 3
    assert verification['invalid'] == 0

    logs[1]['action'] = 'STUDY_DELETED'
    mock_db.immutable_audit_logs.find.return_value.sort.return_value = logs
    tampered_verification = sec_repo.verify_audit_chain(mock_db)
    assert tampered_verification['status'] == 'FAILED'
    assert tampered_verification['invalid'] > 0
    assert tampered_verification['first_invalid_id'] == 'log-1'

def test_security_score_calculation():
    mock_db = MagicMock()
    mock_db.login_events.count_documents.return_value = 0
    mock_db.users.count_documents.return_value = 0
    mock_db.security_events.count_documents.return_value = 0
    mock_db.access_events.count_documents.return_value = 0
    mock_db.security_alerts.count_documents.return_value = 0
    mock_db.consents.find.return_value = []
    mock_db.consents.count_documents.return_value = 0
    mock_db.backup_status.find_one.return_value = {
        'last_backup': datetime.utcnow() - timedelta(minutes=30),
        'status': 'VALID'
    }

    with patch('app.repositories.security_repository.verify_audit_chain') as mock_verify:
        mock_verify.return_value = {'invalid_records': 0}
        score_result = security_service.compute_security_score(mock_db)
        
        assert 'score' in score_result
        assert 'components' in score_result
        assert 0 <= score_result['score'] <= 100
        assert len(score_result['components']) == 8

def test_brute_force_detection():
    mock_db = MagicMock()
    mock_db.login_events.count_documents.return_value = 3
    alert = security_service.detect_brute_force(mock_db, email='victim@trialbridge.io', ip='192.168.1.100')
    assert alert is None

    mock_db.login_events.count_documents.return_value = 6
    alert = security_service.detect_brute_force(mock_db, email='victim@trialbridge.io', ip='192.168.1.100')
    assert alert is not None
    assert alert['severity'] in ['MEDIUM', 'HIGH']

def test_brute_force_lockout_and_progressive_backoff():
    from app.core.rate_limiter import login_rate_limiter
    login_rate_limiter._email_tracker.clear()
    login_rate_limiter._ip_tracker.clear()

    target = "locked.user@trialbridge.io"
    # 5 failed attempts
    for _ in range(5):
        res = client.post("/api/auth/login", json={"email": target, "password": "wrong"})
        assert res.status_code == 400

    # 6th attempt must be blocked with HTTP 429
    res_blocked = client.post("/api/auth/login", json={"email": target, "password": "any"})
    assert res_blocked.status_code == 429
    assert "Retry-After" in res_blocked.headers
    assert int(res_blocked.headers["Retry-After"]) > 800

if __name__ == '__main__':
    print('Running test_security_models_validation...')
    test_security_models_validation()
    print('PASS: test_security_models_validation')

    print('Running test_non_admin_cannot_access_security_endpoints...')
    test_non_admin_cannot_access_security_endpoints()
    print('PASS: test_non_admin_cannot_access_security_endpoints')

    print('Running test_admin_can_access_encryption_endpoint...')
    test_admin_can_access_encryption_endpoint()
    print('PASS: test_admin_can_access_encryption_endpoint')

    print('Running test_audit_hash_chain_integrity_verification...')
    test_audit_hash_chain_integrity_verification()
    print('PASS: test_audit_hash_chain_integrity_verification')

    print('Running test_security_score_calculation...')
    test_security_score_calculation()
    print('PASS: test_security_score_calculation')

    print('Running test_brute_force_detection...')
    test_brute_force_detection()
    print('PASS: test_brute_force_detection')

    print('Running test_brute_force_lockout_and_progressive_backoff...')
    test_brute_force_lockout_and_progressive_backoff()
    print('PASS: test_brute_force_lockout_and_progressive_backoff')

    print('ALL 7 TEST SUITES PASSED SUCCESSFULLY!')
