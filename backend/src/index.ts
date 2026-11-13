import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load backend env
dotenv.config();
// Load database env
dotenv.config({ path: path.resolve(__dirname, '../../database/.env') });

import webhookRoutes from './routes/webhooks';
import interviewRoutes from './routes/interviews';
import { clerkMiddleware } from '@clerk/express';
import { apiLimiter } from './middleware/rateLimiter';
import { prisma } from 'database';

const app = express();
const port = process.env.PORT || 5000;

// Security & CORS configuration
const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(
  cors({
    origin: allowedOrigin === '*' ? '*' : [allowedOrigin, 'http://localhost:3000'],
    credentials: true,
  })
);

// Webhooks must be before express.json() because they require raw bodies for signature verification
app.use('/api/webhooks', webhookRoutes);

// Body parser & Clerk Auth Context
app.use(express.json({ limit: '2mb' }));
app.use(clerkMiddleware());

// Apply global rate limiting to all API requests
app.use('/api', apiLimiter);

// Route handlers
app.use('/api/interviews', interviewRoutes);

// Comprehensive Production Healthcheck (Database ping + AI Key readiness)
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const aiConfigured = Boolean(process.env.GEMINI_API_KEY);

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: 'connected',
      aiConfigured,
      version: '1.0.0',
    });
  } catch (error: any) {
    console.error('[Healthcheck Failed]:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message || 'Database unreachable',
    });
  }
});

const server = app.listen(port, () => {
  console.log(`[OfferPrep API] Server running on port ${port}`);
});

// Graceful Shutdown Handler for Container Orchestration (Docker, Kubernetes, Railway, ECS)
const shutdown = async (signal: string) => {
  console.log(`[OfferPrep API] ${signal} signal received: closing HTTP server...`);
  server.close(async () => {
    console.log('[OfferPrep API] HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('[OfferPrep API] Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('[OfferPrep API] Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force close if graceful shutdown takes too long (> 10s)
  setTimeout(() => {
    console.error('[OfferPrep API] Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
