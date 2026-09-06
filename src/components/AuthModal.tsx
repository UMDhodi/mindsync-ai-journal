/**
 * Authentication Modal - Editorial Aesthetic
 * Supports Google Sign-In, Email/Password (Sign In / Register), and Guest Access.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Sparkles, Mail, Lock, User, AlertCircle, X, Shield, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, canDismiss = true }) => {
  const { signInWithGoogle, signInWithEmail, registerWithEmail, signInAsGuest } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name.trim() || undefined);
      }
      if (onClose) onClose();
    } catch (err: any) {
      const msg = err?.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err?.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Please sign in.'
        : err?.message || 'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInAsGuest();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err?.message || 'Guest sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0B]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0E0E10] rounded-sm border border-[#28282c] shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between bg-[#141416]/70">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-xs rotate-45 flex items-center justify-center shadow-xs shrink-0">
              <div className="w-2.5 h-2.5 bg-[#0A0A0B] -rotate-45" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                <span>MINDSYNC</span>
                <span className="font-light italic text-indigo-400 font-serif">AI</span>
              </h2>
              <p className="text-[10px] text-[#777] uppercase tracking-wider">
                {mode === 'signin' ? 'Sign In to Your Journal' : 'Create an Account'}
              </p>
            </div>
          </div>
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-sm text-[#777] hover:text-white hover:bg-[#222] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-sm text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            id="btn-google-auth"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#18181B] hover:bg-[#222226] border border-[#2e2e34] hover:border-indigo-500/40 rounded-sm text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-all shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[#222] w-full" />
            <span className="bg-[#0E0E10] px-2.5 text-[10px] uppercase font-mono text-[#666]">
              or email
            </span>
          </div>

          {/* Quick Demo Credentials Banner */}
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-sm flex items-center justify-between gap-2 text-xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-indigo-400 font-mono text-[10px] uppercase tracking-wider">Demo Account</span>
              </div>
              <p className="text-[11px] text-[#AAA] font-mono mt-0.5">
                test@gmail.com &bull; test123
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setEmail('test@gmail.com');
                setPassword('test123');
                setError(null);
              }}
              className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 rounded-xs text-[11px] font-medium transition-colors"
            >
              Fill Credentials
            </button>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#888] font-mono block mb-1">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#555] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Alex Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-2 text-xs bg-[#121215] text-[#E0E0E0] placeholder-[#555] rounded-sm border border-[#222] focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#888] font-mono block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#555] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-2 text-xs bg-[#121215] text-[#E0E0E0] placeholder-[#555] rounded-sm border border-[#222] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#888] font-mono block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#555] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-2 text-xs bg-[#121215] text-[#E0E0E0] placeholder-[#555] rounded-sm border border-[#222] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              id="btn-submit-auth"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-sm text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>{mode === 'signin' ? 'Sign In to Journal' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center pt-1">
            {mode === 'signin' ? (
              <p className="text-xs text-[#777]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('register');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium underline transition-colors"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p className="text-xs text-[#777]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('signin');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium underline transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Quick Guest Access */}
          <div className="pt-2 border-t border-[#1C1C20] flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#666]">Instant evaluation:</span>
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 transition-colors"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
