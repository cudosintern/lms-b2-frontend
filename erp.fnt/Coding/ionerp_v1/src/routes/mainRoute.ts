import React from "react";
import MainPage from "../pages/mainPage";
import ChangePasswordPage from "../pages/changepassword";
import ConfigurationTypePage from "../pages/mentoring/ConfigurationTypePage";
import DeptConfigurationPage from "../pages/mentoring/DeptConfigurationPage";
import MentorListPage from "../pages/mentoring/MentorListPage";
import QuestionnairePage from "../pages/mentoring/QuestionnairePage";
import MentoringSessionPage from "../pages/mentoring/MentoringSessionPage";
import MapMentorMenteePage from "../pages/mentoring/MapMentorMenteePage";
import MmpReportPage from "../pages/mentoring/MmpReportPage";
// import CourseRegistrationPage from "../pages/curriculum/CourseRegistrationPage";
import IssueObservationReportPage from "../pages/lms/mmp/reports/IssueObservationReportPage";
import { FaHome, FaUsers, FaBook } from "react-icons/fa";
import ManageTopicInstructor from "../pages/lms/manageTopicInstructor/ManageTopicInstructor";
import ManageQuizPage from "../pages/lms/manageQuiz/ManageQuizPage";
import ManageShareMaterialsPage from "../pages/lms/manageshare/ManageShareMaterialsPage";
// import TimetableListPage from "../pages/lms/timetable/timetableListPage";
import TimetableListPage from "../pages/lms/manageTimetable/Timetable";
import TimetableCalendarPage from "../pages/lms/timetableCalendar/TimetableCalendarPage";
// import ReceiveAnnouncementPage from "../pages/lms/ReciveAnnouncement/ReceiveAnnouncementPage";
// import SendAnnouncementPage from "../pages/lms/sendAnnouncement/SendAnnouncementPage";
import AnnouncementPage from "../pages/lms/announcement/AnnouncementPage";
import ManageAssignmentPage from "../pages/lms/manageAssignment/ManageAssignmentPage";
import CourseRegistrationPage from "../pages/lms/Registration_setup/CourseRegistrationPage";
import AttendanceManagementPage from "../pages/lms/AttendanceManagement/AttendanceManagementPage";

import student_DCTRReport from "../pages/lms/reports/student_DCTRReport";
import student_sharedmaterial from "../pages/lms/reports/student_sharedmaterial";
import AttendanceReportPage from "../pages/lms/reports/AttendanceReportPage";
import studentRecordPage from "../pages/lms/studentRecord/StudentRecordPage";
import StudentAttendanceReport from "../pages/lms/studentAttendanceReport/StudentAttendanceReport";
import StudentQuiz from "../pages/lms/reports/student_StudentQuiz";
// import ConsolidatedStudentMarksReport from "../../pages/lms/consolidatedStudentMarksReport/ConsolidatedStudentMarksReport";

import MyAssignmentPage from "../pages/lms_student/my_assignment/MyAssignmentPage";
import MyClass from "../pages/lms_student/student_myClass/MyClass";
import MyQuizPage from "../pages/lms_student/myQuiz/MyQuizPage";
import StudentAssignmentReport from "../pages/lms/studentAssignmentReport/StudentAssignmentReport";
import TopicCoverageAndTracking from "../pages/lms/TopicCoverageAndTracking/TopicCoverageAndTracking"

