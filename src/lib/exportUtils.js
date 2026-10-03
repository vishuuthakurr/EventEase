import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Export registrations to CSV file using PapaParse
export function exportRegistrationsCSV(registrations, eventTitle = 'All_Events') {
  if (!registrations || registrations.length === 0) {
    alert('No participants to export for this selection.');
    return;
  }

  const exportData = registrations.map((r, index) => ({
    'S.No': index + 1,
    'Registration ID': r.reg_id,
    'Student ID (Roll No)': r.student_id,
    'Student Name': r.name,
    'Email Address': r.email,
    'Department': r.department,
    'Event Name': r.events?.title || 'N/A',
    'Attendance Status': r.attended ? 'PRESENT' : 'ABSENT',
    'Check-in Timestamp': r.attended_at ? new Date(r.attended_at).toLocaleString() : 'N/A',
    'Registered At': new Date(r.created_at).toLocaleString()
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const cleanTitle = eventTitle.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `EventEase_Roster_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export official attendance sheet to PDF using jsPDF + autotable
export function exportAttendancePDF(registrations, event = null) {
  if (!registrations || registrations.length === 0) {
    alert('No participant records found to generate PDF.');
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const eventName = event ? event.title : 'Consolidated Campus Events';
  const venue = event ? event.venue : 'All College Venues';
  const eventDate = event ? `${event.date} | ${event.time}` : new Date().toLocaleDateString();

  const total = registrations.length;
  const present = registrations.filter(r => r.attended).length;
  const absent = total - present;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COLLEGE EVENT REGISTRATION & ATTENDANCE RECORD', 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Log Generated: ${new Date().toLocaleString()}`, 14, 22);

  // Event Details Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 24, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Event: ${eventName}`, 18, 45);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Venue: ${venue}   |   Schedule: ${eventDate}`, 18, 52);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total Registered: ${total}   |   Present: ${present}   |   Absent: ${absent}`, 18, 58);

  // Table Data
  const tableRows = registrations.map((r, i) => [
    i + 1,
    r.reg_id,
    r.student_id,
    r.name,
    r.department,
    r.attended ? 'PRESENT' : 'ABSENT',
    r.attended_at ? new Date(r.attended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---',
    '' // Signature column for physical records
  ]);

  doc.autoTable({
    startY: 68,
    head: [['#', 'Reg ID', 'Roll No', 'Name', 'Dept', 'Status', 'Time', 'Sign']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 24 },
      3: { cellWidth: 38 },
      4: { cellWidth: 32 },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 20 }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.raw === 'PRESENT') {
          data.cell.styles.textColor = [16, 149, 93]; // Emerald
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [239, 68, 68]; // Red
        }
      }
    }
  });

  const cleanTitle = (event ? event.title : 'Attendance_List').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`EventEase_${cleanTitle}.pdf`);
}

// Generate an official participation certificate for attended students
export function generateCertificatePDF(registration) {
  if (!registration.attended) {
    alert('Certificate is only available for students who have attended the event.');
    return;
  }

  // Create A4 Landscape Certificate
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Decorative Border
  doc.setDrawColor(79, 70, 229); // Indigo
  doc.setLineWidth(3);
  doc.rect(10, 10, width - 20, height - 20);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.rect(13, 13, width - 26, height - 26);

  // Watermark / Accent
  doc.setFillColor(238, 242, 255);
  doc.circle(width / 2, height / 2, 70, 'F');

  // Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF PARTICIPATION', width / 2, 45, { align: 'center' });

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('THIS IS PROUDLY PRESENTED TO', width / 2, 60, { align: 'center' });

  // Student Name
  doc.setFontSize(24);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text(registration.name.toUpperCase(), width / 2, 80, { align: 'center' });

  // Roll & Dept
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text(`Student ID: ${registration.student_id}  |  Department: ${registration.department}`, width / 2, 90, { align: 'center' });

  // Body
  doc.setFontSize(13);
  doc.setTextColor(51, 65, 85);
  const eventTitle = registration.events?.title || 'College Technical Symposium 2026';
  doc.text('for active participation and successful completion in the event', width / 2, 110, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`"${eventTitle}"`, width / 2, 125, { align: 'center' });

  // Date and Verification Info
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  const eventDate = registration.events?.date || new Date().toISOString().slice(0, 10);
  doc.text(`Conducted on: ${eventDate}`, width / 2, 138, { align: 'center' });

  // Signature lines
  const sigY = 175;
  doc.setDrawColor(148, 163, 184);
  doc.line(35, sigY, 95, sigY);
  doc.line(width - 95, sigY, width - 35, sigY);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Faculty Coordinator', 65, sigY + 6, { align: 'center' });
  doc.text('Convenor / Principal', width - 65, sigY + 6, { align: 'center' });

  // Certificate ID & Security verification badge
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(`Certificate Verification ID: ${registration.reg_id} • EventEase Verified Record`, width / 2, height - 16, { align: 'center' });

  const safeName = registration.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Certificate_${safeName}_${registration.reg_id}.pdf`);
}
