from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class EligibilityReviewBase(BaseModel):
    study_id: str = Field(validation_alias=AliasChoices("study_id", "studyId"))
    participant_id: str = Field(validation_alias=AliasChoices("participant_id", "participantId"))
    assigned_to_pi: str = Field(default="pi", validation_alias=AliasChoices("assigned_to_pi", "assignedToPi"))
    status: str = "PENDING_PI_REVIEW"
    coordinator_notes: Optional[str] = Field(default=None, validation_alias=AliasChoices("coordinator_notes", "coordinatorNotes"))
    pi_notes: Optional[str] = Field(default=None, validation_alias=AliasChoices("pi_notes", "piNotes"))
    
    # Rich candidate and study fields
    candidate_id: Optional[str] = None
    participant_code: Optional[str] = Field(default=None, validation_alias=AliasChoices("participant_code", "participantCode"))
    study_title: Optional[str] = Field(default=None, validation_alias=AliasChoices("study_title", "studyTitle"))
    age: Optional[int] = 45
    gender: Optional[str] = "Unspecified"
    ai_recommendation: Optional[str] = Field(default="REQUIRES_HUMAN_REVIEW", validation_alias=AliasChoices("ai_recommendation", "aiRecommendation"))
    ai_confidence: Optional[float] = Field(default=90.0, validation_alias=AliasChoices("ai_confidence", "aiConfidence"))
    coordinator_recommendation: Optional[str] = Field(default="PROCEED", validation_alias=AliasChoices("coordinator_recommendation", "coordinatorRecommendation"))
    criteria: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    decision_tree: Optional[Dict[str, Any]] = None
    match_score: Optional[float] = 100.0

    model_config = ConfigDict(populate_by_name=True, extra="allow")

class EligibilityReviewCreate(EligibilityReviewBase):
    coordinator_id: Optional[str] = Field(default=None, validation_alias=AliasChoices("coordinator_id", "coordinatorId"))

class EligibilityReviewInDB(EligibilityReviewBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    coordinator_id: Optional[str] = Field(default=None, validation_alias=AliasChoices("coordinator_id", "coordinatorId"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class EligibilityReviewResponse(EligibilityReviewBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    coordinator_id: Optional[str] = Field(default=None, validation_alias=AliasChoices("coordinator_id", "coordinatorId"))
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class EligibilityDecision(BaseModel):
    reason: Optional[str] = "Decision rendered by Principal Investigator."

