/**
 * Client-side Storage Fallback
 * Provides instant, zero-latency session persistence using localStorage
 * if the serverless backend is cold-starting, unconfigured, or unreachable.
 */
import {
  JournalSession,
  JournalMessage,
  CognitiveAnalysis,
  ConceptGraphData,
  SessionCategory,
} from '../types.js';

const SESSIONS_KEY = 'mindsync_local_sessions';
const MESSAGES_PREFIX = 'mindsync_local_msgs_';
const ANALYSIS_PREFIX = 'mindsync_local_analysis_';
const GRAPH_PREFIX = 'mindsync_local_graph_';

export const localStore = {
  getSessions(): JournalSession[] {
    try {
      const data = localStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  createSession(params: {
    title?: string;
    category?: SessionCategory;
    isEncrypted?: boolean;
    tags?: string[];
  }): JournalSession {
    const sessions = this.getSessions();
    const newSession: JournalSession = {
      id: `local-session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: 'active-user',
      title: params.title || 'Untitled Reflection',
      category: params.category || 'Brainstorm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      isEncrypted: params.isEncrypted || false,
      tags: params.tags || [],
    };
    sessions.unshift(newSession);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
    return newSession;
  },

  getSession(sessionId: string): {
    session: JournalSession | null;
    messages: JournalMessage[];
    analysis: CognitiveAnalysis | null;
    graph: ConceptGraphData | null;
  } {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId) || null;
    let messages: JournalMessage[] = [];
    let analysis: CognitiveAnalysis | null = null;
    let graph: ConceptGraphData | null = null;

    try {
      const msgData = localStorage.getItem(MESSAGES_PREFIX + sessionId);
      if (msgData) messages = JSON.parse(msgData);

      const analysisData = localStorage.getItem(ANALYSIS_PREFIX + sessionId);
      if (analysisData) analysis = JSON.parse(analysisData);

      const graphData = localStorage.getItem(GRAPH_PREFIX + sessionId);
      if (graphData) graph = JSON.parse(graphData);
    } catch {
      // fallback
    }

    return { session, messages, analysis, graph };
  },

  updateSession(sessionId: string, updates: Partial<JournalSession>): JournalSession | null {
    const sessions = this.getSessions();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;

    sessions[idx] = {
      ...sessions[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch {}
    return sessions[idx];
  },

  deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      localStorage.removeItem(MESSAGES_PREFIX + sessionId);
      localStorage.removeItem(ANALYSIS_PREFIX + sessionId);
      localStorage.removeItem(GRAPH_PREFIX + sessionId);
    } catch {}
  },

  saveMessage(sessionId: string, message: JournalMessage): void {
    const { messages } = this.getSession(sessionId);
    messages.push(message);
    try {
      localStorage.setItem(MESSAGES_PREFIX + sessionId, JSON.stringify(messages));
    } catch {}

    this.updateSession(sessionId, {
      messageCount: messages.length,
      lastMessageSnippet: message.content.slice(0, 80),
    });
  },

  saveAnalysis(sessionId: string, analysis: CognitiveAnalysis): void {
    try {
      localStorage.setItem(ANALYSIS_PREFIX + sessionId, JSON.stringify(analysis));
    } catch {}
    this.updateSession(sessionId, {
      summary: analysis.summary,
      dominantEmotion: analysis.emotionalValence?.dominantEmotion,
      tags: analysis.keyThemes,
    });
  },

  saveGraph(sessionId: string, graph: ConceptGraphData): void {
    try {
      localStorage.setItem(GRAPH_PREFIX + sessionId, JSON.stringify(graph));
    } catch {}
  },
};
