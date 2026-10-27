from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

class StudyCriterionBase(BaseModel):
    name: str
    type: str
    description: str
    operator: str
    value: str
    is_inclusion: bool

class StudyCriterionCreate(StudyCriterionBase):
    pass

class StudyCriterionInDB(StudyCriterionBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    model_config = ConfigDict(populate_by_name=True)

class StudyBase(BaseModel):
    study_code: Optional[str] = Field(None, validation_alias=AliasChoices("study_code", "id"))
    title: Optional[str] = Field(None, validation_alias=AliasChoices("title", "name"))
    description: Optional[str] = ""
    organization_id: Optional[str] = None
    principal_investigator_id: Optional[str] = None
    status: str = "active"
    phase: Optional[str] = "Phase II"
    criteria_version: Optional[int] = 1
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class StudyCreate(StudyBase):
    condition: Optional[str] = None
    sponsor: Optional[str] = "PharmaCo Research"
    researchSite: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    targetParticipants: Optional[int] = 100
    anatomy: Optional[str] = None
    anatomyDescription: Optional[str] = None
    principalInvestigator: Optional[str] = None
    criteria: Optional[List[dict]] = Field(default_factory=list, validation_alias=AliasChoices("criteria", "eligibilityCriteria"))
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class StudyInDB(StudyBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    criteria: List[dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class StudyResponse(StudyBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    name: Optional[str] = None
    condition: Optional[str] = None
    sponsor: Optional[str] = None
    researchSite: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    targetParticipants: Optional[int] = 100
    enrolledParticipants: Optional[int] = 0
    screenedParticipants: Optional[int] = 0
    eligibleParticipants: Optional[int] = 0
    pendingReviews: Optional[int] = 0
    principalInvestigator: Optional[str] = None
    anatomy: Optional[str] = None
    anatomyDescription: Optional[str] = None
    criteria: List[dict] = []
    criteria_version: Optional[int] = 1
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True, extra="allow")

