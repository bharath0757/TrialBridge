import type {
  User,
  Organization,
  Study,
  Participant,
  Visit,
  Task,
  ConsentRecord,
  Document,
  Message,
  AuditLog,
  Activity,
  ScreeningResult,
} from '@/types';

export const currentUser: User = {
  id: 'u1',
  name: 'Dr. James Patel',
  email: 'j.patel@cityhospital.org',
  role: 'PRINCIPAL_INVESTIGATOR',
  avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
  organization: 'City Hospital',
  specialty: 'Endocrinology & Nephrology',
};

export const organizations: Organization[] = [
  { id: 'o1', name: 'City Hospital', type: 'Hospital', users: 48, studies: 1, participants: 50, status: 'active' },
  { id: 'o2', name: 'Sunshine Medical Center', type: 'Medical Center', users: 32, studies: 1, participants: 0, status: 'active' },
  { id: 'o3', name: 'Metro Care Research', type: 'Research Institute', users: 27, studies: 1, participants: 0, status: 'active' },
  { id: 'o4', name: 'Global Health University', type: 'University', users: 56, studies: 1, participants: 0, status: 'active' },
  { id: 'o5', name: 'LifeCare Hospital', type: 'Hospital', users: 19, studies: 1, participants: 0, status: 'inactive' },
];

export const studies: Study[] = [
  {
    id: 'ST-001',
    name: 'Type 2 Diabetes Study (C4H11N5 Renal Dynamics)',
    description: 'A Phase III clinical evaluation of C4H11N5 (Metformin) renal tubular clearance, filtration safety, and glycemic response in Type 2 Diabetes patients.',
    condition: 'Type 2 Diabetes',
    sponsor: 'PharmaCo Research',
    researchSite: 'City Hospital, Chennai',
    startDate: '2026-06-01',
    endDate: '2027-06-01',
    targetParticipants: 60,
    enrolledParticipants: 50,
    status: 'active',
    phase: 'Phase III',
    principalInvestigator: 'Dr. James Patel',
    anatomy: 'Kidneys',
    anatomyDescription: 'The kidneys are the primary affected target and excretion site for C4H11N5 (Metformin). In 3D simulation, kidneys are highlighted in red while the remaining anatomy remains normal.',
    eligibilityCriteria: [
      { id: 'c1', field: 'Age', operator: 'between', value: '30-65', category: 'inclusion' },
      { id: 'c2', field: 'Condition', operator: 'equals', value: 'Type 2 Diabetes', category: 'inclusion' },
      { id: 'c3', field: 'HbA1c', operator: '>=', value: '7.0', category: 'inclusion' },
      { id: 'c4', field: 'eGFR', operator: '>=', value: '45', category: 'inclusion' },
      { id: 'c5', field: 'BMI', operator: '<=', value: '40', category: 'inclusion' },
      { id: 'c6', field: 'Pregnancy', operator: 'equals', value: 'Not pregnant', category: 'exclusion' },
    ],
  },
];

