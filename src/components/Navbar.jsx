import React from 'react';
import { Calendar, Shield, User, RefreshCw, Database, Sparkles } from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  isLoggedIn,
  setIsLoggedIn,
  openLoginModal,
  onResetData,
  isCloud
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & College Tag */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('student')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Event<span className="text-indigo-600">Ease</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Campus 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Centralized College Event Registration & Attendance
              </p>
            </div>
          </div>

          {/* Mode Badges & Navigation Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Database indicator badge */}
            <div 
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isCloud 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
              title={isCloud ? 'Connected to live Supabase Postgres' : 'Running on fail-safe local storage (Offline Ready)'}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isCloud ? 'Supabase Live' : 'Local Mock DB'}</span>
            </div>

            {/* View Switcher Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                onClick={() => setActiveView('student')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeView === 'student'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Student Portal</span>
              </button>

              <button
                onClick={() => {
                  if (isLoggedIn) {
                    setActiveView('organizer');
                  } else {
                    openLoginModal();
                  }
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeView === 'organizer'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Organizer Hub</span>
                {isLoggedIn && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>
            </div>

            {/* Quick Demo Reset Button for Judges */}
            <button
              onClick={onResetData}
              title="Reset Sample Hackathon Data"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Logout button if logged in */}
            {isLoggedIn && (
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setActiveView('student');
                }}
                className="text-xs text-rose-600 hover:bg-rose-50 font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
