export interface DoctorProfile {
  id: string;
  license_number: string;
  specialization: string;
  hospital: string;
  consultation_room: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'DOCTOR' | 'HOSPITAL_ADMIN';
  department?: string;
  is_active?: boolean;
  doctor_profile?: DoctorProfile;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Patient {
  id: string;
  patient_id: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  blood_group?: string;
  allergies?: string;
  existing_conditions?: string;
  current_medications?: string;
  emergency_contact?: string;
  total_consultations?: number;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  speaker: 'Doctor' | 'Patient';
  text: string;
  timestamp: string;
}

export interface Transcript {
  id: string;
  consultation_id: string;
  original_transcript: string;
  normalized_clinical_text: string;
  normalized_transcript?: string;
  clinical_summary?: string;
  detected_language: string;
  segments: TranscriptSegment[];
  created_at: string;
}

export interface ClinicalExtraction {
  id: string;
  consultation_id: string;
  chief_complaint?: string;
  symptoms: string[];
  symptom_duration?: string;
  symptom_severity?: string;
  history_of_present_illness?: string;
  past_medical_history?: string;
  allergies?: string;
  current_medications?: string;
  family_history?: string;
  social_history?: string;
  vitals: Record<string, any>;
  examination_findings?: string;
  investigations_mentioned: string[];
  medications_mentioned: string[];
  important_warnings: string[];
  unanswered_questions: string[];
  created_at: string;
}

export interface SOAPNote {
  id: string;
  consultation_id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  is_ai_draft: boolean;
  disclaimer: string;
  doctor_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DiagnosisSuggestion {
  id: string;
  consultation_id: string;
  condition: string;
  reason: string;
  confidence: 'High' | 'Moderate' | 'Low' | string;
  source?: string;
  status: 'SUGGESTED' | 'ACCEPTED' | 'REJECTED' | 'MODIFIED' | string;
  created_at: string;
}

export interface InvestigationSuggestion {
  id: string;
  consultation_id: string;
  name: string;
  reason: string;
  source?: string;
  status: 'RECOMMENDED' | 'ORDERED' | 'OMITTED' | string;
  created_at: string;
}

export interface PrescriptionItem {
  id?: string;
  prescription_id?: string;
  medication_name: string;
  strength: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions?: string;
  is_approved: boolean;
}

export interface Prescription {
  id: string;
  consultation_id: string;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | string;
  disclaimer: string;
  general_instructions?: string;
  doctor_signature?: string;
  items: PrescriptionItem[];
  created_at: string;
  updated_at: string;
}

export interface ICDSuggestion {
  id: string;
  consultation_id: string;
  code: string;
  description: string;
  reason: string;
  status: 'SUGGESTED' | 'ACCEPTED' | 'REJECTED' | string;
  created_at: string;
}

export interface Approval {
  id: string;
  consultation_id: string;
  doctor_name: string;
  doctor_license: string;
  doctor_notes?: string;
  signature_hash: string;
  approved_at: string;
}

export interface Consultation {
  id: string;
  consultation_id: string;
  patient_id: string;
  doctor_id?: string;
  status: 'RECORDING' | 'PROCESSING' | 'AI_DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  conversation_language: string;
  output_language: string;
  detected_language: string;
  duration_seconds: number;
  is_demo: boolean;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;

  // Joined fields in ConsultationDetail
  transcript?: Transcript;
  clinical_extraction?: ClinicalExtraction;
  clinical_note?: SOAPNote;
  diagnosis_suggestions?: DiagnosisSuggestion[];
  investigation_suggestions?: InvestigationSuggestion[];
  prescription?: Prescription;
  icd_suggestions?: ICDSuggestion[];
  approval?: Approval;
  rag_sources?: string[];

  // Bilingual Patient Care Guide
  patient_guide_english?: string;
  patient_guide_malayalam?: string;
  patient_guide_json?: PatientCareGuide;

  // Live Clinical Safety & Conflict Alerts
  safety_alerts?: SafetyAlert[];
}

export interface SafetyAlert {
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SAFE';
  medication: string;
  conflict_source: string;
  title: string;
  clinical_explanation: string;
  recommendation: string;
}

export interface MedicationGuideItem {
  medication: string;
  timing_en: string;
  timing_ml: string;
  purpose_en: string;
  purpose_ml: string;
  special_notes?: string;
}

export interface PatientCareGuide {
  title_en: string;
  title_ml: string;
  diagnosis_summary_en: string;
  diagnosis_summary_ml: string;
  medication_schedule: MedicationGuideItem[];
  diet_and_lifestyle_en: string[];
  diet_and_lifestyle_ml: string[];
  warning_signs_en: string[];
  warning_signs_ml: string[];
  follow_up_en: string;
  follow_up_ml: string;
}

export interface PatientHistoryItem {
  id: string;
  consultation_id: string;
  status: string;
  started_at: string;
  doctor_name?: string;
  chief_complaint?: string;
  diagnoses: string[];
  medications: string[];
  is_approved: boolean;
  approved_at?: string;
}

export interface PatientHistoryResponse {
  patient: Patient;
  consultations: PatientHistoryItem[];
}

export interface MetricItem {
  title: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export interface TrendPoint {
  date: string;
  consultations: number;
  approved: number;
  pending: number;
}

export interface StatusDistributionItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RecentPatientTableItem {
  id: string;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  last_consultation_date?: string;
  last_consultation_id?: string;
  doctor_name?: string;
  status: string;
  has_approved_history: boolean;
}

export interface HospitalDashboardData {
  metrics: Record<string, MetricItem>;
  consultation_trends: TrendPoint[];
  status_distribution: StatusDistributionItem[];
  ai_assisted_ratio: number;
  recent_patients: RecentPatientTableItem[];
}

export interface AuditLog {
  id: string;
  action: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  target_entity?: string;
  target_id?: string;
  details?: string;
  extra_data?: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface GeminiKeyInfo {
  masked: string;
  is_active: boolean;
  in_cooldown: boolean;
  cooldown_remaining_sec: number;
  success_count: number;
  failure_count: number;
  error_reason?: string | null;
}

export interface GeminiPoolStatus {
  total_configured: number;
  active_count: number;
  ready_count: number;
  keys: GeminiKeyInfo[];
}

export interface AIHealthStatus {
  active_provider: string;
  configured_provider: string;
  model_name: string;
  demo_mode: boolean;
  rag_enabled: boolean;
  transcription_mode: string;
  credentials: {
    gemini: string;
    openai: string;
    anthropic: string;
  };
  gemini_pool?: GeminiPoolStatus;
  status: string;
  notice: string;
}