export const participants: Participant[] = [
  {
    "id": "PT-001",
    "name": "Rahul Mehta",
    "age": 38,
    "gender": "Male",
    "email": "rahul.mehta@trialbridge.io",
    "phone": "+91 9800000000",
    "location": "Chennai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-01",
    "enrolledDate": "2026-06-10",
    "aiConfidence": 82.0,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 85.0,
      "bmi": 26.2,
      "baselineHba1c": 7.3,
      "baselineFpg": 138.0,
      "doseMg": 50,
      "cmax": 115.7,
      "tmax": 1.83,
      "auc024": 860.2,
      "bioavailability": 58.3,
      "vdLkg": 0.89,
      "proteinBinding": 78.3,
      "clearanceLh": 12.82,
      "halfLifeH": 4.09,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 51.3,
      "dominantRoute": "Renal-dominant",
      "alt": 35.5,
      "ast": 14.9,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 6.3,
      "hba1cChange": -1.02,
      "week12Fpg": 104.0,
      "fpgChange": -33.8
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 38 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 26.2 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-002",
    "name": "Karthik Sharma",
    "age": 62,
    "gender": "Male",
    "email": "karthik.sharma@trialbridge.io",
    "phone": "+91 9800003719",
    "location": "Bangalore",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-02",
    "enrolledDate": "2026-07-11",
    "aiConfidence": 85.7,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 80.0,
      "bmi": 25.8,
      "baselineHba1c": 7.3,
      "baselineFpg": 167.0,
      "doseMg": 100,
      "cmax": 266.1,
      "tmax": 2.02,
      "auc024": 2688.4,
      "bioavailability": 59.4,
      "vdLkg": 0.95,
      "proteinBinding": 80.2,
      "clearanceLh": 9.86,
      "halfLifeH": 5.34,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 38.1,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 14.7,
      "ast": 27.1,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 6.0,
      "hba1cChange": -1.3,
      "week12Fpg": 140.0,
      "fpgChange": -26.8
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 62 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 25.8 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-003",
    "name": "Arjun Reddy",
    "age": 57,
    "gender": "Male",
    "email": "arjun.reddy@trialbridge.io",
    "phone": "+91 9800007438",
    "location": "Mumbai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-03",
    "enrolledDate": "2026-08-12",
    "aiConfidence": 89.4,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 87.7,
      "bmi": 30.0,
      "baselineHba1c": 8.3,
      "baselineFpg": 171.0,
      "doseMg": 100,
      "cmax": 252.1,
      "tmax": 1.32,
      "auc024": 2085.0,
      "bioavailability": 63.7,
      "vdLkg": 0.72,
      "proteinBinding": 73.0,
      "clearanceLh": 8.05,
      "halfLifeH": 5.44,
      "primaryEnzyme": "CYP2C9",
      "renalExcretion": 51.2,
      "dominantRoute": "Renal-dominant",
      "alt": 8.0,
      "ast": 22.4,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.4,
      "hba1cChange": -0.91,
      "week12Fpg": 140.0,
      "fpgChange": -31.3
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 57 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 30.0 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-004",
    "name": "Vikram Patel",
    "age": 50,
    "gender": "Male",
    "email": "vikram.patel@trialbridge.io",
    "phone": "+91 9800011157",
    "location": "Delhi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-04",
    "enrolledDate": "2026-06-13",
    "aiConfidence": 93.1,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 72.0,
      "bmi": 22.0,
      "baselineHba1c": 9.3,
      "baselineFpg": 228.0,
      "doseMg": 50,
      "cmax": 139.6,
      "tmax": 1.79,
      "auc024": 1421.8,
      "bioavailability": 67.6,
      "vdLkg": 0.94,
      "proteinBinding": 81.8,
      "clearanceLh": 14.51,
      "halfLifeH": 3.23,
      "primaryEnzyme": "CYP2D6",
      "renalExcretion": 35.1,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 9.1,
      "ast": 8.8,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Mild",
      "week12Hba1c": 8.0,
      "hba1cChange": -1.31,
      "week12Fpg": 197.0,
      "fpgChange": -30.7
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 50 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 9.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 22.0 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-005",
    "name": "Aisha Nair",
    "age": 50,
    "gender": "Female",
    "email": "aisha.nair@trialbridge.io",
    "phone": "+91 9800014876",
    "location": "Hyderabad",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-05",
    "enrolledDate": "2026-07-14",
    "aiConfidence": 96.8,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 80.2,
      "bmi": 32.5,
      "baselineHba1c": 8.3,
      "baselineFpg": 212.0,
      "doseMg": 100,
      "cmax": 285.9,
      "tmax": 2.21,
      "auc024": 2278.3,
      "bioavailability": 58.9,
      "vdLkg": 0.61,
      "proteinBinding": 73.7,
      "clearanceLh": 13.05,
      "halfLifeH": 2.6,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 37.4,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 24.2,
      "ast": 8.3,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.2,
      "hba1cChange": -1.1,
      "week12Fpg": 175.0,
      "fpgChange": -36.9
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 50 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 32.5 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-006",
    "name": "Priya Iyer",
    "age": 65,
    "gender": "Female",
    "email": "priya.iyer@trialbridge.io",
    "phone": "+91 9800018595",
    "location": "Chennai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-06",
    "enrolledDate": "2026-08-15",
    "aiConfidence": 85.5,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 86.8,
      "bmi": 33.1,
      "baselineHba1c": 8.1,
      "baselineFpg": 144.0,
      "doseMg": 100,
      "cmax": 159.5,
      "tmax": 3.14,
      "auc024": 1634.2,
      "bioavailability": 71.6,
      "vdLkg": 1.17,
      "proteinBinding": 74.7,
      "clearanceLh": 19.15,
      "halfLifeH": 3.68,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 21.9,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 24.2,
      "ast": 21.9,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.4,
      "hba1cChange": -0.71,
      "week12Fpg": 95.0,
      "fpgChange": -48.8
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 65 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.1% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 33.1 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-007",
    "name": "Deepa Rao",
    "age": 38,
    "gender": "Female",
    "email": "deepa.rao@trialbridge.io",
    "phone": "+91 9800022314",
    "location": "Bangalore",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-07",
    "enrolledDate": "2026-06-16",
    "aiConfidence": 89.2,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 73.7,
      "bmi": 28.8,
      "baselineHba1c": 8.4,
      "baselineFpg": 158.0,
      "doseMg": 50,
      "cmax": 83.2,
      "tmax": 3.88,
      "auc024": 720.3,
      "bioavailability": 51.7,
      "vdLkg": 1.15,
      "proteinBinding": 88.9,
      "clearanceLh": 13.26,
      "halfLifeH": 4.43,
      "primaryEnzyme": "Non-CYP/Renal",
      "renalExcretion": 39.8,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 23.1,
      "ast": 20.5,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.1,
      "hba1cChange": -1.32,
      "week12Fpg": 108.0,
      "fpgChange": -50.5
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 38 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.4% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 28.8 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-008",
    "name": "Sanjay Gupta",
    "age": 59,
    "gender": "Male",
    "email": "sanjay.gupta@trialbridge.io",
    "phone": "+91 9800026033",
    "location": "Mumbai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-08",
    "enrolledDate": "2026-07-17",
    "aiConfidence": 92.9,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 84.4,
      "bmi": 31.4,
      "baselineHba1c": 9.1,
      "baselineFpg": 128.0,
      "doseMg": 150,
      "cmax": 304.3,
      "tmax": 1.39,
      "auc024": 2680.8,
      "bioavailability": 62.1,
      "vdLkg": 0.85,
      "proteinBinding": 69.7,
      "clearanceLh": 13.16,
      "halfLifeH": 3.78,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 35.7,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 33.7,
      "ast": 21.3,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 8.3,
      "hba1cChange": -0.78,
      "week12Fpg": 104.0,
      "fpgChange": -24.2
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 59 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 9.1% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 31.4 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-009",
    "name": "Amit Singh",
    "age": 42,
    "gender": "Male",
    "email": "amit.singh@trialbridge.io",
    "phone": "+91 9800029752",
    "location": "Delhi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-09",
    "enrolledDate": "2026-08-18",
    "aiConfidence": 96.6,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 68.7,
      "bmi": 28.2,
      "baselineHba1c": 8.4,
      "baselineFpg": 150.0,
      "doseMg": 50,
      "cmax": 92.8,
      "tmax": 2.81,
      "auc024": 963.0,
      "bioavailability": 85.4,
      "vdLkg": 0.97,
      "proteinBinding": 58.7,
      "clearanceLh": 11.5,
      "halfLifeH": 4.02,
      "primaryEnzyme": "CYP2C9",
      "renalExcretion": 19.4,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 8.0,
      "ast": 21.8,
      "hypoglycemiaEvent": true,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.6,
      "hba1cChange": -0.83,
      "week12Fpg": 115.0,
      "fpgChange": -35.3
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 42 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.4% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 28.2 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-010",
    "name": "Rajesh Verma",
    "age": 38,
    "gender": "Male",
    "email": "rajesh.verma@trialbridge.io",
    "phone": "+91 9800033471",
    "location": "Hyderabad",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-01",
    "enrolledDate": "2026-06-19",
    "aiConfidence": 85.3,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 72.9,
      "bmi": 24.1,
      "baselineHba1c": 7.9,
      "baselineFpg": 173.0,
      "doseMg": 150,
      "cmax": 387.1,
      "tmax": 1.67,
      "auc024": 3122.3,
      "bioavailability": 64.0,
      "vdLkg": 0.42,
      "proteinBinding": 90.9,
      "clearanceLh": 14.45,
      "halfLifeH": 1.47,
      "primaryEnzyme": "CYP2D6",
      "renalExcretion": 34.4,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 27.2,
      "ast": 23.6,
      "hypoglycemiaEvent": true,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 6.4,
      "hba1cChange": -1.48,
      "week12Fpg": 134.0,
      "fpgChange": -39.2
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 38 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.9% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 24.1 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-011",
    "name": "Ramesh Desai",
    "age": 53,
    "gender": "Male",
    "email": "ramesh.desai@trialbridge.io",
    "phone": "+91 9800037190",
    "location": "Chennai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-02",
    "enrolledDate": "2026-07-20",
    "aiConfidence": 89.0,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 72.7,
      "bmi": 26.4,
      "baselineHba1c": 9.0,
      "baselineFpg": 195.0,
      "doseMg": 50,
      "cmax": 129.6,
      "tmax": 2.88,
      "auc024": 955.2,
      "bioavailability": 74.9,
      "vdLkg": 0.67,
      "proteinBinding": 96.0,
      "clearanceLh": 13.88,
      "halfLifeH": 2.43,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 34.0,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 36.5,
      "ast": 28.6,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 8.3,
      "hba1cChange": -0.71,
      "week12Fpg": 163.0,
      "fpgChange": -31.9
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 53 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 9.0% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 26.4 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-012",
    "name": "Suresh Kumar",
    "age": 69,
    "gender": "Male",
    "email": "suresh.kumar@trialbridge.io",
    "phone": "+91 9800040909",
    "location": "Bangalore",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-03",
    "enrolledDate": "2026-08-21",
    "aiConfidence": 92.7,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 61.3,
      "bmi": 25.5,
      "baselineHba1c": 8.5,
      "baselineFpg": 147.0,
      "doseMg": 150,
      "cmax": 238.1,
      "tmax": 2.4,
      "auc024": 1895.7,
      "bioavailability": 62.8,
      "vdLkg": 0.84,
      "proteinBinding": 74.8,
      "clearanceLh": 15.76,
      "halfLifeH": 2.26,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 56.6,
      "dominantRoute": "Renal-dominant",
      "alt": 15.0,
      "ast": 14.2,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Moderate",
      "week12Hba1c": 7.7,
      "hba1cChange": -0.82,
      "week12Fpg": 124.0,
      "fpgChange": -22.5
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 69 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.5% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 25.5 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-013",
    "name": "Manoj Krishnan",
    "age": 60,
    "gender": "Male",
    "email": "manoj.krishnan@trialbridge.io",
    "phone": "+91 9800044628",
    "location": "Mumbai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-04",
    "enrolledDate": "2026-06-22",
    "aiConfidence": 96.4,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 84.8,
      "bmi": 33.5,
      "baselineHba1c": 9.3,
      "baselineFpg": 149.0,
      "doseMg": 150,
      "cmax": 235.7,
      "tmax": 1.04,
      "auc024": 2131.4,
      "bioavailability": 67.2,
      "vdLkg": 0.69,
      "proteinBinding": 62.5,
      "clearanceLh": 10.44,
      "halfLifeH": 3.88,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 45.7,
      "dominantRoute": "Renal-dominant",
      "alt": 21.0,
      "ast": 13.8,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 8.2,
      "hba1cChange": -1.06,
      "week12Fpg": 119.0,
      "fpgChange": -29.8
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 60 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 9.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 33.5 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-014",
    "name": "Deepak Joshi",
    "age": 61,
    "gender": "Male",
    "email": "deepak.joshi@trialbridge.io",
    "phone": "+91 9800048347",
    "location": "Delhi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-05",
    "enrolledDate": "2026-07-23",
    "aiConfidence": 85.1,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 71.4,
      "bmi": 24.4,
      "baselineHba1c": 8.3,
      "baselineFpg": 111.0,
      "doseMg": 150,
      "cmax": 265.8,
      "tmax": 3.24,
      "auc024": 1759.9,
      "bioavailability": 61.5,
      "vdLkg": 1.04,
      "proteinBinding": 75.5,
      "clearanceLh": 10.69,
      "halfLifeH": 4.81,
      "primaryEnzyme": "Non-CYP/Renal",
      "renalExcretion": 35.1,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 18.0,
      "ast": 14.3,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 6.9,
      "hba1cChange": -1.4,
      "week12Fpg": 71.0,
      "fpgChange": -39.9
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 61 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 24.4 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-015",
    "name": "Lakshmi Bhat",
    "age": 60,
    "gender": "Female",
    "email": "lakshmi.bhat@trialbridge.io",
    "phone": "+91 9800052066",
    "location": "Hyderabad",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-06",
    "enrolledDate": "2026-08-24",
    "aiConfidence": 88.8,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 78.2,
      "bmi": 25.2,
      "baselineHba1c": 7.3,
      "baselineFpg": 161.0,
      "doseMg": 150,
      "cmax": 239.6,
      "tmax": 2.02,
      "auc024": 2219.9,
      "bioavailability": 60.5,
      "vdLkg": 1.3,
      "proteinBinding": 75.7,
      "clearanceLh": 10.56,
      "halfLifeH": 6.67,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 38.0,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 16.8,
      "ast": 24.0,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Moderate",
      "week12Hba1c": 5.9,
      "hba1cChange": -1.44,
      "week12Fpg": 144.0,
      "fpgChange": -17.3
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 60 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 25.2 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-016",
    "name": "Anand Menon",
    "age": 62,
    "gender": "Male",
    "email": "anand.menon@trialbridge.io",
    "phone": "+91 9800055785",
    "location": "Chennai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-07",
    "enrolledDate": "2026-06-25",
    "aiConfidence": 92.5,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 84.7,
      "bmi": 24.5,
      "baselineHba1c": 7.2,
      "baselineFpg": 138.0,
      "doseMg": 150,
      "cmax": 297.3,
      "tmax": 2.07,
      "auc024": 2334.8,
      "bioavailability": 55.0,
      "vdLkg": 0.66,
      "proteinBinding": 76.5,
      "clearanceLh": 14.37,
      "halfLifeH": 2.7,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 35.5,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 21.4,
      "ast": 30.7,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 5.9,
      "hba1cChange": -1.32,
      "week12Fpg": 125.0,
      "fpgChange": -13.0
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 62 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.2% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 24.5 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-017",
    "name": "Meera Pillai",
    "age": 52,
    "gender": "Female",
    "email": "meera.pillai@trialbridge.io",
    "phone": "+91 9800059504",
    "location": "Bangalore",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-08",
    "enrolledDate": "2026-07-26",
    "aiConfidence": 96.2,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 84.3,
      "bmi": 23.4,
      "baselineHba1c": 9.4,
      "baselineFpg": 152.0,
      "doseMg": 100,
      "cmax": 230.9,
      "tmax": 1.64,
      "auc024": 2280.7,
      "bioavailability": 65.9,
      "vdLkg": 0.73,
      "proteinBinding": 69.1,
      "clearanceLh": 16.5,
      "halfLifeH": 2.59,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 32.6,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 35.4,
      "ast": 19.0,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 8.5,
      "hba1cChange": -0.88,
      "week12Fpg": 126.0,
      "fpgChange": -26.1
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 52 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 9.4% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 23.4 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-018",
    "name": "Sunita Choudhury",
    "age": 39,
    "gender": "Female",
    "email": "sunita.choudhury@trialbridge.io",
    "phone": "+91 9800063223",
    "location": "Mumbai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-09",
    "enrolledDate": "2026-08-27",
    "aiConfidence": 84.9,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 87.3,
      "bmi": 29.5,
      "baselineHba1c": 9.4,
      "baselineFpg": 143.0,
      "doseMg": 150,
      "cmax": 377.1,
      "tmax": 1.98,
      "auc024": 2121.9,
      "bioavailability": 54.3,
      "vdLkg": 0.95,
      "proteinBinding": 82.6,
      "clearanceLh": 10.62,
      "halfLifeH": 5.41,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 22.0,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 38.7,
      "ast": 8.0,
      "hypoglycemiaEvent": true,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.9,
      "hba1cChange": -1.48,
      "week12Fpg": 123.0,
      "fpgChange": -20.3
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 39 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 9.4% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 29.5 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-019",
    "name": "Naveen Das",
    "age": 64,
    "gender": "Male",
    "email": "naveen.das@trialbridge.io",
    "phone": "+91 9800066942",
    "location": "Delhi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-01",
    "enrolledDate": "2026-06-10",
    "aiConfidence": 88.6,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 76.6,
      "bmi": 30.3,
      "baselineHba1c": 8.1,
      "baselineFpg": 163.0,
      "doseMg": 50,
      "cmax": 98.0,
      "tmax": 2.84,
      "auc024": 740.5,
      "bioavailability": 68.0,
      "vdLkg": 1.22,
      "proteinBinding": 82.2,
      "clearanceLh": 10.73,
      "halfLifeH": 6.04,
      "primaryEnzyme": "CYP2C9",
      "renalExcretion": 33.2,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 21.3,
      "ast": 10.1,
      "hypoglycemiaEvent": true,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.2,
      "hba1cChange": -0.92,
      "week12Fpg": 146.0,
      "fpgChange": -17.1
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 64 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.1% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 30.3 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-020",
    "name": "Pooja Banerjee",
    "age": 50,
    "gender": "Female",
    "email": "pooja.banerjee@trialbridge.io",
    "phone": "+91 9800070661",
    "location": "Hyderabad",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-02",
    "enrolledDate": "2026-07-11",
    "aiConfidence": 92.3,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 72.1,
      "bmi": 32.0,
      "baselineHba1c": 7.9,
      "baselineFpg": 121.0,
      "doseMg": 100,
      "cmax": 108.6,
      "tmax": 2.35,
      "auc024": 703.3,
      "bioavailability": 71.8,
      "vdLkg": 0.66,
      "proteinBinding": 66.0,
      "clearanceLh": 12.94,
      "halfLifeH": 2.55,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 26.0,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 39.2,
      "ast": 16.2,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 6.3,
      "hba1cChange": -1.6,
      "week12Fpg": 103.0,
      "fpgChange": -18.4
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 50 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.9% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 32.0 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-021",
    "name": "Ananya Mehta",
    "age": 52,
    "gender": "Female",
    "email": "ananya.mehta@trialbridge.io",
    "phone": "+91 9800074380",
    "location": "Chennai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-03",
    "enrolledDate": "2026-08-12",
    "aiConfidence": 96.0,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 76.9,
      "bmi": 26.6,
      "baselineHba1c": 9.2,
      "baselineFpg": 128.0,
      "doseMg": 100,
      "cmax": 220.3,
      "tmax": 2.76,
      "auc024": 1654.1,
      "bioavailability": 65.3,
      "vdLkg": 0.95,
      "proteinBinding": 83.6,
      "clearanceLh": 11.26,
      "halfLifeH": 4.5,
      "primaryEnzyme": "CYP2C9",
      "renalExcretion": 20.0,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 24.3,
      "ast": 18.1,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 8.0,
      "hba1cChange": -1.18,
      "week12Fpg": 103.0,
      "fpgChange": -24.6
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 52 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 9.2% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 26.6 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-022",
    "name": "Pradeep Sharma",
    "age": 47,
    "gender": "Male",
    "email": "pradeep.sharma@trialbridge.io",
    "phone": "+91 9800078099",
    "location": "Bangalore",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-04",
    "enrolledDate": "2026-06-13",
    "aiConfidence": 84.7,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 54.4,
      "bmi": 21.0,
      "baselineHba1c": 7.4,
      "baselineFpg": 218.0,
      "doseMg": 150,
      "cmax": 303.2,
      "tmax": 2.79,
      "auc024": 2667.3,
      "bioavailability": 59.4,
      "vdLkg": 1.26,
      "proteinBinding": 94.4,
      "clearanceLh": 14.86,
      "halfLifeH": 3.2,
      "primaryEnzyme": "CYP2C9",
      "renalExcretion": 41.1,
      "dominantRoute": "Renal-dominant",
      "alt": 38.0,
      "ast": 19.1,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Mild",
      "week12Hba1c": 6.3,
      "hba1cChange": -1.06,
      "week12Fpg": 193.0,
      "fpgChange": -24.8
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 47 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.4% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 21.0 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-023",
    "name": "Sachin Reddy",
    "age": 41,
    "gender": "Male",
    "email": "sachin.reddy@trialbridge.io",
    "phone": "+91 9800081818",
    "location": "Mumbai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-05",
    "enrolledDate": "2026-07-14",
    "aiConfidence": 88.4,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 57.7,
      "bmi": 21.5,
      "baselineHba1c": 7.6,
      "baselineFpg": 133.0,
      "doseMg": 100,
      "cmax": 232.6,
      "tmax": 3.56,
      "auc024": 1927.1,
      "bioavailability": 66.1,
      "vdLkg": 0.57,
      "proteinBinding": 79.4,
      "clearanceLh": 5.24,
      "halfLifeH": 4.35,
      "primaryEnzyme": "Non-CYP/Renal",
      "renalExcretion": 39.7,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 23.3,
      "ast": 22.3,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.5,
      "hba1cChange": -0.12,
      "week12Fpg": 107.0,
      "fpgChange": -25.8
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 41 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.6% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 21.5 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-024",
    "name": "Shreya Patel",
    "age": 67,
    "gender": "Female",
    "email": "shreya.patel@trialbridge.io",
    "phone": "+91 9800085537",
    "location": "Delhi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-06",
    "enrolledDate": "2026-08-15",
    "aiConfidence": 92.1,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 59.5,
      "bmi": 22.7,
      "baselineHba1c": 8.7,
      "baselineFpg": 138.0,
      "doseMg": 100,
      "cmax": 276.6,
      "tmax": 2.23,
      "auc024": 2267.0,
      "bioavailability": 59.2,
      "vdLkg": 0.64,
      "proteinBinding": 75.3,
      "clearanceLh": 9.52,
      "halfLifeH": 2.77,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 13.6,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 25.0,
      "ast": 19.8,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.0,
      "hba1cChange": -1.65,
      "week12Fpg": 93.0,
      "fpgChange": -45.2
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 67 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.7% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 22.7 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-025",
    "name": "Vijay Nair",
    "age": 62,
    "gender": "Male",
    "email": "vijay.nair@trialbridge.io",
    "phone": "+91 9800089256",
    "location": "Hyderabad",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-07",
    "enrolledDate": "2026-06-16",
    "aiConfidence": 95.8,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 64.0,
      "bmi": 22.9,
      "baselineHba1c": 7.9,
      "baselineFpg": 211.0,
      "doseMg": 100,
      "cmax": 150.2,
      "tmax": 1.32,
      "auc024": 1248.0,
      "bioavailability": 70.4,
      "vdLkg": 0.82,
      "proteinBinding": 76.9,
      "clearanceLh": 9.65,
      "halfLifeH": 3.77,
      "primaryEnzyme": "Non-CYP/Renal",
      "renalExcretion": 33.5,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 26.9,
      "ast": 29.3,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.4,
      "hba1cChange": -0.51,
      "week12Fpg": 187.0,
      "fpgChange": -23.6
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 62 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.9% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 22.9 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-026",
    "name": "Ganesh Iyer",
    "age": 57,
    "gender": "Male",
    "email": "ganesh.iyer@trialbridge.io",
    "phone": "+91 9800092975",
    "location": "Chennai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-08",
    "enrolledDate": "2026-07-17",
    "aiConfidence": 84.5,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 83.6,
      "bmi": 26.4,
      "baselineHba1c": 8.2,
      "baselineFpg": 238.0,
      "doseMg": 50,
      "cmax": 103.4,
      "tmax": 3.35,
      "auc024": 904.1,
      "bioavailability": 45.5,
      "vdLkg": 0.8,
      "proteinBinding": 82.9,
      "clearanceLh": 5.04,
      "halfLifeH": 9.2,
      "primaryEnzyme": "CYP2C9",
      "renalExcretion": 46.9,
      "dominantRoute": "Renal-dominant",
      "alt": 49.4,
      "ast": 17.3,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.2,
      "hba1cChange": -1.04,
      "week12Fpg": 190.0,
      "fpgChange": -48.3
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 57 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.2% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 26.4 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-027",
    "name": "Mahesh Rao",
    "age": 49,
    "gender": "Male",
    "email": "mahesh.rao@trialbridge.io",
    "phone": "+91 9800096694",
    "location": "Bangalore",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-09",
    "enrolledDate": "2026-08-18",
    "aiConfidence": 88.2,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 65.3,
      "bmi": 22.9,
      "baselineHba1c": 8.1,
      "baselineFpg": 136.0,
      "doseMg": 50,
      "cmax": 116.5,
      "tmax": 2.23,
      "auc024": 849.3,
      "bioavailability": 59.0,
      "vdLkg": 1.06,
      "proteinBinding": 64.2,
      "clearanceLh": 9.11,
      "halfLifeH": 5.27,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 47.7,
      "dominantRoute": "Renal-dominant",
      "alt": 30.8,
      "ast": 16.0,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.2,
      "hba1cChange": -0.94,
      "week12Fpg": 94.0,
      "fpgChange": -41.5
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 49 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.1% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 22.9 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-028",
    "name": "Divya Gupta",
    "age": 63,
    "gender": "Female",
    "email": "divya.gupta@trialbridge.io",
    "phone": "+91 9800100413",
    "location": "Mumbai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-01",
    "enrolledDate": "2026-06-19",
    "aiConfidence": 91.9,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 72.7,
      "bmi": 26.1,
      "baselineHba1c": 8.4,
      "baselineFpg": 156.0,
      "doseMg": 100,
      "cmax": 171.2,
      "tmax": 3.39,
      "auc024": 1600.4,
      "bioavailability": 44.1,
      "vdLkg": 0.95,
      "proteinBinding": 79.3,
      "clearanceLh": 9.25,
      "halfLifeH": 5.18,
      "primaryEnzyme": "CYP2D6",
      "renalExcretion": 47.3,
      "dominantRoute": "Renal-dominant",
      "alt": 18.3,
      "ast": 25.4,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.4,
      "hba1cChange": -1.05,
      "week12Fpg": 140.0,
      "fpgChange": -16.4
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 63 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.4% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 26.1 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-029",
    "name": "Kavita Singh",
    "age": 54,
    "gender": "Female",
    "email": "kavita.singh@trialbridge.io",
    "phone": "+91 9800104132",
    "location": "Delhi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-02",
    "enrolledDate": "2026-07-20",
    "aiConfidence": 95.6,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 96.2,
      "bmi": 38.1,
      "baselineHba1c": 9.2,
      "baselineFpg": 174.0,
      "doseMg": 100,
      "cmax": 236.4,
      "tmax": 2.81,
      "auc024": 2197.4,
      "bioavailability": 48.5,
      "vdLkg": 0.55,
      "proteinBinding": 74.9,
      "clearanceLh": 11.4,
      "halfLifeH": 3.22,
      "primaryEnzyme": "Non-CYP/Renal",
      "renalExcretion": 35.5,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 31.8,
      "ast": 11.3,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 8.3,
      "hba1cChange": -0.92,
      "week12Fpg": 152.0,
      "fpgChange": -21.9
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 54 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 9.2% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 38.1 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-030",
    "name": "Ritu Verma",
    "age": 50,
    "gender": "Female",
    "email": "ritu.verma@trialbridge.io",
    "phone": "+91 9800107851",
    "location": "Hyderabad",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-03",
    "enrolledDate": "2026-08-21",
    "aiConfidence": 84.3,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 73.0,
      "bmi": 31.2,
      "baselineHba1c": 8.3,
      "baselineFpg": 208.0,
      "doseMg": 50,
      "cmax": 108.5,
      "tmax": 2.4,
      "auc024": 972.4,
      "bioavailability": 74.3,
      "vdLkg": 1.0,
      "proteinBinding": 92.8,
      "clearanceLh": 15.34,
      "halfLifeH": 3.3,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 24.9,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 21.1,
      "ast": 24.7,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.1,
      "hba1cChange": -1.16,
      "week12Fpg": 194.0,
      "fpgChange": -14.2
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 50 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 31.2 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-031",
    "name": "Neha Desai",
    "age": 50,
    "gender": "Female",
    "email": "neha.desai@trialbridge.io",
    "phone": "+91 9800111570",
    "location": "Chennai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-04",
    "enrolledDate": "2026-06-22",
    "aiConfidence": 88.0,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 88.3,
      "bmi": 32.8,
      "baselineHba1c": 8.7,
      "baselineFpg": 140.0,
      "doseMg": 100,
      "cmax": 240.0,
      "tmax": 2.78,
      "auc024": 2200.3,
      "bioavailability": 70.1,
      "vdLkg": 0.78,
      "proteinBinding": 76.6,
      "clearanceLh": 11.26,
      "halfLifeH": 4.24,
      "primaryEnzyme": "Non-CYP/Renal",
      "renalExcretion": 22.0,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 20.1,
      "ast": 22.7,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 8.2,
      "hba1cChange": -0.52,
      "week12Fpg": 105.0,
      "fpgChange": -35.3
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 50 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.7% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 32.8 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-032",
    "name": "Sunil Kumar",
    "age": 42,
    "gender": "Male",
    "email": "sunil.kumar@trialbridge.io",
    "phone": "+91 9800115289",
    "location": "Bangalore",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-05",
    "enrolledDate": "2026-07-23",
    "aiConfidence": 91.7,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 64.9,
      "bmi": 23.0,
      "baselineHba1c": 6.8,
      "baselineFpg": 159.0,
      "doseMg": 100,
      "cmax": 208.7,
      "tmax": 4.06,
      "auc024": 1848.2,
      "bioavailability": 55.5,
      "vdLkg": 1.15,
      "proteinBinding": 91.3,
      "clearanceLh": 8.91,
      "halfLifeH": 5.81,
      "primaryEnzyme": "CYP2C9",
      "renalExcretion": 39.1,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 31.3,
      "ast": 21.0,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 5.5,
      "hba1cChange": -1.28,
      "week12Fpg": 113.0,
      "fpgChange": -45.8
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 42 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 6.8% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 23.0 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-033",
    "name": "Swati Krishnan",
    "age": 38,
    "gender": "Female",
    "email": "swati.krishnan@trialbridge.io",
    "phone": "+91 9800119008",
    "location": "Mumbai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-06",
    "enrolledDate": "2026-08-24",
    "aiConfidence": 95.4,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 75.1,
      "bmi": 22.2,
      "baselineHba1c": 8.2,
      "baselineFpg": 184.0,
      "doseMg": 100,
      "cmax": 225.2,
      "tmax": 4.16,
      "auc024": 2464.2,
      "bioavailability": 48.5,
      "vdLkg": 0.77,
      "proteinBinding": 69.2,
      "clearanceLh": 11.83,
      "halfLifeH": 3.39,
      "primaryEnzyme": "CYP2C9",
      "renalExcretion": 39.6,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 24.2,
      "ast": 33.1,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.5,
      "hba1cChange": -0.65,
      "week12Fpg": 149.0,
      "fpgChange": -34.9
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 38 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.2% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 22.2 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-034",
    "name": "Dinesh Joshi",
    "age": 54,
    "gender": "Male",
    "email": "dinesh.joshi@trialbridge.io",
    "phone": "+91 9800122727",
    "location": "Delhi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-07",
    "enrolledDate": "2026-06-25",
    "aiConfidence": 84.1,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 64.7,
      "bmi": 22.7,
      "baselineHba1c": 7.6,
      "baselineFpg": 176.0,
      "doseMg": 100,
      "cmax": 254.7,
      "tmax": 2.56,
      "auc024": 2138.3,
      "bioavailability": 35.3,
      "vdLkg": 0.77,
      "proteinBinding": 82.7,
      "clearanceLh": 15.15,
      "halfLifeH": 2.28,
      "primaryEnzyme": "Non-CYP/Renal",
      "renalExcretion": 50.4,
      "dominantRoute": "Renal-dominant",
      "alt": 26.2,
      "ast": 17.6,
      "hypoglycemiaEvent": true,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 6.2,
      "hba1cChange": -1.36,
      "week12Fpg": 145.0,
      "fpgChange": -30.8
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 54 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.6% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 22.7 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-035",
    "name": "Prakash Bhat",
    "age": 66,
    "gender": "Male",
    "email": "prakash.bhat@trialbridge.io",
    "phone": "+91 9800126446",
    "location": "Hyderabad",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-08",
    "enrolledDate": "2026-07-26",
    "aiConfidence": 87.8,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 73.3,
      "bmi": 23.4,
      "baselineHba1c": 7.3,
      "baselineFpg": 156.0,
      "doseMg": 100,
      "cmax": 211.2,
      "tmax": 2.63,
      "auc024": 1717.4,
      "bioavailability": 57.1,
      "vdLkg": 1.01,
      "proteinBinding": 80.6,
      "clearanceLh": 9.07,
      "halfLifeH": 5.66,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 48.2,
      "dominantRoute": "Renal-dominant",
      "alt": 24.1,
      "ast": 36.4,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 6.2,
      "hba1cChange": -1.12,
      "week12Fpg": 125.0,
      "fpgChange": -31.1
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 66 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 23.4 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-036",
    "name": "Bhavna Menon",
    "age": 37,
    "gender": "Female",
    "email": "bhavna.menon@trialbridge.io",
    "phone": "+91 9800130165",
    "location": "Chennai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-09",
    "enrolledDate": "2026-08-27",
    "aiConfidence": 91.5,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 89.8,
      "bmi": 33.4,
      "baselineHba1c": 7.6,
      "baselineFpg": 162.0,
      "doseMg": 50,
      "cmax": 107.2,
      "tmax": 3.36,
      "auc024": 814.3,
      "bioavailability": 83.8,
      "vdLkg": 1.05,
      "proteinBinding": 71.0,
      "clearanceLh": 9.27,
      "halfLifeH": 7.05,
      "primaryEnzyme": "Non-CYP/Renal",
      "renalExcretion": 33.4,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 26.7,
      "ast": 20.4,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Mild",
      "week12Hba1c": 6.1,
      "hba1cChange": -1.53,
      "week12Fpg": 144.0,
      "fpgChange": -18.4
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 37 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.6% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 33.4 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-037",
    "name": "Ashok Pillai",
    "age": 65,
    "gender": "Male",
    "email": "ashok.pillai@trialbridge.io",
    "phone": "+91 9800133884",
    "location": "Bangalore",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-01",
    "enrolledDate": "2026-06-10",
    "aiConfidence": 95.2,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 53.8,
      "bmi": 21.8,
      "baselineHba1c": 8.0,
      "baselineFpg": 131.0,
      "doseMg": 150,
      "cmax": 354.3,
      "tmax": 1.82,
      "auc024": 2572.7,
      "bioavailability": 65.9,
      "vdLkg": 0.99,
      "proteinBinding": 79.4,
      "clearanceLh": 13.68,
      "halfLifeH": 2.7,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 20.1,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 27.4,
      "ast": 13.1,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Moderate",
      "week12Hba1c": 7.1,
      "hba1cChange": -0.92,
      "week12Fpg": 95.0,
      "fpgChange": -36.3
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 65 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.0% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 21.8 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-038",
    "name": "Archana Choudhury",
    "age": 63,
    "gender": "Female",
    "email": "archana.choudhury@trialbridge.io",
    "phone": "+91 9800137603",
    "location": "Mumbai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-02",
    "enrolledDate": "2026-07-11",
    "aiConfidence": 83.9,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 84.1,
      "bmi": 33.3,
      "baselineHba1c": 8.8,
      "baselineFpg": 159.0,
      "doseMg": 150,
      "cmax": 221.1,
      "tmax": 2.77,
      "auc024": 1549.2,
      "bioavailability": 57.0,
      "vdLkg": 0.56,
      "proteinBinding": 87.7,
      "clearanceLh": 11.34,
      "halfLifeH": 2.88,
      "primaryEnzyme": "CYP2D6",
      "renalExcretion": 31.2,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 8.5,
      "ast": 22.5,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 8.3,
      "hba1cChange": -0.52,
      "week12Fpg": 131.0,
      "fpgChange": -27.8
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 63 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.8% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 33.3 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-039",
    "name": "Geeta Das",
    "age": 44,
    "gender": "Female",
    "email": "geeta.das@trialbridge.io",
    "phone": "+91 9800141322",
    "location": "Delhi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-03",
    "enrolledDate": "2026-08-12",
    "aiConfidence": 87.6,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 81.3,
      "bmi": 31.4,
      "baselineHba1c": 7.3,
      "baselineFpg": 158.0,
      "doseMg": 100,
      "cmax": 178.9,
      "tmax": 2.48,
      "auc024": 1329.8,
      "bioavailability": 66.2,
      "vdLkg": 1.01,
      "proteinBinding": 75.4,
      "clearanceLh": 13.94,
      "halfLifeH": 4.08,
      "primaryEnzyme": "CYP2C9",
      "renalExcretion": 37.6,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 29.3,
      "ast": 14.5,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 6.2,
      "hba1cChange": -1.13,
      "week12Fpg": 114.0,
      "fpgChange": -43.9
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 44 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 31.4 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-040",
    "name": "Rekha Banerjee",
    "age": 57,
    "gender": "Female",
    "email": "rekha.banerjee@trialbridge.io",
    "phone": "+91 9800145041",
    "location": "Hyderabad",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-04",
    "enrolledDate": "2026-06-13",
    "aiConfidence": 91.3,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 69.7,
      "bmi": 19.9,
      "baselineHba1c": 8.2,
      "baselineFpg": 171.0,
      "doseMg": 100,
      "cmax": 175.0,
      "tmax": 2.75,
      "auc024": 1472.7,
      "bioavailability": 48.0,
      "vdLkg": 0.69,
      "proteinBinding": 64.5,
      "clearanceLh": 11.96,
      "halfLifeH": 2.79,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 32.6,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 16.1,
      "ast": 16.7,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.0,
      "hba1cChange": -1.18,
      "week12Fpg": 144.0,
      "fpgChange": -26.6
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 57 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.2% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 19.9 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-041",
    "name": "Sangeeta Mehta",
    "age": 40,
    "gender": "Female",
    "email": "sangeeta.mehta@trialbridge.io",
    "phone": "+91 9800148760",
    "location": "Chennai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-05",
    "enrolledDate": "2026-07-14",
    "aiConfidence": 95.0,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 57.8,
      "bmi": 22.3,
      "baselineHba1c": 7.9,
      "baselineFpg": 151.0,
      "doseMg": 100,
      "cmax": 169.8,
      "tmax": 1.83,
      "auc024": 1511.4,
      "bioavailability": 59.3,
      "vdLkg": 0.95,
      "proteinBinding": 77.9,
      "clearanceLh": 14.1,
      "halfLifeH": 2.7,
      "primaryEnzyme": "CYP2C9",
      "renalExcretion": 28.1,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 12.5,
      "ast": 24.8,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Severe",
      "week12Hba1c": 6.4,
      "hba1cChange": -1.55,
      "week12Fpg": 119.0,
      "fpgChange": -32.0
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 40 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.9% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 22.3 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-042",
    "name": "Shalini Sharma",
    "age": 61,
    "gender": "Female",
    "email": "shalini.sharma@trialbridge.io",
    "phone": "+91 9800152479",
    "location": "Bangalore",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-06",
    "enrolledDate": "2026-08-15",
    "aiConfidence": 83.7,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 79.0,
      "bmi": 25.5,
      "baselineHba1c": 8.0,
      "baselineFpg": 177.0,
      "doseMg": 150,
      "cmax": 335.6,
      "tmax": 1.23,
      "auc024": 2873.2,
      "bioavailability": 62.9,
      "vdLkg": 0.62,
      "proteinBinding": 70.8,
      "clearanceLh": 8.89,
      "halfLifeH": 3.82,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 38.0,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 23.5,
      "ast": 25.9,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 6.8,
      "hba1cChange": -1.19,
      "week12Fpg": 136.0,
      "fpgChange": -41.0
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 61 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.0% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 25.5 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-043",
    "name": "Kishore Reddy",
    "age": 59,
    "gender": "Male",
    "email": "kishore.reddy@trialbridge.io",
    "phone": "+91 9800156198",
    "location": "Mumbai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-07",
    "enrolledDate": "2026-06-16",
    "aiConfidence": 87.4,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 70.6,
      "bmi": 27.6,
      "baselineHba1c": 8.9,
      "baselineFpg": 190.0,
      "doseMg": 100,
      "cmax": 191.6,
      "tmax": 0.84,
      "auc024": 1452.6,
      "bioavailability": 61.2,
      "vdLkg": 0.99,
      "proteinBinding": 75.3,
      "clearanceLh": 11.96,
      "halfLifeH": 4.05,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 29.0,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 24.7,
      "ast": 17.6,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Moderate",
      "week12Hba1c": 7.2,
      "hba1cChange": -1.74,
      "week12Fpg": 155.0,
      "fpgChange": -34.8
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 59 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.9% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 27.6 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-044",
    "name": "Ajay Patel",
    "age": 47,
    "gender": "Male",
    "email": "ajay.patel@trialbridge.io",
    "phone": "+91 9800159917",
    "location": "Delhi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-08",
    "enrolledDate": "2026-07-17",
    "aiConfidence": 91.1,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 81.3,
      "bmi": 26.2,
      "baselineHba1c": 8.6,
      "baselineFpg": 169.0,
      "doseMg": 150,
      "cmax": 300.6,
      "tmax": 1.61,
      "auc024": 2879.8,
      "bioavailability": 69.1,
      "vdLkg": 0.74,
      "proteinBinding": 77.3,
      "clearanceLh": 11.37,
      "halfLifeH": 3.67,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 27.5,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 18.5,
      "ast": 28.9,
      "hypoglycemiaEvent": true,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.1,
      "hba1cChange": -1.47,
      "week12Fpg": 135.0,
      "fpgChange": -34.2
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 47 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.6% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 26.2 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-045",
    "name": "Mohan Nair",
    "age": 37,
    "gender": "Male",
    "email": "mohan.nair@trialbridge.io",
    "phone": "+91 9800163636",
    "location": "Hyderabad",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-09",
    "enrolledDate": "2026-08-18",
    "aiConfidence": 94.8,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 78.3,
      "bmi": 26.8,
      "baselineHba1c": 9.1,
      "baselineFpg": 174.0,
      "doseMg": 100,
      "cmax": 259.5,
      "tmax": 2.13,
      "auc024": 2436.0,
      "bioavailability": 65.1,
      "vdLkg": 0.64,
      "proteinBinding": 64.4,
      "clearanceLh": 8.35,
      "halfLifeH": 4.16,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 38.7,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 30.6,
      "ast": 30.1,
      "hypoglycemiaEvent": false,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 8.1,
      "hba1cChange": -1.01,
      "week12Fpg": 139.0,
      "fpgChange": -35.2
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 37 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 9.1% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 26.8 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-046",
    "name": "Venkat Iyer",
    "age": 68,
    "gender": "Male",
    "email": "venkat.iyer@trialbridge.io",
    "phone": "+91 9800167355",
    "location": "Chennai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-01",
    "enrolledDate": "2026-06-19",
    "aiConfidence": 83.5,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 100.4,
      "bmi": 36.0,
      "baselineHba1c": 8.1,
      "baselineFpg": 166.0,
      "doseMg": 100,
      "cmax": 208.1,
      "tmax": 2.27,
      "auc024": 1729.0,
      "bioavailability": 68.0,
      "vdLkg": 1.04,
      "proteinBinding": 65.1,
      "clearanceLh": 7.31,
      "halfLifeH": 9.9,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 30.2,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 13.3,
      "ast": 32.1,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Mild",
      "week12Hba1c": 7.5,
      "hba1cChange": -0.57,
      "week12Fpg": 155.0,
      "fpgChange": -10.7
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 68 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.1% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 36.0 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-047",
    "name": "Ravi Rao",
    "age": 50,
    "gender": "Male",
    "email": "ravi.rao@trialbridge.io",
    "phone": "+91 9800171074",
    "location": "Bangalore",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-02",
    "enrolledDate": "2026-07-20",
    "aiConfidence": 87.2,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 74.6,
      "bmi": 26.4,
      "baselineHba1c": 7.7,
      "baselineFpg": 165.0,
      "doseMg": 50,
      "cmax": 105.0,
      "tmax": 4.05,
      "auc024": 810.2,
      "bioavailability": 55.8,
      "vdLkg": 0.95,
      "proteinBinding": 81.9,
      "clearanceLh": 14.06,
      "halfLifeH": 3.49,
      "primaryEnzyme": "CYP3A4",
      "renalExcretion": 37.9,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 20.7,
      "ast": 25.7,
      "hypoglycemiaEvent": true,
      "adverseEvent": false,
      "aeSeverity": "None",
      "week12Hba1c": 7.7,
      "hba1cChange": 0.02,
      "week12Fpg": 132.0,
      "fpgChange": -33.2
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 50 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 7.7% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 26.4 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-048",
    "name": "Aisha Gupta",
    "age": 66,
    "gender": "Female",
    "email": "aisha.gupta@trialbridge.io",
    "phone": "+91 9800174793",
    "location": "Mumbai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-03",
    "enrolledDate": "2026-08-21",
    "aiConfidence": 90.9,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 63.7,
      "bmi": 24.3,
      "baselineHba1c": 8.0,
      "baselineFpg": 147.0,
      "doseMg": 150,
      "cmax": 321.9,
      "tmax": 3.38,
      "auc024": 2948.0,
      "bioavailability": 70.1,
      "vdLkg": 0.78,
      "proteinBinding": 73.8,
      "clearanceLh": 10.95,
      "halfLifeH": 3.15,
      "primaryEnzyme": "CYP2D6",
      "renalExcretion": 38.3,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 19.3,
      "ast": 31.5,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Moderate",
      "week12Hba1c": 6.7,
      "hba1cChange": -1.33,
      "week12Fpg": 112.0,
      "fpgChange": -34.9
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 66 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.0% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 24.3 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-049",
    "name": "Santhosh Singh",
    "age": 58,
    "gender": "Male",
    "email": "santhosh.singh@trialbridge.io",
    "phone": "+91 9800178512",
    "location": "Delhi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-04",
    "enrolledDate": "2026-06-22",
    "aiConfidence": 94.6,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 80.5,
      "bmi": 27.2,
      "baselineHba1c": 8.4,
      "baselineFpg": 173.0,
      "doseMg": 50,
      "cmax": 133.6,
      "tmax": 1.73,
      "auc024": 1165.7,
      "bioavailability": 76.7,
      "vdLkg": 1.19,
      "proteinBinding": 57.5,
      "clearanceLh": 8.93,
      "halfLifeH": 7.44,
      "primaryEnzyme": "CYP2D6",
      "renalExcretion": 21.3,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 23.6,
      "ast": 8.8,
      "hypoglycemiaEvent": true,
      "adverseEvent": true,
      "aeSeverity": "Mild",
      "week12Hba1c": 7.9,
      "hba1cChange": -0.53,
      "week12Fpg": 116.0,
      "fpgChange": -57.2
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 58 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.4% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 27.2 \u2014 within safety threshold (< 40)"
      }
    ]
  },
  {
    "id": "PT-050",
    "name": "Gautam Verma",
    "age": 62,
    "gender": "Male",
    "email": "gautam.verma@trialbridge.io",
    "phone": "+91 9800182231",
    "location": "Hyderabad",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "screeningStatus": "approved",
    "consentStatus": "consented",
    "enrollmentStatus": "enrolled",
    "lastActivity": "2026-09-05",
    "enrolledDate": "2026-07-23",
    "aiConfidence": 83.3,
    "screeningReviewed": true,
    "screeningReviewedBy": "Dr. James Patel",
    "clinicalData": {
      "weightKg": 81.1,
      "bmi": 30.2,
      "baselineHba1c": 8.3,
      "baselineFpg": 163.0,
      "doseMg": 100,
      "cmax": 212.3,
      "tmax": 2.78,
      "auc024": 1435.6,
      "bioavailability": 53.3,
      "vdLkg": 0.81,
      "proteinBinding": 84.3,
      "clearanceLh": 11.71,
      "halfLifeH": 3.89,
      "primaryEnzyme": "CYP2D6",
      "renalExcretion": 29.2,
      "dominantRoute": "Hepatic/Biliary-dominant",
      "alt": 26.2,
      "ast": 19.8,
      "hypoglycemiaEvent": false,
      "adverseEvent": true,
      "aeSeverity": "Severe",
      "week12Hba1c": 7.3,
      "hba1cChange": -1.0,
      "week12Fpg": 120.0,
      "fpgChange": -42.7
    },
    "screeningResults": [
      {
        "criterionId": "c1",
        "criterionLabel": "Age",
        "status": "match",
        "detail": "Age 62 \u2014 within range 30-65"
      },
      {
        "criterionId": "c2",
        "criterionLabel": "Condition",
        "status": "match",
        "detail": "Type 2 Diabetes \u2014 confirmed diagnosis"
      },
      {
        "criterionId": "c3",
        "criterionLabel": "HbA1c",
        "status": "match",
        "detail": "Baseline HbA1c 8.3% \u2014 meets inclusion threshold (>= 7.0%)"
      },
      {
        "criterionId": "c4",
        "criterionLabel": "eGFR",
        "status": "match",
        "detail": "Renal filtration verified (eGFR >= 45 mL/min)"
      },
      {
        "criterionId": "c5",
        "criterionLabel": "BMI",
        "status": "match",
        "detail": "BMI 30.2 \u2014 within safety threshold (< 40)"
      }
    ]
  }
];

