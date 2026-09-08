import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";
import { useAxios } from "../../../hooks/useAxios";

import type {
  ApiResponse,
  CurriculumResponse,
  TermResponse,
  SectionResponse,
  CourseOptionResponse,
  BatchOptionResponse,
  TimetableResponse,
  OverlapResponse,
  ScheduleClassFormState,
  GenerateTimetableRequest,
  TimetableFilterRequest,
  ScheduleClassRequest,
  UpdateClassRequest,
  DeleteTimetableRequest,
  CompensateClassRequest,
  SelectCourseRequest,
  SelectBatchRequest,
  EditClassCourseRequest,
  CheckOverlapRequest,
} from "./TimetableTypes";


const getResponse = <T = any>(res: any): ApiResponse<T> => {
  const body = res?.data;

  /*
   * Supports both:
   *
   * {
   *   success: true,
   *   data: [...]
   * }
   *
   * and
   *
   * {
   *   status: 1,
   *   data: [...]
   * }
   */

  if (body?.success !== undefined) {
    return body as ApiResponse<T>;
  }

  if (body?.status !== undefined) {
    return {
      success: body.status === 1 || body.status === true,
      data: body.data,
      message: body.message,
      error: body.error,
    };
  }

  return {
    success: true,
    data: body as T,
  };
};


