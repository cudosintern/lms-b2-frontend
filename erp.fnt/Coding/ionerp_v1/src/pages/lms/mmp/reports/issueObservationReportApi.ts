import axiosInstance from "../../../../utils/api";

const ISSUE_OBSERVATION_REPORT_BASE = "issues_observations_report";

export type ApiEnvelope<T> = {
  status: boolean;
  message: string;
  data: T;
};

export type IssueObservationStudent = {
  student_id: number;
  student_name: string;
  student_usn: string;
  academic_batch_id: number;
  semester_id: number;
  email: string | null;
  mobile: string | null;
};

export type IssueObservationReportListItem = {
  lms_isnob_id: number;
  report_title: string;
  counselling_date: string;
  mentor_name: string;
  mentor_status: number;
  mentee_status: number;
  parent_guardian_status: number;
};

export type IssueObservationReportDetail = {
  lms_isnob_id: number;
  academic_batch_id: number;
  semester_id: number;
  ssd_id: number;
  student_usn: string;
  report_title: string;
  counselling_date: string;
  mentor_users_id: number;
  purpose_of_meeting_desc: string | null;
  observation_desc: string | null;
  comm_parent_flag: number;
  comm_high_auth_flag: number;
  mentor_status: number;
  mentee_status: number;
  parent_guardian_status: number;
  created_date: string;
};

export type IssueObservationHistoryItem = {
  history_id: number;
  action_type: string;
  report_title: string;
  mentor_status: number;
  mentee_status: number;
  parent_guardian_status: number;
  modified_by: string;
  action_timestamp: string;
};

export type SaveIssueObservationPayload = {
  academic_batch_id: number;
  semester_id: number;
  ssd_id: number;
  student_usn: string;
  report_title: string;
  counselling_date: string;
  mentor_users_id: number;
  purpose_of_meeting_desc?: string | null;
  observation_desc?: string | null;
  comm_parent_flag: number;
  comm_high_auth_flag: number;
  mentor_status: number;
  mentee_status: number;
  parent_guardian_status: number;
};

export type SaveIssueObservationResponse = {
  lms_isnob_id: number;
  message: string;
};

export type UpdateIssueObservationPayload = {
  report_title?: string;
  counselling_date?: string;
  purpose_of_meeting_desc?: string | null;
  observation_desc?: string | null;
  comm_parent_flag?: number;
  comm_high_auth_flag?: number;
  mentor_status?: number;
  mentee_status?: number;
  parent_guardian_status?: number;
};

export type UpdateIssueObservationResponse = {
  lms_isnob_id: number;
  message: string;
};

export type DeleteIssueObservationPayload = {
  delete_reason_desc: string;
};

export type MentorAgreePayload = {
  mentor_status: number;
};

export const getStudentByUsn = async (studentUsn: string) => {
  const response = await axiosInstance.get<ApiEnvelope<IssueObservationStudent>>(
    `${ISSUE_OBSERVATION_REPORT_BASE}/get_student_by_usn/${encodeURIComponent(studentUsn)}`,
  );
  return response.data;
};

export const getIssueObservationReports = async (studentId: number) => {
  const response = await axiosInstance.get<ApiEnvelope<IssueObservationReportListItem[]>>(
    `${ISSUE_OBSERVATION_REPORT_BASE}/get_issue_observations/${studentId}`,
  );
  return response.data;
};

export const getIssueObservationDetail = async (reportId: number) => {
  const response = await axiosInstance.get<ApiEnvelope<IssueObservationReportDetail>>(
    `${ISSUE_OBSERVATION_REPORT_BASE}/get_issue_observation/${reportId}`,
  );
  return response.data;
};

export const getIssueObservationHistory = async (reportId: number) => {
  const response = await axiosInstance.get<ApiEnvelope<IssueObservationHistoryItem[]>>(
    `${ISSUE_OBSERVATION_REPORT_BASE}/get_issue_observation_history/${reportId}`,
  );
  return response.data;
};

export const saveIssueObservation = async (payload: SaveIssueObservationPayload) => {
  const response = await axiosInstance.post<ApiEnvelope<SaveIssueObservationResponse>>(
    `${ISSUE_OBSERVATION_REPORT_BASE}/save_issue_observation`,
    payload,
  );
  return response.data;
};

export const updateIssueObservation = async (
  reportId: number,
  payload: UpdateIssueObservationPayload,
) => {
  const response = await axiosInstance.put<ApiEnvelope<UpdateIssueObservationResponse>>(
    `${ISSUE_OBSERVATION_REPORT_BASE}/update_issue_observation/${reportId}`,
    payload,
  );
  return response.data;
};

export const deleteIssueObservation = async (
  reportId: number,
  payload: DeleteIssueObservationPayload,
) => {
  const response = await axiosInstance({
    method: "DELETE",
    url: `${ISSUE_OBSERVATION_REPORT_BASE}/delete_issue_observation/${reportId}`,
    data: payload,
  } as any);
  return response.data as ApiEnvelope<string>;
};

export const mentorAgreeIssueObservation = async (
  reportId: number,
  payload: MentorAgreePayload,
) => {
  const response = await axiosInstance.put<ApiEnvelope<string>>(
    `${ISSUE_OBSERVATION_REPORT_BASE}/mentor_agree/${reportId}`,
    payload,
  );
  return response.data;
};
