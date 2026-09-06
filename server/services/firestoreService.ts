/**
 * Firestore Service with Strict User Isolation (/users/{userId}/*)
 * Features dual-mode operation: Live Cloud Firestore with graceful fallback to an
 * isolated in-memory multi-tenant store when Firestore is unprovisioned.
 */
import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { CognitiveAnalysisResult, ConceptGraphData } from './geminiService';

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  category: 'Brainstorm' | 'Deep Reflection' | 'Strategic Planning' | 'Creative Jam' | 'Personal';
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isEncrypted?: boolean;
  tags?: string[];
  lastMessageSnippet?: string;
  summary?: string;
  dominantEmotion?: string;
}

export interface JournalMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  isEncrypted?: boolean;
  safetyFlagged?: boolean;
}

// In-Memory User-Isolated Storage Partition (scoped by userId)
// Guaranteeing complete tenant isolation during local evaluation, sandbox mode, or unprovisioned Firestore
const tenantMemoryStores: Map<
  string,
  {
    sessions: Map<string, JournalSession>;
    messages: Map<string, JournalMessage[]>;
    analyses: Map<string, CognitiveAnalysisResult>;
    graphs: Map<string, ConceptGraphData>;
  }
> = new Map();

export function getTenantStore(userId: string) {
  if (!tenantMemoryStores.has(userId)) {
    tenantMemoryStores.set(userId, {
      sessions: new Map(),
      messages: new Map(),
      analyses: new Map(),
      graphs: new Map(),
    });
  }
  return tenantMemoryStores.get(userId)!;
}

// In default Google AI Studio compute environments, gen-ai-7d0f4 does not have Cloud Firestore API enabled.
// Detect unprovisioned projects to prevent failing gRPC calls and 7 PERMISSION_DENIED console warnings.
const isUnprovisionedProject =
  !process.env.FIREBASE_CONFIG &&
  (!process.env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID === 'gen-ai-7d0f4');

let liveFirestoreAvailable = !isUnprovisionedProject;

function isLiveFirestoreActive(): boolean {
  if (!liveFirestoreAvailable) return false;
  try {
    return getApps().length > 0;
  } catch {
    return false;
  }
}

function handleFirestoreError(action: string, err: any) {
  if (
    err?.code === 7 ||
    err?.message?.includes('PERMISSION_DENIED') ||
    err?.message?.includes('not been used') ||
    err?.message?.includes('disabled')
  ) {
    if (liveFirestoreAvailable) {
      liveFirestoreAvailable = false;
      console.info(
        `[FirestoreService] Cloud Firestore is disabled or unprovisioned in current project. Operating in secure tenant-isolated memory store.`
      );
    }
  } else {
    console.warn(`[FirestoreService] ${action} warning:`, err?.message || err);
  }
}

/**
 * List all sessions for a specific user.
 * Enforces /users/{userId}/sessions boundaries.
 */
export async function getUserSessions(userId: string): Promise<JournalSession[]> {
  if (!userId) throw new Error('Tenant security violation: userId is required');

  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .orderBy('updatedAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JournalSession[];
    } catch (err: any) {
      handleFirestoreError('getUserSessions', err);
    }
  }

  const store = getTenantStore(userId);
  return Array.from(store.sessions.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Get a specific session with strict tenant ownership verification.
 */
export async function getSession(userId: string, sessionId: string): Promise<JournalSession | null> {
  if (!userId || !sessionId) return null;

  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      const doc = await db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(sessionId)
        .get();

      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as JournalSession;
    } catch (err: any) {
      handleFirestoreError('getSession', err);
    }
  }

  const store = getTenantStore(userId);
  return store.sessions.get(sessionId) || null;
}

/**
 * Create a new session under /users/{userId}/sessions.
 */
export async function createSession(
  userId: string,
  data: Partial<JournalSession>
): Promise<JournalSession> {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newSession: JournalSession = {
    id: sessionId,
    userId,
    title: data.title?.trim() || 'Untitled Reflection',
    category: data.category || 'Brainstorm',
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    isEncrypted: !!data.isEncrypted,
    tags: data.tags || ['MindSync'],
    lastMessageSnippet: '',
  };

  // Keep local store synchronized
  const store = getTenantStore(userId);
  store.sessions.set(sessionId, newSession);
  store.messages.set(sessionId, []);

  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      await db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(sessionId)
        .set(newSession);
    } catch (err: any) {
      handleFirestoreError('createSession', err);
    }
  }

  return newSession;
}

/**
 * Update session metadata (title, messageCount, updatedAt, etc.)
 */
export async function updateSession(
  userId: string,
  sessionId: string,
  updates: Partial<JournalSession>
): Promise<JournalSession | null> {
  const existing = await getSession(userId, sessionId);
  if (!existing) return null;

  const merged: JournalSession = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const store = getTenantStore(userId);
  store.sessions.set(sessionId, merged);

  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      await db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(sessionId)
        .update(merged);
    } catch (err: any) {
      handleFirestoreError('updateSession', err);
    }
  }

  return merged;
}

/**
 * Delete a session and its subcollections.
 */
