/**
 * API Endpoint Configuration for IonCUDOS Module
 * Central location for all CUDOS-related API endpoints
 */

export const ApiEndpoint = {

   login: "auth/staff_login",
  change_password: "auth/change-password",
  FORGOT_PASSWORD: "auth/forgot-password",

  dashboard_info: "dashboard_info_route/dashboard_info",
  dashboard_info_all_data: "dashboard_info_route/dashboard_info_all_data",

  fetch_result_year_options: "comman_function/fetch_result_year_options",
  // Common master delete endpoint (shared across modules)
  master_soft_delete: "comman_function/soft_delete",

  // Bloom's Domain specific endpoints
  bloomDomain: {
    save_bloom_domain: "bloom_domain/save_bloom_domain", // Create/Update Bloom's Domain
    bloom_domain_list: "bloom_domain/bloom_domain_list", // Fetch all Bloom's Domains
  },

  // Bloom's Level specific endpoints (for future implementation)
  bloomLevel: {
    save_bloom_level: "bloom_level/save_bloom_level",
    bloom_level_list: "comman_function/bloom_level_list",
  },

  // Program Outcome specific endpoints
  program: {
    outcome_list: "comman_function/program_outcome_list",
  },

  common_api: {
    deportment_list: "comman_function/get_dept_programtype",
    batch_cycle_list: "comman_function/batch_cycle_list",
    get_semester_list: "comman_function/get_semester_list",
    occubationoption: "course_type/get_temp_cia_occasion",
    get_batch_terms: "class_time_table/get_batch_terms",
    gettimetablesession: "class_time_table/fetch_student_section_list",
    get_section_list: "comman_function/fetch_student_section_list",
    get_cycle_semester_list: "comman_function/get_cycle_semester_list",
    fetch_student_section_list: "comman_function/fetch_student_section_list",
    fetch_student_course: "course_reg/fetch_student_course_usn",
    get_student_course_usn: "std_exam_reg/fetch_student_course",
    get_university_list: "",
    is_result_yearbacklog: "comman_function/is_result_yearbacklog",
    is_backlog_with_cia_see: "comman_function/is_backlog_with_cia_see",
    is_cycle: "comman_function/is_cycle",
    grade_cardno_sem: "comman_function/get_gc_sem",
    fetch_backlog_course: "comman_function/fetch_backlog_course",
    school_department_list: "/comman_function/school_department_list",
    fetch_gc_sem: "comman_function/get_gc_sem",
    upload_gc_csv: "grade_card_no/upload_gc_csv",
    fetch_gc: "grade_card_no/fetch_gc",
  }, allMaster: {
    get_all_masters_list: "all_master/all_masters_list",
    get_all_org_info: "",
    parents_occupation_master_list: "all_master/parents_occupation_master_list",
    save_parents_occupation_master: "all_master/save_parents_occupation_master",
    event_type_master_list: "all_master/event_type_master_list",
    save_event_type_master: "all_master/save_event_type_master",
    course_type_list: "all_master/course_type_list",
    save_course_type: "all_master/save_course_type",
    occasion_type_list: "all_master/occasion_type_list",
    save_occasion_type: "all_master/save_occasion_type",
    exam_session_list: "all_master/exam_session_list",
    save_exam_session: "all_master/save_exam_session",
    caste_list: "all_master/caste_list",
    save_caste: "all_master/save_caste",
    city_list: "comman_function/city_list",
    exam_hall_list: "all_master/exam_hall_list",
    save_hall: "all_master/save_hall",
    state_list: "comman_function/state_list",
    country_list: "comman_function/country_list",
    common_city_list: "comman_function/city_list",
    save_city: "all_master/save_city",
    course_occasion_type_list: "all_master/course_occasion_type_list",
  },
  academicBatch: {
    grade_type_details: "academic_batch/grade_type_details",
    getTabledata: "comman_function/academic_batch_list",
    saveAcadamicBatch: "academic_batch/save_academic_batch",
  },
  department: {
    save_department: "department/save_department",
    department_list: "comman_function/department_list",
  },

  configType: {
    list: "api/v1/config-type/list",
    save: "api/v1/config-type/save",
    delete: "api/v1/config-type/delete",
  },
  crossDeptMentor: {
    departments: "api/v1/cross-dept-mentor/departments",
    users: "api/v1/cross-dept-mentor/users",
    curriculums: "api/v1/cross-dept-mentor/curriculums",
    mentorsFromOtherDept: "api/v1/cross-dept-mentor/mentors-from-other-dept",
    mentorsToOtherDept: "api/v1/cross-dept-mentor/mentors-to-other-dept",
    save: "api/v1/cross-dept-mentor/save",
    update: "api/v1/cross-dept-mentor/update",
    delete: "api/v1/cross-dept-mentor/delete",
  },
  
  questionnaire: {
    questionnaire_list: "lms_mmp_questionnaire/get_questionnaire_list",
    questionnaire_full: "lms_mmp_questionnaire/get_questionnaire_full",
    save_questionnaire: "lms_mmp_questionnaire/save_questionnaire",
    delete_questionnaire: "lms_mmp_questionnaire/delete_questionnaire",
    delete_question: "lms_mmp_questionnaire/delete_question",
    delete_option: "lms_mmp_questionnaire/delete_option",
    field_setting_list:
      "lms_questionnaire_field_setting/get_questionnaire_field_setting",
  },

  question_type: {
    get_question_type_list: "lms_question_type/get_question_type_list",
    get_questionnaire_type_list: "lms_questionnaire_type/get_questionnaire_type_list",
  },

  mentorMentee: {
    group_list: "lms_mentor_group/get_mentors_group_list",
    academic_batch_list: "lms_mentors_group/get_academic_batch_list",
    semesters_by_academic_batch:
      "lms_mentors_group/get_semesters_by_academic_batch",
    groups_by_academic_batch:
      "lms_mentors_group/get_groups_by_academic_batch",
    save_group: "lms_mentors_group/save_mentors_group",
    group_complete: "lms_mentors_group/get_group_complete",
    dropdowns: "lms_mmp/common_dropdowns",
    terms: "lms_mentor_group_term/get_mentors_group_terms",
    save_mentors: "lms_mentors_group/map_mentors",
    mentors: "lms_mentors_group/get_group_mentors",
    save_mentees: "lms_mentors_group/map_mentees",
    mentees: "lms_mentors_group/get_group_mentees",
    delete_mentee: "lms_mentors_group/delete_mentee",
  },
  mentorList: {
    departments: "api/v1/mentoring/mentor-list/departments",
    programs: "api/v1/mentoring/mentor-list/programs",
    curriculums: "api/v1/mentoring/mentor-list/curriculums",
    semesters: "api/v1/mentoring/mentor-list/semesters",
    students: "api/v1/mentoring/mentor-list/students",
    mentorsMentees: "api/v1/mentoring/mentor-list/mentors-mentees",
    exportPdf: "api/v1/mentoring/mentor-list/export-pdf",
  },
  mentoringSession: {
    curriculumList: "mentoring-session/get_academic_batch_list",
    semestersByCurriculum: "mentoring-session/get_semesters_by_academic_batch",
    groupsByCurriculum: "mentoring-session/get_groups_by_academic_batch",
    groupMentees: "mentoring-session/get_group_mentees",
    saveMentoringSession: "mentoring-session/save_mentoring_session",
    getMentoringSessions: "mentoring-session/get_mentoring_sessions",
    getSessionMentees: "mentoring-session/get_session_mentees",
    updateMentoringSession: "mentoring-session/update_mentoring_session",
    deleteMentoringSession: "mentoring-session/delete_mentoring_session",
    updateSessionStatus: "mentoring-session/update_session_status",
  },
  mentoring: {
    questionnaire: "api/v1/mentoring/questionnaires",
    sessions: "api/v1/mentoring/sessions",
    upload: "api/v1/mentoring/upload",
  },
  studentCourseRegistration: {
    checkRegistrationStatus:
      "student-course-registration/check_registration_status",
    registrationAcademicBatchList:
      "student-course-registration/get_registration_academic_batch_list",
    registrationSemesterList:
      "student-course-registration/get_registration_semester_list",
    validateRegistrationDueDate:
      "student-course-registration/validate_registration_due_date",
    availableCourses:
      "student-course-registration/available-courses",
    registrationSectionList:
      "student-course-registration/get_registration_section_list",
    registeredCourses:
      "student-course-registration/registered-courses",
  },
  material: {
    createMaterial: "/api/v1/material/create_material",
    materialList: "/api/v1/material/material_list",
    studentList: "/api/v1/material/student_list",
    shareMaterial: "/api/v1/material/share_material",
    downloadMaterial: "/api/v1/material/download_material",
    updateMaterial: "/api/v1/material/update_material",
    materialMappingList: "/api/v1/material/material_mapping_list",
  },

  timetable: {
    scheduledClasses: "/api/v1/timetable/scheduled-classes",
    scheduledClass: (id: number) => `/api/v1/timetable/scheduled-classes/${id}`,
    deleteTimetable: (id: number) => `/api/v1/timetable/${id}`,
    resetDates: (id: number) => `/api/v1/timetable/${id}/reset-dates`,
    copyDay: "/api/v1/timetable/copy-day",
    syncRange: (id: number) => `/api/v1/timetable/${id}/sync-range`,
    exportPdf: "/api/v1/comman_function/timetable/export-pdf",
    getTimetables: "/api/v1/timetable/timetables",
  },
  

  topic: {
    curriculumList: "api/v1/topic_management/curriculum_list",
    semesterList: "api/v1/topic_management/semester_list",
    courseList: "api/v1/topic_management/course_list",
    sectionList: "api/v1/topic_management/section_list",
    topicList: "api/v1/topic_management/topic_list",
    topicsToImport: "api/v1/topic_management/topics-to-import",
    importTopics: "api/v1/topic_management/import-topics",
    importTopic: "api/v1/topic_management/import_topic",
    importAllTopics: "api/v1/topic_management/import_all_topics",
    bulkImportTopics: "api/v1/topic_management/bulk_import_topics",
    updateTopic: "api/v1/topic_management/update_topic",
    deleteTopic: "api/v1/topic_management/delete_topic",
    instructorList: "api/v1/topic_management/instructor_list",
    updateInstructor: "api/v1/topic_management/update_instructor",
    cudosTopics: "api/v1/topic_management/cudos_topics",
    importCudosTopics: "api/v1/topic_management/import_cudos_topics",
    topicSchedules: "api/v1/topic_management/topic_schedules",
    updateSchedule: "api/v1/topic_management/update_schedule",
    addSchedule: "api/v1/topic_management/add_schedule",
    addExtraClass: "api/v1/topic_management/add_extra_class",
    updateMapping: "api/v1/topic_management/update_mapping",
    addNewTopic: "api/v1/topic_management/add_new_topic"
  },

  quiz: {
    // Meta dropdowns (GET)
    curriculumList: "/api/v1/manage-quiz/meta/curriculums",
    semesterList: "/api/v1/manage-quiz/meta/terms",
    courseList: "/api/v1/manage-quiz/meta/courses",
    sectionList: "/api/v1/manage-quiz/meta/sections",
    topics: "/api/v1/manage-quiz/meta/topics",

    // CRUD (faculty)
    list: "/api/v1/manage-quiz/list",
    create: "/api/v1/manage-quiz/create",
    delete: (id: number) => `/api/v1/manage-quiz/${id}`,
    details: (id: number) => `/api/v1/manage-quiz/${id}`,

    // Detail pages (faculty)
    students: (id: number) => `/api/v1/manage-quiz/${id}/students`,
    share: (id: number) => `/api/v1/manage-quiz/${id}/share`,
    start: (id: number) => `/api/v1/manage-quiz/${id}/start`,
    submitAnswers: (id: number) => `/api/v1/manage-quiz/${id}/submit-answer`,
    downloadFile: (id: number) => `/api/v1/manage-quiz/${id}/download-file`,
    assignStudents: "/api/v1/manage_quiz/assign_students",
    deleteQuiz: "/api/v1/manage_quiz/delete_quiz/:id",
    getQuizQuestions: "/api/v1/manage_quiz/questions",
    getAssignedStudents: (quizId: number) => `/api/v1/manage_quiz/${quizId}/assigned-students`
  },

  studentAssignmentReport: {
    assignmentList: "api/v1/student_assignment/assignment_list",
    report: "api/v1/student_assignment/report",
    export: "api/v1/student_assignment/export",
  },

  // ── Consolidated Absentees Report ──────────────────────────────────────────
  consolidatedAbsenteesReport: {
    departments: "api/v1/conso_absentees_report/departments",
    programs: (id: number) => `api/v1/conso_absentees_report/programs/${id}`,
    curriculum: (id: number) => `api/v1/conso_absentees_report/curriculum/${id}`,
    terms: (id: number) => `api/v1/conso_absentees_report/terms/${id}`,
    sections: (id: number) => `api/v1/conso_absentees_report/sections/${id}`,
    dateInfo: "api/v1/conso_absentees_report/date-info",
    report: "api/v1/conso_absentees_report/report",
    drilldown: "api/v1/conso_absentees_report/drilldown",
    exportPdf: "api/v1/conso_absentees_report/export/pdf",
    exportXls: "api/v1/conso_absentees_report/export/xls",
  },

  topicCoverage: {
    curriculum:   "api/v1/topic_coverage/curriculum",
    terms:        (curriculumId: number) => `api/v1/topic_coverage/terms/${curriculumId}`,
    courses:      "api/v1/topic_coverage/courses",
    courseTopics: "api/v1/topic_coverage/course-topics",
    exportPdf:    "api/v1/topic_coverage/export-pdf",
  },

  myClass: {
    dropdowns: "api/v1/my-class/dropdowns",
    classList: "api/v1/my-class/class-list",
  },

  consolidatedStudentMarksReport: {
    departments: "api/v1/conso_student_marks_report/departments",
    curriculums: "api/v1/conso_student_marks_report/curriculums",
    terms: "api/v1/conso_student_marks_report/terms",
    sections: "api/v1/conso_student_marks_report/sections",
    courses: "api/v1/conso_student_marks_report/courses",
    report: "api/v1/conso_student_marks_report/report",
    graph: "api/v1/conso_student_marks_report/graph",
    export: "api/v1/conso_student_marks_report/export",
  },

  studentAttendanceReport: {
    curriculums: "api/v1/student_attendance_report/curriculums",
    terms: (curriculumId: string) => `api/v1/student_attendance_report/terms/${curriculumId}`,
    courses: "api/v1/student_attendance_report/courses",
    sections: (curriculumId: string, termId: string) =>`api/v1/student_attendance_report/sections/${curriculumId}/${termId}`,
    lessonDates: "api/v1/student_attendance_report/lesson-dates",
    summary: "api/v1/student_attendance_report/summary",
  },

  studentQuiz: {
    myQuizzes: "/api/v1/student-quiz/my-quizzes",
    start: (quiz_id: number) =>`/api/v1/student-quiz/${quiz_id}/start`,
    submit: (quiz_id: number) =>`/api/v1/student-quiz/${quiz_id}/submit`,
    downloadFile: (quiz_id: number) =>`/api/v1/student-quiz/${quiz_id}/download`,
  },
} as const;

// Alias for backward compatibility
export const LmsApiEndpoint = ApiEndpoint;
