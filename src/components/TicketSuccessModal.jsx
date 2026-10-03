import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Hash, 
  Share2,
  MailCheck
} from 'lucide-react';

export default function TicketSuccessModal({ registration, event, emailConfirmationSent, onClose }) {
  const qrRef = useRef(null);

  if (!registration) return null;

  // Download QR Code PNG
  const handleDownloadQR = () => {
    const canvas = document.getElementById('ticket-qr-canvas');
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `EventEase_QR_${registration.reg_id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Notch Banner */}
        <div className="bg-emerald-600 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-xl font-extrabold">Seat Confirmed!</h2>
          <p className="text-xs text-emerald-100 font-medium">
            Present this QR pass at the entrance on event day.
          </p>
        </div>

        {/* Digital Ticket Body */}
        <div className="p-6 space-y-5">
          
          {/* Email Confirmation Notice if Supabase sent verification */}
          {emailConfirmationSent && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start space-x-2 text-xs text-indigo-900 animate-in fade-in">
              <MailCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Verification Email Dispatched!</span>
                <span className="text-[11px] text-indigo-700">
                  Supabase Auth sent a confirmation link to <strong>{registration.email}</strong>. Check your inbox to verify.
                </span>
              </div>
            </div>
          )}

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl p-5 shadow-inner">
            <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100">
              <QRCodeCanvas
                id="ticket-qr-canvas"
                value={registration.reg_id}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Registration ID Badge */}
            <div className="mt-3 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                Registration Pass ID
              </span>
              <span className="text-2xl font-black text-indigo-700 font-mono tracking-wider">
                {registration.reg_id}
              </span>
            </div>
          </div>

          {/* Ticket Information Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
            <div className="pb-2 border-b border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Event</span>
              <h4 className="font-bold text-slate-800 text-sm">{event?.title || registration.events?.title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Attendee</span>
                <p className="font-bold text-slate-800">{registration.name}</p>
                <p className="text-slate-500 font-mono">{registration.student_id}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                <p className="font-semibold text-slate-700 truncate">{registration.department}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{event?.date || registration.events?.date}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span className="truncate max-w-[140px]">{event?.venue || registration.events?.venue}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleDownloadQR}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download QR Code Pass (PNG)</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Done & Return to Events
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
