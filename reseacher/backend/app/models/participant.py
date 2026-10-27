from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ClinicalAttributes(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    conditions: Optional[list] = []
    medications: Optional[list] = []
    lab_results: Optional[Dict[str, Any]] = {}
    vital_signs: Optional[Dict[str, Any]] = {}
    model_config = ConfigDict(extra="allow")

class ParticipantBase(BaseModel):
    participant_code: str
    organization_id: str
    site_id: Optional[str] = None
    user_id: Optional[str] = None
    status: str = "ACTIVE"
    clinical_attributes: Dict[str, Any] = Field(default_factory=dict)
    clinicalData: Optional[Dict[str, Any]] = None
    model_config = ConfigDict(extra="allow")

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantInDB(ParticipantBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class ParticipantResponse(ParticipantBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    studyId: Optional[str] = None
    study_id: Optional[str] = None
    studyName: Optional[str] = None
    study_name: Optional[str] = None
    screeningStatus: Optional[str] = "approved"
    consentStatus: Optional[str] = "consented"
    enrollmentStatus: Optional[str] = "enrolled"
    lastActivity: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class StudyParticipantBase(BaseModel):
    participant_id: str
    study_id: str
    status: str = "IDENTIFIED"

class StudyParticipantCreate(StudyParticipantBase):
    pass

class StudyParticipantInDB(StudyParticipantBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    added_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class StudyParticipantResponse(StudyParticipantBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    added_at: datetime
    model_config = ConfigDict(populate_by_name=True)
