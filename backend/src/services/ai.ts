import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeneratedQuestion {
  text: string;
  category: "TECHNICAL" | "BEHAVIORAL" | "SCENARIO";
  difficulty: "EASY" | "MEDIUM" | "HARD";
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

export interface EvaluationResult {
  technicalScore: number;
  communicationScore: number;
  completenessScore: number;
  overallScore: number;
  readinessScore: number;
  feedback: string;
  questionFeedback: QuestionFeedbackItem[];
  skillGaps: SkillGapItem[];
}

/**
 * Resilient Retry Wrapper with Exponential Backoff and Jitter
 * Handles transient Gemini rate limits (429) and temporary service hiccups (503).
 */
async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 1200
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes("429") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");
      const isTransient =
        err?.status === 503 ||
        err?.status === 500 ||
        err?.message?.includes("overloaded") ||
        err?.message?.includes("fetch failed");

      if ((isRateLimit || isTransient) && attempt < retries) {
        const jitter = Math.random() * 400;
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
        console.warn(
          `[Gemini AI] Retry attempt ${attempt}/${retries} after ${Math.round(delay)}ms due to: ${
            err.message || err
          }`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Maximum AI retry attempts exceeded");
}

/**
 * Robust JSON Sanitizer and Parser
 * Strips markdown codeblocks, isolates JSON structures, and cleans common formatting artifacts.
 */
function cleanAndParseJSON<T>(rawText: string, isArray = false): T {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present (```json ... ``` or ``` ...)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Match the outermost array [...] or object {...}
  const regex = isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = cleaned.match(regex);
  if (!match) {
    throw new Error(`Could not find valid JSON ${isArray ? "array" : "object"} in response`);
  }

  let jsonStr = match[0];

  try {
    return JSON.parse(jsonStr) as T;
  } catch (initialErr) {
    // Attempt sanitization: remove trailing commas before closing braces/brackets
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, "$1");
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      throw initialErr;
    }
  }
}

export const generateInterviewQuestions = async (
  role: string,
  experienceLevel: string,
  style: string,
  company?: string | null,
  resumeText?: string | null
): Promise<GeneratedQuestion[]> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in backend/.env!");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let resumeContextPrompt = "";
  if (resumeText && resumeText.trim().length > 20) {
    resumeContextPrompt = `\nCANDIDATE RESUME / PROFILE CONTEXT:
"""
${resumeText.trim()}
"""
CRITICAL: At least 2 of the 5 questions MUST directly reference and probe specific technologies, projects, or achievements mentioned in this resume. Test the candidate's real depth on what they claim to have built.\n`;
  }

  let companyContextPrompt = "";
  if (company && company !== "General") {
    companyContextPrompt = `\nTARGET COMPANY: ${company}
Adjust the questions to align with ${company}'s known hiring style and evaluation culture (for Amazon, integrate Amazon Leadership Principles and scalable architectures; for Google, probe algorithmic edge cases, system bottlenecks, and clean design patterns; for Meta, emphasize fast shipping, high throughput, and architecture trade-offs).\n`;
  }

  const prompt = `You are a Principal Engineering Recruiter and Hiring Manager at a top-tier tech firm.
Create an interview session for a candidate with the following profile:
- Role: ${role}
- Experience Level: ${experienceLevel}
- Interview Style: ${style} (Calibrate tone, rigor, and depth to match)
${companyContextPrompt}${resumeContextPrompt}
Generate exactly 5 interview questions. Ensure a mix of technical design, architecture/DSA fundamentals, scenario-based dilemmas, and behavioral competencies appropriate for the role and seniority level.

Output the result strictly in valid JSON format matching this schema:
[
  {
    "text": "The question text",
    "category": "TECHNICAL | BEHAVIORAL | SCENARIO",
    "difficulty": "EASY | MEDIUM | HARD"
  }
]

Do not include any Markdown formatting or code blocks. Return ONLY the raw JSON string.`;

  return callWithRetry(async () => {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = cleanAndParseJSON<GeneratedQuestion[]>(responseText, true);

    return parsed.map((q) => ({
      text: q.text,
      category: (q.category || "TECHNICAL") as any,
      difficulty: (q.difficulty || "MEDIUM") as any,
    }));
  });
};

/**
 * Adaptive Follow-Up Generator
 * Digs deeper into a candidate's answer to test technical limits, just like an experienced interviewer.
 */
export const generateAdaptiveFollowUp = async (
  originalQuestion: string,
  candidateAnswer: string,
  role: string,
  experienceLevel: string
): Promise<{ text: string; category: string; difficulty: "EASY" | "MEDIUM" | "HARD" }> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in backend/.env!");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert technical interviewer in a live round for a ${experienceLevel} ${role}.
The candidate was asked:
"${originalQuestion}"

The candidate just provided this response:
"${candidateAnswer}"

Generate a sharp, realistic, adaptive follow-up probe (1 single question) that either:
1. Challenges an assumption, technology choice, or trade-off made in their answer (e.g. failure modes, concurrency, scalability limits, edge cases), or
2. Prompts them to go deeper into an area they glossed over.

Output strictly in valid JSON format matching this schema:
{
  "text": "The follow-up question text",
  "category": "TECHNICAL",
  "difficulty": "HARD"
}

Do not include any Markdown or backticks. Return ONLY the JSON object.`;

  return callWithRetry(async () => {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = cleanAndParseJSON<{ text: string; category?: string; difficulty?: string }>(
      responseText,
      false
    );

    return {
      text: parsed.text,
      category: "TECHNICAL",
      difficulty: (parsed.difficulty as any) || "HARD",
    };
  });
};

export const evaluateInterview = async (
  session: any,
  questionsWithResponses: any[]
): Promise<EvaluationResult> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in backend/.env!");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let transcriptStr = "";
  questionsWithResponses.forEach((q, i) => {
    transcriptStr += `\nQuestion ${i + 1} [${q.category}] [Difficulty: ${
      q.difficulty || "MEDIUM"
    }]${q.isFollowUp ? " (ADAPTIVE FOLLOW-UP)" : ""}: ${q.text}\nCandidate Answer: ${
      q.response?.transcript?.trim() || "(No answer provided)"
    }\n`;
  });

  const prompt = `You are an executive interviewer calibrating an engineering hiring round.
Candidate Profile:
- Role: ${session.role}
- Experience Level: ${session.experienceLevel}
- Style: ${session.style}
- Company Standard: ${session.company || "General Tech Standard"}

TRANSCRIPT:
${transcriptStr}

Evaluate the candidate's performance across all dimensions:

PART 1 — METRIC SCORES (0 to 100):
- technicalScore: Correctness, depth of concepts, architecture, and code understanding.
- communicationScore: Clarity, structured reasoning (e.g. STAR method where applicable), and conciseness.
- completenessScore: Completeness in addressing edge cases and requirements.
- overallScore: Weighted composite score.
- readinessScore: Estimated placement readiness benchmark for top-tier hiring (0 to 100).
- feedback: Comprehensive Markdown analysis with ### Strengths, ### Critical Weaknesses, and ### Personalized 30-Day Preparation Plan.

PART 2 — PER-QUESTION BREAKDOWN:
For EACH question (${questionsWithResponses.length} total):
- questionIndex: 0-based index
- score: Individual score out of 100
- verdict: One of "Strong", "Satisfactory", "Needs Improvement", or "Poor"
- feedback: 1-3 sentences with specific praise or identified blindspots.

PART 3 — SKILL GAP DETECTION:
Provide 3 to 5 key competencies evaluated (e.g. "Distributed Systems", "API Design", "Database Indexing", "Behavioral / Leadership"):
- topic: The skill name
- status: "Proficient" if scored well, or "Needs Practice" if weak
- recommendation: Specific targeted advice to bridge this gap

CRITICAL INSTRUCTION: Penalize empty, gibberish, or completely off-topic answers heavily (0-10 score). Do not hallucinate knowledge that the candidate did not provide.

Output strictly in valid JSON format matching this schema:
{
  "technicalScore": 85,
  "communicationScore": 90,
  "completenessScore": 80,
  "overallScore": 85,
  "readinessScore": 82,
  "feedback": "### Strengths\\n- ...\\n### Critical Weaknesses\\n- ...\\n### Personalized 30-Day Preparation Plan\\n- ...",
  "questionFeedback": [
    {
      "questionIndex": 0,
      "score": 85,
      "verdict": "Strong",
      "feedback": "Clear explanation with appropriate terminology."
    }
  ],
  "skillGaps": [
    {
      "topic": "System Scalability",
      "status": "Proficient",
      "recommendation": "Great intuition around read-replicas and caching layers."
    },
    {
      "topic": "Concurrency & Locking",
      "status": "Needs Practice",
      "recommendation": "Review optimistic vs pessimistic locking and deadlock prevention strategies."
    }
  ]
}

Do not include any Markdown code blocks outside the JSON. Return ONLY the raw JSON string.`;

  return callWithRetry(async () => {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const evaluation = cleanAndParseJSON<any>(responseText, false);

    const questionFeedback: QuestionFeedbackItem[] = Array.isArray(
      evaluation.questionFeedback
    )
      ? evaluation.questionFeedback.map((qf: any, idx: number) => ({
          questionIndex: typeof qf.questionIndex === "number" ? qf.questionIndex : idx,
          score: Number(qf.score) || 0,
          verdict: qf.verdict || "Needs Improvement",
          feedback: qf.feedback || "Answer noted.",
        }))
      : questionsWithResponses.map((_, idx) => ({
          questionIndex: idx,
          score: Math.round(Number(evaluation.overallScore) || 50),
          verdict: "Satisfactory",
          feedback: "Evaluated as part of overall session.",
        }));

    const skillGaps: SkillGapItem[] = Array.isArray(evaluation.skillGaps)
      ? evaluation.skillGaps.map((sg: any) => ({
          topic: sg.topic || "Core Fundamentals",
          status: sg.status === "Proficient" ? "Proficient" : "Needs Practice",
          recommendation: sg.recommendation || "Continue standard problem practice.",
        }))
      : [
          {
            topic: "Core Engineering Fundamentals",
            status: "Proficient",
            recommendation: "Maintain steady interview cadence.",
          },
        ];

    return {
      technicalScore: Number(evaluation.technicalScore) || 0,
      communicationScore: Number(evaluation.communicationScore) || 0,
      completenessScore: Number(evaluation.completenessScore) || 0,
      overallScore: Number(evaluation.overallScore) || 0,
      readinessScore: Number(evaluation.readinessScore) || Number(evaluation.overallScore) || 0,
      feedback: evaluation.feedback || "No feedback provided.",
      questionFeedback,
      skillGaps,
    };
  });
};