export const visits: Visit[] = [
  {
    "id": "v-PT-001",
    "participantId": "PT-001",
    "participantName": "Rahul Mehta",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-10",
    "time": "9:00 AM",
    "location": "City Hospital, Chennai",
    "coordinator": "Maya Rodriguez",
    "type": "Baseline Screening",
    "status": "completed"
  },
  {
    "id": "v-PT-002",
    "participantId": "PT-002",
    "participantName": "Karthik Sharma",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-11",
    "time": "10:00 AM",
    "location": "City Hospital, Bangalore",
    "coordinator": "Maya Rodriguez",
    "type": "Week 8 Follow-up",
    "status": "completed"
  },
  {
    "id": "v-PT-003",
    "participantId": "PT-003",
    "participantName": "Arjun Reddy",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-12",
    "time": "11:00 AM",
    "location": "City Hospital, Mumbai",
    "coordinator": "Maya Rodriguez",
    "type": "Week 12 Follow-up",
    "status": "completed"
  },
  {
    "id": "v-PT-004",
    "participantId": "PT-004",
    "participantName": "Vikram Patel",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-13",
    "time": "12:00 AM",
    "location": "City Hospital, Delhi",
    "coordinator": "Maya Rodriguez",
    "type": "Week 12 Final",
    "status": "completed"
  },
  {
    "id": "v-PT-005",
    "participantId": "PT-005",
    "participantName": "Aisha Nair",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-14",
    "time": "13:00 AM",
    "location": "City Hospital, Hyderabad",
    "coordinator": "Maya Rodriguez",
    "type": "Baseline Screening",
    "status": "completed"
  },
  {
    "id": "v-PT-006",
    "participantId": "PT-006",
    "participantName": "Priya Iyer",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-15",
    "time": "14:00 AM",
    "location": "City Hospital, Chennai",
    "coordinator": "Maya Rodriguez",
    "type": "Week 8 Follow-up",
    "status": "completed"
  },
  {
    "id": "v-PT-007",
    "participantId": "PT-007",
    "participantName": "Deepa Rao",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-16",
    "time": "9:00 AM",
    "location": "City Hospital, Bangalore",
    "coordinator": "Maya Rodriguez",
    "type": "Week 12 Follow-up",
    "status": "completed"
  },
  {
    "id": "v-PT-008",
    "participantId": "PT-008",
    "participantName": "Sanjay Gupta",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-17",
    "time": "10:00 AM",
    "location": "City Hospital, Mumbai",
    "coordinator": "Maya Rodriguez",
    "type": "Week 12 Final",
    "status": "completed"
  },
  {
    "id": "v-PT-009",
    "participantId": "PT-009",
    "participantName": "Amit Singh",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-18",
    "time": "11:00 AM",
    "location": "City Hospital, Delhi",
    "coordinator": "Maya Rodriguez",
    "type": "Baseline Screening",
    "status": "completed"
  },
  {
    "id": "v-PT-010",
    "participantId": "PT-010",
    "participantName": "Rajesh Verma",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-19",
    "time": "12:00 AM",
    "location": "City Hospital, Hyderabad",
    "coordinator": "Maya Rodriguez",
    "type": "Week 8 Follow-up",
    "status": "completed"
  },
  {
    "id": "v-PT-011",
    "participantId": "PT-011",
    "participantName": "Ramesh Desai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-20",
    "time": "13:00 AM",
    "location": "City Hospital, Chennai",
    "coordinator": "Maya Rodriguez",
    "type": "Week 12 Follow-up",
    "status": "completed"
  },
  {
    "id": "v-PT-012",
    "participantId": "PT-012",
    "participantName": "Suresh Kumar",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-21",
    "time": "14:00 AM",
    "location": "City Hospital, Bangalore",
    "coordinator": "Maya Rodriguez",
    "type": "Week 12 Final",
    "status": "completed"
  },
  {
    "id": "v-PT-013",
    "participantId": "PT-013",
    "participantName": "Manoj Krishnan",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-22",
    "time": "9:00 AM",
    "location": "City Hospital, Mumbai",
    "coordinator": "Maya Rodriguez",
    "type": "Baseline Screening",
    "status": "completed"
  },
  {
    "id": "v-PT-014",
    "participantId": "PT-014",
    "participantName": "Deepak Joshi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-23",
    "time": "10:00 AM",
    "location": "City Hospital, Delhi",
    "coordinator": "Maya Rodriguez",
    "type": "Week 8 Follow-up",
    "status": "completed"
  },
  {
    "id": "v-PT-015",
    "participantId": "PT-015",
    "participantName": "Lakshmi Bhat",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-24",
    "time": "11:00 AM",
    "location": "City Hospital, Hyderabad",
    "coordinator": "Maya Rodriguez",
    "type": "Week 12 Follow-up",
    "status": "completed"
  },
  {
    "id": "v-PT-016",
    "participantId": "PT-016",
    "participantName": "Anand Menon",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-10",
    "time": "12:00 AM",
    "location": "City Hospital, Chennai",
    "coordinator": "Maya Rodriguez",
    "type": "Week 12 Final",
    "status": "completed"
  },
  {
    "id": "v-PT-017",
    "participantId": "PT-017",
    "participantName": "Meera Pillai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-11",
    "time": "13:00 AM",
    "location": "City Hospital, Bangalore",
    "coordinator": "Maya Rodriguez",
    "type": "Baseline Screening",
    "status": "completed"
  },
  {
    "id": "v-PT-018",
    "participantId": "PT-018",
    "participantName": "Sunita Choudhury",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-12",
    "time": "14:00 AM",
    "location": "City Hospital, Mumbai",
    "coordinator": "Maya Rodriguez",
    "type": "Week 8 Follow-up",
    "status": "completed"
  },
  {
    "id": "v-PT-019",
    "participantId": "PT-019",
    "participantName": "Naveen Das",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-13",
    "time": "9:00 AM",
    "location": "City Hospital, Delhi",
    "coordinator": "Maya Rodriguez",
    "type": "Week 12 Follow-up",
    "status": "completed"
  },
  {
    "id": "v-PT-020",
    "participantId": "PT-020",
    "participantName": "Pooja Banerjee",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "date": "2026-09-14",
    "time": "10:00 AM",
    "location": "City Hospital, Hyderabad",
    "coordinator": "Maya Rodriguez",
    "type": "Week 12 Final",
    "status": "completed"
  }
];

