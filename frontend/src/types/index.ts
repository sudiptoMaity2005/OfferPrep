// ============================================================
// Shared TypeScript interfaces for OfferPrep (Tier 5 Enhanced)
// ============================================================

export type SessionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type QuestionCategory = "TECHNICAL" | "BEHAVIORAL" | "SCENARIO";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type ExperienceLevel = "Intern" | "Fresher" | "Mid-Level" | "Senior" | "Lead";
export type InterviewStyle = "Friendly" | "Standard" | "Strict" | "Company Specific";
export type TargetCompany = "General" | "Google" | "Amazon" | "Meta" | "Microsoft";

// --- Database model interfaces (API response shapes) ---

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Response {
  id: string;
  questionId: string;
  transcript: string;
  audioUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  sessionId: string;
  category: QuestionCategory;
  text: string;
  difficulty: QuestionDifficulty;
  order: number;
  isFollowUp?: boolean;
  parentQuestionId?: string | null;
  response: Response | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionFeedbackItem {
  questionIndex: number;
  score: number;
  verdict: "Strong" | "Satisfactory" | "Needs Improvement" | "Poor";
  feedback: string;
}

export interface SkillGapItem {
  topic: string;
  status: "Proficient" | "Needs Practice";
  recommendation: string;
}

export interface Evaluation {
  id: string;
  sessionId: string;
  technicalScore: number;
  communicationScore: number;
  completenessScore: number;
  overallScore: number;
  readinessScore?: number | null;
  feedback: string;
  questionFeedback: QuestionFeedbackItem[] | null;
  skillGaps: SkillGapItem[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  experienceLevel: string;
  style: string;
  company?: string | null;
  resumeText?: string | null;
  isAdaptive?: boolean;
  timePerQuestion: number;
  status: SessionStatus;
  questions: Question[];
  evaluation: Evaluation | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationWithSession extends Evaluation {
  session: InterviewSession;
}

// --- Analytics types ---

export interface InterviewHistoryItem {
  sessionId: string;
  date: string;
  role: string;
  level: string;
  company?: string;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  completenessScore: number;
  readinessScore?: number;
}

export interface AnalyticsData {
  tier?: string;
  interviewCredits?: number;
  totalSessions: number;
  completedSessions: number;
  averageOverallScore: number;
  averageTechnicalScore: number;
  averageCommunicationScore: number;
  averageCompletenessScore: number;
  averageReadinessScore?: number;
  history: InterviewHistoryItem[];
}

// --- API request/response types ---

export interface CreateInterviewRequest {
  role: string;
  experienceLevel: string;
  style: string;
  company?: string;
  resumeText?: string;
  isAdaptive?: boolean;
  timePerQuestion: number;
  userId: string;
}

export interface CreateInterviewResponse {
  sessionId: string;
  session: InterviewSession;
}

export interface SubmitResponseRequest {
  transcript: string;
  userId: string;
}

export interface AdaptiveFollowUpRequest {
  transcript: string;
  userId: string;
}

export interface EvaluateRequest {
  userId: string;
}
