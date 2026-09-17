import axiosInstance from "../../../utils/api";
import { toast } from "react-toastify";
import { timetableApi } from "./timetableApi";

const getClassList = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload !== null
    && typeof payload === "object"
    && "data" in payload
    && Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: unknown[] }).data;
  }

  return [];
};

export const scheduleClassApi = {
  saveSchedule: async (data: any) => {
    try {
      const response = await axiosInstance.post("/api/v1/comman_function/schedule-class", data);
      toast.success("Class scheduled successfully!");
      return { success: true, data: response.data };
    } catch (error) {
      toast.error("Unable to save the class. Please try again.");
      throw error;
    }
  },

  getAll: async () => {
    try {
      const response = await axiosInstance.get("/api/v1/timetable/scheduled-classes");
      const backendData = getClassList(response.data);

      return { success: true, data: backendData };
    } catch (error) {
      throw error;
    }
  },

  delete: async (target: any) => {
    try {
      await axiosInstance.delete(`/api/v1/timetable/scheduled-classes/${target}`);
      return { success: true };
    } catch (error) {
      toast.error("Unable to delete the class. Please try again.");
      throw error;
    }
  },

  // New methods for timetable operations
  copyDay: timetableApi.copyDay.bind(timetableApi),
  resetTimetableDates: timetableApi.resetTimetableDates.bind(timetableApi),
  deleteTimetable: timetableApi.deleteTimetable.bind(timetableApi),
  getTimetables: timetableApi.getTimetables.bind(timetableApi),
  updateScheduledClass: timetableApi.updateScheduledClass.bind(timetableApi),
  deleteScheduledClass: timetableApi.deleteScheduledClass.bind(timetableApi),
  syncDateRange: timetableApi.syncDateRange.bind(timetableApi),
  exportTimetablePdf: timetableApi.exportTimetablePdf.bind(timetableApi),
};
