export interface MarksDropdownOption {
  id: number;
  name: string;
}

export interface MarksCurriculumOption {
  academic_batch_id: number;
  crclm_id: number;
  name: string;
  dept_id?: number | null;
  pgm_id?: number | null;
}

export interface MarksTermOption {
  crclm_term_id: number;
  semester_id?: number | null;
  semester_number: number;
  name: string;
}

export interface MarksSectionOption {
  section_id: number;
  section_name: string;
}

export interface MarksCourseOption {
  course_id: number;
  course_code: string;
  course_title: string;
  semester?: number | null;
}

export interface MarksResolvedFilters {
  department_id?: number | null;
  academic_batch_id: number;
  academic_batch_name?: string | null;
  curriculum_name?: string | null;
  crclm_term_id?: number | null;
  semester_id?: number | null;
  semester_number?: number | null;
  term_name?: string | null;
  section_id?: number | null;
  section_name?: string | null;
  selected_course_ids: number[];
  include_total_marks: boolean;
  from_date?: string | null;
  to_date?: string | null;
}

export interface MarksCourseComponent {
  occasion_name: string;
  max_marks?: number | null;
  marks?: number | null;
  source?: string | null;
}

export interface MarksStudentCourse {
  course_id: number;
  course_code: string;
  course_title: string;
  components: MarksCourseComponent[];
  total_marks?: number | null;
  data_available?: boolean;
}

export interface MarksReportStudentRow {
  sl_no: number;
  student_usn: string;
  student_name: string;
  student_identity_status?: string | null;
  regno?: string | null;
  section?: string | null;
  courses: MarksStudentCourse[];
}

export interface ConsolidatedStudentMarksRequest {
  department_id?: number | null;
  academic_batch_id: number;
  semester_id?: number | null;
  crclm_term_id?: number | null;
  section_id?: number | null;
  course_ids?: number[] | null;
  include_total_marks?: boolean;
  from_date?: string | null;
  to_date?: string | null;
}

export interface ConsolidatedStudentMarksReportData {
  filters: MarksResolvedFilters;
  rows: MarksReportStudentRow[];
}

export interface MarksGraphCourseSummary {
  course_id: number;
  course_code: string;
  course_title: string;
  student_count: number;
  average_marks: number;
  highest_marks: number;
  lowest_marks: number;
  min_passing_marks?: number | null;
  pass_count?: number | null;
  fail_count?: number | null;
}

export interface ConsolidatedStudentMarksGraphData {
  filters: MarksResolvedFilters;
  courses: MarksGraphCourseSummary[];
}

export interface ConsolidatedStudentMarksExportData {
  format: string;
  filters: MarksResolvedFilters;
  export_ready: boolean;
  message: string;
}

export interface MarksSelectOption {
  value: number;
  label: string;
}

export interface MarksTableCourseHeader {
  courseId: number;
  courseCode: string;
  courseTitle: string;
  componentKeys: string[];
}

export interface MarksTableRow {
  key: string;
  slNo: number;
  studentUsn: string;
  studentName: string;
  studentIdentityStatus: string;
  regno: string;
  section: string;
  componentMarks: Record<string, string>;
  courseDataAvailability: Record<number, boolean>;
  grandTotal: string;
}

export interface MarksTransformedTable {
  headers: MarksTableCourseHeader[];
  rows: MarksTableRow[];
}


