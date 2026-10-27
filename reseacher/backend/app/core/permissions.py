from fastapi import HTTPException, status, Depends
from typing import List
from app.core.security import get_current_user

def require_role(*allowed_roles: str):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker

def require_study_access(user: dict, study_id: str, db):
    from app.repositories.studies import get_by_id
    if user['role'] == 'PLATFORM_ADMIN':
        return True
    study = get_by_id(db, study_id)
    if not study:
        raise HTTPException(status_code=404, detail='Study not found')
    org = user.get('organization_id')
    same_org = org and str(study.get('organization_id')) == str(org)
    is_pi = str(study.get('principal_investigator_id')) == str(user['id'])
    if user['role'] == 'PRINCIPAL_INVESTIGATOR' and is_pi:
        return True
    if user['role'] in {'ORGANIZATION', 'RESEARCH_COORDINATOR'} and same_org:
        return True
    raise HTTPException(status_code=403, detail='Not authorized to access this study')


def require_organization_access(user: dict, org_id: str):
    if user["role"] == "PLATFORM_ADMIN":
        return True
    if user.get("organization_id") != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this organization")
    return True

def linked_participant_ids(user: dict, db):
    from bson import ObjectId
    identifiers = [user['id']]
    if ObjectId.is_valid(user['id']):
        identifiers.append(ObjectId(user['id']))
    return [str(p['_id']) for p in db.participants.find({'user_id': {'$in': identifiers}})]


def find_record(collection, identifier):
    from bson import ObjectId
    record = collection.find_one({'_id': identifier})
    if record is None and ObjectId.is_valid(str(identifier)):
        record = collection.find_one({'_id': ObjectId(str(identifier))})
    return record


def require_participant_self_access(user: dict, participant_id: str, db):
    if user['role'] == 'PLATFORM_ADMIN':
        return True
    participant = find_record(db.participants, participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail='Participant not found')
    if user['role'] == 'PARTICIPANT':
        allowed = str(participant.get('user_id')) == str(user['id'])
    else:
        org_id = user.get('organization_id')
        allowed = bool(org_id) and str(participant.get('organization_id')) == str(org_id)
    if not allowed:
        raise HTTPException(status_code=403, detail='Not authorized to access this participant profile')
    return True


def clinical_record_scope(user: dict, db):
    """Scope private clinical records to the participant or assigned research team."""
    if user['role'] == 'PLATFORM_ADMIN':
        return {}
    if user['role'] == 'PARTICIPANT':
        return {'participant_id': {'$in': linked_participant_ids(user, db)}}
    org_id = user.get('organization_id')
    if user['role'] == 'PRINCIPAL_INVESTIGATOR':
        studies = db.studies.find({'principal_investigator_id': user['id']})
    elif org_id:
        studies = db.studies.find({'organization_id': org_id})
    else:
        studies = []
    study_ids = []
    for study in studies:
        study_ids.extend(str(study[key]) for key in ('_id', 'id', 'study_code') if study.get(key) is not None)
    participant_ids = [str(p['_id']) for p in db.participants.find({'organization_id': org_id})] if org_id else []
    return {'$or': [
        {'study_id': {'$in': study_ids}},
        {'participant_id': {'$in': participant_ids}, 'study_id': None},
        {'uploaded_by': user['id'], 'participant_id': None, 'study_id': None},
    ]}


def require_clinical_record_access(user: dict, collection, identifier, db):
    record = find_record(collection, identifier)
    if record is None:
        raise HTTPException(status_code=404, detail='Record not found')
    permitted = collection.find_one({'$and': [{'_id': record['_id']}, clinical_record_scope(user, db)]})
    if permitted is None:
        raise HTTPException(status_code=403, detail='Not authorized to access this record')
    return {**record, '_id': str(record['_id']), 'id': str(record['_id'])}
