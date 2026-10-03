import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StudentCatalog from './components/StudentCatalog';
import RegistrationModal from './components/RegistrationModal';
import TicketSuccessModal from './components/TicketSuccessModal';
import OrganizerDashboard from './components/OrganizerDashboard';
import LoginModal from './components/LoginModal';
import { DataService } from './lib/dataService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('student'); // 'student' | 'organizer'
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedEventToRegister, setSelectedEventToRegister] = useState(null);
  const [confirmedRegistration, setConfirmedRegistration] = useState(null);
  const [confirmedEvent, setConfirmedEvent] = useState(null);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('eventease_organizer_logged_in') === 'true';
  });

  // Fetch latest events & registrations
  const loadData = useCallback(async () => {
    try {
      const [fetchedEvents, fetchedRegs] = await Promise.all([
        DataService.getEvents(),
        DataService.getRegistrations()
      ]);
      setEvents(fetchedEvents);
      setRegistrations(fetchedRegs);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for Supabase email confirmation redirect / sign in
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsLoggedIn(true);
          localStorage.setItem('eventease_organizer_logged_in', 'true');
          setActiveView('organizer');
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          localStorage.removeItem('eventease_organizer_logged_in');
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);

  // Handle Organizer Login
  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    localStorage.setItem('eventease_organizer_logged_in', 'true');
    setActiveView('organizer');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setIsLoggedIn(false);
    localStorage.removeItem('eventease_organizer_logged_in');
    setActiveView('student');
  };

  // Handle Reset Sample Demo Data
  const handleResetData = () => {
    if (window.confirm('Reset demo data back to default sample events and registrations?')) {
      DataService.resetDemoData();
      loadData();
    }
  };

  // Handle Registration Success
  const handleRegistrationSuccess = (newReg, event, emailSent = false) => {
    setSelectedEventToRegister(null);
    setConfirmedRegistration(newReg);
    setConfirmedEvent(event);
    setEmailConfirmationSent(emailSent);
    loadData(); // Refresh seat counts
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={handleLogout}
        openLoginModal={() => setIsLoginModalOpen(true)}
        onResetData={handleResetData}
        isCloud={DataService.isCloudMode()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Loading EventEase...
            </p>
          </div>
        ) : activeView === 'student' ? (
          <StudentCatalog
            events={events}
            isLoading={isLoading}
            onSelectEventToRegister={(evt) => setSelectedEventToRegister(evt)}
          />
        ) : (
          <OrganizerDashboard
            events={events}
            registrations={registrations}
            onRefreshData={loadData}
          />
        )}
      </main>

      {/* Registration Modal */}
      {selectedEventToRegister && (
        <RegistrationModal
          event={selectedEventToRegister}
          onClose={() => setSelectedEventToRegister(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* Instant Ticket Success Modal with QR Code */}
      {confirmedRegistration && (
        <TicketSuccessModal
          registration={confirmedRegistration}
          event={confirmedEvent}
          emailConfirmationSent={emailConfirmationSent}
          onClose={() => {
            setConfirmedRegistration(null);
            setConfirmedEvent(null);
            setEmailConfirmationSent(false);
          }}
        />
      )}

      {/* Organizer Login / Sign Up Modal with Email Confirmation */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">
            EventEase • College Event Registration & Live Attendance System
          </p>
          <p className="text-slate-400">
            Engineered for College Hackathon 2026 • Dual-Portal Architecture with Real-Time QR Scanner
          </p>
        </div>
      </footer>

    </div>
  );
}
