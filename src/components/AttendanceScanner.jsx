import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  CameraOff, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  History, 
  UserCheck, 
  Volume2 
} from 'lucide-react';
import { DataService } from '../lib/dataService';

// Audio feedback using Web Audio API (zero audio file dependencies)
function playBeep(type = 'success') {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'warning') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.setValueAtTime(350, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.setValueAtTime(160, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.35);
    }
  } catch (e) {
    // Audio context may be restricted by autoplay policy
  }
}

export default function AttendanceScanner({ events, onAttendanceUpdated }) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [scannerError, setScannerError] = useState('');

  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Selected event object
  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];

  // Process a code (from manual input or camera)
  const processCheckIn = async (rawCode) => {
    if (!rawCode || isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      // Clean code in case it's a URL or formatted text
      let code = rawCode.trim();
      if (code.includes('EVT-')) {
        const match = code.match(/EVT-[A-Z0-9]+/i);
        if (match) code = match[0];
      }

      const res = await DataService.markAttendance(code, selectedEventId || null);

      if (res.status === 'success') {
        playBeep('success');
        setScanResult({
          type: 'success',
          title: 'Marked Present!',
          message: `${res.registration.name} (${res.registration.student_id})`,
          regId: res.registration.reg_id,
          event: res.registration.events?.title,
          dept: res.registration.department,
          timestamp: new Date().toLocaleTimeString()
        });

        // Add to recent session log
        setRecentScans(prev => [
          {
            id: res.registration.id,
            regId: res.registration.reg_id,
            name: res.registration.name,
            studentId: res.registration.student_id,
            department: res.registration.department,
            status: 'Present',
            time: new Date().toLocaleTimeString()
          },
          ...prev.slice(0, 9)
        ]);

        if (onAttendanceUpdated) onAttendanceUpdated();
      } else if (res.status === 'already_marked') {
        playBeep('warning');
        setScanResult({
          type: 'warning',
          title: 'Already Checked In',
          message: `${res.registration?.name || 'Student'} was previously verified.`,
          detail: res.message,
          regId: res.registration?.reg_id || code
        });
      } else if (res.status === 'wrong_event') {
        playBeep('error');
        setScanResult({
          type: 'error',
          title: 'Wrong Event Ticket',
          message: res.message,
          regId: code
        });
      } else {
        playBeep('error');
        setScanResult({
          type: 'error',
          title: 'Invalid Registration ID',
          message: res.message || 'No record found with this ID.',
          regId: code
        });
      }
    } catch (err) {
      playBeep('error');
      setScanResult({
        type: 'error',
        title: 'Check-in Error',
        message: err.message || 'Failed to communicate with database.'
      });
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1200); // 1.2s debounce to prevent duplicate scan bursts
    }
  };

  // Manual submit handler
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processCheckIn(manualInput);
    setManualInput('');
  };

  // Start / Stop Camera Scanner
  const startScanner = async () => {
    setScannerError('');
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          processCheckIn(decodedText);
        },
        (errorMessage) => {
          // ignore common frame errors
        }
      );
    } catch (err) {
      console.error('Camera startup error:', err);
      setScannerError('Could not access camera. Please allow camera permissions or use manual ID entry below.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Top Controller Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Target Event For Check-in
          </span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="mt-1 font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.registered_count} registered)
              </option>
            ))}
          </select>
        </div>

        {/* Live Attendance Counter */}
        {currentEvent && (
          <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Venue</span>
              <span className="font-bold text-slate-700">{currentEvent.venue}</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-slate-400 block font-semibold">Capacity</span>
              <span className="font-bold text-slate-700">{currentEvent.capacity} Seats</span>
            </div>
          </div>
        )}

      </div>

      {/* Main Dual-Checkin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Camera Scanner & Manual Entry (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Manual ID Input Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  #
                </div>
                <h3 className="font-bold text-slate-800 text-base">Quick Manual Check-in</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Instant lookup</span>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Type or paste Reg ID (e.g. EVT-8F2K1)"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all font-semibold"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-200 transition-all flex items-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Mark</span>
              </button>
            </form>
          </div>

          {/* Camera QR Scanner Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Camera QR Code Scanner</h3>
                  <p className="text-xs text-slate-400">Scan student pass via phone or laptop camera</p>
                </div>
              </div>

              <button
                onClick={isScanning ? stopScanner : startScanner}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
                  isScanning
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {isScanning ? (
                  <>
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Camera</span>
                  </>
                )}
              </button>
            </div>

            {scannerError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{scannerError}</span>
              </div>
            )}

            {/* Video Viewfinder Container */}
            <div className={`relative rounded-2xl overflow-hidden bg-slate-900 min-h-[260px] flex items-center justify-center ${isScanning ? 'block' : 'p-8 text-center'}`}>
              <div id="qr-reader" className={`w-full ${isScanning ? 'block' : 'hidden'}`}></div>

              {!isScanning && (
                <div className="text-center text-slate-400 space-y-2">
                  <Camera className="w-10 h-10 mx-auto opacity-40 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-300">Camera is currently paused</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Click "Open Camera" to activate live barcode scanning, or use the manual box above.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Column: Live Status & Session Log (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Result Feedback Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Check-in Status</h3>

            {scanResult ? (
              <div
                className={`p-5 rounded-2xl border transition-all animate-in fade-in duration-200 ${
                  scanResult.type === 'success'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    : scanResult.type === 'warning'
                    ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                    : 'bg-rose-50/80 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {scanResult.type === 'success' && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  )}
                  {scanResult.type === 'warning' && (
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  {scanResult.type === 'error' && (
                    <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-base">{scanResult.title}</h4>
                    <p className="font-semibold text-sm">{scanResult.message}</p>
                    
                    {scanResult.detail && (
                      <p className="text-xs opacity-80">{scanResult.detail}</p>
                    )}

                    {scanResult.dept && (
                      <p className="text-xs opacity-75">{scanResult.dept}</p>
                    )}

                    {scanResult.regId && (
                      <span className="inline-block mt-2 font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/10">
                        {scanResult.regId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-1">
                <Sparkles className="w-6 h-6 mx-auto opacity-40 text-slate-400" />
                <p className="text-sm font-medium text-slate-500">Awaiting scan or ID submission</p>
                <p className="text-xs text-slate-400">Results will appear here with audio chime.</p>
              </div>
            )}
          </div>

          {/* Recent Scans Session Log */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-800 text-sm">Recent Check-ins (This Session)</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {recentScans.length}
              </span>
            </div>

            {recentScans.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No check-ins recorded in this session yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {recentScans.map((scan, i) => (
                  <div
                    key={`${scan.regId}-${i}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{scan.name}</span>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                        <span className="font-mono">{scan.regId}</span>
                        <span>•</span>
                        <span>{scan.studentId}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {scan.status}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{scan.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
