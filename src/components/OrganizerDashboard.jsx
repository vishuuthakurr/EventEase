import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  BarChart3, 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Award, 
  Clock, 
  Camera, 
  Check, 
  X, 
  AlertCircle 
} from 'lucide-react';
import AttendanceScanner from './AttendanceScanner';
import ManageEventsModal from './ManageEventsModal';
import { exportRegistrationsCSV, exportAttendancePDF, generateCertificatePDF } from '../lib/exportUtils';
import { DataService } from '../lib/dataService';

export default function OrganizerDashboard({ 
  events, 
  registrations, 
  onRefreshData 
}) {
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'scanner' | 'events'
  const [selectedEventFilter, setSelectedEventFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PRESENT' | 'ABSENT'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Compute metrics
  const totalEvents = events.length;
  const totalRegistrations = registrations.length;
  const totalAttended = registrations.filter(r => r.attended).length;
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
  const fillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

  // Filtered registrations for roster table
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      // Event filter
      if (selectedEventFilter !== 'ALL' && r.event_id !== selectedEventFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'PRESENT' && !r.attended) return false;
      if (statusFilter === 'ABSENT' && r.attended) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesStudentId = r.student_id?.toLowerCase().includes(q);
        const matchesRegId = r.reg_id?.toLowerCase().includes(q);
        const matchesDept = r.department?.toLowerCase().includes(q);
        if (!matchesName && !matchesStudentId && !matchesRegId && !matchesDept) {
          return false;
        }
      }
      return true;
    });
  }, [registrations, selectedEventFilter, statusFilter, searchQuery]);

  // Handle Attendance manual toggle from table
  const handleToggleAttendance = async (reg) => {
    await DataService.toggleAttendanceManual(reg.id, reg.attended);
    if (onRefreshData) onRefreshData();
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    const selectedEvent = events.find(e => e.id === selectedEventFilter);
    exportRegistrationsCSV(filteredRegistrations, selectedEvent ? selectedEvent.title : 'All_Campus_Events');
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    const selectedEvent = events.find(e => e.id === selectedEventFilter);
    exportAttendancePDF(filteredRegistrations, selectedEvent || null);
  };

  // Handle Save Event
  const handleSaveEvent = async (eventData) => {
    if (eventData.id) {
      await DataService.updateEvent(eventData.id, eventData);
    } else {
      await DataService.createEvent(eventData);
    }
    if (onRefreshData) await onRefreshData();
  };

  // Handle Delete Event
  const handleDeleteEvent = async (eventId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This will also remove registrations for this event.`)) {
      try {
        await DataService.deleteEvent(eventId);
        if (onRefreshData) await onRefreshData();
      } catch (err) {
        alert('Failed to delete event: ' + (err.message || 'Check database permissions'));
      }
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header & Fast Action Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Organizer Command Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time participant rosters, attendance scanner & report exports.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center self-start sm:self-auto border border-slate-300/60">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'roster'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Participant Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'scanner'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Attendance Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'events'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Manage Events</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Events</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalEvents}</p>
          <span className="text-[11px] text-slate-400 block">Active college events</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registrations</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalRegistrations}</p>
          <span className="text-[11px] text-slate-400 block">Total confirmed students</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{totalAttended}</p>
          <span className="text-[11px] text-slate-400 block">
            {totalRegistrations > 0 ? `${Math.round((totalAttended / totalRegistrations) * 100)}% turnout` : 'No check-ins'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capacity Fill</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{fillRate}%</p>
          <span className="text-[11px] text-slate-400 block">
            {totalRegistrations} of {totalCapacity} seats
          </span>
        </div>

      </div>

      {/* Per-Event Capacity Bar Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>Live Seat Fill Utilization Per Event</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(evt => {
            const pct = Math.min(100, Math.round((evt.registered_count / evt.capacity) * 100));
            const isFull = evt.seats_left === 0;

            return (
              <div key={evt.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate max-w-[180px]" title={evt.title}>
                    {evt.title}
                  </span>
                  <span className="font-mono text-slate-500 font-semibold">{pct}%</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{evt.registered_count} registered</span>
                  <span className={isFull ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                    {isFull ? 'Sold Out' : `${evt.seats_left} seats left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TAB 1: PARTICIPANT ROSTER & EXPORT */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
          
          {/* Controls Bar: Filters + Search + Export Buttons */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Event Select Filter */}
              <select
                value={selectedEventFilter}
                onChange={(e) => setSelectedEventFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Events ({registrations.length})</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Status</option>
                <option value="PRESENT">Present Only</option>
                <option value="ABSENT">Absent Only</option>
              </select>

              {/* Search Box */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, roll no, reg ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

            </div>

            {/* Export Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Attendance PDF</span>
              </button>
            </div>

          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reg ID</th>
                  <th className="py-3 px-4">Student & Roll No</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Check-in Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No student registrations matched the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {reg.reg_id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{reg.name}</span>
                        <span className="font-mono text-[11px] text-slate-400">{reg.student_id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {reg.department}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium truncate max-w-[200px]">
                        {reg.events?.title || 'Unknown Event'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleAttendance(reg)}
                          title="Click to toggle attendance"
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            reg.attended
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {reg.attended ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Present</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 text-slate-400" />
                              <span>Absent</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {reg.attended_at ? new Date(reg.attended_at).toLocaleTimeString() : '---'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {reg.attended ? (
                          <button
                            onClick={() => generateCertificatePDF(reg)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-[11px] transition-colors"
                            title="Download official Certificate of Participation"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Certificate</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Mark present first</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Showing {filteredRegistrations.length} of {registrations.length} total participants</span>
            <span className="italic">💡 Tip: Click on any Absent/Present badge to toggle attendance directly.</span>
          </div>

        </div>
      )}

      {/* TAB 2: ATTENDANCE SCANNER */}
      {activeTab === 'scanner' && (
        <AttendanceScanner 
          events={events} 
          onAttendanceUpdated={onRefreshData} 
        />
      )}

      {/* TAB 3: MANAGE EVENTS */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">College Event Directory</h3>
              <p className="text-xs text-slate-400">Configure schedules, venues, and student capacity</p>
            </div>
            <button
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((evt) => (
              <div 
                key={evt.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-700">
                      {evt.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingEvent(evt);
                          setIsEventModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                        title="Edit Event"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mt-2">{evt.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{evt.description}</p>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                  <p><strong>Venue:</strong> {evt.venue}</p>
                  <p><strong>Schedule:</strong> {evt.date} • {evt.time}</p>
                  <div className="flex items-center justify-between text-indigo-600 font-semibold pt-1">
                    <span>Capacity: {evt.capacity} seats</span>
                    <span>{evt.registered_count} enrolled</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Modal for creating/editing events */}
      {isEventModalOpen && (
        <ManageEventsModal
          event={editingEvent}
          onClose={() => {
            setIsEventModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
        />
      )}

    </div>
  );
}
