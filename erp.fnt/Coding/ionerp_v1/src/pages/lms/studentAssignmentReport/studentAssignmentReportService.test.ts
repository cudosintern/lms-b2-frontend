import axiosInstance from "../../../utils/api";
import { extractArray, useStudentAssignmentReportService } from "./studentAssignmentReportService";
jest.mock("../../../utils/api", () => ({ post: jest.fn() }));
test("accepts supported wrappers but rejects failures and malformed responses", () => {
  expect(extractArray({ status: true, data: { data: [] } })).toEqual([]);
  expect(() => extractArray({ status: false, data: [], message: "Failed" })).toThrow("Failed");
  expect(() => extractArray(null)).toThrow();
});
test("keeps real zero marks and treats blank or nonnumeric marks as ungraded", async () => {
  (axiosInstance.post as jest.Mock).mockResolvedValue({ data: { status: true, data:
    [0, "0", "12.5", null, "", "----"].map(secured_marks => ({ student_usn: "U1", student_name: " ", secured_marks })) } });
  const rows = await useStudentAssignmentReportService().getStudentReport({ academic_batch_id: 1, semester_id: 2, course_id: 3, section_id: 4, assignment_id: 5 });
  expect(rows.map(row => row.secured_marks)).toEqual([0, 0, 12.5, null, null, null]);
  expect(rows[0].student_name).toBe("U1");
});
