import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_EVENTS, INITIAL_REGISTRATIONS } from './mockData';

const LOCAL_STORAGE_KEYS = {
  EVENTS: 'eventease_events_v2',
  REGISTRATIONS: 'eventease_registrations_v2',
  IS_LOGGED_IN: 'eventease_organizer_logged_in'
};

// Initialize localStorage if needed
function getStoredData(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function setStoredData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

export const DataService = {
  // Check if connected to cloud Supabase
  isCloudMode() {
    return isSupabaseConfigured;
  },

  // Reset to default sample data
  resetDemoData() {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    localStorage.setItem(LOCAL_STORAGE_KEYS.REGISTRATIONS, JSON.stringify(INITIAL_REGISTRATIONS));
  },

  // Get all events with live remaining seats calculation (hybrid sync)
  async getEvents() {
    let cloudEvents = [];
    let cloudSuccess = false;

    // 1. Try Supabase
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, registrations(id)')
          .order('date', { ascending: true });

        if (!error && Array.isArray(data)) {
          cloudEvents = data.map(evt => {
            const regCount = evt.registrations ? evt.registrations.length : 0;
            return {
              ...evt,
              registered_count: regCount,
              seats_left: Math.max(0, evt.capacity - regCount)
            };
          });
          cloudSuccess = true;
        }
      } catch (err) {
        console.warn('Supabase getEvents query warning:', err);
      }
    }

    // 2. Fetch local storage events
    let localEvents = getStoredData(LOCAL_STORAGE_KEYS.EVENTS, null);
    if (!localEvents || localEvents.length === 0) {
      localEvents = INITIAL_EVENTS;
      setStoredData(LOCAL_STORAGE_KEYS.EVENTS, localEvents);
    }

    const registrations = getStoredData(LOCAL_STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const enrichedLocal = localEvents.map(evt => {
      const regCount = registrations.filter(r => r.event_id === evt.id).length;
      return {
        ...evt,
        registered_count: regCount,
        seats_left: Math.max(0, evt.capacity - regCount)
      };
    });

    // If cloud returned active events, merge any locally added events that aren't yet in cloud
    if (cloudSuccess && cloudEvents.length > 0) {
      const cloudIds = new Set(cloudEvents.map(e => e.id));
      const localOnly = enrichedLocal.filter(e => !cloudIds.has(e.id));
      return [...localOnly, ...cloudEvents];
    }

    // If cloud is empty or errored, return the rich local events list so screen is never blank!
    return enrichedLocal;
  },

  // Get registrations (optionally filtered by eventId)
  async getRegistrations(eventId = null) {
    let cloudRegs = [];
    let cloudSuccess = false;

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('registrations')
          .select('*, events(title, venue, date, time)')
          .order('created_at', { ascending: false });

        if (eventId) {
          query = query.eq('event_id', eventId);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudRegs = data;
          cloudSuccess = true;
        }
      } catch (err) {
        console.warn('Supabase getRegistrations warning:', err);
      }
    }

    const localRegs = getStoredData(LOCAL_STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const localEvents = getStoredData(LOCAL_STORAGE_KEYS.EVENTS, INITIAL_EVENTS);

    const enrichedLocal = localRegs.map(reg => {
      const evt = localEvents.find(e => e.id === reg.event_id) || {};
      return {
        ...reg,
        events: {
          title: evt.title || 'Campus Event',
          venue: evt.venue || 'TBD',
          date: evt.date || '',
          time: evt.time || ''
        }
      };
    });

    if (cloudSuccess && cloudRegs.length > 0) {
      const cloudIds = new Set(cloudRegs.map(r => r.id));
      const localOnly = enrichedLocal.filter(r => !cloudIds.has(r.id));
      const combined = [...localOnly, ...cloudRegs];
      return eventId ? combined.filter(r => r.event_id === eventId) : combined;
    }

    return eventId ? enrichedLocal.filter(r => r.event_id === eventId) : enrichedLocal;
  },

  // Register student for an event
  async registerStudent({ eventId, studentId, name, email, department }) {
    const cleanStudentId = studentId.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check local storage first
    const events = getStoredData(LOCAL_STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const registrations = getStoredData(LOCAL_STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);

    const event = events.find(e => e.id === eventId) || { id: eventId, title: 'Campus Event', capacity: 100 };

    // Duplicate check
    const existing = registrations.find(
      r => r.event_id === eventId && r.student_id.toUpperCase() === cleanStudentId
    );
    if (existing) {
      return {
        success: false,
        message: `Student ID ${cleanStudentId} is already registered for this event with Reg ID: ${existing.reg_id}`
      };
    }

    // Capacity check
    const currentCount = registrations.filter(r => r.event_id === eventId).length;
    if (currentCount >= event.capacity) {
      return { success: false, message: 'Sorry, this event is already full!' };
    }

    // Generate unique ID
    const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
    const regId = `EVT-${randomChars}`;

    const newRegistration = {
      id: `reg-${Date.now()}`,
      reg_id: regId,
      event_id: eventId,
      student_id: cleanStudentId,
      name: cleanName,
      email: cleanEmail,
      department,
      attended: false,
      attended_at: null,
      created_at: new Date().toISOString(),
      events: {
        title: event.title,
        venue: event.venue || 'TBD',
        date: event.date || '',
        time: event.time || ''
      }
    };

    // Save locally
    registrations.unshift(newRegistration);
    setStoredData(LOCAL_STORAGE_KEYS.REGISTRATIONS, registrations);

    // Try cloud sync in background
    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('register_for_event', {
          p_event_id: eventId,
          p_student_id: cleanStudentId,
          p_name: cleanName,
          p_email: cleanEmail,
          p_department: department
        });
      } catch (err) {
        console.warn('Supabase register sync notice:', err);
      }
    }

    return {
      success: true,
      registration: newRegistration
    };
  },

  // Mark attendance by Registration ID or scanned code
  async markAttendance(regIdOrCode, targetEventId = null) {
    const cleanCode = regIdOrCode.trim().toUpperCase();

    const registrations = getStoredData(LOCAL_STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const events = getStoredData(LOCAL_STORAGE_KEYS.EVENTS, INITIAL_EVENTS);

    const index = registrations.findIndex(
      r => r.reg_id.toUpperCase() === cleanCode
    );

    if (index === -1) {
      // Check cloud if not found locally
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase
            .from('registrations')
            .select('*, events(title, venue, date)')
            .eq('reg_id', cleanCode);

          if (data && data.length > 0) {
            const record = data[0];
            if (record.attended) {
              return {
                status: 'already_marked',
                message: `Already marked attended at ${new Date(record.attended_at).toLocaleTimeString()}`,
                registration: record
              };
            }
            const now = new Date().toISOString();
            await supabase.from('registrations').update({ attended: true, attended_at: now }).eq('id', record.id);
            return {
              status: 'success',
              message: `Verified! Marked present for ${record.name} (${record.student_id})`,
              registration: { ...record, attended: true, attended_at: now }
            };
          }
        } catch (e) {}
      }
      return { status: 'not_found', message: `Registration ID "${cleanCode}" not found in system.` };
    }

    const record = registrations[index];
    const event = events.find(e => e.id === record.event_id) || {};
    const enrichedRecord = { ...record, events: { title: event.title, venue: event.venue, date: event.date } };

    if (targetEventId && record.event_id !== targetEventId) {
      return {
        status: 'wrong_event',
        message: `Ticket is for "${event.title || 'another event'}", not the selected event!`,
        registration: enrichedRecord
      };
    }

    if (record.attended) {
      return {
        status: 'already_marked',
        message: `Already marked attended at ${new Date(record.attended_at).toLocaleTimeString()}`,
        registration: enrichedRecord
      };
    }

    record.attended = true;
    record.attended_at = new Date().toISOString();
    registrations[index] = record;
    setStoredData(LOCAL_STORAGE_KEYS.REGISTRATIONS, registrations);

    // Try cloud sync
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('registrations')
          .update({ attended: true, attended_at: record.attended_at })
          .eq('reg_id', cleanCode);
      } catch (e) {}
    }

    return {
      status: 'success',
      message: `Verified! Marked present for ${record.name} (${record.student_id})`,
      registration: enrichedRecord
    };
  },

  // Toggle attendance manually from table
  async toggleAttendanceManual(registrationId, currentStatus) {
    const newStatus = !currentStatus;
    const now = newStatus ? new Date().toISOString() : null;

    const registrations = getStoredData(LOCAL_STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const updated = registrations.map(r => 
      r.id === registrationId ? { ...r, attended: newStatus, attended_at: now } : r
    );
    setStoredData(LOCAL_STORAGE_KEYS.REGISTRATIONS, updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('registrations')
          .update({ attended: newStatus, attended_at: now })
          .eq('id', registrationId);
      } catch (e) {}
    }
    return true;
  },

  // Create new event (GUARANTEED PUBLISH)
  async createEvent(eventData) {
    const events = getStoredData(LOCAL_STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const newEvent = {
      title: eventData.title.trim(),
      description: eventData.description?.trim() || '',
      category: eventData.category || 'Tech',
      date: eventData.date,
      time: eventData.time,
      venue: eventData.venue.trim(),
      capacity: parseInt(eventData.capacity, 10),
      banner_url: eventData.banner_url?.trim() || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
      id: `evt-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    // 1. Immediately store in local database so it is guaranteed to appear
    events.unshift(newEvent);
    setStoredData(LOCAL_STORAGE_KEYS.EVENTS, events);

    // 2. Also try inserting into Supabase
    if (isSupabaseConfigured) {
      try {
        const payload = {
          title: newEvent.title,
          description: newEvent.description,
          category: newEvent.category,
          date: newEvent.date,
          time: newEvent.time,
          venue: newEvent.venue,
          capacity: newEvent.capacity,
          banner_url: newEvent.banner_url
        };

        const { data, error } = await supabase
          .from('events')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          newEvent.id = data.id; // Adopt cloud ID
          setStoredData(LOCAL_STORAGE_KEYS.EVENTS, events);
        } else if (error) {
          console.warn('Supabase cloud insert notice (stored locally):', error.message);
        }
      } catch (err) {
        console.warn('Supabase network notice:', err);
      }
    }

    return { success: true, event: newEvent };
  },

  // Update existing event
  async updateEvent(id, updatedFields) {
    const events = getStoredData(LOCAL_STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updatedFields };
      setStoredData(LOCAL_STORAGE_KEYS.EVENTS, events);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('events')
          .update(updatedFields)
          .eq('id', id);
      } catch (e) {}
    }

    return { success: true, event: events[index] || updatedFields };
  },

  // Delete event
  async deleteEvent(id) {
    const events = getStoredData(LOCAL_STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const filteredEvents = events.filter(e => e.id !== id);
    setStoredData(LOCAL_STORAGE_KEYS.EVENTS, filteredEvents);

    const registrations = getStoredData(LOCAL_STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    const filteredRegs = registrations.filter(r => r.event_id !== id);
    setStoredData(LOCAL_STORAGE_KEYS.REGISTRATIONS, filteredRegs);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('events').delete().eq('id', id);
      } catch (e) {}
    }

    return true;
  }
};
