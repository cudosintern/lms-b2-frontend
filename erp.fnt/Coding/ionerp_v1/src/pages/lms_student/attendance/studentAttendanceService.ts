import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";
import { LocalStorageHelper } from "../../../utils/localStorageHelper";
import { loginData } from "../../../pages/login/loginModel";

export interface StudentAttendanceOption {
  value: string;
  label: string;
  semesterId?: number;
  semesterNumber?: number;
}

export interface StudentAttendanceSummaryRow {
  course: string;
  present: number;
  totalClasses: number;
  percentage: number;
}

export interface StudentAttendanceDaywiseRow {
  course: string;
  attendance: string;
  attendanceDocument: string;
  attendanceDocumentUrl: string;
  documentStatus: string;
  attendanceDate: string;
}

export interface StudentAttendanceFilters {
  curriculumId: string;
  termId: string;
  fromMonth: string;
  toMonth: string;
}

interface ApiErrorBody {
  message?: string;
  detail?: string;
  error?: string;
}

const getStudentId = () => {
  const authState = LocalStorageHelper.getObject<loginData>("auth_state");
  const possibleId = (authState as loginData & { id?: number })?.user_id ?? (authState as any)?.id;
  return typeof possibleId === "number" ? possibleId : null;
};

const buildStudentParams = (studentId?: number | null) => {
  const resolvedStudentId = studentId ?? getStudentId();
  if (!resolvedStudentId) {
    throw new Error("Student identity could not be resolved from the current session.");
  }

  return { student_id: resolvedStudentId };
};

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
    const objectValue = value as Record<string, unknown>;
    if (Array.isArray(objectValue.data)) {
      return objectValue.data as T[];
    }
    if (Array.isArray(objectValue.items)) {
      return objectValue.items as T[];
    }
    if (Array.isArray(objectValue.results)) {
      return objectValue.results as T[];
    }
  }

  return [];
};

const buildErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      message?: string;
      response?: {
        data?: ApiErrorBody | string;
      };
    };
    const responseData = axiosError.response?.data;

    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === "object") {
      return responseData.message || responseData.detail || responseData.error || fallback;
    }

    return axiosError.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const buildFileUrl = (fileUrl: string | null | undefined) => {
  if (!fileUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  const baseUrl = axiosInstance.defaults.baseURL ?? "";
  return `${baseUrl}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
};

const normalizeCurriculumOptions = (
  items: Record<string, unknown>[]
): StudentAttendanceOption[] =>
  items
    .map((item) => ({
      value: String(item.curriculum_id ?? item.crclm_id ?? item.id ?? ""),
      label: String(item.curriculum_name ?? item.academic_batch_desc ?? item.label ?? "Curriculum"),
    }))
    .filter((item) => Boolean(item.value));

const normalizeTermOptions = (items: Record<string, unknown>[]): StudentAttendanceOption[] =>
  items
    .map((item) => ({
      value: String(item.term_id ?? item.crclm_term_id ?? item.semester_id ?? item.id ?? ""),
      label: String(item.term_name ?? item.semester_desc ?? item.label ?? "Term"),
      semesterId: Number(item.semester_id ?? 0) || undefined,
      semesterNumber: Number(item.semester_number ?? 0) || undefined,
    }))
    .filter((item) => Boolean(item.value));

const normalizeSummaryRows = (items: Record<string, unknown>[]): StudentAttendanceSummaryRow[] =>
  items.map((item) => ({
    course: String(item.course ?? ""),
    present: Number(item.present ?? 0),
    totalClasses: Number(item.total_classes ?? 0),
    percentage: Number(item.percentage ?? 0),
  }));

const normalizeDaywiseRows = (items: Record<string, unknown>[]): StudentAttendanceDaywiseRow[] =>
  items.map((item) => ({
    course: String(item.course ?? ""),
    attendance: String(item.attendance ?? ""),
    attendanceDocument: String(item.attendance_document ?? ""),
    attendanceDocumentUrl: buildFileUrl(String(item.attendance_document_url ?? "")),
    documentStatus: String(item.document_status ?? ""),
    attendanceDate: String(item.attendance_date ?? ""),
  }));

const buildAttendanceParams = (
  filters: StudentAttendanceFilters,
  studentId?: number | null
) => ({
  ...buildStudentParams(studentId),
  curriculum_id: Number(filters.curriculumId),
  term_id: Number(filters.termId),
  from_month: filters.fromMonth,
  to_month: filters.toMonth,
});

export const getAttendanceCurriculums = async (studentId?: number | null) => {
  try {
    const response = await axiosInstance.get(ApiEndpoint.student.attendance.curriculums, {
      params: buildStudentParams(studentId),
    });
    return normalizeCurriculumOptions(
      ensureArray<Record<string, unknown>>(extractBody(response))
    );
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load curriculums"));
  }
};

export const getAttendanceTerms = async (
  curriculumId: string,
  studentId?: number | null
) => {
  try {
    const response = await axiosInstance.get(ApiEndpoint.student.attendance.terms, {
      params: {
        ...buildStudentParams(studentId),
        curriculum_id: Number(curriculumId),
      },
    });
    return normalizeTermOptions(ensureArray<Record<string, unknown>>(extractBody(response)));
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load terms"));
  }
};

export const getAttendanceSummary = async (
  filters: StudentAttendanceFilters,
  studentId?: number | null
) => {
  try {
    const response = await axiosInstance.get(ApiEndpoint.student.attendance.summary, {
      params: buildAttendanceParams(filters, studentId),
    });
    return normalizeSummaryRows(ensureArray<Record<string, unknown>>(extractBody(response)));
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load attendance summary"));
  }
};

export const getAttendanceDaywise = async (
  filters: StudentAttendanceFilters,
  studentId?: number | null
) => {
  try {
    const response = await axiosInstance.get(ApiEndpoint.student.attendance.daywise, {
      params: buildAttendanceParams(filters, studentId),
    });
    return normalizeDaywiseRows(ensureArray<Record<string, unknown>>(extractBody(response)));
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load daywise attendance"));
  }
};
