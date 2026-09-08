import axiosInstance from "../../../utils/api";
import { useTopicService } from "./topicService";
jest.mock("../../../utils/api", () => ({ __esModule: true, default: { request: jest.fn() } }));
const request = axiosInstance.request as jest.Mock;
const context = { academic_batch_id: 1, semester_id: 11, course_id: 20, section_id: 30 };
beforeEach(() => request.mockReset());
test("schedule lookup sends the embedded mapping body", async () => {
  request.mockResolvedValue({ data: { success: true, data: [{ schedule_id: 4 }] } });
  expect(await useTopicService().getTopicSchedules({ mapping_id: 5 })).toEqual([{ schedule_id: 4 }]);
  expect(request.mock.calls[0][0].data).toEqual({ mapping_id: 5 });
});
test("a failed mutation rejects instead of reporting a saved item", async () => {
  request.mockResolvedValue({ data: { success: false, message: "Assignment rejected" } });
  await expect(useTopicService().assignTopics({ ...context, assignments: [{ topic_id: 4, instructor_ids: [5] }] })).rejects.toThrow("Assignment rejected");
});
test("HTTP failures propagate to forms", async () => {
  request.mockRejectedValue(new Error("Server error"));
  await expect(useTopicService().saveSchedules(5, [])).rejects.toThrow("Server error");
});
test("date clearing and distinct draft IDs survive batch save", async () => {
  request.mockResolvedValue({ data: { success: true, data: [] } });
  const schedules = [{ schedule_id: -1, conduction_date: null }, { schedule_id: -2, actual_delivery_date: null }];
  await useTopicService().saveSchedules(5, schedules);
  expect(request.mock.calls[0][0].data).toEqual({ mapping_id: 5, schedules });
});
test("removing a topic always sends its section context", async () => {
  request.mockResolvedValue({ data: { success: true } });
  await useTopicService().deleteTopic(4, context);
  expect(request.mock.calls[0][0]).toMatchObject({ method: "delete", data: context });
});
test("bare and enveloped arrays both work", async () => {
  request.mockResolvedValueOnce({ data: [{ value: 1 }] }).mockResolvedValueOnce({ data: { success: true, data: [{ value: 2 }] } });
  expect(await useTopicService().getInstructorList({ course_id: 20 })).toEqual([{ value: 1 }]);
  expect(await useTopicService().getInstructorList({ course_id: 20 })).toEqual([{ value: 2 }]);
});
