from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class ConsentBase(BaseModel):
    participant_id: str
    study_id: str
    status: str = "PENDING"
    document_url: Optional[str] = None
    version: str = "1.0"

class ConsentCreate(ConsentBase):
    pass

class ConsentInDB(ConsentBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    signed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)

class ConsentResponse(ConsentBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime
    signed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    model_config = ConfigDict(populate_by_name=True)