export const MAINROUTE = [
  {
    name: "Home",
    href: "/",
    element: MainPage,
    icon: React.createElement("div", { className: "w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white mr-1.5" }, React.createElement(FaHome, { size: 11 })),
    roles: [],
    subItems: [],
  },
  {
    name: "LMS",
    href: "/lms",
    element: ManageTopicInstructor,
    icon: React.createElement("div", { className: "w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white mr-1.5" }, React.createElement(FaUsers, { size: 11 })),
    roles: [],
    subItems: [
      {
      name: "Manage Topic Instructor",
      href: "manage-topic-instructor",
      element: ManageTopicInstructor,
      roles: [],
      subItems: [],
      // hidden: true,
    },
    {
      name: "Manage Share Materials",
      href: "manage-share-materials",
      element: ManageShareMaterialsPage,
      roles: [],
      subItems: [],
      // hidden: true,
    },
    {
        name: "Manage Timetable",
        href: "manage-timetable",
        element: TimetableListPage,
        roles: [],
        subItems: [],
      },
    {
      name: "Timetable Calendar",
      href: "timetable-calendar",
      element: TimetableCalendarPage,
      roles: [],
      subItems: [],
      // hidden: true,
    },
    {
      name: "Manage Quiz",
      href: "manage-quiz",
      element: ManageQuizPage,
      roles: [],
      subItems: [],
      // hidden: true,
    },
    // {
    //   name: "Receive Announcement",
    //   href: "receive-announcement",
    //   element: ReceiveAnnouncementPage,
    //   roles: [],
    //   subItems: [],
    //   // hidden: true,
    // },
    // {
    //   name: "Send Announcement",
    //   href: "send-announcement",
    //   element: SendAnnouncementPage,
    //   roles: [],
    //   subItems: [],
    //   // hidden: true,
    // },
      {
      name: "Announcement",
      href: "announcement",
      element: AnnouncementPage,
      roles: [],
      subItems: [],
      // hidden: true,
    },
    {
      name: "Manage Assignment",
      href: "manage-assignment",
      roles: ["faculty"],
      element: ManageAssignmentPage,
      subItems: [],
      // hidden: true,
    },
    {
        name: "Registration Setup",
        href: "course-registration-setup",
        roles: ["faculty"],
        element: CourseRegistrationPage,
        subItems: [],
      },
      {
        name: "Manage Attendance",
        href: "manage-attendance",
        roles: ["faculty"],
        element: AttendanceManagementPage,
        subItems: [],
      },
    ],
  },
  {
    name: "Reports",
    href: "/reports",
    element: ManageTopicInstructor,
    icon: React.createElement("div", { className: "w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white mr-1.5" }, React.createElement(FaUsers, { size: 11 })),
    roles: [],
    subItems: [
      {
        name: "Assignment Report",
        href: "assignment-report",
        element: StudentAssignmentReport,
        roles: [],
        subItems: [],
      },
      {
        name: "Topic Coverage & Tracking",
        href: "topic-coverage-tracking-report",
        element: TopicCoverageAndTracking,
        roles: [],
        subItems: [],
      },
      {
        name: "DCTR Report",
        href: "student-dctr-report",
        element: student_DCTRReport,
        roles: [],
        subItems: [],
      },
      {
        name: "Attendance Report",
        href: "attendance-report",
        element: AttendanceReportPage,
        roles: [],
        subItems: [],
      },
      {
        name: "Student Record Report",
        href: "student-record-report",
        element: studentRecordPage,
        roles: [],
        subItems: [],
      },
      {
        name: "Student Attendance Report",
        href: "student-attendance-report",
        element: StudentAttendanceReport,
        roles: [],
        subItems: [],
      },
      {
        name: "Student Quiz Report",
        href: "student-quiz-report",
        element: StudentQuiz,
        roles: [],
        subItems: [],
      },
      // {
      //   name: "Consolidated Student Marks Report",
      //   href: "consolidated-student-marks-report",
      //   element: consolidatedStudentMarksReport,
      //   roles: [],
      //   subItems: [],
      // },
    ]
  },
  {
    name: "Mentoring",
    href: "/mentoring",
    element: ConfigurationTypePage,
    icon: React.createElement("div", { className: "w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white mr-1.5" }, React.createElement(FaUsers, { size: 11 })),
    roles: [],
    subItems: [],
  },
  {
    name: "",
    href: "/mentoring/dept_configuration",
    element: DeptConfigurationPage,
    roles: [],
    subItems: [],
    // hidden: true,
  },
  {
    name: "",
    href: "/mentoring/mentor_list",
    element: MentorListPage,
    roles: [],
    subItems: [],
    // hidden: true,
  },
  {
    name: "",
    href: "/mentoring/questionnaires",
    element: QuestionnairePage,
    roles: [],
    subItems: [],
    // hidden: true,
  },
  {
    name: "",
    href: "/mentoring/mentoring_session",
    element: MentoringSessionPage,
    roles: [],
    subItems: [],
    // hidden: true,
  },
  {
    name: "",
    href: "/mentoring/map_mentor_mentee",
    element: MapMentorMenteePage,
    roles: [],
    subItems: [],
    // hidden: true,
  },
  {
    name: "",
    href: "/mentoring/mmp_report",
    element: MmpReportPage,
    roles: [],
    subItems: [],
    // hidden: true,
  },
  {
    name: "",
    href: "/mentoring/issue_observation_report",
    element: IssueObservationReportPage,
    roles: [],
    subItems: [],
    // hidden: true,
  },
  // {
  //   name: "Curriculum",
  //   href: "/curriculum",
  //   element: CourseRegistrationPage,
  //   icon: React.createElement("div", { className: "w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white mr-1.5" }, React.createElement(FaBook, { size: 11 })),
  //   roles: [],
  //   subItems: [],
  // },
  {
    name: "Change Password",
    href: "/change_password",
    element: ChangePasswordPage,
    roles: [],
    subItems: [],
  },
  // {
  //   name: "User",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "User Roles",
  //       href: "user_roles",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         { name: "", href: "", roles: [], element: UserRolePage },
  //         { name: "Create", href: "create", roles: [], element: UserRoleAddEditForm },
  //         { name: "Update", href: "update", roles: [], element: UserRoleAddEditForm },
  //       ],
  //     },
  //     {
  //       name: "User Master",
  //       href: "user_master",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         { name: "", href: "", roles: [], element: UserMasterPage },
  //         { name: "Create", href: "create", roles: [], element: UserMasterForm },
  //         { name: "Update", href: "update", roles: [], element: UserMasterForm },
  //       ],
  //     },
  //     {
  //       name: "User Access",
  //       href: "user_access",
  //       roles: [],
  //       element: Outlet,
  //       subItems: [
  //         { name: "", href: "", roles: [], element: UserAccessPage },
  //         { name: "Create", href: "create", roles: [], element: UserAccessAddEditForm },
  //         { name: "Update", href: "update", roles: [], element: UserAccessAddEditForm },
  //       ],
  //     },
  //     { name: "Department", href: "department", roles: [], element: DepartmentPage },
  //     { name: "Program Type", href: "program_type", roles: [], element: ProgramTypePage },
  //     { name: "Program", href: "program", roles: [], element: ProgramPage },

  //   ],
  // },
  // {
  //   name: "Academics",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
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
    // ],
  // },
];
