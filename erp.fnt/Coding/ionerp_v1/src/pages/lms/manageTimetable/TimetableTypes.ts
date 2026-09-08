// ============================================================================
// Manage Timetable - Types
// ============================================================================

// ============================================================================
// Curriculum
// ============================================================================

export interface CurriculumResponse {
  academic_batch_id: number;
  academic_batch_code: string;
  academic_batch_desc: string;
  academic_year?: string | null;
  regulation_year?: string | null;
  start_year?: number;
  end_year?: number;
  dept_id?: number;
  pgm_id?: number;
  status?: number;
}

// ============================================================================
// Request Types
// ============================================================================

export interface TimetableFilterRequest {
  academic_batch_id?: number;
  semester_id?: number;
  section_id?: number;
  crclm_id?: number;
  term_id?: number;
  sec_id?: number;
  tt_detail_id?: number;
}

export interface GenerateTimetableRequest {
  academic_batch_id: number;
  semester_id: number;
  section_id: number;
  crclm_title: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  tt_detail_id?: number;
  lms_reg_byp_flag?: number;
}

export interface ScheduleClassRequest {
  tt_detail_id: number;
  day_val_array: string[];
  class_start_time_array: string[];
  class_end_time_array: string[];
  crs_id: number[];
  crs_mode: number[];
  batch?: string[];
  crs_title: string;
}

export interface UpdateClassRequest {
  time_table_id: number;
  tt_detail_id: number;
  crs_id: number;
  old_crs_id: number;
  class_start_time: string;
  class_end_time: string;
}

export interface DeleteTimetableRequest {
  del_tt_detail_id: number;
  login_pwd: string;
}

export interface CompensateClassRequest {
  comp_tt_detail_id: number;
  from_val: number;
  to_val: number;
  term: number;
  section: number;
  confirm: number;
}

export interface SelectCourseRequest {
  term_id: number;
  crs_mode: number[];
}

export interface SelectBatchRequest {
  crclm_id: number;
  crs_id: number[];
  sec_id: number;
}

export interface EditClassCourseRequest {
  crs_id: number;
  term_id: number;
  crs_mode: number;
}

export interface CheckOverlapRequest {
  class_start_time: string;
  class_end_time: string;
  tt_detail_id: number;
  crs_id: number[];
  day: string;
  start_date: string;
  end_date: string;
  sec_id: number;
  batch_id?: string[];
}

// ============================================================================
// Response Types
// ============================================================================

export interface TermResponse {
  crclm_term_id: number;
  term_name: string;
}

export interface SectionResponse {
  section_id: number;
  section_name: string;
}

export interface CourseOptionResponse {
  crs_id: number;
  crs_code: string;
  crs_title: string;
  crs_mode?: number;
  selected?: boolean;
}

export interface BatchOptionResponse {
  batch_id: number;
  batch_name: string;
  crs_id: number;
  crs_code: string;
  parent_id: number;
}

export interface TTOptionResponse {
  tt_detail_id: number | null;
  label: string;
  selected: boolean;
}

export interface DayResponse {
  day_id: number;
  week_day_name: string;
}

export interface TTDetailsResponse {
  tt_detail_id: number;
  tt_start_date: string;
  tt_end_date: string;
  tt_start_time: string;
  tt_end_time: string;
  lms_reg_byp_flag: number;
  crclm_name?: string;
  term_name?: string;
  mt_details_name?: string;
}

export interface ClassDetailResponse {
  time_table_id: number;
  tt_detail_id: number;
  day_id: number;
  week_day_name: string;
  crs_id: number;
  crs_code: string;
  class_start_time: string;
  class_end_time: string;
  extra_class_flag: number;
  batch_names?: string[];
  course_instructor?: string;
  crs_owner?: string;
  attendance_taken?: number;
}

export interface TimetableResponse {
  status: number;

  tt_detail_id?: number;
  tt_start_date?: string;
  tt_end_date?: string;
  tt_start_time?: string;
  tt_end_time?: string;
  tt_time_slot_gap?: number;
  lms_reg_byp_flag?: number;

  tt_options: TTOptionResponse[];
  week_days: string[];
  days: DayResponse[];
  time_slots: string[];

  tt_details?: TTDetailsResponse;

  classes: ClassDetailResponse[];

  crs_ids: Array<{
    crs_id: number;
  }>;
}

export interface OverlapResponse {
  class_overlap_day: string;
  class_overlap_time: string;
  course: string;
  faculty_name: string;
  another_class: string;
}

// ============================================================================
// UI State
// ============================================================================

export interface TimetableFormState {
  curriculum: number;
  term: number;
  section: number;
  timetable: number;

  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;

  lmsRegBypFlag: number;
}

export interface ScheduleDayState {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

export interface ScheduleClassFormState {
  tt_detail_id: number;

  crs_mode: number[];
  crs_id: number[];
  batch: string[];

  days: Record<string, ScheduleDayState>;
}

export interface EditClassFormState {
  time_table_id: number;
  tt_detail_id: number;
  crs_id: number;
  old_crs_id: number;
  class_start_time: string;
  class_end_time: string;
  day: string;
}

export interface ScheduleFormData {
  tt_detail_id: number;
  days: Record<string, ScheduleDayState>;
  crs_mode: number[];
  crs_id: number[];
  batch: string[];
}

// ============================================================================
// Generic API Response
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
