from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UploadBatchBase(BaseModel):
    study_id: str
    uploaded_by: str
    filename: str
    total_records: int = 0
    valid_records: int = 0
    invalid_records: int = 0
    duplicate_records: int = 0
    missing_records: int = 0
    column_mapping: Dict[str, str] = Field(default_factory=dict)
    status: str = "COMPLETED"  # QUEUED, PROCESSING, COMPLETED, FAILED

class UploadBatchCreate(UploadBatchBase):
    pass

class UploadBatchInDB(UploadBatchBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class UploadBatchResponse(UploadBatchBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True, extra="allow")
