import React, { useState } from 'react';
import { X, Calendar, MapPin, AlertCircle, CheckCircle2, Loader2, Sparkles, MailCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEPARTMENTS } from '../lib/mockData';
import { DataService } from '../lib/dataService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function RegistrationModal({ event, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    department: DEPARTMENTS[0]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!event) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!formData.studentId.trim()) {
      setErrorMessage('Please enter your College Student ID / Roll Number.');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid college email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await DataService.registerStudent({
        eventId: event.id,
        studentId: formData.studentId,
        name: formData.name,
        email: formData.email,
        department: formData.department
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Registration failed.');
        setIsLoading(false);
        return;
      }

      // Supabase Auth email confirmation trigger
      let emailConfirmationSent = false;
      if (isSupabaseConfigured && supabase) {
        try {
          const randomPass = 'Pass@' + Math.random().toString(36).slice(-8) + '1A!';
          const { error: authError } = await supabase.auth.signUp({
            email: formData.email.trim().toLowerCase(),
            password: randomPass,
            options: {
              data: {
                student_id: formData.studentId,
                name: formData.name,
                department: formData.department,
                role: 'student'
              },
              emailRedirectTo: window.location.origin
            }
          });
          if (!authError) {
            emailConfirmationSent = true;
          }
        } catch (authErr) {
          console.warn('Supabase Auth signUp note:', authErr);
        }
      }

      // Celebrate with confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore in case window lacks canvas
      }

      onSuccess(res.registration, event, emailConfirmationSent);
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold tracking-wide uppercase mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Event Registration & Verification</span>
          </div>

          <h2 className="text-xl font-bold leading-snug line-clamp-1">{event.title}</h2>
          
          <div className="flex items-center space-x-4 text-xs text-indigo-100 mt-2">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{event.date} • {event.time}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="font-medium leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Student ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Student ID / Roll No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS22B104"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white uppercase font-mono tracking-wide"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Sundaram"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* College Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              College Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. priya.s@college.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <div className="flex items-center space-x-1.5 text-[11px] text-indigo-600 font-medium mt-1.5">
              <MailCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Supabase Auth will dispatch a confirmation email to verify this address.</span>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Securing Seat...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register & Confirm Email</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
