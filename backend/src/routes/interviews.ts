import { Router } from "express";
import { generateInterviewQuestions } from "../services/ai";
import { prisma } from "database";

const router = Router();

// Endpoint to fetch all interview sessions for the user
router.get("/", async (req, res) => {
  try {
    const clerkId = req.auth?.userId || req.query.userId;
    if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { clerkId: String(clerkId) } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const sessions = await prisma.interviewSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { evaluation: true }
    });

    return res.status(200).json(sessions);
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    return res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Endpoint to create a new interview session
router.post("/create", async (req, res) => {
  try {
    const { role, experienceLevel, style, userId } = req.body;
    const clerkId = req.auth?.userId || userId;

    console.log("Auth header:", req.headers.authorization ? "Present" : "Missing");
    console.log("req.auth:", req.auth);
    console.log("clerkId resolved to:", clerkId);

    if (!role || !experienceLevel) {
      return res.status(400).json({ error: "Role and experienceLevel are required" });
    }

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid Clerk token" });
    }

    // 1. Check if user exists in our DB
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    // If user doesn't exist (e.g. testing locally without webhooks), create them on the fly for seamless testing
    if (!user) {
      console.log(`User ${clerkId} not found in DB. Creating a dummy user...`);
      user = await prisma.user.create({
        data: {
          clerkId,
          email: `${clerkId}@example.com`,
          name: "Test User",
        },
      });
    }

    // 2. Generate questions from Gemini AI
    const generatedQuestions = await generateInterviewQuestions(role, experienceLevel, style || "Standard");

    // 3. Save InterviewSession and Questions to Database
    const session = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        role,
        experienceLevel,
        style: style || "Standard",
        questions: {
          create: generatedQuestions.map((q: any, index: number) => ({
            text: q.text,
            category: q.category,
            order: index + 1,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    // 4. Return the session ID so frontend can redirect
    return res.status(200).json({ sessionId: session.id, session });
  } catch (error: any) {
    console.error("Error creating interview:", error);
    return res.status(500).json({ error: error.message || "Failed to create interview session" });
  }
});

// Endpoint to fetch an interview session and its questions
router.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const clerkId = req.auth?.userId || req.query.userId;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: String(clerkId) } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const session = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { response: true }
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.status(200).json(session);
  } catch (error: any) {
    console.error("Error fetching session:", error);
    return res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Endpoint to submit an answer to a question
router.post("/:sessionId/questions/:questionId/response", async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const { transcript, userId } = req.body;
    const clerkId = req.auth?.userId || userId;

    if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
    if (!transcript) return res.status(400).json({ error: "Transcript is required" });

    // Ensure session belongs to user
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const session = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: user.id }
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Upsert response
    const response = await prisma.response.upsert({
      where: { questionId },
      update: { transcript },
      create: {
        questionId,
        transcript
      }
    });

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Error submitting response:", error);
    return res.status(500).json({ error: "Failed to save response" });
  }
});

// Endpoint to generate and save an evaluation
router.post("/:sessionId/evaluate", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const clerkId = req.auth?.userId || req.body.userId;

    if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const session = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: user.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { response: true }
        },
        evaluation: true,
      }
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    // If an evaluation already exists, just return it
    if (session.evaluation) {
      return res.status(200).json(session.evaluation);
    }

    // Call Gemini to generate the evaluation
    const { evaluateInterview } = await import("../services/ai");
    const aiEvaluation = await evaluateInterview(session, session.questions);

    // Save evaluation to DB
    const newEvaluation = await prisma.evaluation.create({
      data: {
        sessionId: session.id,
        technicalScore: aiEvaluation.technicalScore,
        communicationScore: aiEvaluation.communicationScore,
        completenessScore: aiEvaluation.completenessScore,
        overallScore: aiEvaluation.overallScore,
        feedback: aiEvaluation.feedback,
      }
    });

    // Update session status to COMPLETED
    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED" }
    });

    return res.status(200).json(newEvaluation);
  } catch (error: any) {
    console.error("Error evaluating session:", error);
    return res.status(500).json({ error: "Failed to evaluate session" });
  }
});

// Endpoint to fetch an existing evaluation
router.get("/:sessionId/evaluation", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const clerkId = req.auth?.userId || req.query.userId;

    if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { clerkId: String(clerkId) } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const evaluation = await prisma.evaluation.findUnique({
      where: { sessionId }
    });

    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }

    return res.status(200).json(evaluation);
  } catch (error: any) {
    console.error("Error fetching evaluation:", error);
    return res.status(500).json({ error: "Failed to fetch evaluation" });
  }
});

export default router;
