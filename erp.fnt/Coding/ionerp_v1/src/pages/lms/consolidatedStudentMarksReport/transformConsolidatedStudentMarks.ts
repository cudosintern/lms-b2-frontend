import {
  ConsolidatedStudentMarksReportData,
  MarksTableCourseHeader,
  MarksTableRow,
  MarksTransformedTable,
} from "./consolidatedStudentMarksReportTypes";

const normalizeComponentKey = (courseId: number, componentId: string) =>
  `${courseId}::${componentId}`;

const formatMark = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(Number(value)) ? "-" : String(value);

export const transformConsolidatedStudentMarks = (
  report: ConsolidatedStudentMarksReportData | null | undefined,
): MarksTransformedTable => {
  if (!report) {
    return { headers: [], rows: [] };
  }

  const headerMap = new Map<number, MarksTableCourseHeader>();

  [...(report.courses ?? []), ...report.rows.flatMap((student) => student.courses)].forEach((course) => {
    const existing = headerMap.get(course.course_id) ?? {
      courseId: course.course_id,
      courseCode: course.course_code,
      courseTitle: course.course_title,
      componentKeys: [],
      componentLabels: {},
    };

    course.components.forEach((component) => {
      const componentKey = normalizeComponentKey(course.course_id, component.component_id);
      if (!existing.componentKeys.includes(componentKey)) {
        existing.componentKeys.push(componentKey);
        existing.componentLabels[componentKey] = `${component.occasion_name}${component.max_marks == null ? "" : ` (${component.max_marks})`}`;
      }
    });

    headerMap.set(course.course_id, existing);
  });

  const headers = Array.from(headerMap.values());

  const rows: MarksTableRow[] = report.rows.map((student) => {
    const componentMarks: Record<string, string> = {};
    const courseTotals: Record<number, string> = {};
    const courseDataAvailability: Record<number, boolean> = {};
    let grandTotalValue = 0;
    let hasAnyTotal = false;

    student.courses.forEach((course) => {
      courseTotals[course.course_id] = formatMark(course.total_marks);
      courseDataAvailability[course.course_id] = course.data_available !== false;

      course.components.forEach((component) => {
        const componentKey = normalizeComponentKey(course.course_id, component.component_id);
        componentMarks[componentKey] = component.status === "absent" ? "AB" : formatMark(component.marks);
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
      courseTotals,
      courseDataAvailability,
      grandTotal: hasAnyTotal ? String(Number(grandTotalValue.toFixed(2))) : "-",
    };
  });

  return { headers, rows };
};
