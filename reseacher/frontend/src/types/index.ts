export type Role = 'PLATFORM_ADMIN' | 'ORGANIZATION' | 'PRINCIPAL_INVESTIGATOR' | 'RESEARCH_COORDINATOR' | 'PARTICIPANT';

export type StudyStatus = 'recruiting' | 'screening' | 'active' | 'completed' | 'paused' | 'RECRUITING' | 'SCREENING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'PLANNING';
export type ScreeningStatus = 'candidate' | 'screening' | 'potentially_eligible' | 'human_review' | 'approved' | 'rejected' | 'CANDIDATE' | 'SCREENING' | 'POTENTIALLY_ELIGIBLE' | 'HUMAN_REVIEW' | 'APPROVED' | 'REJECTED';
export type ConsentStatus = 'not_started' | 'sent' | 'viewed' | 'pending' | 'consented' | 'withdrawn' | 'NOT_STARTED' | 'SENT' | 'VIEWED' | 'PENDING' | 'CONSENTED' | 'WITHDRAWN' | 'SIGNED' | 'VERIFIED';
export type EnrollmentStatus = 'not_enrolled' | 'enrolled' | 'completed' | 'withdrawn' | 'NOT_ENROLLED' | 'ENROLLED' | 'COMPLETED' | 'WITHDRAWN' | 'PENDING_APPROVAL' | 'ACTIVE';
export type VisitStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled' | 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
export type TaskPriority = 'high' | 'medium' | 'low' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type TaskType = 'eligibility_review' | 'consent_review' | 'participant_followup' | 'visit_preparation' | 'document_review' | 'data_verification' | 'ELIGIBILITY_REVIEW' | 'CONSENT_REVIEW' | 'PARTICIPANT_FOLLOWUP' | 'VISIT_PREPARATION' | 'DOCUMENT_REVIEW' | 'DATA_VERIFICATION';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  organization?: string;
  specialty?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization_id?: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  read: boolean;
  requires_action?: boolean;
  actions?: string[];
  action_taken?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface EligibilityReview {
  id: string;
  participant_id: string;
  study_id: string;
  submitted_by: string;
  assigned_to_pi: string;
  ai_recommendation: string;
  coordinator_recommendation: string;
  status: string;
  decision?: string;
  decision_reason?: string;
  decided_by?: string;
  decided_at?: string;
}

export interface EligibilityCriterion {
  id: string;
  field: string;
  operator: string;
  value: string;
  category: 'inclusion' | 'exclusion';
}

export interface Study {
  id: string;
  name: string;
  description: string;
  condition: string;
  sponsor: string;
  researchSite: string;
  startDate: string;
  endDate: string;
  targetParticipants: number;
  enrolledParticipants: number;
  status: StudyStatus;
  eligibilityCriteria: EligibilityCriterion[];
  anatomy?: string;
  anatomyDescription?: string;
  phase: string;
  principalInvestigator: string;
}

export interface ScreeningResult {
  criterionId: string;
  criterionLabel: string;
  status: 'match' | 'review' | 'mismatch';
  detail: string;
}

export interface ClinicalTrialData {
  weightKg: number;
  bmi: number;
  baselineHba1c: number;
  baselineFpg: number;
  doseMg: number;
  cmax: number;
  tmax: number;
  auc024: number;
  bioavailability: number;
  vdLkg: number;
  proteinBinding: number;
  clearanceLh: number;
  halfLifeH: number;
  primaryEnzyme: string;
  renalExcretion: number;
  dominantRoute: string;
  alt: number;
  ast: number;
  hypoglycemiaEvent: boolean;
  adverseEvent: boolean;
  aeSeverity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  week12Hba1c: number;
  hba1cChange: number;
  week12Fpg: number;
  fpgChange: number;
}

export interface Participant {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  location: string;
  studyId: string;
  studyName: string;
  screeningStatus: ScreeningStatus;
  consentStatus: ConsentStatus;
  enrollmentStatus: EnrollmentStatus;
  lastActivity: string;
  enrolledDate?: string;
  aiConfidence?: number;
  screeningResults?: ScreeningResult[];
  screeningReviewed?: boolean;
  screeningReviewedBy?: string;
  screeningReviewedDate?: string;
  screeningNotes?: string;
  clinicalData?: ClinicalTrialData;
}

export interface Visit {
  id: string;
  participantId: string;
  participantName: string;
  studyId: string;
  studyName: string;
  date: string;
  time: string;
  location: string;
  coordinator: string;
  type: string;
  status: VisitStatus;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  participantId?: string;
  participantName?: string;
  studyId: string;
  studyName: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
}

export interface ConsentRecord {
  id: string;
  participantId: string;
  participantName: string;
  studyId: string;
  studyName: string;
  consentVersion: string;
  dateSent?: string;
  dateViewed?: string;
  dateSigned?: string;
  researcher: string;
  status: ConsentStatus;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  studyId?: string;
  studyName?: string;
  participantId?: string;
  participantName?: string;
  uploadedBy: string;
  date: string;
  status: 'active' | 'pending' | 'archived';
  size: string;
}

export interface Message {
  id: string;
  from: string;
  fromRole: Role;
  to: string;
  toRole: Role;
  subject: string;
  preview: string;
  body: string;
  date: string;
  time: string;
  read: boolean;
  type: 'consent_reminder' | 'visit_reminder' | 'eligibility_review' | 'task_assignment' | 'study_update' | 'general';
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  userRole: Role;
  target: string;
  timestamp: string;
  category: 'study' | 'participant' | 'consent' | 'document' | 'system' | 'screening';
}

export interface Activity {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  type: 'study' | 'participant' | 'consent' | 'document' | 'screening';
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  users: number;
  studies: number;
  participants: number;
  status: 'active' | 'inactive';
}
