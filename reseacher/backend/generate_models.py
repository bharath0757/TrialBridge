import os

MODELS_DIR = "c:/My projects/Hacksprint/HackSprint-2026/reseacher/project/backend/app/models"
os.makedirs(MODELS_DIR, exist_ok=True)

models = {
    "__init__.py": "",
    
    "user.py": """from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str
    organization_id: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class UserResponse(UserBase):
    id: str
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str
""",

    "organization.py": """from pydantic import BaseModel, ConfigDict, Field
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
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class OrganizationResponse(OrganizationBase):
    id: str
    created_at: datetime
""",

    "site.py": """from pydantic import BaseModel, ConfigDict, Field
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
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class ResearchSiteResponse(ResearchSiteBase):
    id: str
    created_at: datetime
""",

    "study.py": """from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

class StudyCriterionBase(BaseModel):
    name: str
    type: str
    description: str
    operator: str
    value: str
    is_inclusion: bool

class StudyCriterionCreate(StudyCriterionBase):
    pass

class StudyCriterionInDB(StudyCriterionBase):
    id: str = Field(alias="_id")
    model_config = ConfigDict(populate_by_name=True)

class StudyBase(BaseModel):
    study_code: str
    title: str
    description: str
    organization_id: str
    principal_investigator_id: str
    status: str = "PLANNING"
    phase: str

class StudyCreate(StudyBase):
    criteria: Optional[List[StudyCriterionCreate]] = []

class StudyInDB(StudyBase):
    id: str = Field(alias="_id")
    criteria: List[dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class StudyResponse(StudyBase):
    id: str
    criteria: List[dict] = []
    created_at: datetime
""",

    "participant.py": """from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ClinicalAttributes(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    conditions: Optional[list] = []
    medications: Optional[list] = []
    lab_results: Optional[Dict[str, Any]] = {}
    vital_signs: Optional[Dict[str, Any]] = {}

class ParticipantBase(BaseModel):
    participant_code: str
    organization_id: str
    site_id: Optional[str] = None
    user_id: Optional[str] = None
    status: str = "ACTIVE"
    clinical_attributes: ClinicalAttributes = Field(default_factory=ClinicalAttributes)

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantInDB(ParticipantBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class ParticipantResponse(ParticipantBase):
    id: str
    created_at: datetime

class StudyParticipantBase(BaseModel):
    participant_id: str
    study_id: str
    status: str = "IDENTIFIED"

class StudyParticipantCreate(StudyParticipantBase):
    pass

class StudyParticipantInDB(StudyParticipantBase):
    id: str = Field(alias="_id")
    added_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class StudyParticipantResponse(StudyParticipantBase):
    id: str
    added_at: datetime
""",

    "screening.py": """from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

class CriterionResult(BaseModel):
    criterion_id: str
    name: str
    status: str  # MATCH, MISMATCH, REVIEW
    evidence: str

class ScreeningResultBase(BaseModel):
    participant_id: str
    study_id: str
    match_score: float
    results: List[CriterionResult]
    ai_confidence: float

class ScreeningResultCreate(ScreeningResultBase):
    pass

class ScreeningResultInDB(ScreeningResultBase):
    id: str = Field(alias="_id")
    run_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class ScreeningResultResponse(ScreeningResultBase):
    id: str
    run_at: datetime
""",

    "eligibility.py": """from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class EligibilityReviewBase(BaseModel):
    study_id: str
    participant_id: str
    assigned_to_pi: str
    status: str = "PENDING_PI_REVIEW"
    coordinator_notes: Optional[str] = None
    pi_notes: Optional[str] = None

class EligibilityReviewCreate(EligibilityReviewBase):
    coordinator_id: str

class EligibilityReviewInDB(EligibilityReviewBase):
    id: str = Field(alias="_id")
    coordinator_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class EligibilityReviewResponse(EligibilityReviewBase):
    id: str
    coordinator_id: str
    created_at: datetime
    updated_at: datetime

class EligibilityDecision(BaseModel):
    reason: str
""",

    "consent.py": """from pydantic import BaseModel, ConfigDict, Field
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
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    signed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)

class ConsentResponse(ConsentBase):
    id: str
    created_at: datetime
    signed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
""",

    "enrollment.py": """from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class EnrollmentBase(BaseModel):
    participant_id: str
    study_id: str
    status: str = "PENDING_APPROVAL"
    enrolled_by: Optional[str] = None
    notes: Optional[str] = None

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentInDB(EnrollmentBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)

class EnrollmentResponse(EnrollmentBase):
    id: str
    created_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
""",

    "visit.py": """from pydantic import BaseModel, ConfigDict, Field
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
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class VisitResponse(VisitBase):
    id: str
    created_at: datetime
""",

    "task.py": """from pydantic import BaseModel, ConfigDict, Field
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
    id: str = Field(alias="_id")
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class TaskResponse(TaskBase):
    id: str
    created_by: str
    created_at: datetime
""",

    "document.py": """from pydantic import BaseModel, ConfigDict, Field
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
    id: str = Field(alias="_id")
    uploaded_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class DocumentResponse(DocumentBase):
    id: str
    uploaded_by: str
    created_at: datetime
""",

    "notification.py": """from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    recipient_id: str
    type: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    read: bool = False

class NotificationCreate(NotificationBase):
    pass

class NotificationInDB(NotificationBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class NotificationResponse(NotificationBase):
    id: str
    created_at: datetime
""",

    "message.py": """from pydantic import BaseModel, ConfigDict, Field
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
    id: str = Field(alias="_id")
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class MessageResponse(MessageBase):
    id: str
    sent_at: datetime
""",

    "audit.py": """from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class AuditLogBase(BaseModel):
    user_id: str
    role: str
    action: str
    entity_type: str
    entity_id: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    reason: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogInDB(AuditLogBase):
    id: str = Field(alias="_id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True)

class AuditLogResponse(AuditLogBase):
    id: str
    timestamp: datetime
""",

    "simulation.py": """from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class SimulationBase(BaseModel):
    study_id: str
    parameters: Dict[str, Any]

class SimulationCreate(SimulationBase):
    pass

class SimulationInDB(SimulationBase):
    id: str = Field(alias="_id")
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "COMPLETED"
    
    model_config = ConfigDict(populate_by_name=True)

class SimulationResultInDB(BaseModel):
    id: str = Field(alias="_id")
    simulation_id: str
    results: Dict[str, Any]
    
    model_config = ConfigDict(populate_by_name=True)

class SimulationResponse(SimulationBase):
    id: str
    created_by: str
    created_at: datetime
    status: str
"""
}

for name, content in models.items():
    with open(os.path.join(MODELS_DIR, name), "w") as f:
        f.write(content)
