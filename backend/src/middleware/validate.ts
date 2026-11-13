import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodError } from "zod";

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const errorMessages = err.issues.map(
          (issue) => `${issue.path.join(".") || "field"}: ${issue.message}`
        );
        res.status(400).json({
          error: "Validation failed",
          details: errorMessages,
        });
        return;
      }
      res.status(400).json({ error: "Invalid request payload" });
      return;
    }
  };
};

export const createInterviewSchema = z.object({
  role: z.string().min(2, "Role must be at least 2 characters long"),
  experienceLevel: z.string().min(1, "Experience level is required"),
  style: z.string().optional().default("Standard"),
  company: z.string().optional().default("General"),
  resumeText: z.string().optional(),
  isAdaptive: z.boolean().optional().default(false),
  timePerQuestion: z.coerce.number().min(0).max(30).default(3),
  userId: z.string().optional(),
});

export const submitResponseSchema = z.object({
  transcript: z.string().min(1, "Answer transcript cannot be empty"),
  userId: z.string().optional(),
});

export const evaluateInterviewSchema = z.object({
  userId: z.string().optional(),
});

export const adaptiveFollowUpSchema = z.object({
  transcript: z.string().min(1, "Candidate transcript is required"),
  userId: z.string().optional(),
});
