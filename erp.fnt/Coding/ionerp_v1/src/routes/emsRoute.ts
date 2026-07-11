import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/ems/home";
import Bos from "../pages/ioncudos/configuration/bos/Bos";
import AddExistingUser from "../pages/ioncudos/configuration/bos/AddExistingUser";
import AddNewMember from "../pages/ioncudos/configuration/bos/AddNewMember";
import MapMentorMenteeListPage from "../pages/lms/mmp/mapMentorMentee/MapMentorMenteeListPage";
import MapMentorsPage from "../pages/lms/mmp/mapMentorMentee/MapMentorsPage";

import MapMenteesPage from "../pages/lms/mmp/mapMentorMentee/MapMenteesPage";
import MentoringSessionPage from "../pages/lms/mmp/mentoringSession/MentoringSessionPage";
import MmpConfigurationPage from "../pages/lms/mmp/configuration/MmpConfigurationPage";
import DeptConfigurationPage from "../pages/lms/mmp/deptConfiguration/DeptConfigurationPage";
import MmpReportPage from "../pages/lms/mmp/reports/MmpReportPage";
import MentorListPage from "../pages/lms/mmp/reports/MentorListPage";
import IssueObservationReportPage from "../pages/lms/mmp/reports/IssueObservationReportPage";
// import Masters from "../pages/ems/configuration/masters/mastersPage";
// import UserRolePage from "../pages/ems/configuration/userRole/userRolePage";
// import UserMasterPage from "../pages/ems/configuration/userMaster/userMasterPage";
// import UserAccessPage from "../pages/ems/configuration/userAccess/userAccessPage";
import DepartmentPage from "../pages/ems/configuration/departmentDetail/departmentPage";
import BloomDomainPage from "../pages/ioncudos/configuration/bloomDomain/bloomDomainPage";
// import ProgramTypePage from "../pages/ems/configuration/programType/programTypePage";
// import ProgramPage from "../pages/ems/configuration/program/programPage";
// import AcademicCalendarPage from "../pages/ems/academics/academicCalendar/academicCalendarPage";
// import AcademicBatchPage from "../pages/ems/academics/academicBatch/academicBatchPage";
// import SemesterPage from "../pages/ems/academics/semester/semesterPage";
// import AcademicCalenderForm from "../pages/ems/academics/academicCalendar/academicCalenderForm";
// src/routes/emsRoute.ts

import Home from "../pages/ems/home";
import { Outlet } from "react-router-dom";
import ChangePasswordPage from "../pages/changepassword";
import QuestionnairePage from "../pages/lms/mmp/questionnaire/QuestionnairePage";
import QuestionnaireCreatePage from "../pages/lms/mmp/questionnaire/QuestionnaireCreatePage";
import DepartmentPage from "../pages/ems/configuration/departmentDetail/departmentPage";
import RegistrationSetup from "../pages/lms/studentCourseRegitsrtion/studentCourseRegistration";
import type { RouteItem } from "./routeTypes";

// Import all Mentoring pages
import ConfigurationType from "../pages/lms/Mentoring/ConfigurationType/ConfigurationType";
import DeptConfiguration from "../pages/lms/Mentoring/DeptConfiguration/DeptConfiguration";
import Questionnaires from "../pages/lms/Mentoring/Questionnaires/Questionnaires";
import MentorMentee from "../pages/lms/Mentoring/mentorMentee";
import MentoringSession from "../pages/lms/Mentoring/MentoringSession/MentoringSession";
//import MyMentoringSessions from "../pages/lms/Mentoring/MyMentoringSessions/MyMentoringSessions";
import MMPReport from "../pages/lms/Mentoring/MMPReport/MMPReport";
import MentorList from "../pages/lms/Mentoring/MentorList/MentorList";
import IssueObservationReport from "../pages/lms/Mentoring/IssueObservationReport/IssueObservationReport";

