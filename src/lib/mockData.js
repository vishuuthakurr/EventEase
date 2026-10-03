// Pre-seeded high quality sample data for College Hackathon demonstration

export const INITIAL_EVENTS = [
  {
    id: "evt-101",
    title: "HackSphere 2026: 24h National Hackathon",
    description: "Build cutting-edge AI and Web solutions. Mentors, prizes worth 1.5 Lakhs, and free food included!",
    category: "Tech",
    date: "2026-10-15",
    time: "09:00 AM",
    venue: "Main Auditorium & Innovation Lab",
    capacity: 60,
    banner_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: "evt-102",
    title: "Autonomous Robotics & Drone Workshop",
    description: "Hands-on hardware lab building obstacle-avoiding rovers and mini-drones using ESP32 & Arduino.",
    category: "Workshop",
    date: "2026-10-18",
    time: "11:00 AM",
    venue: "Robotics Lab 304, Tech Block",
    capacity: 40,
    banner_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: "evt-103",
    title: "Rhythm & Beats: Inter-College Cultural Gala",
    description: "Annual battle of bands, classical fusion, solo dance battles, and live celebrity DJ evening.",
    category: "Cultural",
    date: "2026-10-22",
    time: "05:30 PM",
    venue: "Open Air Amphitheatre",
    capacity: 120,
    banner_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "evt-104",
    title: "Zero-Day Defense: CyberSecurity & CTF",
    description: "Learn penetration testing, binary exploitation, and compete in a 4-hour live capture-the-flag challenge.",
    category: "Tech",
    date: "2026-10-25",
    time: "10:00 AM",
    venue: "Seminar Hall B, 2nd Floor",
    capacity: 50,
    banner_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "evt-105",
    title: "Inter-Department Box Cricket Championship",
    description: "Fast-paced 6-a-side floodlight tournament with knockout rounds. Rolling trophy for the champions!",
    category: "Sports",
    date: "2026-10-28",
    time: "03:00 PM",
    venue: "College Sports Pavilion",
    capacity: 24,
    banner_url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export const INITIAL_REGISTRATIONS = [
  {
    id: "reg-001",
    reg_id: "EVT-8F2K1",
    event_id: "evt-101",
    student_id: "CS22B104",
    name: "Rahul Sharma",
    email: "rahul.sharma@college.edu",
    department: "Computer Science",
    attended: true,
    attended_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "reg-002",
    reg_id: "EVT-3M9P0",
    event_id: "evt-101",
    student_id: "IT23A045",
    name: "Ananya Iyer",
    email: "ananya.iyer@college.edu",
    department: "Information Technology",
    attended: false,
    attended_at: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "reg-003",
    reg_id: "EVT-7X2W8",
    event_id: "evt-101",
    student_id: "EC22C012",
    name: "Vikram Malhotra",
    email: "v.malhotra@college.edu",
    department: "Electronics & Comm.",
    attended: false,
    attended_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "reg-004",
    reg_id: "EVT-4J8Q3",
    event_id: "evt-102",
    student_id: "ME23A088",
    name: "Siddharth Verma",
    email: "sid.verma@college.edu",
    department: "Mechanical Engg.",
    attended: true,
    attended_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "reg-005",
    reg_id: "EVT-9L1Z5",
    event_id: "evt-103",
    student_id: "BT24B019",
    name: "Pooja Hegde",
    email: "pooja.h@college.edu",
    department: "Biotechnology",
    attended: false,
    attended_at: null,
    created_at: new Date(Date.now() - 1200000).toISOString()
  }
];

export const DEPARTMENTS = [
  "Computer Science & Engg (CSE)",
  "Information Technology (IT)",
  "Electronics & Comm. (ECE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Electrical & Electronics (EEE)",
  "Biotechnology (BT)",
  "Management / MBA"
];
