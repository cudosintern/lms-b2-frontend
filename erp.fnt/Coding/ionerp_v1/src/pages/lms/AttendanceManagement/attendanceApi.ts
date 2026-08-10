import axiosInstanceRaw from "../../../utils/api";
import { toast } from "react-toastify";

const axiosInstance = axiosInstanceRaw as any;
const ATTENDANCE_SUMMARY_URL = "/api/v1/access-control/attendance/summary";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  markedBy: string;
  markedAt: string;
}

export interface AttendanceSummary {
  courseId?: string;
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate?: number;
}

export interface AttendanceStats {
  studentId: string;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
}

export interface MarkAttendanceRequest {
  courseId: string;
  curriculum: string;
  term: string;
  section: string;
  session: string;
  date: string;
  students: {
    studentId: string;
    present: boolean;
    late: boolean;
    absentReason?: string;
  }[];
}

const STORAGE_KEY = "attendance_data";

const generateId = () => Date.now().toString();

const getMockAttendance = (): AttendanceRecord[] => [
  {
    id: "1",
    studentId: "1",
    courseId: "CS201",
    date: "2024-03-15",
    status: "present",
    checkInTime: "09:00",
    checkOutTime: "10:30",
    markedBy: "teacher1",
    markedAt: "2024-03-15T09:05:00Z",
  },
  {
    id: "2",
    studentId: "2",
    courseId: "CS201",
    date: "2024-03-15",
    status: "absent",
    markedBy: "teacher1",
    markedAt: "2024-03-15T09:05:00Z",
  },
];

