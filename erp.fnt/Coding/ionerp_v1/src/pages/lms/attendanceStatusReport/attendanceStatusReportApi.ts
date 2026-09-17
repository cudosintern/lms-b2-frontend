// import axiosInstance from "../../../utils/api";

// export interface AttendanceStatusParams {
//   academic_batch_id: number;
//   from_date: string; // YYYY-MM-DD
//   to_date: string;   // YYYY-MM-DD
//   crs_id?: number;
//   section_id?: number;
// }

// export const attendanceStatusReportApi = {
//   /**
//    * Fetch curriculum (academic_batch) list for the dropdown.
//    * GET /api/v1/reports/attendance-status-report/meta/curriculums
//    */
//   getCurriculums: async () => {
//     try {
//       const response = await axiosInstance.get(
//         "/api/v1/reports/attendance-status-report/meta/curriculums"
//       );
//       return response.data;
//     } catch (error: any) {
//       console.error("attendanceStatusReportApi.getCurriculums error:", error);
//       return { success: false, data: { total: 0, items: [] } };
//     }
//   },

//   /**
//    * Fetch class-wise attendance status for a batch and date range.
//    * GET /api/v1/reports/attendance-status-report/details
//    */
//   getDetails: async (params: AttendanceStatusParams) => {
//     try {
//       const response = await axiosInstance.get(
//         "/api/v1/reports/attendance-status-report/details",
//         { params }
//       );
//       return response.data;
//     } catch (error: any) {
//       console.error("attendanceStatusReportApi.getDetails error:", error);
//       return { success: false, data: { total: 0, items: [], summary: {} } };
//     }
//   },
// };


import axiosInstance from "../../../utils/api";

export interface AttendanceStatusParams {
  academic_batch_id: number;
  from_date: string;
  to_date: string;
  crs_id?: number;
  section_id?: number;
}

export interface ClassDetail {
  date: string;
  start_time: string;
  end_time: string;
  tt_day_map_id?: number;
}

export interface StatusBucket {
  count: number;
  classes: ClassDetail[];
}

export interface MonthStatus {
  Complete: StatusBucket;
  "In-progress": StatusBucket;
  "Not Started": StatusBucket;
}

export interface AttendanceStatusRow {
  semester_id: number;
  term_name: string;
  term_order: number;
  crs_id: number;
  crs_code: string;
  crs_title: string;
  section_id: number;
  batch_id?: number | null;
  section: string;
  faculty: string;
  months: Record<string, MonthStatus>;
}

export const attendanceStatusReportApi = {
  getCurriculums: async () => {
    const response = await axiosInstance.get(
      "/api/v1/reports/attendance-status-report/meta/curriculums"
    );
    return response.data;
  },

  getDetails: async (params: AttendanceStatusParams) => {
    const response = await axiosInstance.get(
      "/api/v1/reports/attendance-status-report/details",
      { params }
    );
    return response.data;
  },
};