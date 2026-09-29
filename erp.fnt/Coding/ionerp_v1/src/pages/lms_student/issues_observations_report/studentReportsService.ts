import axiosInstance from '../../../utils/api';

export interface StudentPayload { student_id: number }
export interface ReportPayload extends StudentPayload { lms_isnob_id: number }
export interface Report {
  lms_isnob_id: number;
  academic_batch_id: number;
  semester_id: number;
  student_usn?: string | null;
  report_title: string;
  counselling_date: string | null;
  mentor_name: string | null;
  purpose_of_meeting_desc: string | null;
  observation_desc: string | null;
  comm_parent_flag: number | boolean;
  comm_high_auth_flag: number | boolean;
  mentor_status: number;
  mentee_status: number;
  report_status: string;
  can_agree: boolean;
}
export interface HistoryItem extends Report { history_id: number; action_type: string; action_timestamp: string; action_label?: string; actor_name?: string; created_by?: number | null; modified_by?: number | null; actor_id?: number | null }
export interface Batch { academic_batch_id: number; academic_batch_desc: string; academic_batch_code: string }
export interface Semester { semester_id: number; semester: string }

export function positiveId(value: unknown, label = 'Student ID'): number {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return Number(value);
}
const prefix = '/stud_issues_observations_report';
async function request<T>(path: string, signal?: AbortSignal, method: 'GET' | 'PUT' = 'GET'): Promise<T> {
  try {
    // Keep cancellation at runtime while supporting the project's legacy Axios typings.
    const config = { url: `${prefix}/${path}`, method, signal };
    const response = await axiosInstance.request<{ status: boolean; message?: string; data: T }>(config);
    if (response.data.status !== true) throw new Error(response.data.message || 'Request failed.');
    return response.data.data;
  } catch (error: unknown) {
    const failure = error as { response?: { data?: { message?: string } }; message?: string };
    throw new Error(failure.response?.data?.message || failure.message || 'Unable to reach the server.');
  }
}
export const studentReportsApi = {
  list: ({ student_id }: StudentPayload, signal?: AbortSignal) => request<Report[]>(`get_student_issue_observations/${positiveId(student_id)}`, signal),
  detail: ({ student_id, lms_isnob_id }: ReportPayload, signal?: AbortSignal) => request<Report>(`get_student_issue_observation/${positiveId(lms_isnob_id, 'Report ID')}/${positiveId(student_id)}`, signal),
  history: ({ student_id, lms_isnob_id }: ReportPayload, signal?: AbortSignal) => request<HistoryItem[]>(`get_student_issue_observation_history/${positiveId(lms_isnob_id, 'Report ID')}/${positiveId(student_id)}`, signal),
  batches: ({ student_id }: StudentPayload, signal?: AbortSignal) => request<Batch[]>(`get_student_academic_batches/${positiveId(student_id)}`, signal),
  semesters: ({ student_id, academic_batch_id }: StudentPayload & { academic_batch_id: string | number }, signal?: AbortSignal) => request<Semester[]>(`get_student_semesters/${positiveId(student_id)}/${positiveId(academic_batch_id, 'Batch ID')}`, signal),
  agree: ({ student_id, lms_isnob_id }: ReportPayload) => request<{ lms_isnob_id: number; message: string }>(`student_agree/${positiveId(lms_isnob_id, 'Report ID')}/${positiveId(student_id)}`, undefined, 'PUT'),
};
