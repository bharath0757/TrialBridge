from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

class CriterionResult(BaseModel):
    criterion_id: str
    name: str
    status: str  # MATCH, MISMATCH, REVIEW
    evidence: str

class ScreeningResultBase(BaseModel):
    participant_id: str
    study_id: str
    match_score: float
    results: List[CriterionResult]
    ai_confidence: float

class ScreeningResultCreate(ScreeningResultBase):
    pass

class ScreeningResultInDB(ScreeningResultBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    run_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class ScreeningResultResponse(ScreeningResultBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    run_at: datetime
    model_config = ConfigDict(populate_by_name=True)