export const EMSROUTE: RouteItem[] = [
  {
    name: "Home",
    href: "/",
    element: Home,
    roles: [],
    subItems: [],
  },
  {
    name: "Change Password",
    href: "/change_password",
    element: ChangePasswordPage,
    roles: [],
    subItems: [],
  },
  {
    name: "",
    href: "/bos/add-existing",
    element: AddExistingUser,
    roles: [],
    subItems: [],
  },
  {
    name: "",
    href: "/bos/add-new",
    element: AddNewMember,
    roles: [],
    subItems: [],
  },

  {
    name: "Configurations",
    href: "",
  {
    name: "Configuration",
    href: "/configuration",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "Department1",
        href: "department",
        roles: [],
        element: DepartmentPage,
      },
      {
        name: "Bloom's Domain",
        href: "bloom_domain",
        roles: [],
        element: BloomDomainPage,
      },
      {
        name: "BoS Members",
        href: "bos",
        roles: [],
        element: Bos
      },

      //   { name: "Program Type", href: "program_type", roles: [], element: ProgramTypePage },
      //   { name: "Program", href: "program", roles: [], element: ProgramPage },
      //   {
      //     name: "Staff Course Allocation",
      //     href: "courseallocation",
      //     roles: [],
      //     element: CourseAllocation,
      //   },
    ],
  },
  {
    name: "Mentor Mentee Program",
  href: "/mmp",
  element: Outlet,
  roles: [],
  subItems: [
    {
      name: "Configuration",
      href: "configuration",
      element: MmpConfigurationPage,
      roles: [],
      subItems: [],
    },
    {
      name: "Questionnaires",
      href: "questionnaire",
      element: Outlet,
      roles: [],
      subItems: [
        { name: "", href: "", roles: [], element: QuestionnairePage },
        { name: "", href: "create", roles: [], element: QuestionnaireCreatePage },
        { name: "", href: "edit/:id", roles: [], element: QuestionnaireCreatePage },
      ],
    },
    {
      name: "Dept. Configuration",
      href: "dept-configuration",
      element: DeptConfigurationPage,
      roles: [],
      subItems: [],
    },

    {
  name: "Map Mentor Mentee",
  href: "map-mentor-mentee",
  element: Outlet,
  roles: [],
  subItems: [
    {
      name: "",
      href: "",
      roles: [],
      element: MapMentorMenteeListPage,
    },

    {
      name: "",
      href: "map-mentors",
      roles: [],
      element: MapMentorsPage,
    },

    {
      name: "",
      href: "map-mentees",
      roles: [],
      element: MapMenteesPage,
    },
    {
      name: "",
      href: "map-mentees/:mentors_group_id/:academic_batch_id",
      roles: [],
      element: MapMenteesPage,
    },
  ],
},

    {
      name: "Mentoring Session",
      href: "mentoring-session",
      element: MentoringSessionPage,
      roles: [],
      subItems: [],
    },
    {
      name: "MMP Report",
      href: "mmp-report",
      element: MmpReportPage,
      roles: [],
      subItems: [],
    },
    {
      name: "Mentor List",
      href: "mentor-list",
      element: MentorListPage,
      roles: [],
      subItems: [],
    },
    {
      name: "Issue & Observation Report",
      href: "issue-observation-report",
      element: IssueObservationReportPage,
      roles: [],
      subItems: [],
    },
  ],
},
{
  name: "",
  href: "/lms_mmp/questionnaire",
  element: QuestionnairePage,
  roles: [],
  hidden: true,
  subItems: [],
},
{
  name: "",
  href: "/lms_mmp/questionnaire/create",
  element: QuestionnaireCreatePage,
  roles: [],
  hidden: true,
  subItems: [],
},
{
  name: "",
  href: "/lms_mmp/questionnaire/edit/:id",
  element: QuestionnaireCreatePage,
  roles: [],
  hidden: true,
  subItems: [],
},
{
  name: "",
  href: "/lms_mmp/map_mentor_mentee",
  element: MapMentorMenteeListPage,
  roles: [],
  hidden: true,
  subItems: [],
},
{
  name: "",
  href: "/lms_mmp/map_mentor_mentee/map-mentors",
  element: MapMentorsPage,
  roles: [],
  hidden: true,
  subItems: [],
},
{
  name: "",
  href: "/lms_mmp/map_mentor_mentee/map-mentees",
  element: MapMenteesPage,
  roles: [],
  hidden: true,
  subItems: [],
},
{
  name: "",
  href: "/lms_mmp/map_mentor_mentee/map-mentees/:mentors_group_id/:academic_batch_id",
  element: MapMenteesPage,
  roles: [],
  hidden: true,
  subItems: [],
},
{
  name: "",
  href: "/lms_mmp/schedule_mentor",
  element: MentoringSessionPage,
  roles: [],
  hidden: true,
  subItems: [],
},
{
  name: "",
  href: "/lms_mmp/mmp_report",
  element: MmpReportPage,
  roles: [],
  hidden: true,
  subItems: [],
},
{
  name: "",
  href: "/lms_mmp/mentor_list",
  element: MentorListPage,
  roles: [],
  hidden: true,
  subItems: [],
},
{
  name: "",
  href: "/lms_mmp/lms_issues_observations_report",
  element: IssueObservationReportPage,
  roles: [],
  hidden: true,
  subItems: [],
},
  // {
  //   name: "Academics",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "Academic Calendar",
  //       href: "academic_calendar",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         {
  //           name: "",
  //           href: "",
  //           roles: [],
  //           element: AcademicCalendarPage,
  //         },
  //         {
  //           name: "Create",
  //           href: "create",
  //           roles: [],
  //           element: AcademicCalenderForm,
  //         },
  //         {
  //           name: "Update",
  //           href: "update",
  //           roles: [],
  //           element: AcademicCalenderForm,
  //         },
  //       ],
  //     },
  //     {
  //       name: "Academic Batch",
  //       href: "academic_batch",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         {
  //           name: "",
  //           href: "",
  //           roles: [],
  //           element: AcademicBatchPage,
  //         },
  //         {
  //           name: "Create",
  //           href: "create",
  //           roles: [],
  //           element: AcademicBatchForm,
  //         },
  //         {
  //           name: "Update",
  //           href: "update",
  //           roles: [],
  //           element: AcademicBatchForm,
  //         },
  //       ],
  //     },
  //     {
  //       name: "Semester",
  //       href: "semester",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         {
  //           name: "",
  //           href: "",
  //           roles: [],
  //           element: SemesterPage,
  //         },
  //         {
  //           name: "Create",
  //           href: "create",
  //           roles: [],
  //           element: SemesterForm,
  //         },
  //         {
  //           name: "Update",
  //           href: "update",
  //           roles: [],
  //           element: SemesterForm,
  //         },
  //       ],
  //     },
  //     {
  //       name: "Course",
  //       href: "course",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         {
  //           name: "",
  //           href: "",
  //           roles: [],
  //           element: CoursePage,
  //         },
  //         {
  //           name: "Create",
  //           href: "create",
  //           roles: [],
  //           element: CourseForm,
  //         },
  //         {
  //           name: "Update",
  //           href: "update",
  //           roles: [],
  //           element: UpdateCourseForm,
  //         },
  //       ],
  //     },
  //     {
  //       name: "Bulk Course Import",
  //       href: "bulk_course_import",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         {
  //           name: "",
  //           href: "",
  //           roles: [],
  //           element: BulkImportCoursePage,
  //         },
  //         {
  //           name: "Create",
  //           href: "create",
  //           roles: [],
  //           element: BulkCourseForm,
  //         },
  //         {
  //           name: "Update",
  //           href: "update",
  //           roles: [],
  //           element: BulkUpdateCourseForm,
  //         },
  //       ],
  //     },
  //     {
  //       name: "Sub Occasion Course",
  //       href: "sub_occasion_course",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         {
  //           name: "",
  //           href: "",
  //           roles: [],
  //           element: CoursePage,
  //         },
  //         {
  //           name: "Create",
  //           href: "create",
  //           roles: [],
  //           element: CourseForm,
  //         },
  //         {
  //           name: "Update",
  //           href: "update",
  //           roles: [],
  //           element: UpdateCourseForm,
  //         },
  //       ],
  //     },
  //     {
  //       name: "Event Calendar",
  //       href: "event_calendar",
  //       roles: [],
  //       element: EventCalendarPage,
  //     },
  //     {
  //       name: "Class Time Table",
  //       href: "class_time_table",
  //       roles: [],
  //       element: ClassTimetable,
  //     },
  //   ],
  // },
  // {
  //   name: "Registration",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "Student Admission Lite",
  //       href: "student_admission_lite",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         {
  //           name: "",
  //           href: "",
  //           roles: [],
  //           element: StudentAdmissionLitePage,
  //         },
  //         {
  //           name: "Create",
  //           href: "create",
  //           roles: [],
  //           element: StudentForm,
  //         },
  //         {
  //           name: "Update",
  //           href: "update",
  //           roles: [],
  //           element: StudentForm,
  //         },
  //       ],
  //     },
  //     {
  //       name: "Student Admission",
  //       href: "student_admission",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         {
  //           name: "",
  //           href: "",
  //           roles: [],
  //           element: StudentAdmissionPage,
  //         },
  //         {
  //           name: "Create",
  //           href: "create",
  //           roles: [],
  //           element: StudentAdmissionForm,
  //         },
  //         {
  //           name: "Update",
  //           href: "update",
  //           roles: [],
  //           element: StudentAdmissionForm,
  //         },
  //         {
  //           name: "Student Bulk Import",
  //           href: "studentimport",
  //           roles: [],
  //           element: StudentBulkImportForm,
  //         },
  //       ],
  //     },
  //     {
  //       name: "Student Allocation",
  //       href: "student_allocation",
  //       roles: [],
  //       element: StudentAllocationPage,
  //     },
  //     {
  //       name: "Course Registration",
  //       href: "course_registration",
  //       roles: [],
  //       element: CourseRegisterPage,
  //     },
  //     {
  //       name: "Bulk Course Registration",
  //       href: "bulk_course_registration",
  //       roles: [],
  //       element: BulkCourseRegisterPage,
  //     },
  //     {
  //       name: "Student Exam Registration",
  //       href: "student_exam_registration",
  //       roles: [],
  //       element: StudentExamRegister,
  //     },
  //     {
  //       name: "Examiner Registration",
  //       href: "examiner_registration",
  //       roles: [],
  //       element: ExaminerRegistrationPage,
  //     },
  //     {
  //       name: "Revaluation Registration",
  //       href: "revaluation_registration",
  //       roles: [],
  //       element: RegisterReevalPage,
  //     },
  //     {
  //       name: "Makeup Registration",
  //       href: "makeup_registration",
  //       roles: [],
  //       element: MakeupRegistationPage,
  //     },
  //     {
  //       name: "FastTrack Registration",
  //       href: "fasttrack_registration",
  //       roles: [],
  //       element: FastTrackRegistationPage,
  //     },
  //     {
  //       name: "Backlog Registration",
  //       href: "backlog_registration",
  //       roles: [],
  //       element: BacklockRegistationPage,
  //     },
  //     {
  //       name: "Supplementary Registration",
  //       href: "supplementary_registration",
  //       roles: [],
  //       element: SupplementaryRegistationPage,
  //     },
  //     { name: "Department Charge", href: "department_charge", roles: [], element: DepartmentChangePage },
  //   ],
  // },
  // {
  //   name: "Exam Eligibility",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     { name: "Attendance", href: "attendance", roles: [], element: AttendanceEntry },
  //     { name: "CIA Process", href: "cia_process", roles: [], element: CIAProcess },
  //     {
  //       name: "Sub Occasion CIA Process",
  //       href: "sub_occasion_cia_process",
  //       roles: [],
  //       element: SubOccCIAProcess,
  //     },
  //     {
  //       name: "Grace Attendance",
  //       href: "grace_attendance",
  //       roles: [],
  //       element: GradeAttendance,
  //     },
  //     {
  //       name: "Eligibility List",
  //       href: "eligibility_list",
  //       roles: [],
  //       element: Eligibility,
  //     },
  //     {
  //       name: "Open Elective Entry",
  //       href: "open_elective_entry",
  //       roles: [],
  //       element: OpenElectiveEntry,
  //     },
  //   ],
  // },
  // {
  //   name: "Examination",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "Exam Time Table",
  //       href: "exam_time_table",
  //       roles: [],
  //       element: ExamTimeTable,
  //     },
  //     {
  //       name: "Lab Batch Allocation",
  //       href: "lab_batch_allocation",
  //       roles: [],
  //       element: LabBatchAllocation,
  //     },
  //     {
  //       name: "Examiner Lab Batch Allocation",
  //       href: "examiner_lab_batch_allocation",
  //       roles: [],
  //       element: ExaminerLabBatchAllocation,
  //     },
  //     {
  //       name: "Exam Hall Allocation",
  //       href: "exam_hall_allocation",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         {
  //           name: "",
  //           href: "",
  //           roles: [],
  //           element: ExamHallAllocation,
  //         },
  //         {
  //           name: "Hall Allocation Details",
  //           href: "update",
  //           roles: [],
  //           element: HallAllocationDetails,
  //         },
  //       ]
  //     },
  //     {
  //       name: "Examiner Lab Exam Marks",
  //       href: "examiner_lab_exam_marks",
  //       roles: [],
  //       element: ExaminorLabExamMark,
  //     },
  //     {
  //       name: "Transitional Grade",
  //       href: "transitional_grade",
  //       roles: [],
  //       element: Result,
  //     },
  //   ],
  // },
  // {
  //   name: "Evaluation",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "Exam Attendance",
  //       href: "exam_attendance",
  //       roles: [],
  //       element: ExamAttendance,
  //     },
  //     { name: "Exam Marks", href: "exam_marks", roles: [], element: ExamMarks },
  //     {
  //       name: "Grade Processing",
  //       href: "grade_processing",
  //       roles: [],
  //       element: GradeProcessing,
  //     },
  //     {
  //       name: "Grace Marks SEE",
  //       href: "grade_marks_see",
  //       roles: [],
  //       element: GradeMarkSee,
  //     },
  //     {
  //       name: "Re-evaluation Marks",
  //       href: "re_evaluation_marks",
  //       roles: [],
  //       element: ReEvaluateMarkEntry,
  //     },
  //     {
  //       name: "Re-evaluation Grade",
  //       href: "re_evaluation_grade",
  //       roles: [],
  //       element: ReEvaluateGradeList,
  //     },
  //     {
  //       name: "Vertical Progression",
  //       href: "vertical_progression",
  //       roles: [],
  //       element: Vertical,
  //     },
  //   ],
  // },
  // {
  //   name: "Reports",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "Student Track Report",
  //       href: "student_track_report",
  //       roles: [],
  //       element: StudentTrackReports,
  //     },
  //     { name: "Search Student", href: "search_student", roles: [], element: SearchStudentReports },
  //     { name: "NAD Report", href: "nad_report", roles: [], element: NADReports },
  //     { name: "CIA Report", href: "cia_report", roles: [], element: CIAReports },
  //     { name: "Eligibility Ineligibility USN wise", href: "eligibility_ineligibility_report", roles: [], element: EligibilityIneligibilityReports },
  //     { name: "Consolidated NE Student List", href: "consolidated_ne_students_list", roles: [], element: ConsolidatedneStudentsListReports },
  //     { name: "Consolidated SEE Absentees Student List", href: "consolidated_see_absentees_list", roles: [], element: ConsolidatedSEEAbsenteesList },
  //     { name: "Cosolidated Form A", href: "consolidated_form_a", roles: [], element: ConsolidateFormAReports },
  //     { name: "Consolidated Registration Reports", href: "consolidated_registration_reports", roles: [], element: ConsolidatedCourseRegistrationReport },
  //     // { name: "Grade Card No", href: "gc", roles: [], element: Home },
  //     // { name: "Hall Ticket", href: "hall_ticket", roles: [], element: Home },
  //     { name: "Result Sheet", href: "result_sheet", roles: [], element: ResultSheetReports },
  //     // { name: "Result Sheet 2021-22", href: "result_sheet", roles: [], element: ResultSheetReports },
  //     { name: "Provisional Grade Card", href: "provisional_card", roles: [], element: ProvisionalCardReports },
  //     { name: "Grade Card", href: "grade_card", roles: [], element: GradeCardReports },
  //     // { name: "Grade Card 2021-22", href: "grade_card", roles: [], element: Home },
  //     { name: "Grade Report", href: "grade_report", roles: [], element: GradeReports },
  //     { name: "Grade Card Ack Report", href: "grade_card_ack_report", roles: [], element: GradeCardAcknowledgementReport },

  //     { name: "Students Result", href: "student_result", roles: [], element: StudentResultReport },
  //     { name: "Analysis Report", href: "analysis_report", roles: [], element: AnalysisReport },
  //     // { name: "Caste-wise Analysis", href: "castewise_analysis_report", roles: [], element: Home },
  //     { name: "Student Promotion", href: "student_promotion", roles: [], element: StudentPromotionReport },
  //     { name: "Student List Report", href: "student_list_report", roles: [], element: StudentListReport },
  //     { name: "Annual Report", href: "annual_report", roles: [], element: AnnualReport },
  //     { name: "Award of degree", href: "degree_award_report", roles: [], element: AwardOfDegreeReports },
  //     { name: "Convocation Report", href: "convocation_report", roles: [], element: ConvocationReport },
  //     { name: "Eligibility List Report", href: "eligibility_list_report", roles: [], element: EligibilityListReport },
  //     { name: "Transcript", href: "transcript_report", roles: [], element: Transcript },
  //   ],
  // },
        name: "Registration Setup",
        href: "/configuration/registration-setup",
        roles: ["faculty", "admin"],
        element: RegistrationSetup,
        subItems: [],
      },
    ],
  },
  {
    name: "LMS - Mentoring",
    href: "/lms",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "Configuration Type",
        href: "/lms/configuration-type",
        roles: [],
        element: ConfigurationType,
        subItems: [],
      },
      {
        name: "Dept. Configuration",
        href: "/lms/dept-configuration",
        roles: [],
        element: DeptConfiguration,
        subItems: [],
      },
      {
        name: "Questionnaires",
        href: "/lms/questionnaires",
        roles: [],
        element: Questionnaires,
        subItems: [],
      },
      {
        name: "Map Mentor Mentee",
        href: "/lms/mentor-mentee",
        roles: [],
        element: MentorMentee,
        subItems: [],
      },
      {
        name: "Mentoring Session",
        href: "/lms/mentoring-session",
        roles: [],
        element: MentoringSession,
        subItems: [],
      },
      //{
        //name: "My Mentoring Sessions",
        //href: "/lms/my-sessions",
        //roles: [],
        //element: MyMentoringSessions,
        //subItems: [],
      //},
      {
        name: "MMP Report",
        href: "/lms/mmp-report",
        roles: [],
        element: MMPReport,
        subItems: [],
      },
      {
        name: "Mentor List",
        href: "/lms/mentor-list",
        roles: [],
        element: MentorList,
        subItems: [],
      },
      {
        name: "Issue & Observation Report",
        href: "/lms/issue-observation-report",
        roles: [],
        element: IssueObservationReport,
        subItems: [],
      },
    ],
  },
];
