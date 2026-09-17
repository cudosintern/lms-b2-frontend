import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

export interface Mark {
  usno: string;
  student_name: string;
  crs_code?: string;
  crs_title?: string;
  section: string;
  total_classes: number;
  present: number;
  attendance_pct: number;
  course_instructor?: string;
}
interface Group {
  section: string;
  courses: Map<string, Mark>;
  students: Map<string, Map<string, Mark>>;
}
export interface Context {
  institution?: string;
  curriculum: string;
  semester: string;
  from?: string;
  to?: string;
}
const displayDate = (value?: string) => value ? value.split('-').reverse().join('-') : '';
const color = (pct: number): [number, number, number] => pct >= 85 ? [0, 128, 0] : pct >= 75 ? [170, 110, 0] : [210, 0, 0];

/** Build independently of the DOM so downloaded and printed pages use identical data. */
export function buildHorizontalAttendancePdf(groups: Group[], context: Context) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  let first = true;
  groups.forEach(group => {
    const allCourses = Array.from(group.courses.entries());
    // Keep text readable for large selections; repeat student identity in each course panel.
    for (let offset = 0; offset < allCourses.length; offset += 4) {
      if (!first) doc.addPage();
      first = false;
      const courses = allCourses.slice(offset, offset + 4);
      doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(42, 70, 90);
      const title = context.institution || 'Consolidated Attendance Report';
      const titleLines = doc.splitTextToSize(title, width - 24);
      doc.text(titleLines, width / 2, 12, { align: 'center' });
      const titleEnd = 14 + titleLines.length * 5;
      if (context.institution) doc.setFontSize(10).text('Consolidated Attendance Report', width / 2, titleEnd, { align: 'center' });
      autoTable(doc, {
        startY: titleEnd + 4, margin: { left: 8, right: 8 }, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.2, textColor: 25 },
        columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold' } },
        body: [['Curriculum:', context.curriculum], ['Semester:', context.semester],
          ['Date Range:', `${displayDate(context.from)} to ${displayDate(context.to)}`]],
      });
      let y = (doc as any).lastAutoTable.finalY + 4;
      autoTable(doc, {
        startY: y, margin: { left: 8, right: 8, bottom: 15 }, theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 1.2 }, headStyles: { fillColor: [224, 232, 239], textColor: [42, 70, 90] },
        head: [[{ content: `Course-wise attendance - Section: ${group.section}${allCourses.length > 4 ? ` (Courses ${offset + 1}-${offset + courses.length} of ${allCourses.length})` : ''}`, colSpan: 2 }], ['Course', 'Students displayed']],
        body: courses.map(([key, c]) => [`${c.crs_code} - ${c.crs_title || ''} - Section: ${c.section}`,
          Array.from(group.students.values()).filter(student => student.has(key)).length]),
        columnStyles: { 1: { cellWidth: 35, halign: 'center' } },
      });
      y = (doc as any).lastAutoTable.finalY + 2;
      const head: RowInput[] = [
        [{ content: 'Sl. No.', rowSpan: 4 }, { content: 'USN', rowSpan: 4 }, 'Course Code',
          ...courses.map(([, c]) => ({ content: c.crs_code || '', colSpan: 2 })),
          { content: 'Overall %', rowSpan: 4 }, { content: 'Student signature', rowSpan: 4 }],
        ['Section', ...courses.map(([, c]) => ({ content: c.section, colSpan: 2 }))],
        ['Total Class Held', ...courses.map(([, c]) => ({ content: String(c.total_classes), colSpan: 2 }))],
        ['Student Name', ...courses.flatMap(() => ['Classes Attended', '%'])],
      ];
      const body: RowInput[] = Array.from(group.students.values()).map((marks, index) => {
        const entries = Array.from(marks.values());
        const held = entries.reduce((sum, row) => sum + Number(row.total_classes), 0);
        const present = entries.reduce((sum, row) => sum + Number(row.present), 0);
        return [index + 1, entries[0].usno, entries[0].student_name,
          ...courses.flatMap(([key]) => {
            const mark = marks.get(key);
            return mark ? [`${mark.present} / ${mark.total_classes}`, Number(mark.attendance_pct).toFixed(2)] : ['-', '-'];
          }), (held ? present / held * 100 : 0).toFixed(2), ''];
      });
      autoTable(doc, {
        startY: y, margin: { top: 12, left: 8, right: 8, bottom: 16 }, theme: 'grid',
        head, body, showHead: 'everyPage', showFoot: 'lastPage', rowPageBreak: 'avoid',
        foot: [[{ content: 'Name of the Faculty', colSpan: 3 }, ...courses.map(([, c]) => ({ content: c.course_instructor || 'Not assigned', colSpan: 2 })), { content: '', colSpan: 2 }],
          [{ content: 'Signature of the Faculty', colSpan: 3 }, ...courses.map(() => ({ content: '', colSpan: 2 })), { content: '', colSpan: 2 }]],
        styles: { font: 'helvetica', fontSize: 7, cellPadding: 1.1, halign: 'center', valign: 'middle', lineColor: [190, 190, 190], lineWidth: 0.15 },
        headStyles: { fillColor: [224, 232, 239], textColor: [42, 70, 90] },
        footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], minCellHeight: 7 },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 23 }, 2: { cellWidth: 48, halign: 'left' },
          [3 + courses.length * 2]: { cellWidth: 19 }, [4 + courses.length * 2]: { cellWidth: 26 } },
        didParseCell: data => {
          if (data.section === 'body' && (data.column.index === 3 + courses.length * 2 ||
            (data.column.index >= 4 && data.column.index < 3 + courses.length * 2 && data.column.index % 2 === 0))) {
            const pct = Number(data.cell.raw);
            if (Number.isFinite(pct)) data.cell.styles.textColor = color(pct);
          }
        },
      });
    }
  });
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal').setFontSize(7);
    [['< 75%', 95, 0], ['75% to < 85%', 123, 75], ['>= 85%', 163, 85]].forEach(([text, x, pct]) => {
      doc.setTextColor(...color(Number(pct))).text(String(text), Number(x), height - 8);
    });
    doc.setTextColor(70).text(`Page ${page} of ${count}`, width - 8, height - 8, { align: 'right' });
  }
  return doc;
}
