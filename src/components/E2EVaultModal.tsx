/**
 * End-to-End Encryption Vault Modal - Editorial Aesthetic
 * Configures client-side Web Crypto AES-GCM 256-bit passphrase.
 */
import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, Key, CheckCircle, X } from 'lucide-react';

interface E2EVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultPassphrase: string;
  onSetPassphrase: (passphrase: string) => void;
  onLockVault: () => void;
}

export const E2EVaultModal: React.FC<E2EVaultModalProps> = ({
  isOpen,
  onClose,
  vaultPassphrase,
  onSetPassphrase,
  onLockVault,
}) => {
  const [inputPass, setInputPass] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isUnlocked = !!vaultPassphrase;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPass.trim()) {
      setError('Please enter a passphrase.');
      return;
    }
    if (inputPass.length < 6) {
      setError('Passphrase must be at least 6 characters.');
      return;
    }
    onSetPassphrase(inputPass.trim());
    setInputPass('');
    setError('');
    onClose();
  };

  const handleLock = () => {
    onLockVault();
    setInputPass('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0B]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#0E0E10] rounded-sm border border-[#28282c] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-5 border-b border-[#222] flex items-center justify-between bg-[#141416]/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-sm ${
                isUnlocked
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#1A1A1C] text-indigo-400 border border-[#2c2c30]'
              }`}
            >
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold">
                Zero-Knowledge Web Crypto
              </p>
              <h3 className="font-semibold text-white text-base">Client-Side E2E Vault</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-[#777] hover:text-white hover:bg-[#1A1A1C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="bg-[#141416] rounded-sm p-3.5 border border-[#26262a] text-[#AAA] space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                When enabled, reflections are encrypted using <strong className="text-white">AES-GCM 256-bit</strong> with 100,000 PBKDF2 rounds directly in your browser.
              </p>
            </div>
            <p className="text-[#777] pl-6 text-[11px] leading-relaxed">
              The server and Cloud Firestore receive only ciphertext. Your passphrase is never transmitted or stored on any server.
            </p>
          </div>

          {isUnlocked ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-emerald-950/20 text-emerald-300 rounded-sm border border-emerald-500/30 text-xs font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Vault is unlocked. Encrypted journal entries are ciphered and deciphered seamlessly in browser.</span>
              </div>
              <button
                id="btn-lock-vault-confirm"
                onClick={handleLock}
                className="w-full py-2.5 px-4 rounded-sm bg-[#1A1A1C] hover:bg-[#222226] border border-[#2c2c30] text-rose-300 font-medium text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                Lock Vault & Evict Key from Memory
              </button>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#AAA] mb-1">
                  Vault Secret Passphrase
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-[#666] absolute left-3 top-2.5" />
                  <input
                    id="input-vault-passphrase"
                    type="password"
                    placeholder="Enter secret passphrase (min 6 characters)..."
                    value={inputPass}
                    onChange={(e) => setInputPass(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-sm bg-[#141416] border border-[#2c2c30] text-[#E0E0E0] placeholder-[#555] focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-3 rounded-sm border border-[#2a2a2e] text-[#AAA] font-medium hover:bg-[#18181c] transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-unlock-vault-submit"
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-sm bg-indigo-500 hover:bg-indigo-400 text-white font-semibold tracking-wide transition-colors"
                >
                  Unlock Vault
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
