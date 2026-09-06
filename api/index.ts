import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { journalRouter } from '../server/routes/journalRoutes';
import { getSecretStatus } from '../server/config/secrets';
import { initFirebaseAdmin } from '../server/middleware/auth';

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

initFirebaseAdmin();

app.get(['/api/health', '/health'], async (req: Request, res: Response) => {
  const secretStatus = await getSecretStatus();
  res.json({
    status: 'healthy',
    service: 'MindSync AI - Personal Gemini Journal',
    serviceLabels: {
      'dev-tutorial': 'cloud-run-ai-challenge',
    },
    timestamp: new Date().toISOString(),
    secretManager: {
      active: secretStatus.active,
      source: secretStatus.source,
      cached: secretStatus.cached,
      secretName: secretStatus.secretName,
      project: secretStatus.projectId,
    },
    runtime: 'Vercel Serverless / Cloud Run Compatible',
  });
});

// Mount journalRouter at both /api and root so rewrites always match
app.use('/api', journalRouter);
app.use(journalRouter);

process.on('unhandledRejection', (reason) => {
  console.error('[API Process Unhandled Rejection]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[API Process Uncaught Exception]:', err);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error Handler]', err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
    });
  }
});

export default app;