export const useManageTimetableService = () => {

  /*
   * Same pattern as Manage Quiz.
   *
   * Currently these calls are mostly handled directly using axiosInstance.
   * useAxios is initialized here so the service follows the existing project
   * service structure.
   */
  const { customApiCall } = useAxios("", {
    method: "post",
    shouldFetch: false,
    loader: false,
  });


  // ==========================================================================
  // CURRICULUM
  // ==========================================================================

  const getCurriculumList = async (
    params?: { org_id?: number }
  ): Promise<ApiResponse<CurriculumResponse[]>> => {

    try {

      const res: any = await axiosInstance.get(
        ApiEndpoint.manageTimetable.fetchCurriculum,
        {
          params,
        }
      );

      return getResponse<CurriculumResponse[]>(res);

    } catch (error) {

      console.error(
        "Error fetching curriculum list:",
        error
      );

      throw error;
    }
  };


  /*
   * Alias used by useTimetable / Timetable.tsx.
   */
  const fetchCurriculums = async (
    orgId?: number
  ): Promise<ApiResponse<CurriculumResponse[]>> => {

    return getCurriculumList(
      orgId ? { org_id: orgId } : undefined
    );
  };


  // ==========================================================================
  // TERMS
  // ==========================================================================

const fetchTerms = async (
  academicBatchId: number
): Promise<ApiResponse<TermResponse[]>> => {

  try {
    const res: any = await axiosInstance.post(
      ApiEndpoint.manageTimetable.fetchTermDesign,
      {
        academic_batch_id: academicBatchId,
      }
    );

    const response = getResponse<
      Array<TermResponse & { semester_id?: number; semester?: string | number }>
    >(res);

    // `fetch_term_design` returns semester_id/semester, while the timetable
    // UI uses a common term shape. Normalize it here so every downstream call
    // receives the selected semester ID instead of an undefined value.
    return {
      ...response,
      data: (response.data ?? []).map((term) => ({
        crclm_term_id: Number(term.crclm_term_id ?? term.semester_id ?? 0),
        term_name: term.term_name ?? String(term.semester ?? ""),
      })),
    };

  } catch (error) {
    console.error(
      "Error fetching terms:",
      error
    );

    throw error;
  }
};

  // ==========================================================================
  // SECTION
  // ==========================================================================

  const getSectionDetails = async (
    academicBatchId: number,
    semesterId: number
  ): Promise<ApiResponse<SectionResponse[]>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.getSectionDetails,
        {
          academic_batch_id: academicBatchId,
          semester_id: semesterId,
        }
      );

      return getResponse<SectionResponse[]>(res);

    } catch (error) {

      console.error(
        "Error fetching sections:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // COURSE
  // ==========================================================================

  const selectCourse = async (
    request: SelectCourseRequest
  ): Promise<ApiResponse<CourseOptionResponse[]>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.selectCourse,
        request
      );

      return getResponse<CourseOptionResponse[]>(res);

    } catch (error) {

      console.error(
        "Error fetching courses:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // BATCH
  // ==========================================================================

  const selectBatch = async (
    request: SelectBatchRequest
  ): Promise<ApiResponse<BatchOptionResponse[]>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.selectBatch,
        request
      );

      return getResponse<BatchOptionResponse[]>(res);

    } catch (error) {

      console.error(
        "Error fetching batches:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // EDIT CLASS COURSE
  // ==========================================================================

  const getEditClassCourse = async (
    request: EditClassCourseRequest
  ): Promise<ApiResponse<CourseOptionResponse[]>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.getEditClassCourse,
        request
      );

      return getResponse<CourseOptionResponse[]>(res);

    } catch (error) {

      console.error(
        "Error fetching edit class courses:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // GENERATE TIMETABLE
  // ==========================================================================

  const generateTimetable = async (
    request: GenerateTimetableRequest
  ): Promise<ApiResponse<TimetableResponse>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.generateTimetable,
        request
      );

      return getResponse<TimetableResponse>(res);

    } catch (error) {

      console.error(
        "Error generating timetable:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // GET SCHEDULED CLASSES
  // ==========================================================================

  const getScheduledClass = async (
    filter: TimetableFilterRequest
  ): Promise<ApiResponse<TimetableResponse>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.getScheduleClass,
        filter
      );

      return getResponse<TimetableResponse>(res);

    } catch (error) {

      console.error(
        "Error fetching timetable:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // GET DETAILS
  // ==========================================================================

  const getTimetableDetails = async (
    ttId: number
  ): Promise<ApiResponse<TimetableResponse>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.getDetails,
        null,
        {
          params: {
            tt_id: ttId,
          },
        }
      );

      return getResponse<TimetableResponse>(res);

    } catch (error) {

      console.error(
        "Error fetching timetable details:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // CHECK DATE EXISTS
  // ==========================================================================

  const checkDateExists = async (
    data: {
      crclm_id: number;
      term_id: number;
      section_id: number;
      tt_start_date: string;
    }
  ): Promise<ApiResponse<{ tt_count: number }>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.checkDateExists,
        data
      );

      return getResponse<{ tt_count: number }>(res);

    } catch (error) {

      console.error(
        "Error checking timetable date:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // UPDATE TIMETABLE
  // ==========================================================================

  const updateTimetable = async (
    data: {
      edit_tt_detail_id: number;
      edit_start_date?: string;
      edit_end_date?: string;
      edit_tt_start_time?: string;
      edit_tt_end_time?: string;
    }
  ): Promise<ApiResponse<{ status: boolean }>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.updateTimetable,
        data
      );

      return getResponse<{ status: boolean }>(res);

    } catch (error) {

      console.error(
        "Error updating timetable:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // DELETE TIMETABLE
  // ==========================================================================

  const deleteTimetable = async (
    request: DeleteTimetableRequest
  ): Promise<ApiResponse<{ status: boolean }>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.deleteTimetable,
        request
      );

      return getResponse<{ status: boolean }>(res);

    } catch (error) {

      console.error(
        "Error deleting timetable:",
        error
      );

      throw error;
    }
  };

  const resetTimetableDate = async (
    ttDetailId: number,
    endDate: string
  ): Promise<ApiResponse<{ status: boolean }>> => {

    try {

      const res: any = await axiosInstance.post(
        "/api/v1/timetable/reset_timetable_date",
        {
          tt_detail_id: ttDetailId,
          end_date: endDate,
        }
      );

      return getResponse<{ status: boolean }>(res);

    } catch (error) {

      console.error("Error resetting timetable dates:", error);
      throw error;
    }
  };


  // ==========================================================================
  // SAVE CLASSES
  // ==========================================================================

  const saveClasses = async (
    request: ScheduleClassRequest
  ): Promise<ApiResponse<{ status: string }>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.saveClasses,
        request
      );

      return getResponse<{ status: string }>(res);

    } catch (error) {

      console.error(
        "Error saving classes:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // UPDATE CLASS
  // ==========================================================================

  const updateClass = async (
    request: UpdateClassRequest
  ): Promise<ApiResponse<{ status: boolean }>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.updateClass,
        request
      );

      return getResponse<{ status: boolean }>(res);

    } catch (error) {

      console.error(
        "Error updating class:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // DELETE CLASS
  // ==========================================================================

  const deleteClass = async (
    timeTableId: number
  ): Promise<ApiResponse<{ status: boolean }>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.deleteClass,
        null,
        {
          params: {
            time_table_id: timeTableId,
          },
        }
      );

      return getResponse<{ status: boolean }>(res);

    } catch (error) {

      console.error(
        "Error deleting class:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // CHECK OVERLAP
  // ==========================================================================

  const checkOverlap = async (
    request: CheckOverlapRequest
  ): Promise<ApiResponse<OverlapResponse>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.checkOverlap,
        request
      );

      return getResponse<OverlapResponse>(res);

    } catch (error) {

      console.error(
        "Error checking class overlap:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // COMPENSATE CLASS
  // ==========================================================================

  const compensateClass = async (
    request: CompensateClassRequest
  ): Promise<ApiResponse<{
    status: boolean;
    records_created: number;
    popup?: boolean;
  }>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.compensateClass,
        request
      );

      return getResponse(res);

    } catch (error) {

      console.error(
        "Error compensating class:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // DOWNLOAD TEMPLATE
  // ==========================================================================

  const downloadTemplate = async (
    ttDetailId: number
  ): Promise<void> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.downloadTemplate,
        {
          do_tt_detail_id: ttDetailId,
        },
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [res.data],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "timetable_template.xlsx";

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error(
        "Error downloading timetable template:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // VERIFY EXCEL
  // ==========================================================================

  const verifyExcel = async (
    formData: FormData
  ): Promise<ApiResponse<any>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.verifyExcel,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return getResponse(res);

    } catch (error) {

      console.error(
        "Error verifying Excel:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // SAVE EXCEL
  // ==========================================================================

  const saveExcel = async (
    formData: FormData
  ): Promise<ApiResponse<any>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.saveExcel,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return getResponse(res);

    } catch (error) {

      console.error(
        "Error saving Excel:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // EXPORT EXCEL
  // ==========================================================================

  const exportTimetable = async (
    ttDetailId: number
  ): Promise<void> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.exportTimetable,
        {
          expo_tt_detail_id: ttDetailId,
        },
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [res.data],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "timetable.xlsx";

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error(
        "Error exporting timetable:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // VIEW TIMETABLE
  // ==========================================================================

  const viewTimetable = async (
    ttDetailId: number
  ): Promise<ApiResponse<{ table_vw: string }>> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.viewTimetable,
        null,
        {
          params: {
            tt_detail_id: ttDetailId,
          },
        }
      );

      return getResponse<{ table_vw: string }>(res);

    } catch (error) {

      console.error(
        "Error viewing timetable:",
        error
      );

      throw error;
    }
  };


  // ==========================================================================
  // EXPORT PDF
  // ==========================================================================

  const exportTimetablePdf = async (
    data: any
  ): Promise<void> => {

    try {

      const res: any = await axiosInstance.post(
        ApiEndpoint.manageTimetable.exportTimetablePdf,
        data,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [res.data],
        {
          type: "application/pdf",
        }
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "timetable.pdf";

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error(
        "Error exporting timetable PDF:",
        error
      );

      throw error;
    }
  };


  return {
    customApiCall,

    getCurriculumList,
    fetchCurriculums,

    fetchTerms,
    getSectionDetails,

    selectCourse,
    selectBatch,
    getEditClassCourse,

    generateTimetable,
    getScheduledClass,
    getTimetableDetails,
    checkDateExists,
    updateTimetable,
    deleteTimetable,
    resetTimetableDate,

    saveClasses,
    updateClass,
    deleteClass,
    checkOverlap,

    compensateClass,

    downloadTemplate,
    verifyExcel,
    saveExcel,
    exportTimetable,
    viewTimetable,
    exportTimetablePdf,
  };
};
