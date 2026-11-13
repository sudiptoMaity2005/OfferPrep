import { api } from "./config";
import type {
  InterviewSession,
  Question,
  CreateInterviewRequest,
  CreateInterviewResponse,
  Evaluation,
  EvaluationWithSession,
  AnalyticsData,
  Response as AnswerResponse,
} from "@/types";

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(res: globalThis.Response): Promise<T> {
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    const details = data && Array.isArray(data.details) ? data.details : undefined;
    throw new ApiError(message, res.status, details);
  }

  return data as T;
}

function authHeaders(token?: string | null, extraHeaders: HeadersInit = {}): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

export const apiClient = {
  /**
   * Create a new interview session
   */
  async createInterview(
    payload: CreateInterviewRequest,
    token?: string | null
  ): Promise<CreateInterviewResponse> {
    const res = await fetch(api("/interviews/create"), {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    return handleResponse<CreateInterviewResponse>(res);
  },

  /**
   * Fetch all past interview sessions for the user
   */
  async fetchSessions(
    userId: string,
    token?: string | null
  ): Promise<InterviewSession[]> {
    const res = await fetch(api(`/interviews?userId=${encodeURIComponent(userId)}`), {
      headers: authHeaders(token),
    });
    return handleResponse<InterviewSession[]>(res);
  },

  /**
   * Fetch a specific interview session and its questions
   */
  async fetchSession(
    sessionId: string,
    userId: string,
    token?: string | null
  ): Promise<InterviewSession> {
    const res = await fetch(
      api(`/interviews/${sessionId}?userId=${encodeURIComponent(userId)}`),
      {
        headers: authHeaders(token),
      }
    );
    return handleResponse<InterviewSession>(res);
  },

  /**
   * Submit an answer to a question
   */
  async submitResponse(
    sessionId: string,
    questionId: string,
    transcript: string,
    userId: string,
    token?: string | null
  ): Promise<AnswerResponse> {
    const res = await fetch(
      api(`/interviews/${sessionId}/questions/${questionId}/response`),
      {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ transcript, userId }),
      }
    );
    return handleResponse<AnswerResponse>(res);
  },

  /**
   * Request an adaptive follow-up probe based on the candidate's answer
   */
  async requestAdaptiveFollowUp(
    sessionId: string,
    questionId: string,
    transcript: string,
    userId: string,
    token?: string | null
  ): Promise<Question> {
    const res = await fetch(
      api(`/interviews/${sessionId}/questions/${questionId}/follow-up`),
      {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ transcript, userId }),
      }
    );
    return handleResponse<Question>(res);
  },

  /**
   * Generate and store AI evaluation
   */
  async evaluateSession(
    sessionId: string,
    userId: string,
    token?: string | null
  ): Promise<Evaluation> {
    const res = await fetch(api(`/interviews/${sessionId}/evaluate`), {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ userId }),
    });
    return handleResponse<Evaluation>(res);
  },

  /**
   * Fetch evaluation results with full Q&A summary
   */
  async fetchEvaluation(
    sessionId: string,
    userId: string,
    token?: string | null
  ): Promise<EvaluationWithSession> {
    const res = await fetch(
      api(`/interviews/${sessionId}/evaluation?userId=${encodeURIComponent(userId)}`),
      {
        headers: authHeaders(token),
      }
    );
    return handleResponse<EvaluationWithSession>(res);
  },

  /**
   * Fetch user interview performance metrics and score history
   */
  async fetchAnalytics(
    userId: string,
    token?: string | null
  ): Promise<AnalyticsData> {
    const res = await fetch(
      api(`/interviews/analytics?userId=${encodeURIComponent(userId)}`),
      {
        headers: authHeaders(token),
      }
    );
    return handleResponse<AnalyticsData>(res);
  },
};