export const tasks: Task[] = [
  {
    "id": "t1",
    "title": "Week 12 HbA1c Lab Verification",
    "type": "data_verification",
    "participantId": "PT-001",
    "participantName": "Rahul Mehta",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "dueDate": "2026-09-12",
    "dueTime": "10:00 AM",
    "priority": "high",
    "status": "in_progress",
    "assignee": "Maya Rodriguez"
  },
  {
    "id": "t2",
    "title": "C4H11N5 PK Sampling Coordination",
    "type": "visit_preparation",
    "participantId": "PT-002",
    "participantName": "Karthik Sharma",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "dueDate": "2026-09-11",
    "dueTime": "11:30 AM",
    "priority": "high",
    "status": "pending",
    "assignee": "Maya Rodriguez"
  },
  {
    "id": "t3",
    "title": "Renal Excretion & Safety Review (PT-004 Mild AE)",
    "type": "eligibility_review",
    "participantId": "PT-004",
    "participantName": "Vikram Patel",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "dueDate": "2026-09-10",
    "dueTime": "2:00 PM",
    "priority": "high",
    "status": "pending",
    "assignee": "Dr. James Patel"
  },
  {
    "id": "t4",
    "title": "Moderate AE Review: Renal Clearance Protocol",
    "type": "eligibility_review",
    "participantId": "PT-012",
    "participantName": "Suresh Kumar",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "dueDate": "2026-09-10",
    "dueTime": "3:30 PM",
    "priority": "high",
    "status": "pending",
    "assignee": "Dr. James Patel"
  },
  {
    "id": "t5",
    "title": "Dose 150mg Cohort PK Data Audit",
    "type": "document_review",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "dueDate": "2026-09-14",
    "dueTime": "4:00 PM",
    "priority": "medium",
    "status": "pending",
    "assignee": "Dr. James Patel"
  },
  {
    "id": "t6",
    "title": "Hypoglycemia Event Follow-up (PT-009)",
    "type": "participant_followup",
    "participantId": "PT-009",
    "participantName": "Amit Singh",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "dueDate": "2026-09-11",
    "dueTime": "1:00 PM",
    "priority": "medium",
    "status": "pending",
    "assignee": "Maya Rodriguez"
  }
];

