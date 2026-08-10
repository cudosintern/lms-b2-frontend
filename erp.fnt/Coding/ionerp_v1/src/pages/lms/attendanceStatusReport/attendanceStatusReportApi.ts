import axiosInstance from "../../../utils/api";

export interface AttendanceStatusParams {
  academic_batch_id: number;
  from_date: string; // YYYY-MM-DD
  to_date: string;   // YYYY-MM-DD
  crs_id?: number;
  section_id?: number;
}

export const attendanceStatusReportApi = {
  /**
   * Fetch curriculum (academic_batch) list for the dropdown.
   * GET /api/v1/reports/attendance-status-report/meta/curriculums
   */
  getCurriculums: async () => {
    try {
      const response = await axiosInstance.get(
        "/api/v1/reports/attendance-status-report/meta/curriculums"
      );
      return response.data;
    } catch (error: any) {
      console.error("attendanceStatusReportApi.getCurriculums error:", error);
      return { success: false, data: { total: 0, items: [] } };
    }
  },

  /**
   * Fetch class-wise attendance status for a batch and date range.
   * GET /api/v1/reports/attendance-status-report/details
   */
  getDetails: async (params: AttendanceStatusParams) => {
    try {
      const response = await axiosInstance.get(
        "/api/v1/reports/attendance-status-report/details",
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error("attendanceStatusReportApi.getDetails error:", error);
      return { success: false, data: { total: 0, items: [], summary: {} } };
    }
  },
};
