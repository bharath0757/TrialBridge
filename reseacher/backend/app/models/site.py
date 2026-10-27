from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class ResearchSiteBase(BaseModel):
    name: str
    organization_id: str
    principal_investigator_id: str
    address: str
    status: str = "ACTIVE"

class ResearchSiteCreate(ResearchSiteBase):
    pass

class ResearchSiteInDB(ResearchSiteBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class ResearchSiteResponse(ResearchSiteBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True)
