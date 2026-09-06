import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  BookOpen,
  MessageSquare,
  Sparkles,
  Lock,
  Trash2,
  ChevronRight,
  Plus,
  Tag,
  CheckCircle2,
  TrendingUp,
  FileText,
  BarChart2,
  SlidersHorizontal,
} from 'lucide-react';
import { JournalSession, SessionCategory } from '../types.js';

interface SessionHistoryViewProps {
  sessions: JournalSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (title: string, category: SessionCategory, isEncrypted: boolean) => void;
  onDeleteSession: (sessionId: string) => void;
  onBackToWorkspace: () => void;
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

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onBackToWorkspace,
  isVaultUnlocked,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SessionCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'messages' | 'title'>('updated');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterEncryptedOnly, setFilterEncryptedOnly] = useState(false);
  const [filterDraftsOnly, setFilterDraftsOnly] = useState(false);

  // Quick Create Modal within History View
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<SessionCategory>('Brainstorm');
  const [newIsEncrypted, setNewIsEncrypted] = useState(false);

  // Filter and Sort Pipeline
  const processedSessions = useMemo(() => {
    return sessions
      .filter((session) => {
        // Category Filter
        if (selectedCategory !== 'All' && session.category !== selectedCategory) {
          return false;
        }

        // Encryption Filter
        if (filterEncryptedOnly && !session.isEncrypted) {
          return false;
        }

        // Drafts Filter
        if (filterDraftsOnly && (!session.draft || session.draft.trim().length === 0)) {
          return false;
        }

        // Search Query
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;

        const matchesTitle = session.title.toLowerCase().includes(q);
        const matchesCategory = session.category.toLowerCase().includes(q);
        const matchesSnippet = session.lastMessageSnippet?.toLowerCase().includes(q);
        const matchesDraft = session.draft?.toLowerCase().includes(q);
        const matchesSummary = session.summary?.toLowerCase().includes(q);
        const matchesEmotion = session.dominantEmotion?.toLowerCase().includes(q);
        const matchesTags = session.tags?.some((t) => t.toLowerCase().includes(q));

        return (
          matchesTitle ||
          matchesCategory ||
          matchesSnippet ||
          matchesDraft ||
          matchesSummary ||
          matchesEmotion ||
          matchesTags
        );
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'updated') {
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (sortBy === 'created') {
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'messages') {
          comparison = (b.messageCount || 0) - (a.messageCount || 0);
        } else if (sortBy === 'title') {
          comparison = a.title.localeCompare(b.title);
        }
        return sortOrder === 'asc' ? -comparison : comparison;
      });
  }, [
    sessions,
    selectedCategory,
    filterEncryptedOnly,
    filterDraftsOnly,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  // Aggregate Metrics for Header
  const totalReflections = sessions.length;
  const totalMessages = sessions.reduce((acc, s) => acc + (s.messageCount || 0), 0);
  const encryptedCount = sessions.filter((s) => s.isEncrypted).length;
  const draftCount = sessions.filter((s) => s.draft && s.draft.trim().length > 0).length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateSession(newTitle.trim(), newCategory, newIsEncrypted);
    setNewTitle('');
    setShowCreateModal(false);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Editorial Header & Statistics Strip */}
      <div className="bg-white dark:bg-[#0E0E10] border border-[#E2E4E8] dark:border-[#222] rounded-sm p-6 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E4E8] dark:border-[#222] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400 font-bold">
                Archival Repository
              </span>
              <span className="px-2 py-0.5 rounded-xs text-[9px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                Tenant Isolated
              </span>
            </div>
            <h2 className="text-2xl font-light text-[#111827] dark:text-white tracking-tight mt-1">
              Session <span className="font-semibold">History & Archive</span>
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-[#888] mt-1 max-w-2xl leading-relaxed">
              Complete chronological audit of your journaling dialogues, strategic brainstorms, cognitive analyses, and encrypted vault entries.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToWorkspace}
              className="px-3.5 py-2 text-xs font-medium text-[#4B5563] dark:text-[#AAA] hover:text-[#111827] dark:hover:text-white bg-[#F4F4F6] dark:bg-[#161619] hover:bg-[#ECEEF2] dark:hover:bg-[#1E1E22] border border-[#D8DCE3] dark:border-[#2a2a2e] rounded-sm transition-colors"
            >
              Back to Active Session
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-xs font-semibold tracking-wide transition-colors flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          <div className="p-3 bg-[#F9F9FB] dark:bg-[#121214] rounded-sm border border-[#E2E4E8] dark:border-[#222]">
            <p className="text-[10px] uppercase tracking-wider font-mono text-[#6B7280] dark:text-[#777]">
              Total Sessions
            </p>
            <p className="text-xl font-light text-[#111827] dark:text-white mt-1">
              {totalReflections}
            </p>
          </div>
          <div className="p-3 bg-[#F9F9FB] dark:bg-[#121214] rounded-sm border border-[#E2E4E8] dark:border-[#222]">
            <p className="text-[10px] uppercase tracking-wider font-mono text-[#6B7280] dark:text-[#777]">
              Reflections Logged
            </p>
            <p className="text-xl font-light text-indigo-600 dark:text-indigo-400 mt-1">
              {totalMessages}
            </p>
          </div>
          <div className="p-3 bg-[#F9F9FB] dark:bg-[#121214] rounded-sm border border-[#E2E4E8] dark:border-[#222]">
            <p className="text-[10px] uppercase tracking-wider font-mono text-[#6B7280] dark:text-[#777]">
              E2E Vault Encrypted
            </p>
            <p className="text-xl font-light text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <span>{encryptedCount}</span>
              {encryptedCount > 0 && <Lock className="w-3.5 h-3.5" />}
            </p>
          </div>
          <div className="p-3 bg-[#F9F9FB] dark:bg-[#121214] rounded-sm border border-[#E2E4E8] dark:border-[#222]">
            <p className="text-[10px] uppercase tracking-wider font-mono text-[#6B7280] dark:text-[#777]">
              Active Drafts
            </p>
            <p className="text-xl font-light text-amber-600 dark:text-amber-400 mt-1">
              {draftCount}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, Sort, and Flags */}
      <div className="bg-white dark:bg-[#0E0E10] border border-[#E2E4E8] dark:border-[#222] rounded-sm p-4 space-y-3.5 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9CA3AF] dark:text-[#666] absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search history by title, snippet, draft thoughts, emotions, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#F4F4F6] dark:bg-[#111113] text-[#111827] dark:text-[#E0E0E0] placeholder-[#9CA3AF] dark:placeholder-[#555] rounded-sm border border-[#E2E4E8] dark:border-[#222] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Sort & Order Dropdowns */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#F4F4F6] dark:bg-[#141416] border border-[#E2E4E8] dark:border-[#222] rounded-sm px-2 py-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#777]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-[#374151] dark:text-[#DDD] outline-none cursor-pointer font-medium"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Created Date</option>
                <option value="messages">Message Volume</option>
                <option value="title">Alphabetical Title</option>
              </select>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-1.5 bg-[#F4F4F6] dark:bg-[#141416] border border-[#E2E4E8] dark:border-[#222] text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-white rounded-sm text-xs transition-colors"
              title={`Sort order: ${sortOrder === 'desc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        </div>

        {/* Category Filter Pills & Toggle Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E2E4E8]/60 dark:border-[#1E1E22]">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-sm text-[11px] whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-[#F0F1F5] dark:bg-[#121214] border border-[#E2E4E8] dark:border-[#222] text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-[#DDD]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterEncryptedOnly(!filterEncryptedOnly)}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-medium flex items-center gap-1.5 border transition-colors ${
                filterEncryptedOnly
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-transparent text-[#6B7280] dark:text-[#777] border-transparent hover:border-[#E2E4E8] dark:hover:border-[#2a2a2e]'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Vault Only</span>
            </button>

            <button
              onClick={() => setFilterDraftsOnly(!filterDraftsOnly)}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-medium flex items-center gap-1.5 border transition-colors ${
                filterDraftsOnly
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                  : 'bg-transparent text-[#6B7280] dark:text-[#777] border-transparent hover:border-[#E2E4E8] dark:hover:border-[#2a2a2e]'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Drafts Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table / List */}
      <div className="bg-white dark:bg-[#0E0E10] border border-[#E2E4E8] dark:border-[#222] rounded-sm overflow-hidden shadow-xs">
        {processedSessions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-[#9CA3AF] dark:text-[#555] mx-auto" />
            <h3 className="text-sm font-medium text-[#111827] dark:text-white">
              No journal reflections found
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#888] max-w-sm mx-auto">
              No sessions match your search criteria or active category filters. Try clearing your filters or create a new entry.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setFilterEncryptedOnly(false);
                setFilterDraftsOnly(false);
              }}
              className="mt-2 px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-sm font-medium border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E4E8] dark:divide-[#1E1E22]">
            {processedSessions.map((session) => {
              const isSelected = selectedSessionId === session.id;
              const dateCreated = new Date(session.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const dateUpdated = new Date(session.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`p-4 sm:p-5 hover:bg-[#F9F9FB] dark:hover:bg-[#121215] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                    isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-l-3 border-indigo-600' : ''
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider bg-[#F0F1F5] dark:bg-[#1A1A1D] text-[#4B5563] dark:text-[#AAA] border border-[#E2E4E8] dark:border-[#2a2a2e]">
                        {session.category}
                      </span>

                      {session.isEncrypted && (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1 font-semibold">
                          <Lock className="w-2.5 h-2.5" />
                          AES-256 Vault
                        </span>
                      )}

                      {session.draft && session.draft.trim().length > 0 && (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1 font-semibold">
                          <FileText className="w-2.5 h-2.5" />
                          Unsaved Draft
                        </span>
                      )}

                      {session.dominantEmotion && (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20">
                          Mood: {session.dominantEmotion}
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-[#9CA3AF] dark:text-[#666]">
                        Created {dateCreated}
                      </span>
                    </div>

                    <h3 className="text-base font-medium text-[#111827] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {session.title}
                    </h3>

                    {/* Content Snippet or Summary */}
                    {session.summary ? (
                      <p className="text-xs text-[#4B5563] dark:text-[#888] line-clamp-2 leading-relaxed">
                        {session.summary}
                      </p>
                    ) : session.lastMessageSnippet ? (
                      <p className="text-xs text-[#6B7280] dark:text-[#777] line-clamp-2 leading-relaxed italic">
                        "{session.lastMessageSnippet}"
                      </p>
                    ) : session.draft ? (
                      <p className="text-xs text-amber-700 dark:text-amber-400/90 line-clamp-1 font-mono">
                        Draft excerpt: {session.draft}
                      </p>
                    ) : (
                      <p className="text-xs text-[#9CA3AF] dark:text-[#666] italic">
                        No reflections written yet. Click to begin dialogue.
                      </p>
                    )}

                    {/* Tag Cloud */}
                    {session.tags && session.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {session.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono text-[#6B7280] dark:text-[#888] bg-[#F4F4F6] dark:bg-[#141416] px-1.5 py-0.5 rounded-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Metadata and Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E4E8]/50 dark:border-[#222]">
                    <div className="text-left md:text-right text-[11px] font-mono text-[#6B7280] dark:text-[#777] space-y-0.5">
                      <div className="flex items-center md:justify-end gap-1.5 text-xs text-[#374151] dark:text-[#CCC]">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{session.messageCount || 0} reflections</span>
                      </div>
                      <p className="text-[10px]">Updated: {dateUpdated}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete session "${session.title}"?`)) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="p-1.5 text-[#9CA3AF] dark:text-[#666] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xs transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="w-7 h-7 rounded-sm bg-[#F4F4F6] dark:bg-[#161619] group-hover:bg-indigo-600 text-[#4B5563] dark:text-[#888] group-hover:text-white flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Session Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#26262a] w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E4E8] dark:border-[#222] pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 font-bold">
                  New Journal Entry
                </p>
                <h3 className="text-base font-semibold text-[#111827] dark:text-white mt-0.5">
                  Create Reflection Session
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#374151] dark:text-[#CCC]">
                  Session Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Architecture Decisions & Database Scaling"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F4F6] dark:bg-[#141416] text-[#111827] dark:text-[#E0E0E0] rounded-sm border border-[#E2E4E8] dark:border-[#2a2a2e] focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#374151] dark:text-[#CCC]">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as SessionCategory)}
                  className="w-full px-3 py-2 bg-[#F4F4F6] dark:bg-[#141416] text-[#111827] dark:text-[#E0E0E0] rounded-sm border border-[#E2E4E8] dark:border-[#2a2a2e] focus:outline-none focus:border-indigo-500"
                >
                  <option value="Brainstorm">Brainstorm</option>
                  <option value="Deep Reflection">Deep Reflection</option>
                  <option value="Strategic Planning">Strategic Planning</option>
                  <option value="Creative Jam">Creative Jam</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsEncrypted}
                    onChange={(e) => setNewIsEncrypted(e.target.checked)}
                    className="rounded-xs text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <p className="font-semibold text-[#111827] dark:text-white flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      Client-Side Zero-Knowledge Encryption
                    </p>
                    <p className="text-[10px] text-[#6B7280] dark:text-[#777]">
                      Encrypts body locally with AES-GCM 256-bit using your passkey.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E4E8] dark:border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-sm border border-[#D8DCE3] dark:border-[#2a2a2e] text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-sm transition-colors"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
