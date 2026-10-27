from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class SimulationBase(BaseModel):
    study_id: str
    parameters: Dict[str, Any]

class SimulationCreate(SimulationBase):
    pass

class SimulationInDB(SimulationBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "COMPLETED"
    
    model_config = ConfigDict(populate_by_name=True)

class SimulationResultInDB(BaseModel):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    simulation_id: str
    results: Dict[str, Any]
    
    model_config = ConfigDict(populate_by_name=True)

class SimulationResponse(SimulationBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_by: str
    created_at: datetime
    status: str
    model_config = ConfigDict(populate_by_name=True)
