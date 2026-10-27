from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Dict, Any, List, Optional
from datetime import datetime

class CandidateBase(BaseModel):
    study_id: str
    participant_code: str
    batch_id: Optional[str] = None
    normalized_data: Dict[str, Any] = Field(default_factory=dict)
    raw_data: Dict[str, Any] = Field(default_factory=dict)
    screening_status: str = "UNSCREENED"
    match_score: Optional[float] = None
    ai_confidence: Optional[float] = None
    ai_summary: Optional[str] = None
    coordinator_notes: Optional[str] = None
    pi_notes: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class CandidateInDB(CandidateBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    decision_tree: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(populate_by_name=True)

class CandidateResponse(CandidateBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    decision_tree: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(populate_by_name=True)

class CandidateUploadPayload(BaseModel):
    study_id: str
    filename: Optional[str] = "candidates.json"
    candidates: List[Dict[str, Any]]
    column_mapping: Optional[Dict[str, str]] = None

class ScreeningRequest(BaseModel):
    batch_id: Optional[str] = None
    candidate_ids: Optional[List[str]] = None
    run_ai_assistance: bool = True
