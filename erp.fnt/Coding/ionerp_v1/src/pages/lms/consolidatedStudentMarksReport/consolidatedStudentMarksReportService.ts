import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";
import {
  ConsolidatedStudentMarksGraphData,
  ConsolidatedStudentMarksReportData,
  ConsolidatedStudentMarksRequest,
  MarksCourseOption,
  MarksCurriculumOption,
  MarksDropdownOption,
  MarksSectionOption,
  MarksTermOption,
} from "./consolidatedStudentMarksReportTypes";

interface ApiEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

const uniqueBy = <T,>(items: T[], getKey: (item: T) => string | number) => {
  const seen = new Set<string | number>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const extractData = <T,>(response: { data: ApiEnvelope<T> | T }): T => {
  const body = response.data;
  if (body && typeof body === "object" && "status" in body && body.status === false) {
    throw new Error((body as ApiEnvelope<T>).message || "Request failed");
  }
  if (body && typeof body === "object" && "data" in (body as ApiEnvelope<T>)) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
};

const buildErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      message?: string;
      response?: {
        data?: { message?: string; error?: string; detail?: string | { msg: string }[] } | string;
      };
    };
    const responseData = axiosError.response?.data;
    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }
    if (responseData && typeof responseData === "object") {
      const detail = responseData.detail;
      return responseData.message || responseData.error ||
        (typeof detail === "string" ? detail : detail?.map((item) => item.msg).join("; ")) || fallback;
    }
    return axiosError.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const fetchMarksDepartments = async (): Promise<MarksDropdownOption[]> => {
  try {
    const response = await axiosInstance.get<ApiEnvelope<MarksDropdownOption[]>>(
      ApiEndpoint.consolidatedStudentMarksReport.departments,
    );
    return uniqueBy(extractData(response), (item) => item.id);
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load departments"));
  }
};

export const fetchMarksCurriculums = async (
  departmentId?: number | null,
): Promise<MarksCurriculumOption[]> => {
  try {
    const response = await axiosInstance.get<ApiEnvelope<MarksCurriculumOption[]>>(
      ApiEndpoint.consolidatedStudentMarksReport.curriculums,
      {
        params: departmentId ? { department_id: departmentId } : undefined,
      },
    );
    return uniqueBy(extractData(response), (item) => item.academic_batch_id);
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load curriculums"));
  }
};

export const fetchMarksTerms = async (academicBatchId: number): Promise<MarksTermOption[]> => {
  try {
    const response = await axiosInstance.get<ApiEnvelope<MarksTermOption[]>>(
      ApiEndpoint.consolidatedStudentMarksReport.terms,
      { params: { academic_batch_id: academicBatchId } },
    );
    return uniqueBy(extractData(response), (item) => item.crclm_term_id);
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load terms"));
  }
};

export const fetchMarksSections = async (params: {
  academic_batch_id: number;
  semester_id?: number | null;
  crclm_term_id?: number | null;
}): Promise<MarksSectionOption[]> => {
  try {
    const response = await axiosInstance.get<ApiEnvelope<MarksSectionOption[]>>(
      ApiEndpoint.consolidatedStudentMarksReport.sections,
      { params },
    );
    return uniqueBy(extractData(response), (item) => item.section_id);
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load sections"));
  }
};

export const fetchMarksCourses = async (params: {
  academic_batch_id: number;
  section_id: number;
  semester_id?: number | null;
  crclm_term_id?: number | null;
}): Promise<MarksCourseOption[]> => {
  try {
    const response = await axiosInstance.get<ApiEnvelope<MarksCourseOption[]>>(
      ApiEndpoint.consolidatedStudentMarksReport.courses,
      { params },
    );
    return uniqueBy(extractData(response), (item) => item.course_id);
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load courses"));
  }
};

export const fetchConsolidatedStudentMarksReport = async (
  payload: ConsolidatedStudentMarksRequest,
): Promise<ConsolidatedStudentMarksReportData> => {
  try {
    const response = await axiosInstance.post<ApiEnvelope<ConsolidatedStudentMarksReportData>>(
      ApiEndpoint.consolidatedStudentMarksReport.report,
      payload,
    );
    return extractData(response);
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load consolidated student marks report"));
  }
};

export const fetchConsolidatedStudentMarksGraph = async (
  payload: ConsolidatedStudentMarksRequest,
): Promise<ConsolidatedStudentMarksGraphData> => {
  try {
    const response = await axiosInstance.post<ApiEnvelope<ConsolidatedStudentMarksGraphData>>(
      ApiEndpoint.consolidatedStudentMarksReport.graph,
      payload,
    );
    return extractData(response);
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load marks graph"));
  }
};

export const exportConsolidatedStudentMarks = async (
  payload: ConsolidatedStudentMarksRequest & { format: "excel" | "pdf" | "csv" },
): Promise<Blob> => {
  try {
    const response = await axiosInstance.post<Blob>(
      ApiEndpoint.consolidatedStudentMarksReport.export, payload, { responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const responseData = (error as { response?: { data?: unknown } }).response?.data;
    if (responseData instanceof Blob) {
      const message = await responseData.text();
      let detail: unknown;
      try { detail = JSON.parse(message).detail; } catch { /* Fall back to the HTTP error. */ }
      if (typeof detail === "string") throw new Error(detail);
      if (Array.isArray(detail)) throw new Error(detail.map((item) => item.msg).join("; "));
    }
    throw new Error(buildErrorMessage(error, "Failed to export consolidated student marks"));
  }
};
