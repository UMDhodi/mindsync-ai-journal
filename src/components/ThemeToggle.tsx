/**
 * Theme Toggle Component - Editorial Aesthetic
 * Provides automatic system preference detection alongside manual Light / Dark overrides.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext.js';

export const ThemeToggle: React.FC = () => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isOpen]);

  const options: { mode: ThemeMode; label: string; description: string; icon: React.ReactNode }[] = [
    {
      mode: 'system',
      label: 'System',
      description: `Auto (${resolvedTheme})`,
      icon: <Monitor className="w-3.5 h-3.5" />,
    },
    {
      mode: 'light',
      label: 'Light',
      description: 'Refined alabaster',
      icon: <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />,
    },
    {
      mode: 'dark',
      label: 'Dark',
      description: 'Obsidian editorial',
      icon: <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="btn-theme-toggle"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Theme mode: ${themeMode}, resolved: ${resolvedTheme}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#D8DCE3] dark:border-[#2c2c30] bg-[#ECEEF2] dark:bg-[#141416] hover:bg-[#E2E5EB] dark:hover:bg-[#1A1A1C] text-[#374151] dark:text-[#CCC] hover:text-[#111827] dark:hover:text-white text-[10px] uppercase tracking-widest font-mono font-semibold transition-colors shadow-xs"
        title={`Theme: ${themeMode.toUpperCase()} (Detected: ${resolvedTheme.toUpperCase()}). Click to customize.`}
      >
        {themeMode === 'system' && <Monitor className="w-3 h-3 text-[#4B5563] dark:text-[#9E9EA8]" />}
        {themeMode === 'light' && <Sun className="w-3 h-3 text-amber-500" />}
        {themeMode === 'dark' && <Moon className="w-3 h-3 text-indigo-400" />}
        <span className="hidden sm:inline">
          {themeMode === 'system' ? 'Auto' : themeMode}
        </span>
      </button>

      {isOpen && (
        <div
          id="menu-theme-options"
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0E0E10] rounded-sm shadow-xl border border-[#E2E4E8] dark:border-[#26262a] py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
        >
          <div className="px-3 py-1.5 border-b border-[#E2E4E8] dark:border-[#222]">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280] dark:text-[#888]">
              Appearance Mode
            </p>
          </div>
          <div className="p-1 space-y-0.5">
            {options.map((opt) => {
              const isSelected = themeMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  id={`btn-theme-${opt.mode}`}
                  type="button"
                  onClick={() => {
                    setThemeMode(opt.mode);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xs flex items-center justify-between transition-colors text-xs ${
                    isSelected
                      ? 'bg-[#EEF2FF] dark:bg-[#1C1C20] text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-[#374151] dark:text-[#B0B0B8] hover:bg-[#F3F4F6] dark:hover:bg-[#161618] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">{opt.icon}</span>
                    <div className="flex flex-col">
                      <span className="leading-none">{opt.label}</span>
                      <span className="text-[9px] font-mono text-[#6B7280] dark:text-[#666] mt-0.5">
                        {opt.description}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
