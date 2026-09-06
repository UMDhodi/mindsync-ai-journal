/**
 * MindSync AI - Main Application Component (Editorial Aesthetic)
 * Production-grade Personal Gemini Journal & Brainstorming Engine
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { JournalHistory } from './components/JournalHistory.js';
import { JournalChat } from './components/JournalChat.js';
import { MindSyncInsights } from './components/MindSyncInsights.js';
import { ConceptGraph } from './components/ConceptGraph.js';
import { SecurityAuditModal } from './components/SecurityAuditModal.js';
import { E2EVaultModal } from './components/E2EVaultModal.js';
import { AuthModal } from './components/AuthModal.js';
import { SessionHistoryView } from './components/SessionHistoryView.js';
import { api } from './services/api.js';
import { localStore } from './services/localStore.js';
import { encryptText } from './services/crypto.js';
import {
  JournalSession,
  JournalMessage,
  CognitiveAnalysis,
  ConceptGraphData,
  SessionCategory,
} from './types.js';
import {
  BrainCircuit,
  Sparkles,
  Zap,
  TrendingUp,
  Network,
  Lock,
  Plus,
  ArrowLeft,
} from 'lucide-react';

function JournalWorkspace() {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<JournalSession | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [analysis, setAnalysis] = useState<CognitiveAnalysis | null>(null);
  const [graph, setGraph] = useState<ConceptGraphData | null>(null);

  const [activeView, setActiveView] = useState<'chat' | 'insights' | 'graph' | 'history'>('chat');
  const [isSending, setIsSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [graphing, setGraphing] = useState(false);

  // Modals & E2E Vault
  const [showSecurityAudit, setShowSecurityAudit] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState('');

  // Fetch sessions for active tenant
  const loadSessions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getSessions();
      setSessions(data);
      if (data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [user, selectedSessionId]);

  useEffect(() => {
    if (!loading && user?.uid) {
      loadSessions();
    }
  }, [user?.uid, loading, loadSessions]);

  // Fetch full details of selected session
  useEffect(() => {
    if (!selectedSessionId) {
      setActiveSession(null);
      setMessages([]);
      setAnalysis(null);
      setGraph(null);
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        const data = await api.getSession(selectedSessionId);
        setActiveSession(data.session);
        setMessages(data.messages || []);
        setAnalysis(data.analysis || null);
        setGraph(data.graph || null);
      } catch (err) {
        console.error('Failed to fetch session:', err);
      }
    };

    fetchSessionDetails();
  }, [selectedSessionId]);

  // Create Session handler
  const handleCreateSession = async (
    title: string,
    category: SessionCategory,
    isEncrypted: boolean
  ) => {
    try {
      const newSession = await api.createSession({
        title,
        category,
        isEncrypted,
      });
      setSessions((prev) => [newSession, ...prev]);
      setSelectedSessionId(newSession.id);
      setActiveView('chat');
    } catch (err: any) {
      console.error('Failed to create session:', err);
      alert('Error creating session: ' + err.message);
    }
  };

  // Delete Session handler
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await api.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
      }
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      alert('Error deleting session: ' + err.message);
    }
  };

  // Send Message handler with optional Client-Side Zero-Knowledge Encryption
  const handleSendMessage = async (content: string) => {
    if (!selectedSessionId || !activeSession) return;

    let finalContent = content;
    const isEncryptedSession = activeSession.isEncrypted;

    if (isEncryptedSession) {
      if (!vaultPassphrase) {
        setShowVaultModal(true);
        return;
      }
      try {
        finalContent = await encryptText(content, vaultPassphrase);
      } catch (err: any) {
        console.error('Encryption failed:', err);
        alert('Vault encryption error: ' + err.message);
        return;
      }
    }

    // Optimistic UI update: instantly append user reflection to stream
    const tempId = `temp-${Date.now()}`;
    const optimisticUserMessage: JournalMessage = {
      id: tempId,
      sessionId: selectedSessionId,
      userId: user?.uid || 'local',
      role: 'user',
      content: content,
      timestamp: new Date().toISOString(),
      isEncrypted: isEncryptedSession,
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setIsSending(true);

    try {
      const res = await api.sendMessage(selectedSessionId, finalContent, isEncryptedSession);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        res.userMessage,
        res.modelMessage,
      ]);

      // Cache locally for offline resilience
      localStore.saveMessage(selectedSessionId, res.userMessage);
      localStore.saveMessage(selectedSessionId, res.modelMessage);

      // Update session snippet in list
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSessionId
            ? {
                ...s,
                messageCount: s.messageCount + 2,
                lastMessageSnippet: content.slice(0, 80),
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert('Failed to send reflection: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Trigger Cognitive Analysis
  const handleTriggerAnalysis = async () => {
    if (!selectedSessionId) return;
    setAnalyzing(true);
    try {
      const result = await api.triggerAnalysis(selectedSessionId);
      setAnalysis(result);
      localStore.saveAnalysis(selectedSessionId, result);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSessionId
            ? {
                ...s,
                summary: result.summary,
                dominantEmotion: result.emotionalValence?.dominantEmotion,
                tags: result.keyThemes || ['MindSync'],
              }
            : s
        )
      );
    } catch (err: any) {
      console.error('Cognitive analysis failure:', err);
      alert('Cognitive Engine error: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Trigger Concept Graph
  const handleTriggerGraph = async () => {
    if (!selectedSessionId) return;
    setGraphing(true);
    try {
      const result = await api.triggerGraph(selectedSessionId);
      setGraph(result);
      localStore.saveGraph(selectedSessionId, result);
    } catch (err: any) {
      console.error('Concept graph failure:', err);
      alert('Thought graph error: ' + err.message);
    } finally {
      setGraphing(false);
    }
  };

  const handleUpdateSession = useCallback((sessionId: string, updates: Partial<JournalSession>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
    );
    setActiveSession((prev) => (prev && prev.id === sessionId ? { ...prev, ...updates } : prev));
  }, []);

  const handleSeedTemplate = (templateTitle: string, category: SessionCategory) => {
    handleCreateSession(templateTitle, category, false);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F6] dark:bg-[#0A0A0B] text-[#111827] dark:text-[#E0E0E0] flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      <Navbar
        onOpenSecurityAudit={() => setShowSecurityAudit(true)}
        onOpenVaultModal={() => setShowVaultModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onOpenHistory={() => setActiveView(activeView === 'history' ? 'chat' : 'history')}
        isVaultUnlocked={!!vaultPassphrase}
        activeView={activeView}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {!user ? (
          <div className="max-w-md mx-auto my-12 bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-8 text-center shadow-md dark:shadow-2xl space-y-5 transition-colors duration-200">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-xs rotate-45 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              <BrainCircuit className="w-6 h-6 text-[#0A0A0B] -rotate-45" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400 font-bold">
                Zero-Leakage Personal Intelligence
              </p>
              <h2 className="text-xl font-semibold text-[#111827] dark:text-white">
                Sign in to MINDSYNC <span className="italic font-serif text-indigo-600 dark:text-indigo-300">AI</span>
              </h2>
              <p className="text-xs text-[#4B5563] dark:text-[#888] leading-relaxed">
                Connect your account to access your personal reflection history, cognitive insights, and topological thought graph.
              </p>
            </div>
            <div className="pt-2">
              <button
                id="btn-main-signin"
                onClick={() => setShowAuthModal(true)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Sign In / Create Account</span>
              </button>
            </div>
          </div>
        ) : activeView === 'history' ? (
          <SessionHistoryView
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={(id) => {
              setSelectedSessionId(id);
              setActiveView('chat');
            }}
            onCreateSession={handleCreateSession}
            onDeleteSession={handleDeleteSession}
            onBackToWorkspace={() => setActiveView('chat')}
            isVaultUnlocked={!!vaultPassphrase}
          />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Timeline & Sessions (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-5 shadow-xs dark:shadow-2xl transition-colors duration-200">
            <JournalHistory
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              onSelectSession={(id) => {
                setSelectedSessionId(id);
                setActiveView('chat');
              }}
              onCreateSession={handleCreateSession}
              onDeleteSession={handleDeleteSession}
              onOpenFullHistory={() => setActiveView('history')}
              isVaultUnlocked={!!vaultPassphrase}
            />
          </div>

          {/* Right Column: Active Workspace (8 cols) */}
          <div className="lg:col-span-8">
            {activeSession ? (
              <div>
                {activeView === 'chat' && (
                  <JournalChat
                    session={activeSession}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onTriggerAnalysis={handleTriggerAnalysis}
                    onTriggerGraph={handleTriggerGraph}
                    onUpdateSession={handleUpdateSession}
                    vaultPassphrase={vaultPassphrase}
                    isSending={isSending}
                    activeView={activeView}
                    setActiveView={setActiveView}
                  />
                )}

                {activeView === 'insights' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setActiveView('chat')}
                        className="text-xs font-medium text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Dialogue
                      </button>
                      <span className="text-xs font-mono text-[#6B7280] dark:text-[#777]">
                        Session: <strong className="text-[#111827] dark:text-[#CCC]">{activeSession.title}</strong>
                      </span>
                    </div>
                    <MindSyncInsights
                      analysis={analysis}
                      loading={analyzing}
                      onRefreshAnalysis={handleTriggerAnalysis}
                      hasMessages={messages.length > 0}
                    />
                  </div>
                )}

                {activeView === 'graph' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setActiveView('chat')}
                        className="text-xs font-medium text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Dialogue
                      </button>
                      <span className="text-xs font-mono text-[#6B7280] dark:text-[#777]">
                        Session: <strong className="text-[#111827] dark:text-[#CCC]">{activeSession.title}</strong>
                      </span>
                    </div>
                    <ConceptGraph
                      graph={graph}
                      loading={graphing}
                      onRefreshGraph={handleTriggerGraph}
                      hasMessages={messages.length > 0}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Empty Workspace Landing - Editorial Aesthetic */
              <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-8 sm:p-10 space-y-6 text-center shadow-xs dark:shadow-2xl transition-colors duration-200">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-sm rotate-45 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                  <BrainCircuit className="w-7 h-7 text-[#0A0A0B] -rotate-45" />
                </div>
                <div className="max-w-lg mx-auto space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 font-bold">
                    Zero-Leakage Personal Intelligence
                  </p>
                  <h3 className="text-2xl font-light text-[#111827] dark:text-white leading-tight">
                    Welcome to <span className="font-semibold tracking-tighter">MINDSYNC</span>{' '}
                    <span className="italic font-serif text-indigo-600 dark:text-indigo-300">AI</span>
                  </h3>
                  <p className="text-xs text-[#4B5563] dark:text-[#888] leading-relaxed">
                    A secure personal cognitive journal engineered for Google Cloud Run, backed by Firebase Auth, Cloud Firestore with strict tenant data boundary isolation, and MindSync Cognitive Engine.
                  </p>
                </div>

                {/* Jumpstart Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto pt-2 text-xs">
                  <div
                    onClick={() =>
                      handleSeedTemplate('Strategic Priority & Unblocking Session', 'Strategic Planning')
                    }
                    className="p-4 rounded-sm border border-[#E2E4E8] dark:border-[#222] hover:border-indigo-500/50 bg-[#FAFAFC] dark:bg-[#111113] hover:bg-[#F2F3F8] dark:hover:bg-[#151518] transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#111827] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                        Strategic Unblocking
                      </span>
                      <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-[11px] text-[#4B5563] dark:text-[#777]">
                      Dissect high-stakes trade-offs, isolate bottlenecks, and extract linear action items.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      handleSeedTemplate('Deep Cognitive Reframing & Stoic Reflection', 'Deep Reflection')
                    }
                    className="p-4 rounded-sm border border-[#E2E4E8] dark:border-[#222] hover:border-emerald-500/50 bg-[#FAFAFC] dark:bg-[#111113] hover:bg-[#F2F3F8] dark:hover:bg-[#151518] transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#111827] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                        Cognitive Reframing
                      </span>
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-[#4B5563] dark:text-[#777]">
                      Identify friction, unpack limiting beliefs, and expand perspectives through Socratic inquiry.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      handleSeedTemplate('Divergent Concept Ideation & Thought Graph', 'Brainstorm')
                    }
                    className="p-4 rounded-sm border border-[#E2E4E8] dark:border-[#222] hover:border-sky-500/50 bg-[#FAFAFC] dark:bg-[#111113] hover:bg-[#F2F3F8] dark:hover:bg-[#151518] transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#111827] dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300">
                        Concept Mind Map
                      </span>
                      <Network className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <p className="text-[11px] text-[#4B5563] dark:text-[#777]">
                      Brainstorm spontaneously and let the engine construct a 2D topological thought graph.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      handleCreateSession('Encrypted Confidential Personal Journal', 'Personal', true)
                    }
                    className="p-4 rounded-sm border border-[#E2E4E8] dark:border-[#222] hover:border-purple-500/50 bg-[#FAFAFC] dark:bg-[#111113] hover:bg-[#F2F3F8] dark:hover:bg-[#151518] transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#111827] dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300">
                        Zero-Knowledge Vault
                      </span>
                      <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-[11px] text-[#4B5563] dark:text-[#777]">
                      End-to-End client-side AES-GCM 256-bit encryption for confidential personal thoughts.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleCreateSession('Untitled Reflection', 'Brainstorm', false)}
                    className="px-5 py-2.5 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide transition-colors inline-flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Start Blank Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <SecurityAuditModal
        isOpen={showSecurityAudit}
        onClose={() => setShowSecurityAudit(false)}
      />

      <E2EVaultModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
        vaultPassphrase={vaultPassphrase}
        onSetPassphrase={(p) => setVaultPassphrase(p)}
        onLockVault={() => setVaultPassphrase('')}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <JournalWorkspace />
      </AuthProvider>
    </ThemeProvider>
  );
}