export const consentRecords: ConsentRecord[] = [
  {
    "id": "cr-PT-001",
    "participantId": "PT-001",
    "participantName": "Rahul Mehta",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-002",
    "participantId": "PT-002",
    "participantName": "Karthik Sharma",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-003",
    "participantId": "PT-003",
    "participantName": "Arjun Reddy",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-004",
    "participantId": "PT-004",
    "participantName": "Vikram Patel",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-005",
    "participantId": "PT-005",
    "participantName": "Aisha Nair",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-006",
    "participantId": "PT-006",
    "participantName": "Priya Iyer",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-007",
    "participantId": "PT-007",
    "participantName": "Deepa Rao",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-008",
    "participantId": "PT-008",
    "participantName": "Sanjay Gupta",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-009",
    "participantId": "PT-009",
    "participantName": "Amit Singh",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-010",
    "participantId": "PT-010",
    "participantName": "Rajesh Verma",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-011",
    "participantId": "PT-011",
    "participantName": "Ramesh Desai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-012",
    "participantId": "PT-012",
    "participantName": "Suresh Kumar",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-013",
    "participantId": "PT-013",
    "participantName": "Manoj Krishnan",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-014",
    "participantId": "PT-014",
    "participantName": "Deepak Joshi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-015",
    "participantId": "PT-015",
    "participantName": "Lakshmi Bhat",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-016",
    "participantId": "PT-016",
    "participantName": "Anand Menon",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-017",
    "participantId": "PT-017",
    "participantName": "Meera Pillai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-018",
    "participantId": "PT-018",
    "participantName": "Sunita Choudhury",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-019",
    "participantId": "PT-019",
    "participantName": "Naveen Das",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-020",
    "participantId": "PT-020",
    "participantName": "Pooja Banerjee",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-021",
    "participantId": "PT-021",
    "participantName": "Ananya Mehta",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-022",
    "participantId": "PT-022",
    "participantName": "Pradeep Sharma",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-023",
    "participantId": "PT-023",
    "participantName": "Sachin Reddy",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-024",
    "participantId": "PT-024",
    "participantName": "Shreya Patel",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-025",
    "participantId": "PT-025",
    "participantName": "Vijay Nair",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-026",
    "participantId": "PT-026",
    "participantName": "Ganesh Iyer",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-027",
    "participantId": "PT-027",
    "participantName": "Mahesh Rao",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-028",
    "participantId": "PT-028",
    "participantName": "Divya Gupta",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-029",
    "participantId": "PT-029",
    "participantName": "Kavita Singh",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-030",
    "participantId": "PT-030",
    "participantName": "Ritu Verma",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-031",
    "participantId": "PT-031",
    "participantName": "Neha Desai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-032",
    "participantId": "PT-032",
    "participantName": "Sunil Kumar",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-033",
    "participantId": "PT-033",
    "participantName": "Swati Krishnan",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-034",
    "participantId": "PT-034",
    "participantName": "Dinesh Joshi",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-035",
    "participantId": "PT-035",
    "participantName": "Prakash Bhat",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-036",
    "participantId": "PT-036",
    "participantName": "Bhavna Menon",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-037",
    "participantId": "PT-037",
    "participantName": "Ashok Pillai",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-038",
    "participantId": "PT-038",
    "participantName": "Archana Choudhury",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-039",
    "participantId": "PT-039",
    "participantName": "Geeta Das",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-040",
    "participantId": "PT-040",
    "participantName": "Rekha Banerjee",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-041",
    "participantId": "PT-041",
    "participantName": "Sangeeta Mehta",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-042",
    "participantId": "PT-042",
    "participantName": "Shalini Sharma",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-043",
    "participantId": "PT-043",
    "participantName": "Kishore Reddy",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-044",
    "participantId": "PT-044",
    "participantName": "Ajay Patel",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-045",
    "participantId": "PT-045",
    "participantName": "Mohan Nair",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-046",
    "participantId": "PT-046",
    "participantName": "Venkat Iyer",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-047",
    "participantId": "PT-047",
    "participantName": "Ravi Rao",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-048",
    "participantId": "PT-048",
    "participantName": "Aisha Gupta",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-049",
    "participantId": "PT-049",
    "participantName": "Santhosh Singh",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  },
  {
    "id": "cr-PT-050",
    "participantId": "PT-050",
    "participantName": "Gautam Verma",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "consentVersion": "v2.1 (C4H11N5)",
    "dateSent": "2026-06-01",
    "dateViewed": "2026-06-02",
    "dateSigned": "2026-06-05",
    "researcher": "Dr. James Patel",
    "status": "consented"
  }
];

