import {
  useState,
  useCallback,
} from "react";


import { useManageTimetableService } from "../manageTimetableService";

import {
  TimetableResponse,
  GenerateTimetableRequest,
  TimetableFilterRequest,
  CurriculumResponse,
  TermResponse,
  SectionResponse,
  CourseOptionResponse,
  BatchOptionResponse,
  ApiResponse,
  TimetableFormState,
  ScheduleClassFormState,
  UpdateClassRequest,
} from "../TimetableTypes";

interface EditFormData {
  time_table_id: number;
  tt_detail_id: number;
  crs_id: number;
  old_crs_id: number;
  class_start_time: string;
  class_end_time: string;
  day: string;
}

interface UseTimetableReturn {

  // ============================================================
  // State
  // ============================================================

  loading: boolean;

  timetable: TimetableResponse | null;

  curriculums: CurriculumResponse[];

  terms: TermResponse[];

  sections: SectionResponse[];

  courses: CourseOptionResponse[];

  batches: BatchOptionResponse[];

  formState: TimetableFormState;

  // ============================================================
  // Actions
  // ============================================================

  setFormState: React.Dispatch<
    React.SetStateAction<TimetableFormState>
  >;

  fetchCurriculums: (orgId?: number) => Promise<void>;

  fetchTerms: (
    crclmId: number
  ) => Promise<void>;

  fetchSections: (
    crclmId: number,
    term: number
  ) => Promise<void>;

  fetchCourses: (
    termId: number,
    crsModes: number[]
  ) => Promise<void>;

  fetchBatches: (
    crclmId: number,
    crsIds: number[],
    secId: number
  ) => Promise<void>;

  generateTimetable: () =>
    Promise<ApiResponse<TimetableResponse>>;

  loadTimetable: (
    filter: TimetableFilterRequest
  ) => Promise<ApiResponse<TimetableResponse>>;

  saveClasses: (
    data: ScheduleClassFormState
  ) => Promise<ApiResponse>;

  deleteClass: (
    timeTableId: number
  ) => Promise<ApiResponse>;

  updateClass: (
    data: EditFormData
  ) => Promise<ApiResponse>;

  deleteTimetable: (
    del_tt_detail_id: number,
    login_pwd: string
  ) => Promise<ApiResponse>;

  resetTimetableDate: (
    ttDetailId: number,
    endDate: string
  ) => Promise<ApiResponse>;

  checkOverlap: (
    data: any
  ) => Promise<ApiResponse>;

  downloadTemplate: (
    ttDetailId: number
  ) => Promise<void>;

  exportTimetable: (
    ttDetailId: number
  ) => Promise<void>;

  exportTimetablePdf: (
    data: { expo_tt_detail_id: number }
  ) => Promise<void>;

  viewTimetable: (
    ttDetailId: number
  ) => Promise<ApiResponse<{ table_vw: string }>>;

  compensateClass: (
    data: any
  ) => Promise<ApiResponse>;

  resetForm: () => void;

  clearTimetable: () => void;
}

