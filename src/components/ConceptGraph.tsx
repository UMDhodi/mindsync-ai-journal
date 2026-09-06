/**
 * Dynamic Concept Mind Map & Thought Graph Visualization - Editorial Aesthetic
 * Extracts ideas, challenges, breakthroughs, and milestone nodes with dark editorial topology.
 */
import React, { useState, useMemo } from 'react';
import { Network, Sparkles, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { ConceptGraphData, ConceptGraphNode } from '../types.js';
import { useTheme } from '../context/ThemeContext.js';

interface ConceptGraphProps {
  graph: ConceptGraphData | null;
  loading: boolean;
  onRefreshGraph: () => void;
  hasMessages: boolean;
}

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  core_goal: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#059669', label: 'Core Goal' },
  challenge: { bg: 'rgba(244, 63, 94, 0.1)', border: '#f43f5e', text: '#e11d48', label: 'Challenge' },
  insight: { bg: 'rgba(99, 102, 241, 0.1)', border: '#6366f1', text: '#4f46e5', label: 'Insight' },
  action: { bg: 'rgba(168, 85, 247, 0.1)', border: '#a855f7', text: '#9333ea', label: 'Action Milestone' },
  resource: { bg: 'rgba(14, 165, 233, 0.1)', border: '#0ea5e9', text: '#0284c7', label: 'Resource / Lever' },
};

