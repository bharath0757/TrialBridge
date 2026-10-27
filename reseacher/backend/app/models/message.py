from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    from_id: str
    to_id: str
    content: str
    read: bool = False

class MessageCreate(BaseModel):
    to_id: str
    content: str

class MessageInDB(MessageBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class MessageResponse(MessageBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    sent_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(populate_by_name=True, extra="allow")
