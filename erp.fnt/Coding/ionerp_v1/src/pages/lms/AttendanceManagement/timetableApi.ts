import axiosInstance from "../../../utils/api";
import { toast } from "react-toastify";

// ─── Exported Types ───────────────────────────────────────────────────────────
export interface CopyDayRequest {
  sourceDate: string;
  targetDate: string;
  curriculumId?: number;
  termId?: number;
  sectionId?: number;
  // legacy fields kept for backward compatibility
  fromDay?: string;
  toDay?: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────
export const timetableApi = {

  // Copy day - Copy timetable from one day to another
  copyDay: async (data: CopyDayRequest): Promise<any> => {
    try {
      const response = await axiosInstance.post("/api/v1/timetable/copy-day", data);
      toast.success("Timetable copied successfully!");
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to copy timetable";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Reset timetable date - Clear all dates for a term
  resetDate: async (term: number): Promise<any> => {
    try {
      const response = await axiosInstance.put(`/api/v1/timetable/reset-date`, { term });
      toast.success("Timetable dates reset successfully!");
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to reset timetable dates";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Reset timetable dates (alias used by scheduleClassApi)
  resetTimetableDates: async (termId: number): Promise<any> => {
    try {
      const response = await axiosInstance.put(`/api/v1/timetable/reset-date`, { term: termId });
      toast.success("Timetable dates reset successfully!");
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to reset timetable dates";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Delete a specific timetable by semTimeTableId
  deleteTimetable: async (semTimeTableId: number | string): Promise<any> => {
    try {
      const response = await axiosInstance.delete(`/api/v1/timetable/${semTimeTableId}`);
      toast.success("Timetable deleted successfully!");
      return { success: true, data: response.data };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete timetable";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Update timetable entry (delete + create since backend has no PUT)
  updateEntry: async (id: number, data: any): Promise<any> => {
    try {
      await axiosInstance.delete(`/api/v1/timetable/${id}`);
      const response = await axiosInstance.post("/api/v1/comman_function/timetable", data);
      toast.success("Timetable entry updated successfully!");
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update timetable entry";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Update a scheduled class
  updateScheduledClass: async (id: number, data: any): Promise<any> => {
    try {
      const response = await axiosInstance.put(`/api/v1/timetable/scheduled-classes/${id}`, data);
      toast.success("Scheduled class updated successfully!");
      return { success: true, data: response.data };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update scheduled class";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Delete timetable entry by id
  deleteEntry: async (id: number): Promise<any> => {
    try {
      const response = await axiosInstance.delete(`/api/v1/timetable/${id}`);
      toast.success("Timetable entry deleted successfully!");
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete timetable entry";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Delete a scheduled class by id
  deleteScheduledClass: async (id: number | string): Promise<any> => {
    try {
      const response = await axiosInstance.delete(`/api/v1/timetable/scheduled-classes/${id}`);
      toast.success("Scheduled class deleted successfully!");
      return { success: true, data: response.data };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete scheduled class";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Delete timetable by term and section
  deleteByTermSection: async (term: number, section: string): Promise<any> => {
    try {
      const response = await axiosInstance.delete(`/api/v1/timetable`, {
        data: { term, section }
      } as any);
      toast.success("Timetable cleared successfully!");
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to clear timetable";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Sync date range for timetable entries
  syncDateRange: async (data: { startDate: string; endDate: string; [key: string]: any }): Promise<any> => {
    try {
      const response = await axiosInstance.post("/api/v1/timetable/sync-date-range", data);
      toast.success("Date range synced successfully!");
      return { success: true, data: response.data };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to sync date range";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Export timetable as PDF
  exportTimetablePdf: async (data: any): Promise<any> => {
    try {
      const response = await axiosInstance.post("/api/v1/timetable/export-pdf", data, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `timetable_${new Date().toISOString().split("T")[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Timetable exported successfully!");
      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to export timetable PDF";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Get all timetable entries
  getAll: async (): Promise<any> => {
    try {
      const response = await axiosInstance.get("/api/v1/comman_function/timetable");
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load timetable";
      toast.error(errorMessage);
      const STORAGE_KEY = "timetable_entries";
      const existingData = localStorage.getItem(STORAGE_KEY);
      const timetableData = existingData ? JSON.parse(existingData) : [];
      toast.warning(`${errorMessage} - Using offline data instead!`);
      return { data: timetableData };
    }
  },

  // Get curriculums
  getCurriculums: async (): Promise<any> => {
    try {
      const response = await axiosInstance.get("/api/v1/timetable/curriculums");
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load curriculums";
      toast.error(errorMessage);
      const STORAGE_KEY = "curriculums";
      const existingData = localStorage.getItem(STORAGE_KEY);
      const curriculums = existingData ? JSON.parse(existingData) : [];
      toast.warning(`${errorMessage} - Using offline data instead!`);
      return { data: curriculums };
    }
  },

  // Get terms by curriculum
  getTermsByCurriculum: async (crclmId: number): Promise<any> => {
    try {
      const response = await axiosInstance.get(`/api/v1/timetable/curriculums/${crclmId}/terms`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load terms";
      toast.error(errorMessage);
      const STORAGE_KEY = "curriculum_terms";
      const existingData = localStorage.getItem(STORAGE_KEY);
      const terms = existingData ? JSON.parse(existingData) : [];
      toast.warning(`${errorMessage} - Using offline data instead!`);
      return { data: terms };
    }
  },

  // Get sections by curriculum and term
  getSectionsByCurriculumTerm: async (crclmId: number, termName: string): Promise<any> => {
    try {
      const response = await axiosInstance.get(`/api/v1/timetable/curriculums/${crclmId}/terms/${termName}/sections`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load sections";
      toast.error(errorMessage);
      const STORAGE_KEY = "curriculum_term_sections";
      const existingData = localStorage.getItem(STORAGE_KEY);
      const sections = existingData ? JSON.parse(existingData) : [];
      toast.warning(`${errorMessage} - Using offline data instead!`);
      return { data: sections };
    }
  },

  // Get all timetables (with optional filters)
  getTimetables: async (term?: string, section?: string): Promise<any> => {
    try {
      const params: any = {};
      if (term) params.term = term;
      if (section) params.section = section;
      const response = await axiosInstance.get("/api/v1/timetable/timetables", { params });
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load timetables";
      toast.error(errorMessage);
      const STORAGE_KEY = "all_timetables";
      const existingData = localStorage.getItem(STORAGE_KEY);
      const timetables = existingData ? JSON.parse(existingData) : [];
      toast.warning(`${errorMessage} - Using offline data instead!`);
      return { success: false, data: timetables };
    }
  },

  // Get scheduled classes — flexible params; always returns { success, data }
  getScheduledClasses: async (
    courseCodeOrParams?: string | Record<string, any>,
    classDate?: string,
    section?: string
  ): Promise<{ success: boolean; data: any[] }> => {
    try {
      let params: Record<string, any> = {};

      if (typeof courseCodeOrParams === "object" && courseCodeOrParams !== null) {
        // Called as getScheduledClasses({ startDate, endDate, ... })
        params = courseCodeOrParams;
      } else if (typeof courseCodeOrParams === "string") {
        // Called as getScheduledClasses(courseCode, classDate, section)
        params.course_code = courseCodeOrParams;
        if (classDate) params.class_date = classDate;
        if (section) params.section = section;
      }
      // else: no args — return all

      const response = await axiosInstance.get("/api/v1/timetable/scheduled-classes", { params });
      return { success: true, data: (response.data as any[]) || [] };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load scheduled classes";
      console.error("getScheduledClasses error:", errorMessage);
      return { success: false, data: [] };
    }
  },
};
