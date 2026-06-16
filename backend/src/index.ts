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

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

// Webhooks must be before express.json() because they require raw bodies
app.use('/api/webhooks', webhookRoutes);

// Add body parser for normal API routes
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api/interviews', interviewRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'OfferPrep API is running' });
});

// Trigger reload

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
