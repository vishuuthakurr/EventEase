# 🎓 EventEase — College Event Registration & Attendance System

> Built for **College Hackathon 2026** • Problem Statement #2

A high-performance, dual-portal event management web application for students and organizers. Eliminates the chaos of scattered Google Forms and paper checklists by providing real-time seat tracking, 1-click registration, digital QR ticketing, instant webcam/mobile check-in, and automated attendance exports.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies (already installed)
npm install

# 2. Run the development server
npm run dev
```

Visit `http://localhost:3000` in your web browser.

---

## 🎯 Dual-Portal Features

### 1. 🎓 Student Portal (No Login Required)
- **Live Event Catalog**: Clean card feed displaying Title, Date, Time, Venue, and Description.
- **Category Filter Chips**: Instant filtering by `Tech`, `Cultural`, `Workshop`, `Sports`.
- **Real-Time Seat Gauge**:
  - 🟢 **Available**: `X seats left`
  - 🟡 **Low Availability**: `Only X left!` (pulsing indicator)
  - 🔴 **Sold Out**: Disables the registration button when capacity is reached.
- **1-Click Registration Flow**: Collects Student ID (Roll No), Full Name, Email, and Department.
- **Digital QR Pass**: Generates high-contrast QR code encoding the unique Registration ID (`EVT-XXXXX`) with one-click **Download QR Pass (PNG)**.
- **Duplicate Prevention**: Prevents the same student ID from registering twice for the same event.

### 2. 🛡️ Organizer Portal (Protected Hub)
- **Instant Demo Login**: Evaluators can click *"Instant Organizer Access"* to test immediately without configuring accounts.
- **Executive Analytics Dashboard**:
  - Total Events, Total Registrations, Present Turnout Count, and Seat Utilization percentage.
  - Per-event visual progress bar tracking capacity filled.
- **Live Participant Roster**:
  - Instant search by student name, roll number, or Registration ID.
  - Filter by specific event or attendance status (Present / Absent).
  - One-click manual attendance toggle button.
- **Data Export Center**:
  - 📊 **Download CSV**: Formatted for Microsoft Excel with timestamps (`papaparse`).
  - 📄 **Download PDF Sheet**: Official printable attendance record with signature column (`jspdf` + `jspdf-autotable`).
- **⚡ On-Day Attendance Marker**:
  - **Camera QR Scanner**: Real-time webcam or smartphone camera scanner using `html5-qrcode`.
  - **Instant Manual ID Search**: Type or paste `EVT-XXXXX` and hit Enter (<10ms verification).
  - **Audio/Visual Feedback**: Distinct chimes and color-coded status banners for *Verified*, *Already Checked In*, and *Invalid Ticket*.
- **🏆 Bonus Feature: Participation Certificate Generator**:
  - 1-click download of an official, printable A4 Landscape Certificate of Participation for verified attendees!
- **Event Directory (CRUD)**: Create new college events, edit seat capacities, or delete expired events.

---

## 🗄️ Database & Fail-Safe Architecture

### 1. Fail-Safe LocalStorage Mode (Default)
Out-of-the-box, EventEase uses an intelligent mock persistence layer with rich sample events and registrations. **Even if the hackathon venue has spotty Wi-Fi, your demo will never crash or fail during presentation.**

### 2. Optional Supabase PostgreSQL Mode
To connect to live cloud Supabase:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the script in [`supabase/schema.sql`](./supabase/schema.sql).
3. Create a `.env` file from `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Restart Vite. EventEase automatically detects the credentials and switches to Cloud Live mode!

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Ticketing & QR**: `qrcode.react`, `html5-qrcode`
- **Data & Reports**: `papaparse`, `jspdf`, `jspdf-autotable`, `canvas-confetti`
- **Backend / Database**: Supabase (PostgreSQL with atomic row-locking RPC) + LocalStorage Mock Layer
