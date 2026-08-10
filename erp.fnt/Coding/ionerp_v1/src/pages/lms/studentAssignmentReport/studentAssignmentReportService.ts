import { useAxios } from "../../../hooks/useAxios";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

interface DropdownOption {
  value: string | number;
  label: string;
}

interface StudentReportRow {
  id: number;
  student_usn: string;
  student_name: string;
  secured_marks: number | string;
}

// Helper: extract array from any response shape customApiCall might return.
// Backend sends: { status: true, data: [...] }  OR  customApiCall may unwrap to just [...]
function extractArray(response: any): any[] {
  if (Array.isArray(response))            return response;           // already an array
  if (Array.isArray(response?.data))      return response.data;      // { data: [...] }
  if (Array.isArray(response?.data?.data)) return response.data.data; // double-wrapped
  return [];
}

export const useStudentAssignmentReportService = () => {
  const { customApiCall } = useAxios("", {
    method: "post",
    shouldFetch: false,
    loader: false,
  });

  // ── Assignment dropdown ───────────────────────────────────────────
  // Backend: POST /api/v1/student_assignment/assignment_list
  // Payload: { course_id, semester_id, academic_batch_id }
  // Returns: { status: true, data: [{ value, label }, ...] }
  const getAssignments = async (
    course_id: number,
    semester_id: number,
    academic_batch_id: number
  ): Promise<DropdownOption[]> => {
    try {
      const response: any = await customApiCall(
        ApiEndpoint.studentAssignmentReport.assignmentList,
        "post",
        { course_id, semester_id, academic_batch_id }
      );

      const raw = extractArray(response);

      return raw.map((item: any) => ({
        value: String(item.value ?? item.lms_assignment_id ?? ""),
        label: item.label ?? item.assignment_name ?? `Assignment ${item.lms_assignment_id ?? ""}`,
      }));
    } catch (error) {
      console.error("getAssignments error:", error);
      return [];
    }
  };

  // ── Student report ────────────────────────────────────────────────
  // Backend: POST /api/v1/student_assignment/report
  // Payload: { assignment_id }
  // Returns: { status: true, data: [{ student_usn, student_name, secured_marks, ... }] }
  const getStudentReport = async (assignment_id: number) => {
  try {
    const response: any = await customApiCall(
      ApiEndpoint.studentAssignmentReport.report,
      "post",
      { assignment_id }
    );

    console.log("RAW API RESPONSE:", response);

    // ✅ FORCE extraction
    let dataArray = [];

    if (Array.isArray(response)) {
      dataArray = response;
    } else if (Array.isArray(response?.data)) {
      dataArray = response.data;
    } else if (Array.isArray(response?.data?.data)) {
      dataArray = response.data.data;
    }

    console.log("EXTRACTED DATA:", dataArray);

    return dataArray.map((row: any, index: number) => ({
      id: index + 1,
      student_usn: row.student_usn ?? "",
      student_name: row.student_name ?? row.student_usn ?? "N/A",
      secured_marks: row.secured_marks ?? 0,
    }));

  } catch (error) {
    console.error("getStudentReport error:", error);
    return [];
  }
};
  // ── Export Excel ────────────────────────────────────────────────────
  // Backend: POST /api/v1/student_assignment/export  
  // Payload: { assignment_id }
  // Returns: FileResponse (Excel blob)
  const exportReport = async (assignment_id: number, custompdfApiCall: any) => {
    try {
      await custompdfApiCall(
        ApiEndpoint.studentAssignmentReport.export,
        "post",
        { assignment_id },
        false,
        "excel",
        `assignment_report_${assignment_id}`
      );
    } catch (error) {
      console.error("exportReport error:", error);
      throw error;
    }
  };

  return {
    getAssignments,
    getStudentReport,
    exportReport
  };
};
