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
    if user["role"] == "PLATFORM_ADMIN":
        return True
    
    study = db.studies.find_one({"_id": study_id}) # Note: assuming _id is stored as ObjectId but queried correctly or queried as string if so. We will convert string to ObjectId in repositories.
    
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    if user["role"] == "ORGANIZATION":
        if str(study.get("organization_id")) != user.get("organization_id"):
            raise HTTPException(status_code=403, detail="Not authorized to access this study")
            
    elif user["role"] == "PRINCIPAL_INVESTIGATOR":
        if str(study.get("principal_investigator_id")) != user.get("id"):
            raise HTTPException(status_code=403, detail="Not authorized to access this study")
            
    # For RESEARCH_COORDINATOR and others, we might need to check study assignments.
    return True

def require_organization_access(user: dict, org_id: str):
    if user["role"] == "PLATFORM_ADMIN":
        return True
    if user.get("organization_id") != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this organization")
    return True

def require_participant_self_access(user: dict, participant_id: str, db):
    if user["role"] == "PARTICIPANT":
        # Check if this user is linked to this participant
        # Assuming participant doc has user_id or email
        participant = db.participants.find_one({"_id": participant_id})
        if not participant or str(participant.get("user_id")) != user.get("id"):
            raise HTTPException(status_code=403, detail="Not authorized to access this participant profile")
    return True
