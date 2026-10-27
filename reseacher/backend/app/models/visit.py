from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class VisitBase(BaseModel):
    participant_id: str
    study_id: str
    visit_name: str
    date: datetime
    status: str = "SCHEDULED"
    notes: Optional[str] = None

class VisitCreate(VisitBase):
    pass

class VisitInDB(VisitBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class VisitResponse(VisitBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(populate_by_name=True, extra="allow")
