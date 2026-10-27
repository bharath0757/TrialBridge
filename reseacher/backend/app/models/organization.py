from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    type: str
    status: str = "ACTIVE"
    address: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationInDB(OrganizationBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class OrganizationResponse(OrganizationBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(populate_by_name=True, extra="allow")
