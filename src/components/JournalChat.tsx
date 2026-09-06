/**
 * Real-Time Multi-Turn Journaling & Brainstorming Chat Interface - Editorial Aesthetic
 * Features editorial typography, Socratic dialogue bubbles, and robust Auto-Save for
 * both session titles and ongoing drafts during deep reflection sessions.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Sparkles,
  Lock,
  ShieldAlert,
  Lightbulb,
  TrendingUp,
  Network,
  Check,
  Loader2,
  Cloud,
  Edit2,
  Trash2,
} from 'lucide-react';
import { JournalSession, JournalMessage } from '../types.js';
import { decryptText, isEncrypted } from '../services/crypto.js';
import { api } from '../services/api.js';
import { MarkdownView } from './MarkdownView.js';

interface JournalChatProps {
  session: JournalSession;
  messages: JournalMessage[];
  onSendMessage: (content: string) => Promise<void>;
  onTriggerAnalysis: () => void;
  onTriggerGraph: () => void;
  onUpdateSession?: (sessionId: string, updates: Partial<JournalSession>) => void;
  vaultPassphrase: string;
  isSending: boolean;
  activeView: 'chat' | 'insights' | 'graph';
  setActiveView: (view: 'chat' | 'insights' | 'graph') => void;
}

const QUICK_PROMPTS = [
  'What limiting assumption am I making about this challenge?',
  'Help me stress-test this strategy from 3 contrasting viewpoints.',
  'Brainstorm 5 unorthodox solutions prioritizing speed of execution.',
  'I feel overwhelmed by competing priorities. Help me find the linchpin task.',
];

export const JournalChat: React.FC<JournalChatProps> = ({
  session,
  messages,
  onSendMessage,
  onTriggerAnalysis,
  onTriggerGraph,
  onUpdateSession,
  vaultPassphrase,
  isSending,
  activeView,
  setActiveView,
}) => {
  // --- Title Auto-Save State ---
  const [titleText, setTitleText] = useState(session.title);
  const [titleSaveStatus, setTitleSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const titleDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // --- Draft Auto-Save State ---
  const [inputText, setInputText] = useState('');
  const [draftSaveStatus, setDraftSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const draftDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // --- Initialize Title & Restore Ongoing Draft on Session Change ---
  useEffect(() => {
    setTitleText(session.title);
    setTitleSaveStatus('idle');

    // Restore draft from local storage first (instant & crash-resistant), fallback to session draft
    const localDraftKey = `mindsync_draft_${session.id}`;
    const localDraft = localStorage.getItem(localDraftKey);

    if (localDraft !== null && localDraft.trim().length > 0) {
      setInputText(localDraft);
      setDraftSaveStatus('saved');
    } else if (session.draft && session.draft.trim().length > 0) {
      setInputText(session.draft);
      localStorage.setItem(localDraftKey, session.draft);
      setDraftSaveStatus('saved');
    } else {
      setInputText('');
      setDraftSaveStatus('idle');
    }

    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
    };
  }, [session.id]);

  // --- Session Title Auto-Save Handlers ---
  const persistTitle = useCallback(
    async (newTitle: string) => {
      const cleanTitle = newTitle.trim();
      if (!cleanTitle || cleanTitle === session.title) {
        setTitleSaveStatus('idle');
        return;
      }

      setTitleSaveStatus('saving');
      try {
        await api.updateSession(session.id, { title: cleanTitle });
        if (onUpdateSession) {
          onUpdateSession(session.id, { title: cleanTitle });
        }
        setTitleSaveStatus('saved');
        setTimeout(() => {
          setTitleSaveStatus((curr) => (curr === 'saved' ? 'idle' : curr));
        }, 2500);
      } catch (err) {
        console.error('Failed to auto-save title:', err);
        setTitleSaveStatus('error');
      }
    },
    [session.id, session.title, onUpdateSession]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleText(val);
    setTitleSaveStatus('saving');

    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
    }
    titleDebounceRef.current = setTimeout(() => {
      persistTitle(val);
    }, 700);
  };

  const handleTitleBlur = () => {
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
    }
    persistTitle(titleText);
  };

  // --- Draft Auto-Save Handlers ---
  const persistDraft = useCallback(
    async (text: string) => {
      try {
        await api.updateSession(session.id, { draft: text });
        if (onUpdateSession) {
          onUpdateSession(session.id, { draft: text });
        }
        setDraftSaveStatus('saved');
        setLastDraftSavedAt(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      } catch (err) {
        console.error('Failed to auto-save draft to cloud:', err);
        setDraftSaveStatus('error');
      }
    },
    [session.id, onUpdateSession]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    // 1. Immediately persist to localStorage for instant recovery
    const localDraftKey = `mindsync_draft_${session.id}`;
    if (val.trim()) {
      localStorage.setItem(localDraftKey, val);
      setDraftSaveStatus('saving');
    } else {
      localStorage.removeItem(localDraftKey);
      setDraftSaveStatus('idle');
    }

    // 2. Debounce cloud persistence
    if (draftDebounceRef.current) {
      clearTimeout(draftDebounceRef.current);
    }

    draftDebounceRef.current = setTimeout(() => {
      persistDraft(val);
    }, 850);
  };

  const handleDiscardDraft = () => {
    if (confirm('Discard current reflection draft?')) {
      setInputText('');
      localStorage.removeItem(`mindsync_draft_${session.id}`);
      setDraftSaveStatus('idle');
      setLastDraftSavedAt(null);
      if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
      api.updateSession(session.id, { draft: '' }).catch(console.error);
      if (onUpdateSession) onUpdateSession(session.id, { draft: '' });
    }
  };

  // Attempt decryption of any encrypted messages if vaultPassphrase is present
  useEffect(() => {
    const decryptAll = async () => {
      const decryptedMap: Record<string, string> = {};
      for (const m of messages) {
        if (isEncrypted(m.content)) {
          if (vaultPassphrase) {
            try {
              decryptedMap[m.id] = await decryptText(m.content, vaultPassphrase);
            } catch {
              decryptedMap[m.id] = '[🔒 Decryption Failed: Invalid Passphrase]';
            }
          } else {
            decryptedMap[m.id] = '[🔒 Client-Encrypted: Unlock E2E Vault in Navbar to read]';
          }
        }
      }
      setDecryptedMessages(decryptedMap);
    };

    decryptAll();
  }, [messages, vaultPassphrase]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    if (draftDebounceRef.current) {
      clearTimeout(draftDebounceRef.current);
    }

    const textToSend = inputText.trim();

    // Clear local & ongoing draft immediately upon sending
    setInputText('');
    localStorage.removeItem(`mindsync_draft_${session.id}`);
    setDraftSaveStatus('idle');
    setLastDraftSavedAt(null);

    // Clear backend draft concurrently
    api.updateSession(session.id, { draft: '' }).catch(() => {});
    if (onUpdateSession) {
      onUpdateSession(session.id, { draft: '' });
    }

    await onSendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white dark:bg-[#050506] rounded-sm border border-[#E2E4E8] dark:border-[#222] overflow-hidden shadow-md dark:shadow-2xl transition-colors duration-200">
      {/* Session Header & Editorial Top Bar */}
      <div className="px-6 py-4 border-b border-[#E2E4E8] dark:border-[#222] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9FAFC] dark:bg-[#0A0A0B]/80 transition-colors duration-200">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400 font-bold">
              {session.category}
            </p>
            <span className="text-[#9CA3AF] dark:text-[#444]">&bull;</span>
            <span className="text-[10px] uppercase font-mono text-[#6B7280] dark:text-[#666]">
              {new Date(session.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {session.isEncrypted && (
              <span className="px-2 py-0.5 rounded-sm text-[9px] font-mono uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1 font-medium">
                <Lock className="w-2.5 h-2.5" />
                AES-GCM
              </span>
            )}
          </div>

          {/* Inline Auto-Saving Title Field */}
          <div className="flex items-center gap-2 max-w-xl">
            <div className="relative flex-1">
              <input
                id="input-session-title"
                type="text"
                value={titleText}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="text-base sm:text-lg font-light text-[#111827] dark:text-white tracking-tight leading-snug bg-transparent border border-transparent hover:border-[#CBD0D8] dark:hover:border-[#2a2a2e] focus:border-indigo-500/60 focus:bg-[#F3F4F6] dark:focus:bg-[#111114] px-1.5 py-0.5 rounded-sm transition-all outline-none w-full truncate"
                placeholder="Untitled Reflection..."
                title="Click to rename session (auto-saves)"
              />
            </div>

            {/* Title Auto-Save Status Indicators */}
            {titleSaveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400 shrink-0">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            {titleSaveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0 animate-in fade-in">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
          </div>
        </div>

        {/* View Toggle Bar (Editorial Pill Switcher) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#F0F1F5] dark:bg-[#141416] p-1 rounded-sm border border-[#E2E4E8] dark:border-[#222]">
          <button
            onClick={() => setActiveView('chat')}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
              activeView === 'chat'
                ? 'bg-white dark:bg-[#222226] text-[#111827] dark:text-white shadow-xs'
                : 'text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-white'
            }`}
          >
            Dialogue
          </button>
          <button
            id="tab-insights"
            onClick={() => {
              setActiveView('insights');
              if (messages.length > 0) onTriggerAnalysis();
            }}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeView === 'insights'
                ? 'bg-white dark:bg-[#222226] text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Insights</span>
          </button>
          <button
            id="tab-graph"
            onClick={() => {
              setActiveView('graph');
              if (messages.length > 0) onTriggerGraph();
            }}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeView === 'graph'
                ? 'bg-white dark:bg-[#222226] text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Node Map</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        {messages.length === 0 && !isSending ? (
          <div className="min-h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-4 space-y-5 my-auto">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 rounded-sm rotate-45 flex items-center justify-center border border-indigo-500/30 shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 -rotate-45" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#6B7280] dark:text-[#666] font-semibold">
                Cognitive Workspace Ready
              </p>
              <h3 className="text-xl sm:text-2xl font-light text-[#111827] dark:text-white leading-tight font-serif">
                Refining your <span className="italic font-serif text-indigo-600 dark:text-indigo-300">perspectives</span> and architecture.
              </h3>
              <p className="text-xs text-[#4B5563] dark:text-[#888] leading-relaxed max-w-md">
                Unpack complex dilemmas, dissect organizational bottlenecks, or brainstorm spontaneously. Drafts and session titles are automatically preserved as you write.
              </p>
            </div>

            {/* Quick Prompts to Jumpstart */}
            <div className="w-full space-y-2 pt-2 text-left">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#666] block text-center">
                Socratic Prompts to Jumpstart
              </span>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(qp)}
                    className="p-3 rounded-sm border border-[#E2E4E8] dark:border-[#222] hover:border-indigo-500/40 bg-[#FAFAFC] dark:bg-[#0E0E10] hover:bg-[#F3F4F8] dark:hover:bg-[#141417] text-[#374151] dark:text-[#CCC] hover:text-[#111827] dark:hover:text-white text-xs text-left transition-colors flex items-center gap-3 group shadow-2xs"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:text-amber-500 shrink-0" />
                    <span className="truncate">{qp}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const displayText = decryptedMessages[msg.id] || msg.content;

            return (
              <div
                key={msg.id}
                className="flex gap-4 text-xs sm:text-sm leading-relaxed animate-in fade-in duration-150"
              >
                {/* Avatar Badge */}
                {isUser ? (
                  <div className="w-8 h-8 rounded-full bg-[#E5E7EB] dark:bg-[#222] text-[#374151] dark:text-[#CCC] flex-shrink-0 flex items-center justify-center text-[10px] font-bold tracking-wider shadow-2xs">
                    YOU
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/40 flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-2xs">
                    MS
                  </div>
                )}

                {/* Message Body */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#6B7280] dark:text-[#666]">
                    <span className="uppercase tracking-wider font-semibold text-[#4B5563] dark:text-[#888]">
                      {isUser ? 'Journal Reflection' : 'MindSync Cognitive Model'}
                    </span>
                    <span>&bull;</span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-sm border shadow-xs ${
                      isUser
                        ? 'bg-[#F3F4F7] dark:bg-[#141417] text-[#111827] dark:text-[#E0E0E0] border-[#E2E4E8] dark:border-[#26262a]'
                        : 'bg-white dark:bg-[#0E0E10] text-[#1F2937] dark:text-[#D8D8DF] border-[#E2E4E8] dark:border-[#1F1F22]'
                    }`}
                  >
                    <MarkdownView content={displayText} isUser={isUser} />

                    {/* STRIDE heuristic safety scanner notice */}
                    {msg.safetyFlagged && (
                      <div className="mt-2.5 flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 rounded-sm text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Input passed STRIDE heuristic prompt inspection.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex gap-4 items-start text-xs text-[#6B7280] dark:text-[#888] animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/40 flex-shrink-0 flex items-center justify-center text-[10px] font-bold animate-pulse">
              MS
            </div>
            <div className="p-3 bg-white dark:bg-[#0E0E10] border border-[#E2E4E8] dark:border-[#222] rounded-sm flex items-center gap-2 shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-300/80 ml-1">
                MindSync is synthesizing perspective...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Editorial Input Composer with Ongoing Draft Auto-Save */}
      <div className="p-4 sm:p-5 border-t border-[#E2E4E8] dark:border-[#222] bg-[#F9FAFC] dark:bg-[#0A0A0B] space-y-2 transition-colors duration-200">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            id="input-chat-message"
            rows={2}
            placeholder={
              session.isEncrypted && !vaultPassphrase
                ? 'Unlock E2E Vault in top navbar to send encrypted thoughts...'
                : 'Reflect on your thoughts, architectural trade-offs, or decisions... (Enter to send, Shift+Enter for newline)'
            }
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isSending || (session.isEncrypted && !vaultPassphrase)}
            className="w-full bg-white dark:bg-[#111114] border border-[#E2E4E8] dark:border-[#2a2a2e] rounded-sm py-3 pl-4 pr-16 text-xs sm:text-sm text-[#111827] dark:text-[#E0E0E0] placeholder-[#9CA3AF] dark:placeholder-[#555] focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 resize-none min-h-[58px] max-h-[160px]"
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            {session.isEncrypted && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-mono hidden sm:inline">
                Encrypted
              </span>
            )}

            <button
              id="btn-send-message"
              type="submit"
              disabled={!inputText.trim() || isSending || (session.isEncrypted && !vaultPassphrase)}
              className="p-2 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs"
              title="Send Reflection (Enter)"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Composer Auto-Save & Status Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] dark:text-[#666] px-1">
          <div className="flex items-center gap-3">
            {draftSaveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Auto-saving draft...</span>
              </span>
            )}
            {draftSaveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3 h-3" />
                <span>
                  Draft saved {lastDraftSavedAt ? `at ${lastDraftSavedAt}` : 'locally & vault'}
                </span>
              </span>
            )}
            {draftSaveStatus === 'idle' && inputText.trim().length > 0 && (
              <span className="flex items-center gap-1.5 text-[#4B5563] dark:text-[#888]">
                <Cloud className="w-3 h-3 text-[#6B7280] dark:text-[#666]" />
                <span>Draft preserved</span>
              </span>
            )}

            {inputText.trim().length > 0 && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-[#6B7280] dark:text-[#666] hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 text-[10px]"
                title="Clear current draft"
              >
                <Trash2 className="w-2.5 h-2.5" />
                <span>Clear draft</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {wordCount > 0 && (
              <span className="text-[#4B5563] dark:text-[#777]">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
            )}
            <span className="hidden sm:inline text-[#9CA3AF] dark:text-[#555] text-[10px]">
              Shift+Enter for newline
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
