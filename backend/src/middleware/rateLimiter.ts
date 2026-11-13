import rateLimit from "express-rate-limit";

// Rate limiter for general API routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP, please try again in 15 minutes.",
  },
});

// Stricter rate limiter for expensive AI generation & evaluation routes
export const aiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 25, // limit each IP to 25 generation/eval calls per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "AI service request limit reached. Please wait a few minutes before starting or evaluating another session.",
  },
});