export function useTimetable(): UseTimetableReturn {

  // ============================================================
  // Service
  // ============================================================

  const timetableService =
    useManageTimetableService();

  // ============================================================
  // State
  // ============================================================

  const [loading, setLoading] =
    useState<boolean>(false);

  const [timetable, setTimetable] =
    useState<TimetableResponse | null>(null);

  const [curriculums, setCurriculums] =
    useState<CurriculumResponse[]>([]);

  const [terms, setTerms] =
    useState<TermResponse[]>([]);

  const [sections, setSections] =
    useState<SectionResponse[]>([]);

  const [courses, setCourses] =
    useState<CourseOptionResponse[]>([]);

  const [batches, setBatches] =
    useState<BatchOptionResponse[]>([]);

  const [formState, setFormState] =
    useState<TimetableFormState>({
      curriculum: 0,
      term: 0,
      section: 0,
      timetable: 0,
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      lmsRegBypFlag: 0,
    });

    

  // ============================================================
  // Fetch Curriculum
  // ============================================================

  const fetchCurriculums = useCallback(
  async (orgId?: number): Promise<void> => {

    setLoading(true);

    try {

      const response =
        await timetableService.fetchCurriculums(orgId);

      if (response.success) {

        setCurriculums(
          response.data ?? []
        );

      } else {

        setCurriculums([]);

      }

    } catch (error) {

      console.error(
        "Error fetching curriculums:",
        error
      );

      setCurriculums([]);

    } finally {

      setLoading(false);

    }

  },
  [timetableService]
);

  // ============================================================
  // Fetch Terms
  // ============================================================

  const fetchTerms = useCallback(
  async (crclmId: number): Promise<void> => {

    setLoading(true);

    try {

      const response =
        await timetableService.fetchTerms(crclmId);

      setTerms(
        response.success
          ? response.data ?? []
          : []
      );

    } catch (error) {

      console.error(
        "Error fetching terms:",
        error
      );

      setTerms([]);

    } finally {

      setLoading(false);

    }
  },
  [timetableService]
);

  // ============================================================
  // Fetch Sections
  // ============================================================

  const fetchSections = useCallback(
  async (
    crclmId: number,
    term: number
  ): Promise<void> => {

    setLoading(true);

    try {

      const response =
        await timetableService.getSectionDetails(
          crclmId,
          term
        );

      setSections(
        response.success
          ? response.data ?? []
          : []
      );

    } catch (error) {

      console.error(
        "Error fetching sections:",
        error
      );

      setSections([]);

    } finally {

      setLoading(false);

    }
  },
  [timetableService]
);

  // ============================================================
  // Fetch Courses
  // ============================================================

  const fetchCourses = useCallback(
  async (
    termId: number,
    crsModes: number[]
  ): Promise<void> => {

    setLoading(true);

    try {

      const response =
        await timetableService.selectCourse({
          term_id: termId,
          crs_mode: crsModes,
        });

      setCourses(
        response.success
          ? response.data ?? []
          : []
      );

    } catch (error) {

      console.error(
        "Error fetching courses:",
        error
      );

      setCourses([]);

    } finally {

      setLoading(false);

    }
  },
  [timetableService]
);

  // ============================================================
  // Fetch Batches
  // ============================================================

  const fetchBatches = useCallback(
  async (
    crclmId: number,
    crsIds: number[],
    secId: number
  ): Promise<void> => {

    setLoading(true);

    try {

      const response =
        await timetableService.selectBatch({
          crclm_id: crclmId,
          crs_id: crsIds,
          sec_id: secId,
        });

      setBatches(
        response.success
          ? response.data ?? []
          : []
      );

    } catch (error) {

      console.error(
        "Error fetching batches:",
        error
      );

      setBatches([]);

    } finally {

      setLoading(false);

    }
  },
  [timetableService]
);

  // ============================================================
  // Generate Timetable
  // ============================================================

  const generateTimetable =
    useCallback(
      async (): Promise<
        ApiResponse<TimetableResponse>
      > => {

        const {
          curriculum,
          term,
          section,
          timetable: ttId,
          startDate,
          endDate,
          startTime,
          endTime,
          lmsRegBypFlag,
        } = formState;

        if (
          !curriculum ||
          !term ||
          !section ||
          !startDate ||
          !endDate ||
          !startTime ||
          !endTime
        ) {

          throw new Error(
            "Please fill all required fields"
          );
        }

        setLoading(true);

        try {

          const request:
            GenerateTimetableRequest = {

            academic_batch_id: curriculum,

            semester_id: term,

            section_id: section,

            crclm_title: "",

            start_date: startDate,

            end_date: endDate,

            start_time: startTime,

            end_time: endTime,

            tt_detail_id:
              ttId || undefined,

            lms_reg_byp_flag:
              lmsRegBypFlag,
          };

          const response: any =
            await timetableService.generateTimetable(
              request
            );

          if (
            response?.success &&
            response?.data
          ) {

            setTimetable(
              response.data
            );

            setFormState(prev => ({
              ...prev,

              timetable:
                response.data.tt_detail_id ||
                0,

              startDate:
                response.data.tt_start_date ||
                prev.startDate,

              endDate:
                response.data.tt_end_date ||
                prev.endDate,

              startTime:
                response.data.tt_start_time ||
                prev.startTime,

              endTime:
                response.data.tt_end_time ||
                prev.endTime,

              lmsRegBypFlag:
                response.data.lms_reg_byp_flag ??
                prev.lmsRegBypFlag,
            }));
          }

          return response;

        } catch (error) {

          console.error(
            "Error generating timetable:",
            error
          );

          throw error;

        } finally {

          setLoading(false);
        }

      },
      [
        formState,
        timetableService,
      ]
    );

  // ============================================================
  // Load Timetable
  // ============================================================

  const loadTimetable =
    useCallback(
      async (
        filter: TimetableFilterRequest
      ): Promise<
        ApiResponse<TimetableResponse>
      > => {

        setLoading(true);

        try {

          const response: any = filter.tt_detail_id
            ? await timetableService.getTimetableDetails(filter.tt_detail_id)
            : await timetableService.getScheduledClass(filter);

          if (
            response?.success &&
            response?.data?.tt_detail_id
          ) {

            setTimetable(
              response.data
            );

            setFormState(prev => ({
              ...prev,

              timetable:
                response.data.tt_detail_id ||
                0,

              startDate:
                response.data.tt_start_date ||
                "",

              endDate:
                response.data.tt_end_date ||
                "",

              startTime:
                response.data.tt_start_time ||
                "",

              endTime:
                response.data.tt_end_time ||
                "",

              lmsRegBypFlag:
                response.data.lms_reg_byp_flag ??
                0,
            }));

          } else {

            setTimetable(null);

            setFormState(prev => ({
              ...prev,

              timetable: 0,

              startDate: "",

              endDate: "",

              startTime: "",

              endTime: "",
            }));
          }

          return response;

        } catch (error) {

          console.error(
            "Error loading timetable:",
            error
          );

          throw error;

        } finally {

          setLoading(false);
        }

      },
      [timetableService]
    );

  // ============================================================
  // Save Classes
  // ============================================================

  const saveClasses =
    useCallback(
      async (
        data: ScheduleClassFormState
      ): Promise<ApiResponse> => {

        setLoading(true);

        try {

          const days =
            Object.keys(data.days)
              .filter(
                key =>
                  data.days[key].enabled
              );

          const request = {
            tt_detail_id:
              data.tt_detail_id,

            day_val_array:
              days,

            class_start_time_array:
              days.map(
                day =>
                  data.days[day]
                    .start_time
              ),

            class_end_time_array:
              days.map(
                day =>
                  data.days[day]
                    .end_time
              ),

            crs_id:
              data.crs_id,

            crs_mode:
              data.crs_mode,

            batch:
              data.batch,

            crs_title: "",
          };

          const response: any =
            await timetableService.saveClasses(
              request
            );

          if (
            response?.success &&
            timetable?.tt_detail_id
          ) {

            await loadTimetable({
              tt_detail_id:
                timetable.tt_detail_id,
            });
          }

          return response;

        } catch (error) {

          console.error(
            "Error saving classes:",
            error
          );

          throw error;

        } finally {

          setLoading(false);
        }

      },
      [
        timetable,
        loadTimetable,
        timetableService,
      ]
    );

  // ============================================================
  // Delete Class
  // ============================================================

  const deleteClass =
    useCallback(
      async (
        timeTableId: number
      ): Promise<ApiResponse> => {

        setLoading(true);

        try {

          const response: any =
            await timetableService.deleteClass(
              timeTableId
            );

          if (
            response?.success &&
            timetable?.tt_detail_id
          ) {

            await loadTimetable({
              tt_detail_id:
                timetable.tt_detail_id,
            });
          }

          return response;

        } catch (error) {

          console.error(
            "Error deleting class:",
            error
          );

          throw error;

        } finally {

          setLoading(false);
        }

      },
      [
        timetable,
        loadTimetable,
        timetableService,
      ]
    );

  // ============================================================
  // Update Class
  // ============================================================

  const updateClass =
    useCallback(
      async (
        data: EditFormData
      ): Promise<ApiResponse> => {

        setLoading(true);

        try {

          const request:
            UpdateClassRequest = {

            time_table_id:
              data.time_table_id,

            tt_detail_id:
              data.tt_detail_id,

            crs_id:
              data.crs_id,

            old_crs_id:
              data.old_crs_id,

            class_start_time:
              data.class_start_time,

            class_end_time:
              data.class_end_time,
          };

          const response: any =
            await timetableService.updateClass(
              request
            );

          if (
            response?.success &&
            timetable?.tt_detail_id
          ) {

            await loadTimetable({
              tt_detail_id:
                timetable.tt_detail_id,
            });
          }

          return response;

        } catch (error) {

          console.error(
            "Error updating class:",
            error
          );

          throw error;

        } finally {

          setLoading(false);
        }

      },
      [
        timetable,
        loadTimetable,
        timetableService,
      ]
    );

  // ============================================================
  // Delete Timetable
  // ============================================================

  const deleteTimetable =
    useCallback(
      async (
        del_tt_detail_id: number,
        login_pwd: string
      ): Promise<ApiResponse> => {

        setLoading(true);

        try {

          const response: any =
            await timetableService.deleteTimetable({
              del_tt_detail_id,
              login_pwd,
            });

          if (response?.success) {

            setTimetable(null);

            setFormState(prev => ({
              ...prev,

              timetable: 0,

              startDate: "",

              endDate: "",

              startTime: "",

              endTime: "",
            }));
          }

          return response;

        } catch (error) {

          console.error(
            "Error deleting timetable:",
            error
          );

          throw error;

        } finally {

          setLoading(false);
        }

      },
      [timetableService]
    );

  const resetTimetableDate =
    useCallback(
      async (
        ttDetailId: number,
        endDate: string
      ): Promise<ApiResponse> => {

        setLoading(true);

        try {

          const response = await timetableService.resetTimetableDate(
            ttDetailId,
            endDate
          );

          if (response.success) {
            await loadTimetable({ tt_detail_id: ttDetailId });
          }

          return response;

        } finally {

          setLoading(false);
        }
      },
      [loadTimetable, timetableService]
    );

  // ============================================================
  // Check Overlap
  // ============================================================

  const checkOverlap =
    useCallback(
      async (
        data: any
      ): Promise<ApiResponse> => {

        return await timetableService.checkOverlap(
          data
        );

      },
      [timetableService]
    );

  // ============================================================
  // Download Template
  // ============================================================

  const downloadTemplate =
    useCallback(
      async (
        ttDetailId: number
      ): Promise<void> => {

        setLoading(true);

        try {

          await timetableService.downloadTemplate(
            ttDetailId
          );

        } catch (error) {

          console.error(
            "Error downloading template:",
            error
          );

          throw error;

        } finally {

          setLoading(false);
        }

      },
      [timetableService]
    );

  // ============================================================
  // Export Timetable
  // ============================================================

  const exportTimetable =
    useCallback(
      async (
        ttDetailId: number
      ): Promise<void> => {

        setLoading(true);

        try {

          await timetableService.exportTimetable(
            ttDetailId
          );

        } catch (error) {

          console.error(
            "Error exporting timetable:",
            error
          );

          throw error;

        } finally {

          setLoading(false);
        }

      },
      [timetableService]
    );

  const exportTimetablePdf =
    useCallback(
      async (
        data: { expo_tt_detail_id: number }
      ): Promise<void> => {

        setLoading(true);

        try {

          await timetableService.exportTimetablePdf(data);

        } finally {

          setLoading(false);
        }
      },
      [timetableService]
    );

  // ============================================================
  // View Timetable
  // ============================================================

  const viewTimetable =
    useCallback(
      async (
        ttDetailId: number
      ): Promise<
        ApiResponse<{ table_vw: string }>
      > => {

        setLoading(true);

        try {

          return await timetableService.viewTimetable(
            ttDetailId
          );

        } catch (error) {

          console.error(
            "Error viewing timetable:",
            error
          );

          throw error;

        } finally {

          setLoading(false);
        }

      },
      [timetableService]
    );

  // ============================================================
  // Compensate Class
  // ============================================================

  const compensateClass =
    useCallback(
      async (
        data: any
      ): Promise<ApiResponse> => {

        setLoading(true);

        try {

          const response: any =
            await timetableService.compensateClass(
              data
            );

          if (
            response?.success &&
            timetable?.tt_detail_id
          ) {

            await loadTimetable({
              tt_detail_id:
                timetable.tt_detail_id,
            });
          }

          return response;

        } catch (error) {

          console.error(
            "Error compensating class:",
            error
          );

          throw error;

        } finally {

          setLoading(false);
        }

      },
      [
        timetable,
        loadTimetable,
        timetableService,
      ]
    );

  // ============================================================
  // Reset
  // ============================================================

  const resetForm =
    useCallback((): void => {

      setFormState({
        curriculum: 0,
        term: 0,
        section: 0,
        timetable: 0,
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        lmsRegBypFlag: 0,
      });

      setTimetable(null);

      setCurriculums([]);

      setTerms([]);

      setSections([]);

      setCourses([]);

      setBatches([]);

    }, []);

  const clearTimetable =
    useCallback((): void => {
      setTimetable(null);
    }, []);

  // ============================================================
  // Return
  // ============================================================

  return {

    loading,

    timetable,

    curriculums,

    terms,

    sections,

    courses,

    batches,

    formState,

    setFormState,

    fetchCurriculums,

    fetchTerms,

    fetchSections,

    fetchCourses,

    fetchBatches,

    generateTimetable,

    loadTimetable,

    saveClasses,

    deleteClass,

    updateClass,

    deleteTimetable,

    resetTimetableDate,

    checkOverlap,

    downloadTemplate,

    exportTimetable,

    exportTimetablePdf,

    viewTimetable,

    compensateClass,

    resetForm,

    clearTimetable,
  };
}
