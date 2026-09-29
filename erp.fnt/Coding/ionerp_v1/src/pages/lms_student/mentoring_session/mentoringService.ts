import axiosInstance from '../../../utils/api';

export interface Batch { academic_batch_id: number; academic_batch_desc: string; academic_batch_code: string }
export interface MentoringSession {
  schedule_id: number; mentors_group_id: number; sub_group_id: number; sub_group_date_id: number;
  group_name: string; sub_group_name: string; session_agenda: string; location: string;
  start_date: string; end_date: string; start_time: string; end_time: string;
  semester_name: string; mentor_names: string[]; status: number;
  questionnaire_id: number | null; questionnaire_status: string;
}
export interface Option { option_id: number; option: string; specify_flag: number | boolean; selected: boolean; specification: string | null }
export interface Question { question_id: number; question_no: number; question: string; que_type_id: number; mandatory: number | boolean; text_answer: string | null; options: Option[] }
export interface Questionnaire { is_submitted: boolean; schedule_id: number; questionnaire_id: number; questionnaire_name: string; message_to_mentees: string; questions: Question[] }
export interface Answer { questionnaire_que_id: number; selected_option_ids: number[]; text_answer: string | null; specifications: Record<number, string> }
export interface Comment { generic_comment_id?: number; individual_comment_id?: number; comment: string | null; attachment: string | null; suggestion_type: number; posted_by_id: number; posted_by_name: string; posted_by_type: string; created_date: string }
export type CommentKind = 'group' | 'individual';
export const flag = (value: unknown) => value === true || value === 1 || value === '1';
export function positiveId(value: unknown): number {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) throw new Error('A valid student/session ID is required.');
  return Number(value);
}
// ERP integration: pass the authenticated student's ID to the page. Demo fallback only.
export function resolveStudentId(studentId?: number) {
  return positiveId(studentId ?? (process.env.REACT_APP_DEMO_STUDENT_ID || 3348));
}
async function request<T>(endpoint: string, data: unknown, signal?: AbortSignal): Promise<T> {
  try {
    const config = { url: `/student_mentoring/${endpoint}`, method: 'POST', data, signal,
      ...(data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}) };
    // Legacy @types/axios treats request<T> as the request body type.
    // Infer the request config and type the API response separately.
    const response = await axiosInstance.request(config);
    const body = response.data as { status: boolean; message: string; data: T };
    if (body.status !== true) throw new Error(body.message || 'Request failed.');
    return body.data;
  } catch (error: unknown) {
    const failure = error as { response?: { data?: { message?: string; detail?: unknown } }; message?: string };
    throw new Error(failure.response?.data?.message || failure.message || 'Unable to reach the server.');
  }
}
export const mentoringApi = {
  batches: (student_id: number, signal?: AbortSignal) => request<Batch[]>('get_student_academic_batches', { student_id }, signal),
  sessions: (student_id: number, academic_batch_id: number, month: string, signal?: AbortSignal) => request<MentoringSession[]>('get_my_mentoring_schedules', { student_id, academic_batch_id, month }, signal),
  questionnaire: (student_id: number, schedule_id: number, signal?: AbortSignal) => request<Questionnaire>('get_questionnaire', { student_id, schedule_id }, signal),
  saveAnswers: (student_id: number, schedule_id: number, sub_group_date_id: number, answers: Answer[]) => request<string>('save_questionnaire_response', { student_id, schedule_id, sub_group_date_id, answers }),
  comments: (kind: CommentKind, student_id: number, schedule_id: number, signal?: AbortSignal) => request<Comment[]>(`get_${kind}_comments`, { student_id, schedule_id }, signal),
  saveComment: (kind: CommentKind, student_id: number, schedule_id: number, comment: string, attachment: File | null) => {
    const data = new FormData();
    data.append('student_id', String(student_id)); data.append('schedule_id', String(schedule_id));
    data.append('comment', comment.trim()); data.append('suggestion_type', attachment ? '1' : '0');
    if (attachment) data.append('attachment', attachment);
    return request<string>(`save_${kind}_comment`, data);
  },
  removeAttachment: (student_id: number, schedule_id: number, generic_comment_id: number) => request<string>('delete_group_attachment', { student_id, schedule_id, generic_comment_id }),
};
export function attachmentUrl(filename: string) {
  const api = new URL(process.env.REACT_APP_API_URL || '/', window.location.origin);
  // Backend returns generated filenames, never executable or arbitrary external URLs.
  return new URL(`/uploads/mentoring_comments/${encodeURIComponent(filename.split(/[\\/]/).pop() || '')}`, api).href;
}
export function validateAnswers(questions: Question[], answers: Answer[]): string | null {
  for (const q of questions) {
    const answer = answers.find(a => a.questionnaire_que_id === q.question_id);
    if (![1, 2, 3].includes(q.que_type_id)) return `Question ${q.question_no} has an unsupported question type.`;
    if (flag(q.mandatory) && !(q.que_type_id === 3 ? answer?.text_answer?.trim() : answer?.selected_option_ids.length)) return `Please answer Question ${q.question_no}.`;
    if (q.que_type_id === 1 && (answer?.selected_option_ids.length || 0) > 1) return `Select one option for Question ${q.question_no}.`;
    for (const option of q.options) {
      if (flag(q.mandatory) && flag(option.specify_flag) && answer?.selected_option_ids.includes(option.option_id) && !answer.specifications[option.option_id]?.trim()) return `Please specify your answer for Question ${q.question_no}.`;
    }
  }
  return null;
}
