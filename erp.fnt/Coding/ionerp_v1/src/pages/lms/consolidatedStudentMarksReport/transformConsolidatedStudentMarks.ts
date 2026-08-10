import {
  ConsolidatedStudentMarksReportData,
  MarksTableCourseHeader,
  MarksTableRow,
  MarksTransformedTable,
} from "./consolidatedStudentMarksReport";

const normalizeComponentKey = (courseId: number, occasionName: string) =>
  `${courseId}::${occasionName.trim()}`;

const formatMark = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(Number(value)) ? "-" : String(value);

export const transformConsolidatedStudentMarks = (
  report: ConsolidatedStudentMarksReportData | null | undefined,
): MarksTransformedTable => {
  if (!report?.rows?.length) {
    return { headers: [], rows: [] };
  }

  const headerMap = new Map<number, MarksTableCourseHeader>();

  report.rows.forEach((student) => {
    student.courses.forEach((course) => {
      const existing = headerMap.get(course.course_id) ?? {
        courseId: course.course_id,
        courseCode: course.course_code,
        courseTitle: course.course_title,
        componentKeys: [],
      };

      course.components.forEach((component) => {
        const componentKey = normalizeComponentKey(course.course_id, component.occasion_name);
        if (!existing.componentKeys.includes(componentKey)) {
          existing.componentKeys.push(componentKey);
        }
      });

      headerMap.set(course.course_id, existing);
    });
  });

  const headers = Array.from(headerMap.values()).sort((a, b) => a.courseId - b.courseId);

  const rows: MarksTableRow[] = report.rows.map((student) => {
    const componentMarks: Record<string, string> = {};
    const courseDataAvailability: Record<number, boolean> = {};
    let grandTotalValue = 0;
    let hasAnyTotal = false;

    student.courses.forEach((course) => {
      courseDataAvailability[course.course_id] = course.data_available !== false;

      course.components.forEach((component) => {
        const componentKey = normalizeComponentKey(course.course_id, component.occasion_name);
        componentMarks[componentKey] = formatMark(component.marks);
      });

      if (course.total_marks !== null && course.total_marks !== undefined && !Number.isNaN(Number(course.total_marks))) {
        grandTotalValue += Number(course.total_marks);
        hasAnyTotal = true;
      }
    });

    return {
      key: `${student.student_usn}-${student.sl_no}`,
      slNo: student.sl_no,
      studentUsn: student.student_usn,
      studentName: student.student_name,
      studentIdentityStatus: student.student_identity_status ?? "",
      regno: student.regno ?? "-",
      section: student.section ?? "-",
      componentMarks,
      courseDataAvailability,
      grandTotal: hasAnyTotal ? String(grandTotalValue) : "-",
    };
  });

  return { headers, rows };
};
