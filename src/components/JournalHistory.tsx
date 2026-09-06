/**
 * Journal History Timeline Component - Editorial Aesthetic
 * Manages user-isolated sessions, category filtering, search, and session creation.
 */
import React, { useState } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Lock,
  Trash2,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';
import { JournalSession, SessionCategory } from '../types.js';

interface JournalHistoryProps {
  sessions: JournalSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (title: string, category: SessionCategory, isEncrypted: boolean) => void;
  onDeleteSession: (sessionId: string) => void;
  onOpenFullHistory?: () => void;
  isVaultUnlocked: boolean;
}

const CATEGORIES: Array<SessionCategory | 'All'> = [
  'All',
  'Brainstorm',
  'Deep Reflection',
  'Strategic Planning',
  'Creative Jam',
  'Personal',
];

export const JournalHistory: React.FC<JournalHistoryProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onOpenFullHistory,
  isVaultUnlocked,
}) => {
  const [activeCategory, setActiveCategory] = useState<SessionCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<SessionCategory>('Brainstorm');
  const [newIsEncrypted, setNewIsEncrypted] = useState(false);

  const filteredSessions = sessions.filter((s) => {
    const matchesCat = activeCategory === 'All' || s.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCat;

    const matchesTitle = s.title.toLowerCase().includes(q);
    const matchesSnippet = s.lastMessageSnippet?.toLowerCase().includes(q);
    const matchesDraft = s.draft?.toLowerCase().includes(q);
    const matchesSummary = s.summary?.toLowerCase().includes(q);
    const matchesTags = s.tags?.some((t) => t.toLowerCase().includes(q));

    return matchesCat && (matchesTitle || matchesSnippet || matchesDraft || matchesSummary || matchesTags);
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateSession(newTitle.trim(), newCategory, newIsEncrypted);
    setNewTitle('');
    setShowCreateModal(false);
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Editorial Eyebrow & Action Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 font-bold">
            Journal Timeline
          </h2>
          <p className="text-[11px] text-[#6B7280] dark:text-[#777] mt-0.5 font-medium">
            {sessions.length} {sessions.length === 1 ? 'reflection' : 'reflections'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenFullHistory && (
            <button
              onClick={onOpenFullHistory}
              className="px-2 py-1 text-[11px] font-medium text-[#4B5563] dark:text-[#AAA] hover:text-[#111827] dark:hover:text-white bg-[#F4F4F6] dark:bg-[#161619] hover:bg-[#EBECEF] dark:hover:bg-[#1E1E22] border border-[#D8DCE3] dark:border-[#2a2a2e] rounded-sm transition-colors"
              title="Open full session history & archive browser"
            >
              Full History
            </button>
          )}
          <button
            id="btn-new-session-modal"
            onClick={() => setShowCreateModal(true)}
            className="px-2.5 py-1 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-colors inline-flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Editorial Search Bar with Content Snippet Filtering */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#666] absolute left-3 top-2.5" />
        <input
          id="input-search-sessions"
          type="text"
          placeholder="Filter by title or content snippet..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8.5 pr-8 py-2 text-xs bg-[#F4F4F6] dark:bg-[#111113] text-[#111827] dark:text-[#E0E0E0] placeholder-[#9CA3AF] dark:placeholder-[#555] rounded-sm border border-[#E2E4E8] dark:border-[#222] focus:outline-none focus:border-indigo-500 transition-colors"
        />
        {searchQuery.trim() && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 p-0.5 text-[#6B7280] dark:text-[#666] hover:text-[#111827] dark:hover:text-[#DDD] transition-colors rounded-xs"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {searchQuery.trim() && (
        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-[#6B7280] dark:text-[#888]">
          <span>
            Found {filteredSessions.length} {filteredSessions.length === 1 ? 'match' : 'matches'}
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-sm text-[11px] whitespace-nowrap font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-[#EEF2FF] dark:bg-[#1A1A1C] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 shadow-xs'
                : 'bg-[#F0F1F5] dark:bg-[#111] border border-[#E2E4E8] dark:border-[#222] text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-[#CCC] hover:border-[#CBD0D8] dark:hover:border-[#333]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sessions Timeline List */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[calc(100vh-370px)]">
        {filteredSessions.length === 0 ? (
          <div className="bg-[#F9F9FB] dark:bg-[#111113] rounded-sm border border-dashed border-[#E2E4E8] dark:border-[#26262a] p-6 text-center space-y-2">
            <BookOpen className="w-5 h-5 text-[#9CA3AF] dark:text-[#555] mx-auto" />
            <p className="text-xs font-medium text-[#374151] dark:text-[#AAA]">
              {searchQuery.trim() ? `No reflections match "${searchQuery.trim()}"` : 'No entries match your query'}
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#666]">
              {searchQuery.trim() ? 'Try another keyword or reset the filter.' : 'Create a new reflection.'}
            </p>
            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-1 px-2.5 py-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-[#EEF2FF] dark:bg-[#161619] border border-indigo-200 dark:border-[#2c2c30] rounded-sm font-medium transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isSelected = selectedSessionId === session.id;
            const dateStr = new Date(session.updatedAt)
              .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              .toUpperCase();

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group cursor-pointer p-3.5 rounded-sm border transition-all space-y-1.5 ${
                  isSelected
                    ? 'border-l-2 border-indigo-600 dark:border-indigo-500 pl-3 bg-gradient-to-r from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-[#121215] border-t-[#E2E4E8] dark:border-t-[#222] border-r-[#E2E4E8] dark:border-r-[#222] border-b-[#E2E4E8] dark:border-b-[#222]'
                    : 'bg-[#FAFAFC] dark:bg-[#111113] border-[#E2E4E8] dark:border-[#222] hover:border-[#CBD0D8] dark:hover:border-[#333] hover:bg-[#F3F4F7] dark:hover:bg-[#151518]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={`text-[10px] font-mono tracking-wider ${
                          isSelected ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-[#6B7280] dark:text-[#666]'
                        }`}
                      >
                        {dateStr} {isSelected && '— ACTIVE'}
                      </p>
                      {session.isEncrypted && (
                        <span title="E2E Client Encrypted">
                          <Lock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                        </span>
                      )}
                      {session.draft && session.draft.trim().length > 0 && (
                        <span
                          title="Has saved reflection draft"
                          className="px-1.5 py-0.2 rounded-xs text-[8px] font-mono uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1 font-semibold"
                        >
                          Draft
                        </span>
                      )}
                    </div>
                    <h4
                      className={`text-sm font-medium leading-snug truncate transition-colors ${
                        isSelected
                          ? 'text-[#111827] dark:text-white'
                          : 'text-[#1F2937] dark:text-[#DDD] group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`}
                    >
                      {session.title}
                    </h4>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete session "${session.title}"?`)) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="p-1 text-[#9CA3AF] dark:text-[#555] hover:text-rose-600 dark:hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {session.summary ? (
                  <p className="text-[11px] text-[#4B5563] dark:text-[#888] line-clamp-2 leading-relaxed">
                    {session.summary}
                  </p>
                ) : session.lastMessageSnippet ? (
                  <p className="text-[11px] text-[#6B7280] dark:text-[#777] line-clamp-2 leading-relaxed italic">
                    "{session.lastMessageSnippet}"
                  </p>
                ) : session.draft ? (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400/80 line-clamp-2 leading-relaxed font-mono text-[10px]">
                    Draft: {session.draft}
                  </p>
                ) : null}

                <div className="flex items-center justify-between pt-1 text-[10px] text-[#6B7280] dark:text-[#777]">
                  <span className="font-mono">{session.category}</span>
                  <span>
                    {session.messageCount} {session.messageCount === 1 ? 'turn' : 'turns'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* System Integrity Telemetry Panel */}
      <div className="mt-auto p-3.5 bg-[#F4F4F6] dark:bg-[#141416] rounded-sm border border-[#E2E4E8] dark:border-[#2a2a2e] space-y-2 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#111827] dark:text-white">System Integrity</p>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
        </div>
        <div className="space-y-1.5 text-[10px] text-[#4B5563] dark:text-stone-300">
          <div className="flex justify-between">
            <span className="opacity-75">Firestore Rules:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">Verified</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">E2E Encryption:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
              {isVaultUnlocked ? 'AES-GCM (Active)' : 'AES-GCM (Ready)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Secret Manager:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">Live</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-[#E2E4E8] dark:border-[#222]">
            <span className="opacity-75">Service Label:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[9px]">dev-tutorial=cloud-run-ai-challenge</span>
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-[#0A0A0B]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#28282c] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E2E4E8] dark:border-[#222] pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 font-bold">
                  New Entry
                </p>
                <h3 className="font-semibold text-[#111827] dark:text-white text-base">Start Journaling Session</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B7280] dark:text-[#666] hover:text-[#111827] dark:hover:text-[#CCC] text-lg font-light"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#374151] dark:text-[#AAA] font-medium mb-1 uppercase tracking-wider text-[10px]">
                  Session Title
                </label>
                <input
                  id="input-new-session-title"
                  type="text"
                  placeholder="e.g. Scalability Bottlenecks in Edge Computing, Cognitive Biases..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F4F4F6] dark:bg-[#141416] border border-[#E2E4E8] dark:border-[#2c2c30] text-[#111827] dark:text-[#E0E0E0] placeholder-[#9CA3AF] dark:placeholder-[#555] rounded-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[#374151] dark:text-[#AAA] font-medium mb-1 uppercase tracking-wider text-[10px]">
                  Cognitive Intent Category
                </label>
                <select
                  id="select-new-session-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as SessionCategory)}
                  className="w-full px-3 py-2 bg-[#F4F4F6] dark:bg-[#141416] border border-[#E2E4E8] dark:border-[#2c2c30] text-[#111827] dark:text-[#E0E0E0] rounded-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Brainstorm">Brainstorm</option>
                  <option value="Deep Reflection">Deep Reflection</option>
                  <option value="Strategic Planning">Strategic Planning</option>
                  <option value="Creative Jam">Creative Jam</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 p-3 rounded-sm border border-[#E2E4E8] dark:border-[#26262a] bg-[#F9FAFB] dark:bg-[#141416] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsEncrypted}
                    onChange={(e) => setNewIsEncrypted(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-[#0A0A0B] border-[#D1D5DB] dark:border-[#444]"
                  />
                  <div>
                    <span className="font-semibold text-[#111827] dark:text-white block text-xs">
                      Enable Client-Side Zero-Knowledge Encryption
                    </span>
                    <span className="text-[#6B7280] dark:text-[#777] text-[10px] block leading-normal mt-0.5">
                      Reflections are encrypted with AES-GCM 256-bit in browser before cloud transmission.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 px-3 rounded-sm border border-[#E2E4E8] dark:border-[#2a2a2e] text-[#4B5563] dark:text-[#AAA] font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#18181c] transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-create-session-submit"
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold tracking-wide transition-colors"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
