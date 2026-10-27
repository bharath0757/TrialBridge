"""HTTP authorization regressions backed by an isolated MongoDB-compatible store."""
from datetime import datetime
import mongomock
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from app.main import app
from app.db.mongodb import db_instance
from app.core.security import create_access_token


@pytest.fixture
def access_client(isolated_database):
    db = mongomock.MongoClient().access_regressions
    db_instance.db = db
    db_instance.is_connected = True
    actors = {}
    for label, role, org in [
        ('participant_a', 'PARTICIPANT', 'org-a'),
        ('participant_b', 'PARTICIPANT', 'org-b'),
        ('unlinked', 'PARTICIPANT', None),
        ('org_a', 'ORGANIZATION', 'org-a'),
        ('pi_a', 'PRINCIPAL_INVESTIGATOR', 'org-a'),
        ('rc_a', 'RESEARCH_COORDINATOR', 'org-a'),
        ('admin', 'PLATFORM_ADMIN', None),
    ]:
        actor = {'_id': ObjectId(), 'name': label, 'email': label + '@example.com', 'role': role, 'organization_id': org, 'is_active': True}
        db.users.insert_one(dict(actor))
        actor['id'] = str(actor['_id'])
        actor['headers'] = {'Authorization': 'Bearer ' + create_access_token({'sub': actor['id'], 'role': role})}
        actors[label] = actor
    ids = {}
    for suffix in ['a', 'b']:
        pid, sid = ObjectId(), ObjectId()
        ids['participant_' + suffix] = str(pid)
        ids['study_' + suffix] = str(sid)
        db.participants.insert_one({'_id': pid, 'user_id': actors['participant_' + suffix]['id'], 'participant_code': 'P-' + suffix, 'organization_id': 'org-' + suffix, 'created_at': datetime.utcnow()})
        db.studies.insert_one({'_id': sid, 'organization_id': 'org-' + suffix, 'principal_investigator_id': actors['pi_a']['id'] if suffix == 'a' else 'other-pi', 'title': 'Study ' + suffix})
        db.visits.insert_one({'participant_id': str(pid), 'study_id': str(sid), 'visit_name': 'Visit ' + suffix, 'date': datetime.utcnow(), 'status': 'SCHEDULED'})
        db.documents.insert_one({'participant_id': str(pid), 'study_id': str(sid), 'title': 'Private document ' + suffix, 'type': 'clinical', 'file_url': 'https://example.com/' + suffix})
        db.consents.insert_one({'participant_id': str(pid), 'study_id': str(sid), 'status': 'PENDING', 'created_at': datetime.utcnow()})
    yield TestClient(app), db, actors, ids


def test_unlinked_participant_never_receives_someone_else_profile(access_client):
    client, db, actors, ids = access_client
    response = client.get('/api/participants/', headers=actors['unlinked']['headers'])
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.parametrize('actor', ['participant_a', 'org_a', 'pi_a', 'rc_a'])
@pytest.mark.parametrize('path', ['visits', 'documents', 'consent-records'])
def test_clinical_lists_are_scoped_to_participant_or_research_team(access_client, actor, path):
    client, db, actors, ids = access_client
    response = client.get('/api/' + path + '/', headers=actors[actor]['headers'])
    assert response.status_code == 200
    assert len(response.json()) == 1
    record = response.json()[0]
    assert record.get('participant_id') == ids['participant_a']
    if path != 'consent-records':
        assert client.get('/api/' + path + '/?participant_id=' + ids['participant_b'], headers=actors[actor]['headers']).json() == []


def test_objectid_profile_lookup_and_unknown_clinical_state(access_client):
    client, db, actors, ids = access_client
    response = client.get('/api/participants/', headers=actors['participant_a']['headers'])
    assert response.status_code == 200
    profile = response.json()[0]
    assert profile['age'] is None and profile['phone'] is None
    assert profile['screeningStatus'] == 'candidate'
    assert profile['consentStatus'] == 'not_started'
    assert profile['enrollmentStatus'] == 'not_enrolled'
    assert client.get('/api/participants/' + ids['participant_a'], headers=actors['participant_a']['headers']).status_code == 200
    assert client.get('/api/participants/' + ids['participant_b'], headers=actors['participant_a']['headers']).status_code == 403
    assert client.get('/api/participants/' + ids['participant_b'], headers=actors['rc_a']['headers']).status_code == 403


@pytest.mark.parametrize('role,org', [('PLATFORM_ADMIN', None), ('ORGANIZATION', 'org-a'), ('RESEARCH_COORDINATOR', 'org-b')])
def test_organization_cannot_escalate_privileges_or_change_tenant(access_client, role, org):
    client, db, actors, ids = access_client
    response = client.post('/api/users/', headers=actors['org_a']['headers'], json={'email': 'new.staff@example.com', 'name': 'New Staff', 'password': 'Long-test-password-998!', 'role': role, 'organization_id': org})
    assert response.status_code == 403
    assert db.users.find_one({'email': 'new.staff@example.com'}) is None


