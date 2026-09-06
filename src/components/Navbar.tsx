/**
 * Navigation Bar Component - Editorial Aesthetic
 * Features real user profile display, sign-out control, Zero-Knowledge Vault toggle,
 * and Security Architecture telemetry. All mockups and internal paths hidden.
 */
import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ChevronDown,
  LogOut,
  LogIn,
  User,
  Shield,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { ThemeToggle } from './ThemeToggle.js';

interface NavbarProps {
  onOpenSecurityAudit: () => void;
  onOpenVaultModal: () => void;
  onOpenAuthModal: () => void;
  onOpenHistory?: () => void;
  isVaultUnlocked: boolean;
  activeView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSecurityAudit,
  onOpenVaultModal,
  onOpenAuthModal,
  onOpenHistory,
  isVaultUnlocked,
  activeView,
}) => {
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="border-b border-[#E2E4E8] dark:border-[#222] bg-white/95 dark:bg-[#0A0A0B]/95 backdrop-blur-xs sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Editorial Brand Mark */}
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-xs rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)] shrink-0">
            <div className="w-3.5 h-3.5 bg-white dark:bg-[#0A0A0B] -rotate-45" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tighter text-[#111827] dark:text-white">
                MINDSYNC <span className="font-light italic text-indigo-600 dark:text-indigo-400 font-serif">AI</span>
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-widest font-mono text-indigo-700 dark:text-indigo-300/80 bg-[#EEF2FF] dark:bg-[#1A1A1C] border border-indigo-200 dark:border-indigo-500/20">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#888] hidden sm:block font-medium">
              Personal Cognitive Journal & Mind Map
            </p>
          </div>
        </div>

        {/* Security Telemetry & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Session History Archive Button */}
          {user && onOpenHistory && (
            <button
              id="btn-session-history"
              onClick={onOpenHistory}
              className={`px-3 py-1.5 rounded-sm border text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                activeView === 'history'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-[#ECEEF2] dark:bg-[#141416] border-[#D8DCE3] dark:border-[#2c2c30] text-[#374151] dark:text-stone-300 hover:border-[#CBD0D8] dark:hover:border-[#3a3a40] hover:text-[#111827] dark:hover:text-white'
              }`}
              title="View full session history & archive"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Session History</span>
            </button>
          )}

          {/* Automatic / Manual Theme Switcher */}
          <ThemeToggle />

          {/* E2E Zero-Knowledge Vault Pill */}
          <button
            id="btn-vault-toggle"
            onClick={onOpenVaultModal}
            className={`px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-colors ${
              isVaultUnlocked
                ? 'bg-emerald-50 dark:bg-[#1A1A1C] border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:border-emerald-500/70'
                : 'bg-[#ECEEF2] dark:bg-[#141416] border-[#D8DCE3] dark:border-[#2c2c30] text-[#4B5563] dark:text-stone-400 hover:border-[#CBD0D8] dark:hover:border-[#3a3a40] hover:text-[#111827] dark:hover:text-stone-300'
            }`}
            title="Zero-Knowledge AES-GCM 256-bit Vault"
          >
            {isVaultUnlocked ? (
              <>
                <Unlock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">E2E Vault:</span>
                <span className="text-emerald-600 dark:text-emerald-300 font-extrabold">Active</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-[#6B7280] dark:text-stone-500" />
                <span className="hidden md:inline">E2E Vault:</span>
                <span>Locked</span>
              </>
            )}
          </button>

          {/* GCP Secure Vault Active Pill */}
          <button
            id="btn-security-audit"
            onClick={onOpenSecurityAudit}
            className="hidden sm:flex items-center gap-2 bg-[#ECEEF2] dark:bg-[#1A1A1C] hover:bg-[#E2E5EB] dark:hover:bg-[#202024] px-3.5 py-1.5 rounded-full border border-emerald-500/30 hover:border-emerald-500/60 transition-colors shadow-xs"
            title="Inspect Live Architecture & Security Telemetry"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-400">
              Security Vault Active
            </span>
          </button>

          {/* Real User Identity & Profile Controls */}
          {user ? (
            <div className="relative">
              <button
                id="btn-profile-menu"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="text-right flex items-center gap-2.5 bg-[#ECEEF2] dark:bg-[#1A1A1C] hover:bg-[#E2E5EB] dark:hover:bg-[#222226] border border-[#D8DCE3] dark:border-[#2a2a2e] hover:border-[#CBD0D8] dark:hover:border-[#38383f] px-3 py-1.5 rounded-md transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-[9px] uppercase tracking-widest text-[#6B7280] dark:text-[#888]">Signed In</p>
                  <p className="text-xs font-medium text-[#111827] dark:text-white max-w-[130px] truncate">
                    {user.displayName || user.email || 'Member'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] dark:text-stone-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0E0E10] rounded-sm shadow-xl border border-[#E2E4E8] dark:border-[#26262a] py-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3.5 py-2.5 border-b border-[#E2E4E8] dark:border-[#222]">
                    <p className="text-xs font-semibold text-[#111827] dark:text-white truncate">
                      {user.displayName || 'Personal Journal'}
                    </p>
                    {user.email && (
                      <p className="text-[11px] text-[#6B7280] dark:text-[#888] truncate mt-0.5 font-mono">
                        {user.email}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                        Authenticated
                      </span>
                    </div>
                  </div>

                  <div className="px-2 pt-1">
                    <button
                      id="btn-signout"
                      onClick={() => {
                        signOut();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-sm flex items-center gap-2 transition-colors font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="btn-nav-signin"
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
