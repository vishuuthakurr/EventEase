-- =========================================================================
-- College Event Registration System (EventEase) - Database Schema
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Tech', 'Cultural', 'Workshop', 'Sports', 'Seminar')),
    date DATE NOT NULL,
    time TEXT NOT NULL,
    venue TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg_id TEXT UNIQUE NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT NOT NULL,
    attended BOOLEAN DEFAULT FALSE,
    attended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_student_per_event UNIQUE (event_id, student_id)
);

-- Index for high-speed queries during event day check-in
CREATE INDEX IF NOT EXISTS idx_registrations_reg_id ON registrations(reg_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_student_id ON registrations(student_id);

-- 2. Concurrency-Safe Seat Reservation Procedure
-- Prevents race conditions when multiple students click Register for the final seat simultaneously
CREATE OR REPLACE FUNCTION register_for_event(
    p_event_id UUID,
    p_student_id TEXT,
    p_name TEXT,
    p_email TEXT,
    p_department TEXT
) RETURNS JSONB AS $$
DECLARE
    v_capacity INT;
    v_registered INT;
    v_reg_id TEXT;
    v_new_reg registrations%ROWTYPE;
BEGIN
    -- Row-level lock on event record to serialize simultaneous registrations
    SELECT capacity INTO v_capacity FROM events WHERE id = p_event_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found');
    END IF;

    -- Count existing confirmed registrations
    SELECT count(*) INTO v_registered FROM registrations WHERE event_id = p_event_id;

    IF v_registered >= v_capacity THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event is sold out! No seats remaining.');
    END IF;

    -- Generate human-readable Registration ID: EVT-XXXXX (5 chars)
    v_reg_id := 'EVT-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));

    INSERT INTO registrations (
        reg_id,
        event_id,
        student_id,
        name,
        email,
        department
    ) VALUES (
        v_reg_id,
        p_event_id,
        p_student_id,
        p_name,
        p_email,
        p_department
    )
    RETURNING * INTO v_new_reg;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Registration confirmed successfully!',
        'registration', row_to_json(v_new_reg)
    );
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'You have already registered for this event with Student ID: ' || p_student_id
        );
END;
$$ LANGUAGE plpgsql;

-- 3. Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow public read on events
CREATE POLICY "Public can view all events" ON events
    FOR SELECT USING (true);

-- Allow authenticated organizers full management on events
CREATE POLICY "Organizers can insert events" ON events
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Organizers can update events" ON events
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Organizers can delete events" ON events
    FOR DELETE TO authenticated USING (true);

-- Registrations policies
CREATE POLICY "Public can view own registration or insert" ON registrations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view registrations" ON registrations
    FOR SELECT USING (true);

CREATE POLICY "Organizers can update registrations (attendance)" ON registrations
    FOR UPDATE TO authenticated USING (true);

-- 4. Realistic Seed Events
INSERT INTO events (title, description, category, date, time, venue, capacity) VALUES
('HackSphere 2026: 24h National Hackathon', 'Build cutting-edge AI and Web solutions. Mentors, prizes worth 1.5 Lakhs, and free food included!', 'Tech', '2026-10-15', '09:00 AM', 'Main Auditorium & Innovation Lab', 80),
('Autonomous Robotics & Drone Workshop', 'Hands-on hardware lab building obstacle-avoiding rovers and mini-drones using ESP32.', 'Workshop', '2026-10-18', '11:00 AM', 'Robotics Lab 304, Tech Block', 45),
('Rhythm & Beats: Inter-College Cultural Gala', 'Annual battle of bands, classical fusion, solo dance battles, and live celebrity DJ evening.', 'Cultural', '2026-10-22', '05:30 PM', 'Open Air Amphitheatre', 150),
('Zero-Day Defense: CyberSecurity & CTF', 'Learn real-world penetration testing, reverse engineering, and compete in a 4-hour live capture the flag.', 'Tech', '2026-10-25', '10:00 AM', 'Seminar Hall B, 2nd Floor', 50),
('Inter-Department Box Cricket Championship', 'Fast-paced 6-a-side floodlight tournament. Trophies for champions and player of the tournament.', 'Sports', '2026-10-28', '03:00 PM', 'College Sports Ground', 32);