def test_organization_can_create_and_list_its_own_team(access_client):
    client, db, actors, ids = access_client
    response = client.post('/api/users/', headers=actors['org_a']['headers'], json={'email': 'new.staff@example.com', 'name': 'New Staff', 'password': 'Long-test-password-998!', 'role': 'RESEARCH_COORDINATOR'})
    assert response.status_code == 200
    assert response.json()['organization_id'] == 'org-a'
    team = client.get('/api/users/', headers=actors['org_a']['headers']).json()
    assert all(u['organization_id'] == 'org-a' for u in team)
    assert client.get('/api/users/' + actors['participant_b']['id'], headers=actors['org_a']['headers']).status_code == 403


@pytest.mark.parametrize('resource', ['documents', 'consent'])
def test_participant_cannot_open_or_change_other_private_records(access_client, resource):
    client, db, actors, ids = access_client
    collection = db.documents if resource == 'documents' else db.consents
    record = collection.find_one({'participant_id': ids['participant_b']})
    url = '/api/' + resource + '/' + str(record['_id'])
    assert client.get(url, headers=actors['participant_a']['headers']).status_code == 403
    if resource == 'consent':
        assert client.post(url + '/withdraw', headers=actors['participant_a']['headers']).status_code == 403
        assert collection.find_one({'_id': record['_id']})['status'] == 'PENDING'


def test_messages_and_tasks_reject_access_by_other_accounts(access_client):
    client, db, actors, ids = access_client
    message_id = db.messages.insert_one({'from_id': actors['rc_a']['id'], 'to_id': actors['participant_b']['id'], 'content': 'Private', 'read': False}).inserted_id
    task_id = db.tasks.insert_one({'assignee_id': actors['participant_b']['id'], 'created_by': actors['rc_a']['id'], 'study_id': ids['study_b'], 'status': 'TODO'}).inserted_id
    headers = actors['participant_a']['headers']
    assert client.get('/api/messages/' + str(message_id), headers=headers).status_code == 403
    assert client.patch('/api/messages/' + str(message_id) + '/read', headers=headers).status_code == 403
    assert client.get('/api/tasks/?assignee_id=' + actors['participant_b']['id'], headers=headers).status_code == 403
    assert client.put('/api/tasks/' + str(task_id) + '?status=COMPLETED', headers=headers).status_code == 403
    assert db.messages.find_one({'_id': message_id})['read'] is False
    assert db.tasks.find_one({'_id': task_id})['status'] == 'TODO'


def test_new_signup_loads_its_own_unassigned_profile_without_validation_failure(access_client):
    client, db, actors, ids = access_client
    payload = {'email': 'new.participant@example.com', 'name': 'New Participant', 'password': 'Long-test-password-998!'}
    assert client.post('/api/auth/register', json=payload).status_code == 200
    login = client.post('/api/auth/login', json=payload)
    assert login.status_code == 200
    response = client.get('/api/participants/', headers={'Authorization': 'Bearer ' + login.json()['access_token']})
    assert response.status_code == 200
    profile = response.json()[0]
    assert profile['email'] == payload['email']
    assert profile['organization_id'] is None
    assert profile['enrollmentStatus'] == 'not_enrolled'
    assert profile['consentStatus'] == 'not_started'


@pytest.fixture
def demo_security_module():
    import importlib.util
    from pathlib import Path
    path = Path(__file__).resolve().parents[3] / 'scripts' / 'secure_demo_accounts.py'
    spec = importlib.util.spec_from_file_location('secure_demo_accounts', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_demo_accounts_cannot_be_changed_without_a_secure_owner(access_client, demo_security_module):
    from app.core.security import hash_password
    client, db, actors, ids = access_client
    db.users.insert_one({'email': 'legacy@example.com', 'role': 'PLATFORM_ADMIN', 'hashed_password': hash_password('demo123')})
    with pytest.raises(ValueError):
        demo_security_module.secure_demo_accounts(db, 'missing.owner@example.com', apply=True)
    with pytest.raises(ValueError):
        demo_security_module.secure_demo_accounts(db, 'legacy@example.com', apply=True)
    assert db.users.find_one({'email': 'legacy@example.com'}).get('is_locked') is None


def test_demo_account_dry_run_and_apply_preserve_owner_and_private_accounts(access_client, demo_security_module):
    from app.core.security import hash_password, verify_password
    client, db, actors, ids = access_client
    owner_id = db.users.insert_one({'email': 'owner@example.com', 'role': 'PLATFORM_ADMIN', 'is_active': True, 'hashed_password': hash_password('Private-owner-password-998!')}).inserted_id
    legacy_id = db.users.insert_one({'email': 'legacy@example.com', 'role': 'PARTICIPANT', 'is_active': True, 'hashed_password': hash_password('demo123')}).inserted_id
    assert demo_security_module.secure_demo_accounts(db, 'owner@example.com') == 1
    assert verify_password('demo123', db.users.find_one({'_id': legacy_id})['hashed_password'])
    assert demo_security_module.secure_demo_accounts(db, 'owner@example.com', apply=True) == 1
    assert db.users.find_one({'_id': legacy_id})['is_locked'] is True
    assert not verify_password('demo123', db.users.find_one({'_id': legacy_id})['hashed_password'])
    assert verify_password('Private-owner-password-998!', db.users.find_one({'_id': owner_id})['hashed_password'])
    assert db.audit_logs.count_documents({'action': 'LEGACY_DEMO_CREDENTIAL_RETIRED'}) == 1
