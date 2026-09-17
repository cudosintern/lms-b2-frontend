import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Context, Mark } from './horizontalAttendancePdf';

export function buildVerticalAttendancePdf(groups: Mark[][], context: Context) {
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
  groups.forEach((students, index) => {
    if (!students.length) return;
    if (index) doc.addPage();
    const course = students[0];
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(40);
    const title = doc.splitTextToSize(context.institution || 'Consolidated Attendance Report', 180);
    doc.text(title, 105, 12, { align: 'center' });
    let y = 17 + title.length * 5;
    doc.setDrawColor(150).line(10, y, 200, y);
    doc.setFontSize(10).setTextColor(160, 0, 0).text('Consolidated Attendance Report', 10, y + 7);
    autoTable(doc, {
      startY: y + 11, margin: { left: 10, right: 10 }, theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: 30 },
      body: [[`Curriculum: ${context.curriculum}`, `Term: ${context.semester}`],
        [{ content: `Date Range: ${context.from || ''} to ${context.to || ''}`, colSpan: 2 }]],
    });
    y = (doc as any).lastAutoTable.finalY + 5;
    autoTable(doc, {
      startY: y, margin: { left: 10, right: 10 }, theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [255, 255, 255], textColor: [150, 0, 0] },
      head: [[{ content: 'Course-wise Section-wise student attendance report with percentage', colSpan: 2 }], ['Course', 'Students displayed']],
      body: [[`${course.crs_code} - ${course.crs_title || ''} - Section: ${course.section}`, students.length]],
      columnStyles: { 1: { cellWidth: 40, halign: 'center' } },
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      margin: { top: 12, left: 10, right: 10, bottom: 15 }, theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center', valign: 'middle', lineWidth: 0.15, lineColor: [195, 195, 195] },
      headStyles: { fillColor: [255, 255, 255], textColor: [150, 0, 0] },
      footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], minCellHeight: 8 },
      columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 24 }, 2: { cellWidth: 55, halign: 'left' }, 3: { cellWidth: 28 }, 4: { cellWidth: 17 }, 5: { cellWidth: 54 } },
      showHead: 'everyPage', showFoot: 'lastPage', rowPageBreak: 'avoid',
      head: [[{ content: 'Sl. No.', rowSpan: 4 }, { content: 'USN', rowSpan: 4 }, 'Course Code', { content: course.crs_code || '', colSpan: 2 }, { content: 'Student Signature', rowSpan: 4 }],
        ['Section', { content: course.section, colSpan: 2 }],
        ['Total Class Held', { content: String(course.total_classes), colSpan: 2 }],
        ['Student Name', 'Classes Attended', '%']],
      body: students.map((row, i) => [i + 1, row.usno, row.student_name, `${row.present} / ${row.total_classes}`, Number(row.attendance_pct).toFixed(2), '']),
      foot: [[{ content: 'Name of the Faculty', colSpan: 3 }, { content: course.course_instructor || 'Not assigned', colSpan: 2 }, { content: '', rowSpan: 2 }],
        [{ content: 'Signature of the Faculty', colSpan: 3 }, { content: '', colSpan: 2 }]],
      didParseCell: data => {
        if (data.section === 'body' && data.column.index === 4) {
          const pct = Number(data.cell.raw);
          data.cell.styles.textColor = pct >= 85 ? [0, 128, 0] : pct >= 75 ? [170, 110, 0] : [210, 0, 0];
        }
      },
    });
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(70);
    doc.text('< 75%     |     75% to < 85%     |     >= 85%', 105, 289, { align: 'center' });
    doc.text(`Page ${page} of ${pages}`, 200, 289, { align: 'right' });
  }
  return doc;
}
