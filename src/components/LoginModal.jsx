import React, { useState } from 'react';
import { X, Shield, Lock, Mail, ArrowRight, Sparkles, CheckCircle, User, AlertCircle, Send } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function LoginModal({ onClose, onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  const handleDemoLogin = () => {
    onLoginSuccess({ email: 'organizer@college.edu', role: 'admin' });
    onClose();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isSupabaseConfigured) {
      try {
        if (authMode === 'signup') {
          // Sign Up with Supabase Auth -> sends confirmation email
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName, role: 'organizer' },
              emailRedirectTo: window.location.origin
            }
          });

          if (signUpError) throw signUpError;

          // Check if email confirmation is required by Supabase project
          if (data?.user && !data.session) {
            setEmailSentNotice(true);
            return;
          }

          // If auto-confirmed or existing session
          onLoginSuccess(data.user);
          onClose();
        } else {
          // Sign In
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (authError) throw authError;
          onLoginSuccess(data.user);
          onClose();
        }
      } catch (err) {
        setError(err.message || 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local fallback mode
      if (email.trim() && password.trim()) {
        onLoginSuccess({ email, role: 'admin' });
        onClose();
      } else {
        setError('Please enter your email and password');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>

          <h3 className="text-xl font-extrabold">Organizer Portal</h3>
          <p className="text-xs text-slate-300 mt-1">
            Access live registrations, attendance scanner & exports
          </p>

          {/* Mode Switcher */}
          <div className="flex bg-white/10 p-1 rounded-xl mt-4 border border-white/10">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setEmailSentNotice(false); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                authMode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setEmailSentNotice(false); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Create Account (Sign Up)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {emailSentNotice ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Send className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-lg">Check Your Email!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  A verification confirmation link has been sent by <strong>Supabase Auth</strong> to:
                </p>
                <p className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 py-1.5 px-3 rounded-lg inline-block mt-1">
                  {email}
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                Click the confirmation link in your inbox to verify your account, then return here to sign in.
              </p>
              <button
                type="button"
                onClick={() => { setEmailSentNotice(false); setAuthMode('signin'); }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Hackathon Fast Judge Access */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 text-center space-y-1.5">
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-700">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Hackathon Judge Quick Access</span>
                </div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Instant Demo Access</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">
                  {authMode === 'signup' ? 'New Account with Email Confirmation' : 'Sign in with credentials'}
                </span>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-3">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Rajesh Kumar"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="organizer@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  {authMode === 'signup' && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Min. 6 characters. Supabase will send a confirmation link to this email.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-all mt-2 flex items-center justify-center space-x-1.5"
                >
                  {isLoading ? (
                    <span>Processing with Supabase...</span>
                  ) : authMode === 'signup' ? (
                    <>
                      <span>Sign Up & Send Confirmation</span>
                      <Send className="w-4 h-4" />
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
