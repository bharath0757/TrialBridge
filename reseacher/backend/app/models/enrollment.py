from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class EnrollmentBase(BaseModel):
    participant_id: str
    study_id: str
    status: str = "PENDING_APPROVAL"
    enrolled_by: Optional[str] = None
    notes: Optional[str] = None

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentInDB(EnrollmentBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)

class EnrollmentResponse(EnrollmentBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    model_config = ConfigDict(populate_by_name=True)