export const ConceptGraph: React.FC<ConceptGraphProps> = ({
  graph,
  loading,
  onRefreshGraph,
  hasMessages,
}) => {
  const { resolvedTheme } = useTheme();
  const [selectedNode, setSelectedNode] = useState<ConceptGraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const isDark = resolvedTheme === 'dark';

  // Compute node 2D positions in a clean circular/cluster graph layout
  const positionedNodes = useMemo(() => {
    if (!graph || !graph.nodes || graph.nodes.length === 0) return [];

    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const count = graph.nodes.length;
    return graph.nodes.map((node, i) => {
      if (node.category === 'core_goal' && i === 0) {
        return { ...node, x: centerX, y: centerY };
      }

      const angle = (i / (count > 1 ? count - 1 : 1)) * 2 * Math.PI;
      const radius = 160 + (i % 2 === 0 ? 30 : -30);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        ...node,
        x: Math.max(70, Math.min(width - 70, x)),
        y: Math.max(50, Math.min(height - 50, y)),
      };
    });
  }, [graph]);

  // Map nodes for fast link lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, typeof positionedNodes[0]>();
    positionedNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [positionedNodes]);

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-8 text-center space-y-4 shadow-xs dark:shadow-2xl transition-colors duration-200">
        <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto rotate-45">
          <Network className="w-6 h-6 -rotate-45" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h4 className="font-semibold text-[#111827] dark:text-white text-sm">Dynamic Concept & Mind Map Graph</h4>
          <p className="text-xs text-[#4B5563] dark:text-[#888] leading-relaxed">
            Extract interconnected concepts, architectural barriers, breakthroughs, and milestone nodes from your transcript.
          </p>
        </div>
        <button
          id="btn-generate-concept-graph"
          onClick={onRefreshGraph}
          disabled={loading || !hasMessages}
          className="px-4 py-2.5 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-colors shadow-xs"
        >
          <Sparkles className={`w-3.5 h-3.5 text-indigo-200 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Synthesizing Thought Graph...' : 'Generate Thought Graph'}
        </button>
        {!hasMessages && (
          <p className="text-[10px] text-[#6B7280] dark:text-[#666]">Share at least one reflection to generate a topology.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Controls */}
      <div className="bg-white dark:bg-[#0E0E10] rounded-sm border border-[#E2E4E8] dark:border-[#222] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs dark:shadow-2xl transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#111827] dark:text-white text-sm">Concept Mind Map & Idea Topology</h3>
            <span className="px-2 py-0.5 rounded-sm text-[9px] font-mono uppercase tracking-widest bg-emerald-50 dark:bg-[#1A1A1C] text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-medium">
              {graph.nodes.length} Nodes &bull; {graph.links.length} Relations
            </span>
          </div>
          <p className="text-xs text-[#4B5563] dark:text-[#888] mt-0.5">Click any node to explore connections and details</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center border border-[#E2E4E8] dark:border-[#26262a] rounded-sm overflow-hidden bg-[#F4F4F6] dark:bg-[#141416]">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 hover:bg-[#E5E7EB] dark:hover:bg-[#202024] text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[10px] font-mono text-[#374151] dark:text-[#AAA]">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 hover:bg-[#E5E7EB] dark:hover:bg-[#202024] text-[#4B5563] dark:text-[#888] hover:text-[#111827] dark:hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="btn-re-extract-concept-graph"
            onClick={onRefreshGraph}
            disabled={loading}
            className="px-3 py-1.5 rounded-sm bg-[#F4F4F6] dark:bg-[#1A1A1C] hover:bg-[#EEF0F5] dark:hover:bg-[#222226] border border-[#E2E4E8] dark:border-[#2a2a2e] text-[#374151] dark:text-[#CCC] text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Synthesizing...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="bg-[#F9FAFC] dark:bg-[#050506] rounded-sm p-4 overflow-hidden relative border border-[#E2E4E8] dark:border-[#222] min-h-[460px] flex items-center justify-center shadow-md dark:shadow-2xl transition-colors duration-200">
        {/* Graph Legend */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-sm">
          {Object.entries(CATEGORY_STYLES).map(([cat, style]) => (
            <span
              key={cat}
              className="px-2 py-0.5 rounded-xs text-[9px] font-mono uppercase tracking-wider border text-[#1F2937] dark:text-white/90 bg-white/95 dark:bg-[#0E0E10]/90 backdrop-blur-xs shadow-xs"
              style={{ borderColor: style.border }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5" style={{ backgroundColor: style.border }} />
              {style.label}
            </span>
          ))}
        </div>

        <svg
          viewBox="0 0 800 500"
          className="w-full h-full max-h-[500px] transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Subtle Radial Aura in background */}
          <circle cx="400" cy="250" r="280" fill="url(#radialAura)" opacity={isDark ? "0.15" : "0.08"} />
          <defs>
            <radialGradient id="radialAura">
              <stop offset="0%" stopColor={isDark ? "#6366f1" : "#818cf8"} />
              <stop offset="100%" stopColor={isDark ? "#050506" : "#f9fafc"} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Connecting Links */}
          <g className="links">
            {graph.links.map((link, i) => {
              const sourceNode = nodeMap.get(link.source);
              const targetNode = nodeMap.get(link.target);
              if (!sourceNode || !targetNode) return null;

              const isConnectedToSelected =
                selectedNode &&
                (selectedNode.id === sourceNode.id || selectedNode.id === targetNode.id);

              const strokeColor = isConnectedToSelected
                ? (isDark ? '#818cf8' : '#6366f1')
                : (isDark ? '#2c2c32' : '#CBD5E1');

              return (
                <g key={`link-${i}`}>
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={strokeColor}
                    strokeWidth={isConnectedToSelected ? 2 : 1}
                    strokeDasharray={isConnectedToSelected ? 'none' : '4 3'}
                    opacity={isConnectedToSelected ? 0.95 : 0.7}
                  />
                  {link.label && (
                    <text
                      x={(sourceNode.x! + targetNode.x!) / 2}
                      y={(sourceNode.y! + targetNode.y!) / 2 - 4}
                      fill={isDark ? "#71717a" : "#64748B"}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none pointer-events-none font-medium"
                    >
                      {link.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {positionedNodes.map((node) => {
              const style = CATEGORY_STYLES[node.category] || CATEGORY_STYLES.insight;
              const isSelected = selectedNode?.id === node.id;
              const radius = 22 + (node.weight || 2) * 4;

              const nodeBg = isSelected
                ? style.border
                : (isDark ? '#111113' : '#FFFFFF');

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                  transform={`translate(${node.x}, ${node.y})`}
                >
                  {/* Ping pulse for active node */}
                  {isSelected && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke={style.border}
                      strokeWidth="1.5"
                      opacity="0.4"
                      className="animate-ping"
                    />
                  )}

                  {/* Main Circle */}
                  <circle
                    r={radius}
                    fill={nodeBg}
                    stroke={style.border}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="transition-all duration-200 group-hover:stroke-indigo-500 shadow-sm"
                  />

                  {/* Node Label */}
                  <text
                    y={radius + 14}
                    fill={isDark ? "#e4e4e7" : "#1F2937"}
                    fontSize="11"
                    fontWeight="500"
                    textAnchor="middle"
                    className="select-none font-sans"
                  >
                    {node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-80 bg-white/95 dark:bg-[#0E0E10]/95 backdrop-blur-md border border-[#E2E4E8] dark:border-[#2a2a2e] rounded-sm p-4 text-xs text-[#1F2937] dark:text-[#DDD] shadow-xl space-y-2 animate-in fade-in slide-in-from-bottom-2 z-20">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-[#111827] dark:text-white text-sm font-serif">
                {selectedNode.label}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[#6B7280] dark:text-[#666] hover:text-[#111827] dark:hover:text-white p-1 text-base leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-xs text-[9px] font-mono uppercase tracking-wider border font-medium"
                style={{
                  backgroundColor: CATEGORY_STYLES[selectedNode.category]?.bg,
                  borderColor: CATEGORY_STYLES[selectedNode.category]?.border,
                  color: CATEGORY_STYLES[selectedNode.category]?.text,
                }}
              >
                {CATEGORY_STYLES[selectedNode.category]?.label || selectedNode.category}
              </span>
              <span className="text-[#6B7280] dark:text-[#888] font-mono text-[10px]">
                Weight: {selectedNode.weight}/5
              </span>
            </div>
            {selectedNode.description && (
              <p className="text-[#4B5563] dark:text-[#AAA] text-[11px] leading-relaxed pt-1">
                {selectedNode.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
