import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

export interface AttendanceOption {
  value: string;
  label: string;
}

export interface AttendanceLessonDatesParams {
  academic_batch_id: string;
  semester_id: string;
  course_id: string;
  section_id: string;
}

export interface AttendanceSummaryParams extends AttendanceLessonDatesParams {
  from_date: string;
  to_date: string;
  only_present: boolean;
}

export interface AttendanceSummaryRow {
  usn: string;
  name: string;
  present: number;
  absent: number;
}

interface AttendanceApiError {
  message?: string;
  error?: string;
}

const extractBody = <T,>(response: { data: T }) => {
  const body = response.data as T & { data?: unknown };
  if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
    return body.data;
  }
  return body;
};

const ensureArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const data = value as Record<string, unknown>;
    if (Array.isArray(data.data)) {
      return data.data as T[];
    }
    if (Array.isArray(data.results)) {
      return data.results as T[];
    }
    if (Array.isArray(data.items)) {
      return data.items as T[];
    }
  }

  return [];
};

const buildErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      message?: string;
      response?: {
        data?: AttendanceApiError | string;
      };
    };
    const data = axiosError.response?.data;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    if (data && typeof data === "object") {
      return data.message || data.error || fallback;
    }
    return axiosError.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const normalizeCurriculumOptions = (items: Record<string, unknown>[]): AttendanceOption[] =>
  items.map((item) => ({
    value: String(item.crclm_id ?? item.academic_batch_id ?? item.id ?? item.value ?? ""),
    label: String(
      item.curriculum_name ??
        item.crclm_name ??
        item.academic_batch_name ??
        item.academic_batch_desc ??
        item.label ??
        item.name ??
        "Curriculum"
    ),
  }));

const normalizeTermOptions = (items: Record<string, unknown>[]): AttendanceOption[] =>
  items.map((item) => ({
    value: String(item.crclm_term_id ?? item.semester_id ?? item.id ?? item.value ?? ""),
    label: String(
      item.term_name ??
        item.crclm_term ??
        item.semester_name ??
        item.semester_desc ??
        item.label ??
        item.name ??
        "Term"
    ),
  }));

const normalizeCourseOptions = (items: Record<string, unknown>[]): AttendanceOption[] =>
  items
    .map((item) => {
      const value = String(item.crs_id ?? item.course_id ?? item.id ?? item.value ?? "");
      const labelValue =
        item.course_name ??
        item.course_title ??
        item.crs_name ??
        item.subject_name ??
        item.crs_title ??
        item.crs_code ??
        item.course_code ??
        item.label;

      return {
        value,
        label: typeof labelValue === "string" ? labelValue.trim() : "",
      };
    })
    .filter((item) => Boolean(item.value) && Boolean(item.label));

const normalizeSectionOptions = (items: Record<string, unknown>[]): AttendanceOption[] =>
  items.map((item) => ({
    value: String(item.section_id ?? item.id ?? item.value ?? item.section ?? item.section_name ?? ""),
    label: String(item.section ?? item.section_name ?? item.label ?? item.name ?? "Section"),
  }));

const normalizeSummaryRows = (items: Record<string, unknown>[]): AttendanceSummaryRow[] =>
  items.map((item) => ({
    usn: String(item.usn ?? item.student_usn ?? ""),
    name: String(item.name ?? item.student_name ?? ""),
    present: Number(item.present ?? 0),
    absent: Number(item.absent ?? 0),
  }));

export const fetchAttendanceCurriculums = async (): Promise<AttendanceOption[]> => {
  try {
    console.log("[StudentAttendanceReport] GET curriculums");
    const response = await axiosInstance.get(ApiEndpoint.studentAttendanceReport.curriculums);
    return normalizeCurriculumOptions(ensureArray<Record<string, unknown>>(extractBody(response)));
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load curriculums"));
  }
};

export const fetchAttendanceTerms = async (curriculumId: string): Promise<AttendanceOption[]> => {
  try {
    console.log("[StudentAttendanceReport] GET terms", { curriculumId });
    const response = await axiosInstance.get(ApiEndpoint.studentAttendanceReport.terms(curriculumId));
    return normalizeTermOptions(ensureArray<Record<string, unknown>>(extractBody(response)));
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load terms"));
  }
};

export const fetchAttendanceCourses = async (
  curriculumId: string,
  termId: string
): Promise<AttendanceOption[]> => {
  const payload = {
    academic_batch_id: curriculumId,
    semester_id: termId,
    course_type_id: 1,
  };

  try {
    console.log("[StudentAttendanceReport] POST courses", payload);
    const response = await axiosInstance.post(ApiEndpoint.studentAttendanceReport.courses, payload);
    console.log("COURSES API RESPONSE:", response.data);
    return normalizeCourseOptions(ensureArray<Record<string, unknown>>(extractBody(response)));
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load courses"));
  }
};

export const fetchAttendanceSections = async (
  curriculumId: string,
  termId: string
): Promise<AttendanceOption[]> => {
  try {
    console.log("[StudentAttendanceReport] GET sections", { curriculumId, termId });
    const response = await axiosInstance.get(
      ApiEndpoint.studentAttendanceReport.sections(curriculumId, termId)
    );
    return normalizeSectionOptions(ensureArray<Record<string, unknown>>(extractBody(response)));
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load sections"));
  }
};

export const fetchAttendanceLessonDates = async (
  params: AttendanceLessonDatesParams
): Promise<string[]> => {
  try {
    console.log("[StudentAttendanceReport] GET lesson dates", params);
    const response = await axiosInstance.get(ApiEndpoint.studentAttendanceReport.lessonDates, {
      params,
    });
    const body = extractBody(response);
    const rows = ensureArray<string | Record<string, unknown>>(body);

    return rows
      .map((row) => {
        if (typeof row === "string") {
          return row;
        }
        return String(row.lesson_date ?? row.date ?? row.attendance_date ?? "");
      })
      .filter((date) => Boolean(date))
      .sort();
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load lesson dates"));
  }
};

export const fetchAttendanceSummary = async (
  params: AttendanceSummaryParams
): Promise<AttendanceSummaryRow[]> => {
  try {
    console.log("[StudentAttendanceReport] GET summary", params);
    const response = await axiosInstance.get(ApiEndpoint.studentAttendanceReport.summary, {
      params,
    });
    return normalizeSummaryRows(ensureArray<Record<string, unknown>>(extractBody(response)));
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load attendance summary"));
  }
};
