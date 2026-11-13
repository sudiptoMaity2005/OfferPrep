import { Router } from "express";
import { getAuth } from "@clerk/express";
import {
  generateInterviewQuestions,
  generateAdaptiveFollowUp,
  evaluateInterview,
} from "../services/ai";
import { prisma } from "database";
import {
  validateBody,
  createInterviewSchema,
  submitResponseSchema,
  evaluateInterviewSchema,
  adaptiveFollowUpSchema,
} from "../middleware/validate";
import { aiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Endpoint to fetch analytics across all interviews for the current user
router.get("/analytics", async (req, res) => {
  try {
    const auth = getAuth(req);
    const clerkId = auth.userId || req.query.userId;
    if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { clerkId: String(clerkId) } });
    if (!user) {
      return res.status(200).json({
        tier: "FREE",
        interviewCredits: 5,
        totalSessions: 0,
        completedSessions: 0,
        averageOverallScore: 0,
        averageTechnicalScore: 0,
        averageCommunicationScore: 0,
        averageCompletenessScore: 0,
        averageReadinessScore: 0,
        history: [],
      });
    }

    const sessions = await prisma.interviewSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { evaluation: true },
    });

    const evaluatedSessions = sessions.filter((s) => s.evaluation !== null);

    const total = evaluatedSessions.length;
    const avgOverall = total
      ? Math.round(
          evaluatedSessions.reduce((acc, s) => acc + (s.evaluation?.overallScore || 0), 0) / total
        )
      : 0;
    const avgTech = total
      ? Math.round(
          evaluatedSessions.reduce((acc, s) => acc + (s.evaluation?.technicalScore || 0), 0) / total
        )
      : 0;
    const avgComm = total
      ? Math.round(
          evaluatedSessions.reduce(
            (acc, s) => acc + (s.evaluation?.communicationScore || 0),
            0
          ) / total
        )
      : 0;
    const avgComp = total
      ? Math.round(
          evaluatedSessions.reduce(
            (acc, s) => acc + (s.evaluation?.completenessScore || 0),
            0
          ) / total
        )
      : 0;
    const avgReadiness = total
      ? Math.round(
          evaluatedSessions.reduce(
            (acc, s) => acc + (s.evaluation?.readinessScore || s.evaluation?.overallScore || 0),
            0
          ) / total
        )
      : 0;

    const history = evaluatedSessions.map((s) => ({
      sessionId: s.id,
      date: new Date(s.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      role: s.role,
      level: s.experienceLevel,
      company: s.company || "General",
      overallScore: s.evaluation?.overallScore || 0,
      technicalScore: s.evaluation?.technicalScore || 0,
      communicationScore: s.evaluation?.communicationScore || 0,
      completenessScore: s.evaluation?.completenessScore || 0,
      readinessScore: s.evaluation?.readinessScore || s.evaluation?.overallScore || 0,
    }));

    return res.status(200).json({
      tier: user.tier,
      interviewCredits: user.interviewCredits,
      totalSessions: sessions.length,
      completedSessions: total,
      averageOverallScore: avgOverall,
      averageTechnicalScore: avgTech,
      averageCommunicationScore: avgComm,
      averageCompletenessScore: avgComp,
      averageReadinessScore: avgReadiness,
      history,
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Endpoint to fetch all interview sessions for the user
router.get("/", async (req, res) => {
  try {
    const auth = getAuth(req);
    const clerkId = auth.userId || req.query.userId;
    if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { clerkId: String(clerkId) } });
    if (!user) return res.status(200).json([]);

    const sessions = await prisma.interviewSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { evaluation: true },
    });

    return res.status(200).json(sessions);
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    return res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Endpoint to create a new interview session
router.post("/create", aiRateLimiter, validateBody(createInterviewSchema), async (req, res) => {
  try {
    const {
      role,
      experienceLevel,
      style,
      company,
      resumeText,
      isAdaptive,
      timePerQuestion,
      userId,
    } = req.body;
    const auth = getAuth(req);
    const clerkId = auth.userId || userId;

    if (!role || !experienceLevel) {
      return res.status(400).json({ error: "Role and experienceLevel are required" });
    }

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid Clerk token" });
    }

    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email: `${clerkId}@example.com`,
          name: "Interviewee",
        },
      });
    }

    // Quota guard: Free tier gets 5 full mock simulations
    if (user.tier === "FREE" && user.interviewCredits <= 0) {
      return res.status(403).json({
        error: "Simulation quota reached. You have completed all 5 free mock interviews. Upgrade to Pro for unlimited sessions.",
        code: "QUOTA_EXCEEDED",
      });
    }

    // 2. Generate questions from Gemini AI (incorporating company and resume context)
    const generatedQuestions = await generateInterviewQuestions(
      role,
      experienceLevel,
      style || "Standard",
      company,
      resumeText
    );

    const parsedTime = typeof timePerQuestion === "number" ? timePerQuestion : 3;

    // 3. Save InterviewSession and Questions to Database
    const session = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        role,
        experienceLevel,
        style: style || "Standard",
        company: company || "General",
        resumeText: resumeText || null,
        isAdaptive: Boolean(isAdaptive),
        timePerQuestion: parsedTime,
        questions: {
          create: generatedQuestions.map((q: any, index: number) => ({
            text: q.text,
            category: q.category,
            difficulty: q.difficulty || "MEDIUM",
            order: index + 1,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    // Deduct 1 credit for Free tier candidates
    if (user.tier === "FREE") {
      await prisma.user.update({
        where: { id: user.id },
        data: { interviewCredits: { decrement: 1 } },
      });
    }

    return res.status(200).json({ sessionId: session.id, session });
  } catch (error: any) {
    console.error("Error creating interview:", error);
    return res.status(500).json({ error: error.message || "Failed to create interview session" });
  }
});

// Endpoint to fetch an interview session and its questions
router.get("/:sessionId", async (req, res) => {
  try {
    const sessionId = String(req.params.sessionId);
    const auth = getAuth(req);
    const clerkId = auth.userId || req.query.userId;

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
          orderBy: { order: "asc" },
          include: { response: true },
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
router.post(
  "/:sessionId/questions/:questionId/response",
  validateBody(submitResponseSchema),
  async (req, res) => {
    try {
      const sessionId = String(req.params.sessionId);
      const questionId = String(req.params.questionId);
      const { transcript, userId } = req.body;
      const auth = getAuth(req);
      const clerkId = auth.userId || userId;

      if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
      if (!transcript) return res.status(400).json({ error: "Transcript is required" });

      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const session = await prisma.interviewSession.findFirst({
        where: { id: sessionId, userId: user.id },
      });
      if (!session) return res.status(404).json({ error: "Session not found" });

      const response = await prisma.response.upsert({
        where: { questionId },
        update: { transcript },
        create: {
          questionId,
          transcript,
        },
      });

      return res.status(200).json(response);
    } catch (error: any) {
      console.error("Error submitting response:", error);
      return res.status(500).json({ error: "Failed to save response" });
    }
  }
);

// Adaptive Follow-Up Question Generator Endpoint
router.post(
  "/:sessionId/questions/:questionId/follow-up",
  aiRateLimiter,
  validateBody(adaptiveFollowUpSchema),
  async (req, res) => {
    try {
      const sessionId = String(req.params.sessionId);
      const questionId = String(req.params.questionId);
      const { transcript, userId } = req.body;
      const auth = getAuth(req);
      const clerkId = auth.userId || userId;

      if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const session = await prisma.interviewSession.findFirst({
        where: { id: sessionId, userId: user.id },
        include: { questions: true },
      });
      if (!session) return res.status(404).json({ error: "Session not found" });

      const parentQuestion = session.questions.find((q) => q.id === questionId);
      if (!parentQuestion) return res.status(404).json({ error: "Question not found" });

      // Generate the adaptive probe question
      const followUp = await generateAdaptiveFollowUp(
        parentQuestion.text,
        transcript,
        session.role,
        session.experienceLevel
      );

      // Save follow-up question to session
      const newQuestion = await prisma.question.create({
        data: {
          sessionId: session.id,
          text: followUp.text,
          category: followUp.category,
          difficulty: followUp.difficulty,
          order: session.questions.length + 1,
          isFollowUp: true,
          parentQuestionId: parentQuestion.id,
        },
      });

      return res.status(200).json(newQuestion);
    } catch (error: any) {
      console.error("Error generating adaptive follow-up:", error);
      return res.status(500).json({ error: "Failed to generate follow-up" });
    }
  }
);

// Endpoint to generate and save an evaluation
router.post(
  "/:sessionId/evaluate",
  aiRateLimiter,
  validateBody(evaluateInterviewSchema),
  async (req, res) => {
    try {
      const sessionId = String(req.params.sessionId);
      const auth = getAuth(req);
      const clerkId = auth.userId || req.body.userId;

      if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const session = await prisma.interviewSession.findFirst({
        where: { id: sessionId, userId: user.id },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { response: true },
          },
          evaluation: true,
        },
      });

      if (!session) return res.status(404).json({ error: "Session not found" });

      if (session.evaluation) {
        return res.status(200).json(session.evaluation);
      }

      const aiEvaluation = await evaluateInterview(session, session.questions);

      const newEvaluation = await prisma.evaluation.create({
        data: {
          sessionId: session.id,
          technicalScore: aiEvaluation.technicalScore,
          communicationScore: aiEvaluation.communicationScore,
          completenessScore: aiEvaluation.completenessScore,
          overallScore: aiEvaluation.overallScore,
          readinessScore: aiEvaluation.readinessScore,
          feedback: aiEvaluation.feedback,
          questionFeedback: aiEvaluation.questionFeedback as any,
          skillGaps: aiEvaluation.skillGaps as any,
        },
      });

      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED" },
      });

      return res.status(200).json(newEvaluation);
    } catch (error: any) {
      console.error("Error evaluating session:", error);
      return res.status(500).json({ error: "Failed to evaluate session" });
    }
  }
);

// Endpoint to fetch an existing evaluation (with session Q&A summary included)
router.get("/:sessionId/evaluation", async (req, res) => {
  try {
    const sessionId = String(req.params.sessionId);
    const auth = getAuth(req);
    const clerkId = auth.userId || req.query.userId;

    if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { clerkId: String(clerkId) } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const evaluation = await prisma.evaluation.findUnique({
      where: { sessionId },
    });

    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { response: true },
        },
      },
    });

    return res.status(200).json({
      ...evaluation,
      session,
    });
  } catch (error: any) {
    console.error("Error fetching evaluation:", error);
    return res.status(500).json({ error: "Failed to fetch evaluation" });
  }
});

export default router;