export const attendanceApi = {
  // Mark attendance for multiple students
  markAttendance: async (
    attendanceData: Omit<AttendanceRecord, "id" | "markedAt">[],
  ) => {
    try {
      const response = await axiosInstance.post(
        "/api/v1/attendance/mark",
        attendanceData,
      );
      toast.success("Attendance marked successfully!");
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Error marking attendance:", error);

      // Fallback to localStorage
      const existingData = localStorage.getItem(STORAGE_KEY);
      const attendanceRecords = existingData
        ? JSON.parse(existingData)
        : getMockAttendance();

      const newRecords = attendanceData.map((record) => ({
        ...record,
        id: generateId(),
        markedAt: new Date().toISOString(),
      }));

      const updatedData = [...attendanceRecords, ...newRecords];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      toast.success("Attendance saved locally (Offline)");
      return { success: true, data: newRecords, isOffline: true };
    }
  },

  // markAttendance: async (
  //   attendanceData: MarkAttendanceRequest
  // ) => {
  //   try {
  //     const response = await axiosInstance.post(
  //       "/api/v1/attendance/mark",
  //       attendanceData
  //     );

  //     toast.success("Attendance marked successfully!");
  //     return { success: true, data: response.data };
  //   } catch (error: any) {
  //     console.error(error);
  //     toast.error("Unable to save attendance.");
  //     return { success: false };
  //   }
  // },

  // Get attendance by course and date
  getAttendanceByCourseDate: async (
    courseId: string,
    date: string,
    options?: {
      academicBatchId?: number;
      termId?: number;
      sectionId?: string;
    },
  ) => {
    try {
      const params: Record<string, any> = {
        from_date: date,
        to_date: date,
      };

      if (options?.academicBatchId !== undefined) {
        params.academic_batch_id = options.academicBatchId;
      }
      if (options?.termId !== undefined) {
        params.semester_id = options.termId;
      }
      if (options?.sectionId) {
        params.section_id = options.sectionId;
      }
      const parsedCourseId = Number(courseId);
      if (!Number.isNaN(parsedCourseId)) {
        params.course_id = parsedCourseId;
      }

      const url = ATTENDANCE_SUMMARY_URL;
      console.log("FINAL SUMMARY API CALL", url, params);
      const response = await axiosInstance.get(url, {
        params,
      });

      const records = Array.isArray(response.data?.data)
        ? response.data.data
        : (response.data?.data ?? response.data ?? []);
      return { success: true, data: records };
    } catch (error: any) {
      console.error("Error fetching attendance:", error);

      // Fallback to localStorage
      const existingData = localStorage.getItem(STORAGE_KEY);
      const attendanceRecords = existingData
        ? JSON.parse(existingData)
        : getMockAttendance();

      const filteredRecords = attendanceRecords.filter(
        (record: AttendanceRecord) =>
          record.courseId === courseId && record.date === date,
      );

      return { success: true, data: filteredRecords, isOffline: true };
    }
  },

  getAttendanceFetch: async (payload: {
    crs_code: string;
    day: string;
    start_time: string;
    end_time: string;
    section?: string;
    sem_time_table_id?: string | number;
  }) => {
    try {
      const response = await axiosInstance.get("/api/v1/attendance/fetch", {
        params: payload,
      });
      const records =
        response.data?.attendance ?? response.data?.data ?? response.data ?? [];
      return { success: true, data: records };
    } catch (error: any) {
      console.error("Error fetching daily attendance:", error);
      return { success: false, data: [] as any[] };
    }
  },

  getAttendanceCurriculums: async () => {
    try {
      const response = await axiosInstance.get("/api/v1/timetable/curriculums");
      return {
        success: true,
        data: response.data?.data ?? response.data ?? [],
      };
    } catch (error: any) {
      console.error("Error fetching curriculums:", error);
      return { success: false, data: [] as any[] };
    }
  },

  getAttendanceTerms: async (curriculumId: string) => {
    try {
      const response = await axiosInstance.get(
        `/api/v1/timetable/curriculums/${curriculumId}/terms`,
      );
      return {
        success: true,
        data: response.data?.data ?? response.data ?? [],
      };
    } catch (error: any) {
      console.error("Error fetching terms:", error);
      return { success: false, data: [] as any[] };
    }
  },

  getAttendanceCourses: async (payload: {
    academic_batch_id: number;
    crclm_term_id: number | string;
  }) => {
    try {
      const response = await axiosInstance.post(
        "/api/v1/comman_function/courses",
        payload,
      );
      return {
        success: true,
        data: response.data?.data ?? response.data ?? [],
      };
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      return { success: false, data: [] as any[] };
    }
  },

  getAttendanceSections: async (payload: {
    academic_batch_id: number;
    semester_id: number;
    crclm_term_id?: number | string;
  }) => {
    try {
      const response = await axiosInstance.post(
        "/api/v1/comman_function/batch-sections",
        payload,
      );
      return {
        success: true,
        data: response.data?.sections ?? response.data ?? [],
      };
    } catch (error: any) {
      console.error("Error fetching sections:", error);
      return { success: false, data: [] as any[] };
    }
  },

  getAttendanceStudents: async (payload: {
    academic_batch_id: number;
    section: string;
  }) => {
    try {
      const response = await axiosInstance.get(
        "/api/v1/comman_function/students",
        {
          params: payload,
        },
      );
      return {
        success: true,
        data: response.data?.data ?? response.data ?? [],
      };
    } catch (error: any) {
      console.error("Error fetching students:", error);
      return { success: false, data: [] as any[] };
    }
  },

  getAttendanceSummaryByDate: async (payload: {
    academic_batch_id: number;
    semester_id: number | string;
    course_id: number | string;
    section_id: string;
    from_date: string;
    to_date: string;
  }) => {
    try {
      const url = ATTENDANCE_SUMMARY_URL;
      console.log("FINAL SUMMARY API CALL", url, payload);
      const response = await axiosInstance.get(url, {
        params: payload,
      });
      return {
        success: true,
        data: response.data?.data ?? response.data ?? [],
      };
    } catch (error: any) {
      console.error("Error fetching attendance summary by date:", error);
      const existingData = localStorage.getItem(STORAGE_KEY);
      const attendanceRecords = existingData
        ? JSON.parse(existingData)
        : getMockAttendance();
      const filteredRecords = attendanceRecords.filter(
        (record: AttendanceRecord) =>
          record.courseId === String(payload.course_id) &&
          record.date >= payload.from_date &&
          record.date <= payload.to_date,
      );
      return { success: true, data: filteredRecords, isOffline: true };
    }
  },

  // Get attendance summary for a course
  getAttendanceSummary: async (
    courseId: string,
    startDate: string,
    endDate: string,
  ) => {
    try {
      const params = {
        course_id: Number(courseId),
        from_date: startDate,
        to_date: endDate,
      };
      const url = ATTENDANCE_SUMMARY_URL;
      console.log("FINAL SUMMARY API CALL", url, params);
      const response = await axiosInstance.get(url, {
        params,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Error fetching attendance summary:", error);

      // Fallback to localStorage
      const existingData = localStorage.getItem(STORAGE_KEY);
      const attendanceRecords = existingData
        ? JSON.parse(existingData)
        : getMockAttendance();

      const courseRecords = attendanceRecords.filter(
        (record: AttendanceRecord) =>
          record.courseId === courseId &&
          record.date >= startDate &&
          record.date <= endDate,
      );

      // Calculate summary
      const summary: AttendanceSummary = {
        courseId,
        date: endDate,
        totalStudents: courseRecords.length,
        present: courseRecords.filter(
          (r: AttendanceRecord) => r.status === "present",
        ).length,
        absent: courseRecords.filter(
          (r: AttendanceRecord) => r.status === "absent",
        ).length,
        late: courseRecords.filter((r: AttendanceRecord) => r.status === "late")
          .length,
        excused: courseRecords.filter(
          (r: AttendanceRecord) => r.status === "excused",
        ).length,
        attendanceRate:
          courseRecords.length > 0
            ? (courseRecords.filter(
                (r: AttendanceRecord) => r.status === "present",
              ).length /
                courseRecords.length) *
              100
            : 0,
      };

      return { success: true, data: summary, isOffline: true };
    }
  },

  // Get student attendance statistics
  getStudentAttendanceStats: async (studentId: string, courseId?: string) => {
    try {
      const url = courseId
        ? `/api/v1/attendance/student/${studentId}/course/${courseId}`
        : `/api/v1/attendance/student/${studentId}`;

      const response = await axiosInstance.get(url);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Error fetching student stats:", error);

      // Fallback to localStorage
      const existingData = localStorage.getItem(STORAGE_KEY);
      const attendanceRecords = existingData
        ? JSON.parse(existingData)
        : getMockAttendance();

      const studentRecords = courseId
        ? attendanceRecords.filter(
            (r: AttendanceRecord) =>
              r.studentId === studentId && r.courseId === courseId,
          )
        : attendanceRecords.filter(
            (r: AttendanceRecord) => r.studentId === studentId,
          );

      const stats: AttendanceStats = {
        studentId,
        totalClasses: studentRecords.length,
        presentCount: studentRecords.filter(
          (r: AttendanceRecord) => r.status === "present",
        ).length,
        absentCount: studentRecords.filter(
          (r: AttendanceRecord) => r.status === "absent",
        ).length,
        lateCount: studentRecords.filter(
          (r: AttendanceRecord) => r.status === "late",
        ).length,
        excusedCount: studentRecords.filter(
          (r: AttendanceRecord) => r.status === "excused",
        ).length,
        attendancePercentage:
          studentRecords.length > 0
            ? (studentRecords.filter(
                (r: AttendanceRecord) => r.status === "present",
              ).length /
                studentRecords.length) *
              100
            : 0,
      };

      return { success: true, data: stats, isOffline: true };
    }
  },

  // Update attendance record
  updateAttendance: async (id: string, updates: Partial<AttendanceRecord>) => {
    try {
      const response = await axiosInstance.put(
        `/api/v1/attendance/${id}`,
        updates,
      );
      toast.success("Attendance updated successfully!");
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Error updating attendance:", error);

      // Fallback to localStorage
      const existingData = localStorage.getItem(STORAGE_KEY);
      const attendanceRecords = existingData
        ? JSON.parse(existingData)
        : getMockAttendance();

      const updatedRecords = attendanceRecords.map(
        (record: AttendanceRecord) =>
          record.id === id ? { ...record, ...updates } : record,
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));

      toast.success("Attendance updated locally (Offline)");
      return { success: true, data: { id, ...updates }, isOffline: true };
    }
  },

  // Delete attendance record
  deleteAttendance: async (id: string) => {
    try {
      await axiosInstance.delete(`/api/v1/attendance/${id}`);
      toast.success("Attendance deleted successfully!");
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting attendance:", error);

      // Fallback to localStorage
      const existingData = localStorage.getItem(STORAGE_KEY);
      const attendanceRecords = existingData
        ? JSON.parse(existingData)
        : getMockAttendance();

      const filteredRecords = attendanceRecords.filter(
        (record: AttendanceRecord) => record.id !== id,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));

      toast.success("Attendance deleted locally (Offline)");
      return { success: true, isOffline: true };
    }
  },

  // Get attendance report
  getAttendanceReport: async (
    courseId: string,
    startDate: string,
    endDate: string,
  ) => {
    try {
      const response = await axiosInstance.get(
        `/api/v1/attendance/report/${courseId}`,
        {
          params: { startDate, endDate },
        },
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Error generating attendance report:", error);

      // Fallback to localStorage
      const existingData = localStorage.getItem(STORAGE_KEY);
      const attendanceRecords = existingData
        ? JSON.parse(existingData)
        : getMockAttendance();

      const courseRecords = attendanceRecords.filter(
        (record: AttendanceRecord) =>
          record.courseId === courseId &&
          record.date >= startDate &&
          record.date <= endDate,
      );

      // Generate report data
      const reportData = {
        courseId,
        period: { startDate, endDate },
        summary: {
          totalClasses: courseRecords.length,
          uniqueStudents: Array.from(
            new Set(courseRecords.map((r: AttendanceRecord) => r.studentId)),
          ).length,
          averageAttendance:
            courseRecords.length > 0
              ? (courseRecords.filter(
                  (r: AttendanceRecord) => r.status === "present",
                ).length /
                  courseRecords.length) *
                100
              : 0,
        },
        dailyBreakdown: courseRecords.reduce(
          (acc: Record<string, any>, record: AttendanceRecord) => {
            if (!acc[record.date]) {
              acc[record.date] = { present: 0, absent: 0, late: 0, excused: 0 };
            }
            acc[record.date][record.status]++;
            return acc;
          },
          {} as Record<string, any>,
        ),
      };

      return { success: true, data: reportData, isOffline: true };
    }
  },

  // Save attendance with state (draft/enabled/finalized)
  saveAttendance: async (attendanceData: {
    courseId: string;
    date: string;
    records: any[];
    state: "draft" | "enabled" | "finalized";
  }) => {
    try {
      const response = await axiosInstance.post(
        "/api/v1/attendance/save",
        attendanceData,
      );
      toast.success("Attendance saved successfully!");
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Error saving attendance:", error);

      // Fallback to localStorage
      const existingData = localStorage.getItem(STORAGE_KEY);
      const attendanceRecords = existingData
        ? JSON.parse(existingData)
        : getMockAttendance();

      const newRecords = attendanceData.records.map((record: any) => ({
        ...record,
        id: generateId(),
        markedAt: new Date().toISOString(),
      }));

      const updatedData = [...attendanceRecords, ...newRecords];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      toast.success("Attendance saved locally (Offline)");
      return { success: true, data: newRecords, isOffline: true };
    }
  },


  // Export attendance data
  exportAttendance: async (exportData: {
    courseId: string;
    date?: string;
    format: "excel" | "pdf" | "csv";
  }) => {
    try {
      const response = await axiosInstance.get(`/api/v1/attendance/export`, {
        params: exportData,
        responseType: exportData.format === "excel" ? "blob" : "json",
      });

      if (exportData.format === "excel") {
        // Create download link for Excel
        const blob = new Blob([response.data as BlobPart], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `attendance_${exportData.courseId}_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast.success("Attendance exported successfully!");
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Error exporting attendance:", error);
      toast.error("Failed to export attendance");
      return { success: false, message: "Export failed" };
    }
  },

  // Backward-compatible wrapper for getStudentsForCourse
  getStudentsForCourse: async (courseId: string, section?: string) => {
    try {
      const response = await axiosInstance.get("/api/v1/comman_function/students", {
        params: {
          course_id: courseId,
          section: section || "",
        },
      });
      return {
        success: true,
        data: response.data?.data ?? response.data ?? [],
      };
    } catch (error: any) {
      console.error("Error fetching students for course:", error);
      return { success: false, data: [] as any[] };
    }
  },

  // Backward-compatible wrapper for importAttendance
  // importAttendance: async (attendanceData: {
  //   courseId: string;
  //   date: string;
  //   records: any[];
  //   state?: "draft" | "enabled" | "finalized";
  // }) => {
  //   try {
  //     const response = await axiosInstance.post(
  //       "/api/v1/attendance/save",
  //       {
  //         ...attendanceData,
  //         state: attendanceData.state || "draft",
  //       },
  //     );
  //     toast.success("Attendance imported successfully!");
  //     return { success: true, data: response.data };
  //   } catch (error: any) {
  //     console.error("Error importing attendance:", error);
  //     return { success: false, data: [] as any[] };
  //   }
  // },

  importAttendance: async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post(
      "/api/v1/attendance/import",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    toast.success("Attendance imported successfully!");
    return { success: true, data: response.data };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
},
};
