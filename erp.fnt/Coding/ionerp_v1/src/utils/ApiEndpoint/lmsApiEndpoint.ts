/**
 * API Endpoint Configuration for IonLMS & IonCUDOS Modules
 * Central location for LMS and CUDOS API endpoints
 */

export const ApiEndpoint = {
  // Common master delete endpoint (shared across modules)
  master_soft_delete: "comman_function/soft_delete",

  // Bloom's Domain specific endpoints
  bloomDomain: {
    save_bloom_domain: "bloom_domain/save_bloom_domain",
    bloom_domain_list: "bloom_domain/bloom_domain_list",
  },

  // Bloom's Level specific endpoints
  bloomLevel: {
    save_bloom_level: "bloom_level/save_bloom_level",
    bloom_level_list: "comman_function/bloom_level_list",
  },

  // Program Outcome specific endpoints
  program: {
    outcome_list: "comman_function/program_outcome_list",
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
} as const;

export const LmsApiEndpoint = {
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
} as const;
