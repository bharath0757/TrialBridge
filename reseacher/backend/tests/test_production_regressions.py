import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from app.main import app
from app.core.security import create_access_token
from app.db.mongodb import db_instance

client = TestClient(app)

def register():
    response = client.post('/api/auth/register', json={'name': 'Regression Test', 'email': 'regression@example.com', 'password': 'ValidPassword998!'})
    assert response.status_code == 200
    return response.json()

@pytest.mark.parametrize('password', ['demo123', 'Password123!', '', 'wrongpassword'])
def test_known_passwords_cannot_bypass_auth(password):
    register()
    response = client.post('/api/auth/login', json={'email': 'regression@example.com', 'password': password})
    assert response.status_code == 400
    assert 'access_token' not in response.json()

def test_registration_login_me_and_locked_session(isolated_database):
    user = register()
    response = client.post('/api/auth/login', json={'email': 'REGRESSION@example.com', 'password': 'ValidPassword998!'})
    assert response.status_code == 200
    token = response.json()['access_token']
    headers = {'Authorization': 'Bearer ' + token}
    assert client.get('/api/auth/me', headers=headers).json()['id'] == user['id']
    isolated_database.users.update_one({'email': 'regression@example.com'}, {'$set': {'is_locked': True}})
    assert client.get('/api/auth/me', headers=headers).status_code == 401

def test_public_signup_cannot_create_admin():
    response = client.post('/api/auth/register', json={'name': 'Test', 'email': 'admin2@example.com', 'password': 'ValidPassword998!', 'role': 'PLATFORM_ADMIN'})
    assert response.status_code == 403

def test_demo_token_is_rejected():
    assert client.get('/api/auth/me', headers={'Authorization': 'Bearer demo-jwt-token-platform_admin'}).status_code == 401

def test_database_outage_cannot_fake_login_or_registration():
    db_instance.db = None
    db_instance.is_connected = False
    assert client.post('/api/auth/login', json={'email': 'sarah.chen@trialbridge.io', 'password': 'demo123'}).status_code == 503
    assert client.post('/api/auth/register', json={'email': 'test@example.com', 'name': 'Test', 'password': 'ValidPassword998!'}).status_code == 503
    assert client.get('/api/health').status_code == 503

def test_only_configured_origins_are_allowed():
    for origin, status in [('https://trialbridge-in-5443.web.app', 200), ('https://untrusted.example', 400)]:
        result = client.options('/api/auth/login', headers={'Origin': origin, 'Access-Control-Request-Method': 'POST'})
        assert result.status_code == status
        if status == 400:
            assert 'access-control-allow-origin' not in result.headers

def test_websocket_cannot_spoof_admin_using_query_parameters():
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect('/api/ws/notifications?user_id=test-platform_admin&role=PLATFORM_ADMIN'):
            pass

def test_invalid_login_payload_returns_validation_error():
    response = client.post('/api/auth/login', json={'email': ['bad'], 'password': 'testpassword'})
    assert response.status_code == 400
