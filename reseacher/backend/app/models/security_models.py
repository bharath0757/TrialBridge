from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SecurityEventBase(BaseModel):
    event_type: str
    severity: str
    category: str
    title: str
    description: str
    user_id: Optional[str] = None
    email: Optional[str] = None
    organization_id: Optional[str] = None
    study_id: Optional[str] = None
    participant_id: Optional[str] = None
    endpoint: Optional[str] = None
    http_method: Optional[str] = None
    status_code: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None
    result: Optional[str] = None
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class SecurityEventCreate(SecurityEventBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SecurityEventResponse(SecurityEventBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True)

class SecurityAlertBase(BaseModel):
    severity: str
    category: str
    title: str
    description: str
    user_id: Optional[str] = None
    organization_id: Optional[str] = None
    study_id: Optional[str] = None
    participant_id: Optional[str] = None
    event_id: Optional[str] = None
    status: str = "OPEN"
    assigned_to: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None

class SecurityAlertCreate(SecurityAlertBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SecurityAlertResponse(SecurityAlertBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True)

class LoginEventBase(BaseModel):
    user_id: Optional[str] = None
    email: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool
    failure_reason: Optional[str] = None
    risk_score: int = 0
    organization_id: Optional[str] = None

class LoginEventCreate(LoginEventBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LoginEventResponse(LoginEventBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True)

class AccessEventBase(BaseModel):
    user_id: str
    role: str
    organization_id: Optional[str] = None
    resource_type: str
    resource_id: Optional[str] = None
    participant_id: Optional[str] = None
    study_id: Optional[str] = None
    action: str
    endpoint: str
    result: str
    ip_address: Optional[str] = None

class AccessEventCreate(AccessEventBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AccessEventResponse(AccessEventBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True)

class ConsentEventBase(BaseModel):
    consent_id: str
    participant_id: str
    study_id: str
    action: str
    actor_id: str
    actor_role: str
    previous_status: Optional[str] = None
    new_status: str
    document_version: Optional[str] = None
    ip_address: Optional[str] = None

class ConsentEventCreate(ConsentEventBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConsentEventResponse(ConsentEventBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True)

class ImmutableAuditLogBase(BaseModel):
    user_id: str
    role: str
    action: str
    entity_type: str
    entity_id: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None
    organization_id: Optional[str] = None
    study_id: Optional[str] = None
    participant_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None
    event_hash: str
    previous_event_hash: str

class ImmutableAuditLogCreate(ImmutableAuditLogBase):
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ImmutableAuditLogResponse(ImmutableAuditLogBase):
    id: str = Field(validation_alias=AliasChoices("_id", "id"))
    timestamp: datetime
    model_config = ConfigDict(populate_by_name=True)

class ComplianceControl(BaseModel):
    control_id: str
    framework: str
    name: str
    description: str
    status: str
    severity: str
    last_checked: datetime
    evidence: Optional[str] = None
    remediation: Optional[str] = None
    model_config = ConfigDict(populate_by_name=True)

class SecurityScoreComponent(BaseModel):
    category: str
    max_points: int
    current_points: int
    deductions: List[str]
    status: str
    model_config = ConfigDict(populate_by_name=True)

class SecurityOverview(BaseModel):
    security_score: int
    score_components: List[SecurityScoreComponent]
    compliance_badges: Dict[str, str]
    kpi: Dict[str, Any]
    recent_events: List[Dict[str, Any]]
    alert_summary: Dict[str, int]
    model_config = ConfigDict(populate_by_name=True)

class AlertResolveRequest(BaseModel):
    resolution_notes: str
