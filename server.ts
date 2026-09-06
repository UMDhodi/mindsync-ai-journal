/**
 * MindSync AI - Express Server Entry Point
 * Implements Google Cloud Run compatible HTTP server, Vite middleware integration,
 * and security-hardened API proxying.
 *
 * Cloud Run Service Label: dev-tutorial=cloud-run-ai-challenge
 */
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { journalRouter } from './server/routes/journalRoutes';
import { getSecretStatus } from './server/config/secrets';
import { initFirebaseAdmin } from './server/middleware/auth';

dotenv.config();

const app = express();
const PORT = 3000;

// Security & Parsing Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// Initialize backend services
initFirebaseAdmin();

// --- API Routes FIRST ---
app.get('/api/health', async (req: Request, res: Response) => {
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
    runtime: 'Cloud Run / Node.js',
  });
});

// Mount journal and cognitive engine routes
app.use('/api', journalRouter);

// Global Error Handler (Defensive: Strips raw stack traces from client responses)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error Handler]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// --- Vite Middleware / Static SPA Host ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MindSync Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[MindSync Server] Cloud Run ingress ready [service label: dev-tutorial=cloud-run-ai-challenge].`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Failure]', err);
  process.exit(1);
});
