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

const normalizeNotification = (item: Record<string, unknown>): StudentNotificationItem => ({
  id: Number(item.id ?? item.lmsn_id ?? 0),
  notice: String(item.notice ?? item.notify_description ?? ""),
  fileName: String(item.file_name ?? item.notify_attachment ?? ""),
  fileUrl: buildFileUrl(String(item.file_url ?? item.notify_document_url ?? "")),
  sentOn: String(item.sent_on ?? item.created_at ?? item.delivery_date ?? ""),
  sender: String(item.sender ?? item.created_by_name ?? "System"),
  isRead: Boolean(item.is_read ?? item.notify_seen_flag ?? item.seen_flag),
});

const fetchNotificationList = async (
  endpoint: string,
  studentId?: number | null
): Promise<StudentNotificationItem[]> => {
  try {
    const response = await axiosInstance.get(endpoint, {
      params: buildStudentParams(studentId),
    });

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
    const response = await axiosInstance.get(ApiEndpoint.student.notifications.counts, {
      params: buildStudentParams(studentId),
    });
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
      {},
      {
        params: buildStudentParams(studentId),
      }
    );
  } catch (error) {
    throw new Error(buildErrorMessage(error, "Failed to mark notification as read"));
  }
};
