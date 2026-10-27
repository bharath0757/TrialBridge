from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class ParticipantContext(BaseModel):
    participant_id: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    egfr: Optional[float] = None
    baseline_hba1c: Optional[float] = None
    baseline_fpg: Optional[float] = None
    alt: Optional[float] = None
    ast: Optional[float] = None
    diabetes_status: Optional[str] = 'Type 2 Diabetes'
    comorbidities: Optional[List[str]] = Field(default_factory=list)
    concomitant_medications: Optional[List[str]] = Field(default_factory=list)
    study_id: Optional[str] = 'DB-101'
    protocol_id: Optional[str] = 'ADA-2026-T2D'

class DoseInput(BaseModel):
    dose_amount: float = 1000.0
    unit: str = 'mg'
    frequency: str = 'BID'
    route: str = 'Oral'
    reference_dose: float = 1000.0
    dose_multiplier: Optional[float] = 1.0

class ProtocolContext(BaseModel):
    protocol_id: str = 'ADA-2026-T2D'
    version: str = 'v2.6'
    study_name: str = 'Type 2 Diabetes Renal Dynamics & ADMET Profiling'
    permitted_dose_range: Dict[str, float] = Field(default_factory=lambda: {'min': 500.0, 'max': 2000.0})
    reference_sequence: List[float] = Field(default_factory=lambda: [500.0, 1000.0, 1500.0, 2000.0])
    target_organ: str = 'Kidneys / Renal Pelvis & Liver'
    safety_thresholds: Dict[str, Any] = Field(default_factory=lambda: {
        'min_egfr_standard': 45.0,
        'contraindicated_egfr': 30.0,
        'max_hba1c_target': 8.5,
        'alt_uln_threshold': 105.0
    })

class AdmetScores(BaseModel):
    absorption: Optional[int] = None
    distribution: Optional[int] = None
    metabolism: Optional[int] = None
    excretion: Optional[int] = None
    toxicity: Optional[int] = None
    overall: Optional[int] = None

class AdmetSafetySignal(BaseModel):
    signal_name: str
    severity: str  # 'info', 'caution', 'warning', 'critical'
    target_system: str
    description: str
    evidence_source: str

class ExplainabilityReport(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    data_used: List[str]
    data_missing: List[str]
    unsupported_variables: List[str]
    drug_level_summary: str
    participant_modifiers_applied: List[str]
    dose_exposure_relationship: str
    confidence_pct: Optional[int] = None
    data_completeness_pct: int
    model_version: str
    provenance_sources: List[str]
    warnings: List[str]
    limitations: str

class AdmetAnalyzeRequest(BaseModel):
    compound_id: str = 'c4h11n5'
    smiles: str = 'CN(C)C(=N)NC(=N)N'
    participant_context: Optional[ParticipantContext] = None
    dose_input: Optional[DoseInput] = None
    protocol_context: Optional[ProtocolContext] = None
    analysis_mode: str = 'participant_adjusted'

class AdmetAnalyzeResponse(BaseModel):
    analysis_id: str
    compound_id: str
    compound_name: str
    formula: str
    smiles: str
    indication: str
    target_organ: str
    analysis_mode: str
    scores_intrinsic: AdmetScores
    scores_adjusted: AdmetScores
    scores_display: AdmetScores
    verdict: str
    verdict_rationale: str
    safety_signals: List[AdmetSafetySignal]
    explainability: ExplainabilityReport
    dose_context: DoseInput
    participant_context: Optional[ParticipantContext] = None
    protocol_context: ProtocolContext
    created_at: str
    review_status: str = 'DRAFT'
    review_details: Optional[Dict[str, Any]] = None
    disclaimer: str

class DoseComparisonItem(BaseModel):
    dose_amount: float
    unit: str
    dose_multiplier: float
    predicted_auc_ratio: float
    predicted_cmax_ratio: float
    scores: AdmetScores
    safety_signals: List[str]
    verdict: str
    status: str
    target_organ_effect: str
    data_availability: str

class DoseComparisonRequest(BaseModel):
    compound_id: str = 'c4h11n5'
    smiles: str = 'CN(C)C(=N)NC(=N)N'
    participant_context: Optional[ParticipantContext] = None
    protocol_context: Optional[ProtocolContext] = None
    dose_levels: Optional[List[float]] = None

class DoseComparisonResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    compound_id: str
    compound_name: str
    reference_dose: float
    unit: str
    comparison_items: List[DoseComparisonItem]
    model_version: str
    disclaimer: str

class AdmetReviewRequest(BaseModel):
    analysis_id: str
    reviewer_name: str
    reviewer_role: str
    decision: str
    review_notes: str

class AdmetReviewResponse(BaseModel):
    review_id: str
    analysis_id: str
    reviewer_name: str
    reviewer_role: str
    decision: str
    review_notes: str
    timestamp: str
    status: str
