from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: str
    assignee_id: str
    study_id: str
    status: str = "TODO"
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskInDB(TaskBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class TaskResponse(TaskBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_by: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(populate_by_name=True, extra="allow")
