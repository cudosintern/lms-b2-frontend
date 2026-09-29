import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";
import { LocalStorageHelper } from "../../../utils/localStorageHelper";
import { loginData } from "../../../pages/login/loginModel";

export interface StudentNotificationItem {
  id: number;
  notice: string;
  fileName: string;
  fileUrl: string;
  sentOn: string;
  sender: string;
  isRead: boolean;
}

export interface StudentNotificationCounts {
  unreadCount: number;
  readCount: number;
  totalCount: number;
}

interface ApiErrorBody {
  message?: string;
  detail?: unknown;
  error?: string;
}

export const getStudentId = (): number | null => {
  const authState = LocalStorageHelper.getObject<loginData & { student_id?: number | string }>("auth_state");
  // Match the adjacent student module's demo configuration until ERP student
  // login supplies student_id. Never substitute the login's user_id.
  const value = Number(authState?.student_id ?? (process.env.REACT_APP_DEMO_STUDENT_ID || 3348));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

const buildStudentParams = (studentId?: number | null) => {
  const resolvedStudentId = studentId ?? getStudentId();
  if (!Number.isSafeInteger(resolvedStudentId) || !resolvedStudentId || resolvedStudentId < 1) {
    throw new Error("A valid student ID is required to load notifications.");
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

const buildFileUrl = (fileUrl: string | null | undefined) => {
  if (!fileUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(fileUrl) || fileUrl.startsWith("//") || fileUrl.includes("\\")) {
    return "";
  }
  const baseUrl = axiosInstance.defaults.baseURL ?? window.location.origin;
  return new URL(fileUrl, `${baseUrl.replace(/\/$/, "")}/`).href;
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
      return responseData.message ||
        (typeof responseData.detail === "string" ? responseData.detail : undefined) ||
        responseData.error || fallback;
    }

    return axiosError.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const normalizeNotification = (item: Record<string, unknown>): StudentNotificationItem => ({
  id: Number(item.id ?? item.lmsn_id ?? 0),
  notice: String(item.notice ?? item.notify_description ?? ""),
  fileName: String(item.file_name ?? item.notify_attachment ?? ""),
  fileUrl: buildFileUrl(String(item.file_url ?? item.notify_document_url ?? "")),
  sentOn: String(item.sent_on ?? item.created_at ?? item.delivery_date ?? ""),
  sender: String(item.sender ?? item.created_by_name ?? "System"),
  isRead: [true, 1, "1"].includes((item.is_read ?? item.notify_seen_flag ?? item.seen_flag) as boolean | number | string),
});

const fetchNotificationList = async (
  endpoint: string,
  studentId?: number | null
): Promise<StudentNotificationItem[]> => {
  try {
    const response = await axiosInstance.post(endpoint, buildStudentParams(studentId));

    return ensureArray<Record<string, unknown>>(extractBody(response))
      .map(normalizeNotification)
      .filter((item) => item.id > 0);
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load notifications"));
  }
};

export const getUnreadNotifications = async (studentId?: number | null) =>
  fetchNotificationList(ApiEndpoint.student.notifications.unread, studentId);

export const getReadNotifications = async (studentId?: number | null) =>
  fetchNotificationList(ApiEndpoint.student.notifications.read, studentId);

export const getNotificationCounts = async (
  studentId?: number | null
): Promise<StudentNotificationCounts> => {
  try {
    const response = await axiosInstance.post(ApiEndpoint.student.notifications.counts, buildStudentParams(studentId));
    const counts = (extractBody(response) ?? {}) as Record<string, unknown>;
    const unreadCount = Number(counts.unread_count ?? 0);
    const readCount = Number(counts.read_count ?? 0);

    return {
      unreadCount,
      readCount,
      totalCount: unreadCount + readCount,
    };
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load notification counts"));
  }
};

export const getNotificationBuckets = async (studentId?: number | null) => {
  try {
    const [unread, read, counts] = await Promise.all([
      getUnreadNotifications(studentId),
      getReadNotifications(studentId),
      getNotificationCounts(studentId),
    ]);

    return { unread, read, counts };
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to load student notifications"));
  }
};

export const markNotificationRead = async (
  notificationId: number,
  studentId?: number | null
) => {
  try {
    await axiosInstance.post(
      ApiEndpoint.student.notifications.markRead(notificationId),
      buildStudentParams(studentId)
    );
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to mark notification as read"));
  }
};

export const downloadNotificationAttachment = async (item: StudentNotificationItem) => {
  if (!item.fileUrl) throw new Error("No attachment is available for this notification.");
  // Do not send ERP credentials to document hosts. Fetching a Blob makes the
  // download attribute work even when the API runs on a different origin.
  const response = await fetch(item.fileUrl, { credentials: "omit" });
  if (!response.ok) throw new Error("The attachment could not be downloaded. Please try again.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = item.fileName || decodeURIComponent(new URL(item.fileUrl).pathname.split("/").pop() || "attachment");
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
