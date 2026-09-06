/**
 * Secret Manager Client with In-Memory TTL Caching & AI Studio Default Integration
 * Implements Principle of Least Privilege and Zero-Leakage Architecture.
 *
 * Supports:
 * 1. Default Google AI Studio API key (GEMINI_API_KEY) - auto-injected in AI Studio / Vercel env.
 * 2. Google Cloud Secret Manager on Cloud Run - auto-detects GCP_PROJECT / GOOGLE_CLOUD_PROJECT.
 */
import dotenv from 'dotenv';

dotenv.config();

interface CachedSecret {
  value: string;
  expiresAt: number;
  source: 'AI_STUDIO_DEFAULT_API' | 'SECRET_MANAGER' | 'ENVIRONMENT_FALLBACK';
}

let cachedSecret: CachedSecret | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

// Lazy initialize client to avoid crashes if credentials aren't in local/serverless environment
let client: any = null;

async function getSecretManagerClient(): Promise<any> {
  if (!client) {
    try {
      const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
      client = new SecretManagerServiceClient();
    } catch (e: any) {
      console.warn('[SecretManager] @google-cloud/secret-manager module not available or credentials missing:', e?.message);
      return null;
    }
  }
  return client;
}

/**
 * Retrieves the Gemini API key.
 * Prioritizes the default AI Studio API key (process.env.GEMINI_API_KEY).
 * If on Cloud Run with Secret Manager enabled, accesses the secret version.
 */
export async function getGeminiApiKey(): Promise<string> {
  const now = Date.now();

  // Return cached key if still valid
  if (cachedSecret && cachedSecret.expiresAt > now && cachedSecret.value) {
    return cachedSecret.value;
  }

  // 1. Default AI Studio API key / Environment variable (First-class priority)
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    const trimmed = envKey.trim();
    cachedSecret = {
      value: trimmed,
      expiresAt: now + CACHE_TTL_MS,
      source: 'AI_STUDIO_DEFAULT_API',
    };
    return trimmed;
  }

  // 2. Secret Manager on GCP Cloud Run
  // Project ID is auto-derived from GCP_PROJECT or GOOGLE_CLOUD_PROJECT (built into GCP/AI environment)
  const isVercel = Boolean(process.env.VERCEL);
  const hasGcpCredentials = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
  const secretName = process.env.GEMINI_SECRET_NAME || 'gemini-api-key';

  if (projectId && (!isVercel || hasGcpCredentials)) {
    try {
      const smClient = await getSecretManagerClient();
      if (smClient) {
        const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
        const accessPromise = smClient.accessSecretVersion({ name });
        // Enforce strict 2.5s timeout on secret retrieval
        const [version] = await Promise.race([
          accessPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Secret Manager lookup timed out')), 2500)
          ),
        ]);
        const payload = version.payload?.data?.toString();

        if (payload && payload.trim()) {
          const trimmed = payload.trim();
          cachedSecret = {
            value: trimmed,
            expiresAt: now + CACHE_TTL_MS,
            source: 'SECRET_MANAGER',
          };
          console.log(`[SecretManager] Successfully loaded and cached secret: ${secretName} from GCP project: ${projectId}`);
          return trimmed;
        }
      }
    } catch (err: any) {
      console.warn(
        `[SecretManager] GCP Secret Manager lookup skipped (${err?.message || err}). Verify IAM permissions or GEMINI_API_KEY.`
      );
    }
  }

  throw new Error(
    'No valid Gemini API key found in environment variables. If you are running on Vercel, please add GEMINI_API_KEY in your Vercel Project Settings > Environment Variables.'
  );
}

/**
 * Returns diagnostic metadata about the secret source without exposing the secret itself.
 */
export async function getSecretStatus() {
  const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID || 'integrated-ai-project';
  const secretName = process.env.GEMINI_SECRET_NAME || 'default-ai-studio-api';

  try {
    await getGeminiApiKey();
    const now = Date.now();
    return {
      active: true,
      source: cachedSecret?.source || 'AI_STUDIO_DEFAULT_API',
      cached: !!cachedSecret,
      ttlRemainingSeconds: cachedSecret ? Math.max(0, Math.floor((cachedSecret.expiresAt - now) / 1000)) : 0,
      projectId,
      secretName: cachedSecret?.source === 'AI_STUDIO_DEFAULT_API' ? 'default-ai-studio-api' : secretName,
      maskedSnippet: cachedSecret?.value ? `...${cachedSecret.value.slice(-6)}` : 'N/A',
      labels: {
        'dev-tutorial': 'cloud-run-ai-challenge',
      },
    };
  } catch (err: any) {
    return {
      active: false,
      error: err.message,
      source: 'NONE',
      cached: false,
      ttlRemainingSeconds: 0,
      projectId,
      secretName,
      maskedSnippet: 'N/A',
      labels: {
        'dev-tutorial': 'cloud-run-ai-challenge',
      },
    };
  }
}
