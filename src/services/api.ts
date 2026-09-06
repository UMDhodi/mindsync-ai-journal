/**
 * MindSync API Client
 * Injects authenticated Firebase Bearer Token and manages REST communication with the backend.
 */
import {
  JournalSession,
  JournalMessage,
  CognitiveAnalysis,
  ConceptGraphData,
  SecurityAuditTelemetry,
  SessionCategory,
} from '../types.js';
import { localStore } from './localStore.js';

let tokenProvider: (() => Promise<string | null>) | null = null;

export function setTokenProvider(provider: () => Promise<string | null>) {
  tokenProvider = provider;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  let token: string | null = null;
  if (tokenProvider) {
    try {
      token = await tokenProvider();
    } catch (err) {
      console.warn('[API Client] Error resolving auth token:', err);
    }
  }

  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      // Safely read response text once without multiple stream consumptions
      const rawText = await response.text();
      try {
        const errJson = JSON.parse(rawText);
        errorDetail = errJson.error || errJson.message || errJson.detail || rawText;
      } catch {
        if (rawText.includes('FUNCTION_INVOCATION_FAILED')) {
          errorDetail =
            'Vercel Serverless Function Invocation Failed. Please ensure GEMINI_API_KEY is configured in Vercel Project Settings > Environment Variables, and check Vercel Function logs.';
        } else {
          errorDetail = rawText;
        }
      }
    } catch {
      errorDetail = `HTTP Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

export const api = {
  async getSessions(): Promise<JournalSession[]> {
    try {
      const data = await fetchWithAuth('/api/sessions');
      return data.sessions || [];
    } catch (err) {
      console.warn('[API] Server sessions unavailable, using local cache:', err);
      return localStore.getSessions();
    }
  },

  async createSession(params: {
    title?: string;
    category?: SessionCategory;
    isEncrypted?: boolean;
    tags?: string[];
  }): Promise<JournalSession> {
    try {
      const data = await fetchWithAuth('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      // Also cache locally for offline/resilience
      if (data?.session) {
        try {
          const localSessions = localStore.getSessions();
          if (!localSessions.some((s) => s.id === data.session.id)) {
            localSessions.unshift(data.session);
            localStorage.setItem('mindsync_local_sessions', JSON.stringify(localSessions));
          }
        } catch {}
        return data.session;
      }
    } catch (err) {
      console.warn('[API] Server createSession failed, falling back to local storage:', err);
      return localStore.createSession(params);
    }
    return localStore.createSession(params);
  },

  async getSession(sessionId: string): Promise<{
    session: JournalSession;
    messages: JournalMessage[];
    analysis: CognitiveAnalysis | null;
    graph: ConceptGraphData | null;
  }> {
    try {
      return await fetchWithAuth(`/api/sessions/${sessionId}`);
    } catch (err) {
      console.warn(`[API] getSession(${sessionId}) failed, reading from localStore:`, err);
      const localData = localStore.getSession(sessionId);
      if (localData.session) {
        return {
          session: localData.session,
          messages: localData.messages,
          analysis: localData.analysis,
          graph: localData.graph,
        };
      }
      throw err;
    }
  },

  async updateSession(
    sessionId: string,
    updates: {
      title?: string;
      draft?: string;
      category?: SessionCategory;
      tags?: string[];
    }
  ): Promise<JournalSession> {
    localStore.updateSession(sessionId, updates);
    try {
      const data = await fetchWithAuth(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return data.session;
    } catch (err) {
      console.warn(`[API] updateSession(${sessionId}) server sync failed, kept locally:`, err);
      const local = localStore.getSession(sessionId);
      if (local.session) return local.session;
      throw err;
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    localStore.deleteSession(sessionId);
    try {
      await fetchWithAuth(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn(`[API] deleteSession server failed:`, err);
    }
  },

  async sendMessage(
    sessionId: string,
    content: string,
    isEncrypted = false
  ): Promise<{
    userMessage: JournalMessage;
    modelMessage: JournalMessage;
    safety: { flagged: boolean; detectedPatterns: string[]; warnings?: string[] };
  }> {
    try {
      return await fetchWithAuth(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, isEncrypted }),
      });
    } catch (err: any) {
      console.warn('[API] Server sendMessage failed, using resilient offline fallback:', err);
      const userMessage: JournalMessage = {
        id: `msg_local_${Date.now()}_u`,
        sessionId,
        userId: 'offline-user',
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        isEncrypted,
      };

      const isKeyOrVercel =
        err?.message?.includes('Vercel') ||
        err?.message?.includes('FUNCTION_INVOCATION_FAILED') ||
        err?.message?.includes('GEMINI_API_KEY');

      const fallbackNote = isKeyOrVercel
        ? `I have securely recorded your reflection. 💡 **Vercel Setup Reminder**: If running on Vercel, make sure you have added **\`GEMINI_API_KEY\`** in your **Vercel Dashboard → Project Settings → Environment Variables**.`
        : `Your reflection was saved locally. (The AI server is temporarily unreachable: ${err?.message?.slice(0, 100) || 'network issue'}). You can continue journaling uninterrupted.`;

      const modelMessage: JournalMessage = {
        id: `msg_local_${Date.now()}_m`,
        sessionId,
        userId: 'offline-user',
        role: 'model',
        content: fallbackNote,
        timestamp: new Date().toISOString(),
        isEncrypted: false,
      };

      localStore.saveMessage(sessionId, userMessage);
      localStore.saveMessage(sessionId, modelMessage);

      return {
        userMessage,
        modelMessage,
        safety: { flagged: false, detectedPatterns: [] },
      };
    }
  },

  async triggerAnalysis(sessionId: string): Promise<CognitiveAnalysis> {
    const data = await fetchWithAuth(`/api/sessions/${sessionId}/analyze`, {
      method: 'POST',
    });
    return data.analysis;
  },

  async triggerGraph(sessionId: string): Promise<ConceptGraphData> {
    const data = await fetchWithAuth(`/api/sessions/${sessionId}/graph`, {
      method: 'POST',
    });
    return data.graph;
  },

  async getSecurityAudit(): Promise<SecurityAuditTelemetry> {
    return fetchWithAuth('/api/security/audit');
  },
};