export const documents: Document[] = [
  {
    "id": "d1",
    "name": "C4H11N5_Phase3_Clinical_Protocol_v3.2.pdf",
    "type": "PDF",
    "category": "Study Protocol",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "uploadedBy": "Dr. James Patel",
    "date": "2026-06-01",
    "status": "active",
    "size": "3.8 MB"
  },
  {
    "id": "d2",
    "name": "Informed_Consent_C4H11N5_v2.1.pdf",
    "type": "PDF",
    "category": "Consent Forms",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "uploadedBy": "Maya Rodriguez",
    "date": "2026-06-05",
    "status": "active",
    "size": "1.4 MB"
  },
  {
    "id": "d3",
    "name": "Cohort_PK_PD_Analysis_Dataset_PT001_PT050.csv",
    "type": "CSV",
    "category": "Research Documents",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "uploadedBy": "Dr. James Patel",
    "date": "2026-09-09",
    "status": "active",
    "size": "48.2 KB"
  },
  {
    "id": "d4",
    "name": "Renal_Clearance_Safety_Report_OCT2.pdf",
    "type": "PDF",
    "category": "Study Protocol",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "uploadedBy": "Dr. James Patel",
    "date": "2026-08-28",
    "status": "active",
    "size": "2.1 MB"
  },
  {
    "id": "d5",
    "name": "Adverse_Events_Safety_Monitoring_Report.pdf",
    "type": "PDF",
    "category": "Participant Documents",
    "studyId": "ST-001",
    "studyName": "Type 2 Diabetes Study (C4H11N5 Renal Dynamics)",
    "uploadedBy": "Maya Rodriguez",
    "date": "2026-09-08",
    "status": "active",
    "size": "1.2 MB"
  }
];

