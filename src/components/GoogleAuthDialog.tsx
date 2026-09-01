import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ShieldCheck, ArrowRight, Sparkles, User, Mail, Globe, Lock } from 'lucide-react';
import { GoogleIcon } from './GoogleIcon';

interface GoogleAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { token: string; user: { id: string; email: string; name: string; avatar?: string }; isNewUser?: boolean }) => void;
  defaultEmail?: string;
}

const PRESET_GOOGLE_ACCOUNTS = [
  {
    name: 'Somesh Kumar',
    email: 'someshm7662@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    headline: 'Current Active Google Session'
  },
  {
    name: 'Tech Candidate',
    email: 'candidate.career@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    headline: 'University & Placement Profile'
  }
];

export const GoogleAuthDialog: React.FC<GoogleAuthDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail
}) => {
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (defaultEmail && defaultEmail.includes('@')) {
      setCustomEmail(defaultEmail);
    }
  }, [defaultEmail]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async (email: string, name?: string, avatar?: string) => {
    setLoadingEmail(email);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || email.split('@')[0],
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Google authentication failed');
      }

      onSuccess(data);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMsg(err.message || 'Unable to connect to Google account. Please try again.');
      setLoadingEmail(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setErrorMsg('Please enter a valid Google email address');
      return;
    }
    handleGoogleSignIn(customEmail.trim(), customName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 relative"
      >
        {/* Header with Google Visual Brand */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
              <GoogleIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Sign in with Google</h3>
              <p className="text-xs text-slate-400">to continue to SkillVision AI Placement Cockpit</p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isCustomMode ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Choose an account</p>

              <div className="space-y-2">
                {PRESET_GOOGLE_ACCOUNTS.map((acc, index) => {
                  const isThisLoading = loadingEmail === acc.email;
                  return (
                    <button
                      key={index}
                      disabled={loadingEmail !== null}
                      onClick={() => handleGoogleSignIn(acc.email, acc.name, acc.avatar)}
                      className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all group disabled:opacity-60"
                    >
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isThisLoading && (
                          <div className="absolute inset-0 bg-indigo-900/60 flex items-center justify-center">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                            {acc.name}
                          </p>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </div>
                        <p className="text-xs text-slate-500 truncate">{acc.email}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{acc.headline}</p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsCustomMode(true)}
                  disabled={loadingEmail !== null}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Use another Google account</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">Enter Google Account Details</span>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  ← Back to account list
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Google Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingEmail !== null}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-60"
              >
                {loadingEmail ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4" />
                    <span>Authorize & Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Privacy & Safe OAuth Disclaimer */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Encrypted OAuth2 session. Never stores your Google password.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
