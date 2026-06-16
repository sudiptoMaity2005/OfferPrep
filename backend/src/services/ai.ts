import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateInterviewQuestions = async (role: string, experienceLevel: string, style: string) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in backend/.env!");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert technical recruiter and interviewer.
Create an interview session for a candidate with the following profile:
- Role: ${role}
- Experience Level: ${experienceLevel}
- Interview Style: ${style} (Adjust the tone and difficulty of the questions to match this style)

Generate exactly 5 interview questions. Ensure a mix of technical, behavioral, and scenario-based questions appropriate for the role, experience level, and requested interview style.

Output the result strictly in valid JSON format matching this schema:
[
  {
    "text": "The question text",
    "category": "TECHNICAL | BEHAVIORAL | SCENARIO",
    "difficulty": "EASY | MEDIUM | HARD"
  }
]

Do not include any Markdown formatting or code blocks (like \`\`\`json). Return ONLY the raw JSON string.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  try {
    // Robustly extract JSON array using regex
    const match = responseText.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found in response");
    
    const questions = JSON.parse(match[0]);
    return questions;
  } catch (error) {
    console.error("Failed to parse Gemini response as JSON:", responseText);
    throw new Error("Invalid response format from AI");
  }
};

export const evaluateInterview = async (session: any, questionsWithResponses: any[]) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in backend/.env!");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let transcriptStr = "";
  questionsWithResponses.forEach((q, i) => {
    transcriptStr += `\nQuestion ${i+1} [${q.category}]: ${q.text}\nCandidate Answer: ${q.response?.transcript || "(No answer provided)"}\n`;
  });

  const prompt = `You are an expert technical interviewer evaluating a candidate's performance.
Profile:
- Role: ${session.role}
- Experience Level: ${session.experienceLevel}
- Interview Style: ${session.style}

Below is the full transcript of the interview. The candidate was asked 5 questions and provided answers.

TRANSCRIPT:
${transcriptStr}

Please evaluate the candidate's performance. Provide scores out of 100 for the following categories, keeping in mind the expected experience level and interview style:
- technicalScore: Accuracy and depth of technical knowledge.
- communicationScore: Clarity, structure, and conciseness of the answers.
- completenessScore: Did they fully answer all parts of the questions?
- overallScore: A weighted average or overall impression.

CRITICAL INSTRUCTION: You MUST heavily penalize gibberish, random characters, completely off-topic responses, or extreme brevity. If the candidate provides nonsensical answers (e.g. "asdfg", "sduhfaobuyckiu"), their scores MUST be extremely low (0-10). Do NOT invent or hallucinate positive traits for bad answers. Explicitly call out the lack of coherent responses in the feedback.

Also provide detailed feedback (formatted as a beautiful Markdown string) highlighting their strengths, weaknesses, and specific areas for improvement.

Output strictly in valid JSON format matching this schema:
{
  "technicalScore": 85,
  "communicationScore": 90,
  "completenessScore": 80,
  "overallScore": 85,
  "feedback": "### Strengths\\n- ...\\n### Areas for Improvement\\n- ..."
}

Do not include any Markdown formatting or code blocks (like \`\`\`json) outside the JSON. Return ONLY the raw JSON string.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  try {
    // Robustly extract JSON object using regex
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in response");
    
    const evaluation = JSON.parse(match[0]);
    
    // Ensure scores are numbers
    return {
      technicalScore: Number(evaluation.technicalScore) || 0,
      communicationScore: Number(evaluation.communicationScore) || 0,
      completenessScore: Number(evaluation.completenessScore) || 0,
      overallScore: Number(evaluation.overallScore) || 0,
      feedback: evaluation.feedback || "No feedback provided."
    };
  } catch (error) {
    console.error("Failed to parse Gemini evaluation as JSON:", responseText);
    throw new Error("Invalid evaluation format from AI");
  }
};
