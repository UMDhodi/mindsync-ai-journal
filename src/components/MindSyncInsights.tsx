/**
 * MindSync Cognitive Engine Insights Component - Editorial Aesthetic
 * Multi-dimensional analysis: Cognitive Reframing, Sentiment Valence & Energy Radar, Actionable Checklist.
 */
import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Zap,
  TrendingUp,
  CheckSquare,
  Square,
  Compass,
  RefreshCw,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { CognitiveAnalysis } from '../types.js';

interface MindSyncInsightsProps {
  analysis: CognitiveAnalysis | null;
  loading: boolean;
  onRefreshAnalysis: () => void;
  hasMessages: boolean;
}

export const MindSyncInsights: React.FC<MindSyncInsightsProps> = ({
  analysis,
  loading,
  onRefreshAnalysis,
  hasMessages,
}) => {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-8 text-center space-y-4 shadow-xs dark:shadow-2xl transition-colors duration-200">
        <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto rotate-45">
          <Brain className="w-6 h-6 -rotate-45" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h4 className="font-semibold text-[#111827] dark:text-white text-sm">MindSync Cognitive Engine</h4>
          <p className="text-xs text-[#4B5563] dark:text-[#888] leading-relaxed">
            Extract high-dimensional cognitive reframing, emotional valence metrics, and tactical action items from your reflections.
          </p>
        </div>
        <button
          id="btn-run-cognitive-engine-empty"
          onClick={onRefreshAnalysis}
          disabled={loading || !hasMessages}
          className="px-4 py-2.5 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-colors shadow-xs"
        >
          <Sparkles className={`w-3.5 h-3.5 text-indigo-200 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Synthesizing Cognitive Insights...' : 'Synthesize Reflection & Insights'}
        </button>
        {!hasMessages && (
          <p className="text-[10px] text-[#6B7280] dark:text-[#666]">Share at least one reflection to generate insights.</p>
        )}
      </div>
    );
  }

  const { summary, keyThemes, cognitiveReframing, emotionalValence, actionableTakeaways } = analysis;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs dark:shadow-2xl transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#111827] dark:text-white text-base">Cognitive Synthesis</h3>
            <span className="px-2 py-0.5 rounded-sm text-[9px] font-mono uppercase tracking-widest bg-indigo-50 dark:bg-[#1A1A1C] text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-medium">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-[#4B5563] dark:text-[#888] mt-0.5">Automated multi-dimensional analysis of your thoughts</p>
        </div>
        <button
          id="btn-re-analyze-cognitive-engine"
          onClick={onRefreshAnalysis}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-sm bg-[#F4F4F6] dark:bg-[#1A1A1C] hover:bg-[#EEF0F5] dark:hover:bg-[#222226] border border-[#E2E4E8] dark:border-[#2a2a2e] text-[#374151] dark:text-[#CCC] text-xs font-medium inline-flex items-center gap-2 transition-colors self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Re-analyzing...' : 'Refresh Synthesis'}
        </button>
      </div>

      {/* Synthesis Summary & Key Themes */}
      <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-5 space-y-3 shadow-xs dark:shadow-2xl transition-colors duration-200">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Core Synthesis</span>
        </div>
        <p className="text-xs sm:text-sm text-[#1F2937] dark:text-[#DDD] leading-relaxed font-normal">
          {summary}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {keyThemes.map((theme, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-sm text-xs font-mono font-medium bg-[#EEF2FF] dark:bg-[#141417] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-[#26262a]"
            >
              #{theme}
            </span>
          ))}
        </div>
      </div>

      {/* Cognitive Reframing - Editorial Blockquote */}
      <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-5 space-y-4 shadow-xs dark:shadow-2xl transition-colors duration-200">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 font-bold">
          Cognitive Reframing
        </h2>

        <div className="p-4 bg-[#F8FAFC] dark:bg-[#141416] rounded-sm border-l-2 border-indigo-600 dark:border-indigo-400 italic text-xs leading-relaxed text-indigo-950 dark:text-indigo-200/95 font-serif text-sm sm:text-base">
          "{cognitiveReframing.reframedPerspective}"
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-sm bg-[#FAFAFC] dark:bg-[#111113] border border-[#E2E4E8] dark:border-[#222] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Identified Friction / Bias
            </span>
            <p className="text-[#374151] dark:text-[#BBB] leading-relaxed">
              {cognitiveReframing.limitingBeliefOrFriction}
            </p>
          </div>

          <div className="p-3.5 rounded-sm bg-[#FAFAFC] dark:bg-[#111113] border border-[#E2E4E8] dark:border-[#222] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Growth Opportunity
            </span>
            <p className="text-[#374151] dark:text-[#BBB] leading-relaxed">
              {cognitiveReframing.growthOpportunity}
            </p>
          </div>
        </div>
      </div>

      {/* Energy Valence Visualizer (Editorial Columns) */}
      <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-5 space-y-4 shadow-xs dark:shadow-2xl transition-colors duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 font-bold">
            Energy Valence
          </h2>
          <span className="px-2.5 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-emerald-50 dark:bg-[#1A1A1C] text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-medium">
            State: {emotionalValence.dominantEmotion}
          </span>
        </div>

        {/* Editorial Multi-bar visualizer */}
        <div className="space-y-3">
          <div className="flex items-end gap-2.5 h-24 border-b border-[#E2E4E8] dark:border-[#222] pb-2">
            <div
              className="flex-1 bg-indigo-500/20 rounded-t-xs transition-all duration-500 hover:bg-indigo-500/40 relative group"
              style={{ height: '35%' }}
            >
              <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-indigo-600 dark:text-indigo-300">
                Baseline
              </span>
            </div>
            <div
              className="flex-1 bg-indigo-500/40 rounded-t-xs transition-all duration-500 hover:bg-indigo-500/60 relative group"
              style={{ height: `${Math.max(20, (emotionalValence.valenceScore + 100) / 2)}%` }}
            >
              <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-indigo-600 dark:text-indigo-300">
                Valence
              </span>
            </div>
            <div
              className="flex-1 bg-indigo-600 dark:bg-indigo-500/80 rounded-t-xs transition-all duration-500 hover:bg-indigo-500 relative group"
              style={{ height: `${Math.max(25, emotionalValence.energyLevel)}%` }}
            >
              <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-indigo-600 dark:text-indigo-300">
                Drive
              </span>
            </div>
            <div
              className="flex-1 bg-emerald-500 dark:bg-emerald-400 rounded-t-xs transition-all duration-500 hover:bg-emerald-400 relative group shadow-[0_0_12px_rgba(52,211,153,0.3)]"
              style={{ height: `${Math.max(30, emotionalValence.cognitiveClarity)}%` }}
            >
              <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-600 dark:text-emerald-300">
                Clarity
              </span>
            </div>
            <div
              className="flex-1 bg-indigo-500/30 rounded-t-xs transition-all duration-500 hover:bg-indigo-500/50 relative group"
              style={{ height: '45%' }}
            >
              <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-indigo-600 dark:text-indigo-300">
                Equanimity
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-[#FAFAFC] dark:bg-[#111113] p-2.5 rounded-sm border border-[#E2E4E8] dark:border-[#222]">
              <span className="text-[10px] text-[#6B7280] dark:text-[#777] uppercase font-mono block">Valence Score</span>
              <span className="text-[#111827] dark:text-white font-mono font-medium">
                {emotionalValence.valenceScore > 0 ? `+${emotionalValence.valenceScore}` : emotionalValence.valenceScore} / 100
              </span>
            </div>
            <div className="bg-[#FAFAFC] dark:bg-[#111113] p-2.5 rounded-sm border border-[#E2E4E8] dark:border-[#222]">
              <span className="text-[10px] text-[#6B7280] dark:text-[#777] uppercase font-mono block">Energy Level</span>
              <span className="text-[#111827] dark:text-white font-mono font-medium">{emotionalValence.energyLevel}%</span>
            </div>
            <div className="bg-[#FAFAFC] dark:bg-[#111113] p-2.5 rounded-sm border border-[#E2E4E8] dark:border-[#222]">
              <span className="text-[10px] text-[#6B7280] dark:text-[#777] uppercase font-mono block">Clarity Index</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">{emotionalValence.cognitiveClarity}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Takeaways & Next Steps */}
      <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-5 space-y-3 shadow-xs dark:shadow-2xl transition-colors duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 font-bold">
            Extracted Tasks
          </h2>
          <span className="text-xs font-mono text-[#6B7280] dark:text-[#888]">
            {Object.values(completedTasks).filter(Boolean).length} / {actionableTakeaways.length} completed
          </span>
        </div>

        <div className="space-y-2">
          {actionableTakeaways.map((item) => {
            const isDone = completedTasks[item.id] ?? item.completed;
            return (
              <div
                key={item.id}
                onClick={() => toggleTask(item.id)}
                className={`p-3 rounded-sm border transition-colors cursor-pointer flex items-start gap-3 text-xs ${
                  isDone
                    ? 'bg-[#F3F4F6] dark:bg-[#111113] border-[#E2E4E8] dark:border-[#222] text-[#9CA3AF] dark:text-[#666]'
                    : 'bg-[#FAFAFC] dark:bg-[#141416] border-[#E2E4E8] dark:border-[#26262a] hover:border-[#CBD0D8] dark:hover:border-[#38383f] text-[#1F2937] dark:text-[#DDD]'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <div
                    className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center transition-colors ${
                      isDone
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500 dark:border-emerald-400 dark:text-emerald-400'
                        : 'border-[#D1D5DB] dark:border-[#444] group-hover:border-emerald-500'
                    }`}
                  >
                    {isDone && <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400" />}
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-medium ${isDone ? 'line-through text-[#9CA3AF] dark:text-[#666]' : 'text-[#111827] dark:text-white'}`}>
                      {item.task}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-xs text-[9px] font-mono uppercase tracking-wider ${
                        item.priority === 'high'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                          : item.priority === 'medium'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                          : 'bg-stone-100 dark:bg-[#1A1A1C] text-[#4B5563] dark:text-[#888] border border-[#E2E4E8] dark:border-[#333]'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4B5563] dark:text-[#777] leading-normal">{item.rationale}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
