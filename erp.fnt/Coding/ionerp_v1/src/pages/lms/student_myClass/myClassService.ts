import axios from "axios";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

const BASE = "http://127.0.0.1:8000";

function api(path: string): string {
  return `${BASE}/${path}`.replace(/([^:])\/\//g, "$1/");
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CurriculumOut {
  academic_batch_id: number;
  academic_batch_name: string | null;
}

export interface TermOut {
  semester_id: number;
  semester_name: string | null;
}

export interface CourseOut {
  course_id: number;
  course_code: string;
  course_title: string | null;
}

export interface SectionOut {
  section_id: number;
  section_name: string | null;
}

export interface StudentDropdownResponse {
  curriculum: CurriculumOut[];
  terms: TermOut[];
  courses: CourseOut[];
  sections: SectionOut[];
}

export interface ClassListItem {
  status: string;
  course_name: string;
  section_name: string;
  topic_title: string | null;
  class_date: string;        // "YYYY-MM-DD"
  start_time: string | null; // "HH:MM:SS"
  end_time: string | null;
  video_link: string | null;
  portion_to_be_covered: string | null;
}

export interface ClassListResponse {
  classes: ClassListItem[];
}

// ── API calls ──────────────────────────────────────────────────────────────────

/**
 * Fetch dropdown options for a student.
 * Pass optional academic_batch_id / semester_id to cascade-filter terms & courses.
 */
export const getStudentDropdowns = async (
  studentId: number,
  academicBatchId?: number,
  semesterId?: number
): Promise<StudentDropdownResponse> => {
  const params: any = { student_id: studentId };

if (semesterId) {
  params.semester_id = semesterId;   // ✅ ADD THIS
}
  const res = await axios.get<StudentDropdownResponse>(
    api(ApiEndpoint.myClass.dropdowns),
    { params }
  );
  return res.data;
};

/**
 * Fetch class list for a student on a specific date.
 */
export const getClassList = async (
  studentId: number,
  courseId: number,
  sectionId: number,
  semesterId: number,
  selectedDate: string
): Promise<ClassListResponse> => {
  const res = await axios.get<ClassListResponse>(
    api(ApiEndpoint.myClass.classList),
    {
      params: {
        student_id: studentId,
        course_id: courseId,
        section_id: sectionId,
        semester_id: semesterId,
        selected_date: selectedDate,
      },
    }
  );
  return res.data;
};
