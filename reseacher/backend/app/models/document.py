from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    title: str
    type: str
    file_url: str
    study_id: Optional[str] = None
    participant_id: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentInDB(DocumentBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    uploaded_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class DocumentResponse(DocumentBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    uploaded_by: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(populate_by_name=True, extra="allow")