export const messages: Message[] = [
  { id: 'm1', from: 'Dr. James Patel', fromRole: 'PRINCIPAL_INVESTIGATOR', to: 'Maya Rodriguez', toRole: 'RESEARCH_COORDINATOR', subject: 'PT-001 Week 12 Results Approved', preview: 'PT-001 achieved -1.02% HbA1c reduction and normal renal clearance...', body: 'I have verified PT-001 12-week clinical parameters. Fasting plasma glucose declined from 138 to 104 mg/dL with 51.3% renal excretion and zero adverse events.', date: '2026-09-09', time: '9:30 AM', read: false, type: 'eligibility_review' },
  { id: 'm2', from: 'System', fromRole: 'PLATFORM_ADMIN', to: 'Maya Rodriguez', toRole: 'RESEARCH_COORDINATOR', subject: 'Visit Reminder: PT-002', preview: 'Reminder: 100mg cohort follow-up visit scheduled...', body: 'Automated reminder: PT-002 follow-up visit scheduled at City Hospital. Review Cmax and liver enzymes (ALT/AST).', date: '2026-09-09', time: '8:00 AM', read: false, type: 'visit_reminder' },
  { id: 'm3', from: 'Maya Rodriguez', fromRole: 'RESEARCH_COORDINATOR', to: 'Dr. James Patel', toRole: 'PRINCIPAL_INVESTIGATOR', subject: '50-Patient PK/PD Dataset Ready', preview: 'All 50 participants data synced with glycemic and renal clearance endpoints...', body: 'Dear Dr. Patel, all 50 participants (PT-001 through PT-050) have completed baseline and pharmacokinetic evaluation across 50mg, 100mg, and 150mg cohorts. Reports dashboard updated.', date: '2026-09-08', time: '3:00 PM', read: true, type: 'study_update' },
  { id: 'm4', from: 'Dr. James Patel', fromRole: 'PRINCIPAL_INVESTIGATOR', to: 'Maya Rodriguez', toRole: 'RESEARCH_COORDINATOR', subject: 'Safety Audit: Hypoglycemia & AE Review', preview: 'Please confirm safety logs for 8 mild hypoglycemia cases...', body: 'Review the 8 reported hypoglycemia episodes and 12 reported AEs. Verify all mild/moderate cases are stable with normal eGFR.', date: '2026-09-07', time: '2:15 PM', read: true, type: 'task_assignment' },
  { id: 'm5', from: 'Michael Torres', fromRole: 'ORGANIZATION', to: 'Dr. James Patel', toRole: 'PRINCIPAL_INVESTIGATOR', subject: 'Quarterly Sponsor Review (C4H11N5 Cohorts)', preview: 'Sponsor review for Type 2 Diabetes study scheduled...', body: 'Dear Dr. Patel, sponsor review is confirmed. Please present dose-dependent HbA1c reductions and renal clearance safety data from the 50 participants.', date: '2026-09-06', time: '11:00 AM', read: true, type: 'study_update' },
];