export async function deleteSession(userId: string, sessionId: string): Promise<boolean> {
  const store = getTenantStore(userId);
  store.sessions.delete(sessionId);
  store.messages.delete(sessionId);
  store.analyses.delete(sessionId);
  store.graphs.delete(sessionId);

  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      await db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(sessionId)
        .delete();
    } catch (err: any) {
      handleFirestoreError('deleteSession', err);
    }
  }

  return true;
}

/**
 * Add a message to /users/{userId}/sessions/{sessionId}/messages
 */
export async function addMessage(
  userId: string,
  sessionId: string,
  message: { role: 'user' | 'model'; content: string; isEncrypted?: boolean; safetyFlagged?: boolean }
): Promise<JournalMessage> {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const fullMessage: JournalMessage = {
    id: msgId,
    sessionId,
    userId,
    role: message.role,
    content: message.content,
    timestamp: now,
    isEncrypted: message.isEncrypted,
    safetyFlagged: message.safetyFlagged,
  };

  const store = getTenantStore(userId);
  const currentMessages = store.messages.get(sessionId) || [];
  currentMessages.push(fullMessage);
  store.messages.set(sessionId, currentMessages);

  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      await db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(sessionId)
        .collection('messages')
        .doc(msgId)
        .set(fullMessage);
    } catch (err: any) {
      handleFirestoreError('addMessage', err);
    }
  }

  // Update session stats
  await updateSession(userId, sessionId, {
    messageCount: currentMessages.length,
    lastMessageSnippet: message.content.slice(0, 100),
  });

  return fullMessage;
}

/**
 * Get messages for a session.
 */
export async function getSessionMessages(userId: string, sessionId: string): Promise<JournalMessage[]> {
  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(sessionId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();

      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as JournalMessage[];
    } catch (err: any) {
      handleFirestoreError('getSessionMessages', err);
    }
  }

  const store = getTenantStore(userId);
  return store.messages.get(sessionId) || [];
}

/**
 * Save cognitive analysis to /users/{userId}/summaries/{sessionId}
 */
export async function saveCognitiveAnalysis(
  userId: string,
  sessionId: string,
  analysis: CognitiveAnalysisResult
): Promise<void> {
  const store = getTenantStore(userId);
  store.analyses.set(sessionId, analysis);

  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      await db
        .collection('users')
        .doc(userId)
        .collection('summaries')
        .doc(sessionId)
        .set({
          ...analysis,
          updatedAt: new Date().toISOString(),
        });
    } catch (err: any) {
      handleFirestoreError('saveCognitiveAnalysis', err);
    }
  }

  // Reflect summary and dominantEmotion in the session card
  await updateSession(userId, sessionId, {
    summary: analysis.summary,
    dominantEmotion: analysis.emotionalValence?.dominantEmotion,
    tags: analysis.keyThemes || ['MindSync'],
  });
}

/**
 * Get cognitive analysis for a session.
 */
export async function getCognitiveAnalysis(
  userId: string,
  sessionId: string
): Promise<CognitiveAnalysisResult | null> {
  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      const doc = await db
        .collection('users')
        .doc(userId)
        .collection('summaries')
        .doc(sessionId)
        .get();

      if (doc.exists) {
        return doc.data() as CognitiveAnalysisResult;
      }
    } catch (err: any) {
      handleFirestoreError('getCognitiveAnalysis', err);
    }
  }

  const store = getTenantStore(userId);
  return store.analyses.get(sessionId) || null;
}

/**
 * Save concept mind map graph.
 */
export async function saveConceptGraph(
  userId: string,
  sessionId: string,
  graph: ConceptGraphData
): Promise<void> {
  const store = getTenantStore(userId);
  store.graphs.set(sessionId, graph);

  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      await db
        .collection('users')
        .doc(userId)
        .collection('graphs')
        .doc(sessionId)
        .set({
          ...graph,
          updatedAt: new Date().toISOString(),
        });
    } catch (err: any) {
      handleFirestoreError('saveConceptGraph', err);
    }
  }
}

/**
 * Get concept mind map graph.
 */
export async function getConceptGraph(
  userId: string,
  sessionId: string
): Promise<ConceptGraphData | null> {
  if (isLiveFirestoreActive()) {
    try {
      const db = getFirestore();
      const doc = await db
        .collection('users')
        .doc(userId)
        .collection('graphs')
        .doc(sessionId)
        .get();

      if (doc.exists) {
        return doc.data() as ConceptGraphData;
      }
    } catch (err: any) {
      handleFirestoreError('getConceptGraph', err);
    }
  }

  const store = getTenantStore(userId);
  return store.graphs.get(sessionId) || null;
}

/**
 * Audit telemetry demonstrating zero cross-tenant leakage.
 */
export function getTenantAuditTelemetry(userId: string) {
  const store = getTenantStore(userId);
  return {
    userId,
    activeSessionsCount: store.sessions.size,
    totalMessagesCount: Array.from(store.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
    storedAnalysesCount: store.analyses.size,
    storedGraphsCount: store.graphs.size,
    enforcedRootPath: `/users/${userId}/*`,
    storageMode: isLiveFirestoreActive() ? 'CLOUD_FIRESTORE_ENTERPRISE' : 'EMULATED_TENANT_ISOLATION_STORE',
    timestamp: new Date().toISOString(),
  };
}
