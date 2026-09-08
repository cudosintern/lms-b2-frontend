import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

export type TopicContext = { academic_batch_id: number; semester_id: number; course_id: number; section_id: number };
export type ScheduleInput = {
  mapping_id?: number; session_number?: number; portion_to_be_covered?: string;
  conduction_date?: string | null; actual_delivery_date?: string | null;
  start_time?: string | null; end_time?: string | null;
};

// The shared hook discards bare responses and catches mutation failures.
async function request(url: string, method: "post" | "put" | "delete", data?: unknown): Promise<any> {
  const response = await axiosInstance.request({ url, method, data });
  const body: any = response.data;
  if (body == null || body.success === false || body.status === false || body.status === "error") {
    throw new Error(body?.message || "The request failed");
  }
  return body;
}
async function list(url: string, data: unknown = {}): Promise<any[]> {
  const body = await request(url, "post", data);
  const rows = Array.isArray(body) ? body : body.data;
  if (!Array.isArray(rows)) throw new Error("The server returned an invalid list");
  return rows;
}
const endpoints = ApiEndpoint.topic;
const base = endpoints.topicList.slice(0, endpoints.topicList.lastIndexOf("/"));
const service = {
  getCurriculumList: () => list(endpoints.curriculumList),
  getSemesterList: (payload: { academic_batch_id?: number } = {}) => list(endpoints.semesterList, payload),
  getCourseList: (payload: { academic_batch_id?: number; curriculum_id?: number; semester_id?: number } = {}) => list(endpoints.courseList, payload),
  getSectionList: (payload: Partial<TopicContext> = {}) => list(endpoints.sectionList, payload),
  getInstructorList: (payload: { course_id: number; section_id?: number; academic_batch_id?: number; semester_id?: number }) => list(endpoints.instructorList, payload),
  getTopicList: (payload: Omit<TopicContext, "section_id"> & { section_id?: number; instructor_id?: number }) => list(endpoints.topicList, payload),
  getCudosTopics: (payload: TopicContext) => list(endpoints.cudosTopics, payload),
  getUnmappedCudosTopics: (payload: TopicContext) => list(endpoints.cudosTopics, payload),
  importCudosTopics: (payload: TopicContext & { topic_ids: number[]; instructor_id: number }) => request(endpoints.importCudosTopics, "post", payload),
  importTopics: (payload: any) => request(endpoints.importCudosTopics, "post", payload),
  assignTopics: (payload: TopicContext & { assignments: { topic_id: number; instructor_ids: number[] }[] }) => request(`${base}/assign_topics`, "post", payload),
  updateTopic: (id: number, payload: any) => request(`${endpoints.updateTopic}/${id}`, "put", payload),
  deleteTopic: (id: number, context: TopicContext) => request(`${endpoints.deleteTopic}/${id}`, "delete", context),
  bulkDeleteTopics: (context: TopicContext, topic_ids: number[]) => request(`${base}/bulk_delete_topics`, "post", { ...context, topic_ids }),
  updateInstructor: (id: number, payload: { course_instructor_id: number }) => request(`${endpoints.updateInstructor}/${id}`, "put", payload),
  updateMapping: (id: number, payload: { instructor_id: number }) => request(`${endpoints.updateMapping}/${id}`, "put", payload),
  getDeliverySlots: (mapping_id: number) => list(`${base}/delivery_slots`, { mapping_id }),
  getTopicSchedules: (payload: { mapping_id: number }) => list(endpoints.topicSchedules, payload),
  updateSchedule: (id: number, payload: ScheduleInput) => request(`${endpoints.updateSchedule}/${id}`, "put", payload),
  addSchedule: (payload: ScheduleInput & { mapping_id: number; session_number: number }) => request(endpoints.addSchedule, "post", payload),
  saveSchedules: (mapping_id: number, schedules: (ScheduleInput & { schedule_id: number })[], instructor_ids?: number[]) => request(`${base}/save_schedules`, "post", { mapping_id, schedules, ...(instructor_ids ? { instructor_ids } : {}) }),
  addExtraClass: (payload: { mapping_id: number; class_date: string; start_time?: string; end_time?: string; notes?: string }) => request(endpoints.addExtraClass, "post", payload),
  addNewTopic: (payload: any) => request(endpoints.addNewTopic, "post", payload),
};
export const useTopicService = () => service;