export const auditLogs: AuditLog[] = [
  { id: 'al1', action: 'Cohort PK/PD data imported', user: 'Dr. James Patel', userRole: 'PRINCIPAL_INVESTIGATOR', target: '50 Participants (PT-001 - PT-050)', timestamp: '2026-09-09 14:32', category: 'study' },
  { id: 'al2', action: 'Renal excretion verification', user: 'Maya Rodriguez', userRole: 'RESEARCH_COORDINATOR', target: 'C4H11N5 Clearance Safety Logs', timestamp: '2026-09-09 11:15', category: 'screening' },
  { id: 'al3', action: 'Week 12 endpoint analyzed', user: 'Dr. James Patel', userRole: 'PRINCIPAL_INVESTIGATOR', target: 'Mean HbA1c Reduction -1.06%', timestamp: '2026-09-08 16:45', category: 'participant' },
  { id: 'al4', action: 'Consent forms verified', user: 'Maya Rodriguez', userRole: 'RESEARCH_COORDINATOR', target: '50 Consented Records', timestamp: '2026-09-08 10:20', category: 'document' },
  { id: 'al5', action: 'Dose cohort balancing', user: 'Dr. James Patel', userRole: 'PRINCIPAL_INVESTIGATOR', target: '50mg (12), 100mg (24), 150mg (14)', timestamp: '2026-09-07 15:30', category: 'study' },
];

export const recentActivity: Activity[] = [
  { id: 'a1', action: 'Clinical data synced', user: 'Dr. James Patel', target: '50 Participants Dataset (C4H11N5)', timestamp: '1 hour ago', type: 'study' },
  { id: 'a2', action: 'PK analytics computed', user: 'System', target: 'Cmax & AUC Dose Response', timestamp: '3 hours ago', type: 'screening' },
  { id: 'a3', action: 'Safety monitoring report generated', user: 'Maya Rodriguez', target: 'AE & Hypoglycemia Incidence', timestamp: '5 hours ago', type: 'participant' },
  { id: 'a4', action: 'Renal dynamics updated', user: 'Dr. James Patel', target: 'Kidney Clearance OCT2 Model', timestamp: '1 day ago', type: 'study' },
];

export const userGrowthData = [
  { month: 'Mar', users: 120, participants: 15 },
  { month: 'Apr', users: 145, participants: 25 },
  { month: 'May', users: 178, participants: 35 },
  { month: 'Jun', users: 210, participants: 42 },
  { month: 'Jul', users: 245, participants: 46 },
  { month: 'Aug', users: 289, participants: 48 },
  { month: 'Sep', users: 312, participants: 50 },
];

export const enrollmentTrendData = [
  { month: 'Mar', enrolled: 15, target: 20 },
  { month: 'Apr', enrolled: 25, target: 30 },
  { month: 'May', enrolled: 35, target: 40 },
  { month: 'Jun', enrolled: 42, target: 50 },
  { month: 'Jul', enrolled: 46, target: 55 },
  { month: 'Aug', enrolled: 48, target: 60 },
  { month: 'Sep', enrolled: 50, target: 60 },
];

export const recruitmentFunnelData = [
  { stage: 'Candidates', count: 65, fill: '#DBEAFE' },
  { stage: 'Screening', count: 58, fill: '#BFDBFE' },
  { stage: 'Potentially Eligible', count: 54, fill: '#93C5FD' },
  { stage: 'Human Review', count: 52, fill: '#60A5FA' },
  { stage: 'Consented', count: 50, fill: '#3B82F6' },
  { stage: 'Enrolled', count: 50, fill: '#2563EB' },
];

export const sitePerformanceData = [
  { site: 'City Hospital (Chennai)', rate: 94, participants: 50 },
];

export const trialPerformanceData = [
  { trial: 'Type 2 Diabetes Study (C4H11N5)', enrolled: 50, target: 60 },
];

export const studyPerformanceData = [
  { study: 'Type 2 Diabetes Study (C4H11N5)', progress: 83 },
];

export const consentConversionData = [
  { month: 'Apr', sent: 15, signed: 12 },
  { month: 'May', sent: 20, signed: 18 },
  { month: 'Jun', sent: 25, signed: 22 },
  { month: 'Jul', sent: 12, signed: 11 },
  { month: 'Aug', sent: 8, signed: 7 },
  { month: 'Sep', sent: 5, signed: 5 },
];

export const retentionData = [
  { month: 'Month 1', retained: 100 },
  { month: 'Month 2', retained: 98 },
  { month: 'Month 3', retained: 96 },
  { month: 'Month 4', retained: 96 },
  { month: 'Month 5', retained: 94 },
  { month: 'Month 6', retained: 94 },
];

export const recruitmentTrendData = [
  { week: 'W1', candidates: 12, enrolled: 4 },
  { week: 'W2', candidates: 18, enrolled: 8 },
  { week: 'W3', candidates: 22, enrolled: 14 },
  { week: 'W4', candidates: 30, enrolled: 22 },
  { week: 'W5', candidates: 38, enrolled: 31 },
  { week: 'W6', candidates: 45, enrolled: 39 },
  { week: 'W7', candidates: 52, enrolled: 45 },
  { week: 'W8', candidates: 65, enrolled: 50 },
];

export const anatomyData: Record<string, { organ: string; description: string; structures: { name: string; description: string; relevant: boolean }[] }> = {
  Kidneys: {
    organ: 'Kidneys',
    description: 'The kidneys are essential bean-shaped organs responsible for filtration of waste and blood pressure regulation. In Type 2 Diabetes trials with C4H11N5 (Metformin), the kidneys are the affected elimination organ and are highlighted in red.',
    structures: [
      { name: 'Renal Cortex', description: 'Outer functional filtration zone containing glomeruli and convoluted tubules.', relevant: true },
      { name: 'Renal Medulla', description: 'Internal pyramid region facilitating urine concentration and tubular transport.', relevant: true },
      { name: 'Renal Pelvis', description: 'Central collecting funnel channeling filtrate to the ureter.', relevant: true },
      { name: 'Renal Vasculature', description: 'Arterial input delivering systemic C4H11N5 for rapid clearance.', relevant: true },
    ],
  },
  Pancreas: {
    organ: 'Pancreas',
    description: 'The pancreas produces insulin and digestive enzymes. In Type 2 Diabetes, impaired insulin secretion and peripheral insulin resistance lead to metabolic dysregulation, impacting secondary filtration organs.',
    structures: [
      { name: 'Pancreatic Head', description: 'Duodenal contact zone involved in exocrine drainage.', relevant: false },
      { name: 'Pancreatic Body', description: 'Central islet concentration responsible for baseline insulin secretion.', relevant: true },
      { name: 'Islets of Langerhans', description: 'Clusters containing beta-cells targeted by glycemic regulation.', relevant: true }
    ],
  },
};
