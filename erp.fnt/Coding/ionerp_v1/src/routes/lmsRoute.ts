import { Outlet } from "react-router-dom";
import MapMentorMenteeListPage from "../pages/lms/mmp/mapMentorMentee/MapMentorMenteeListPage";
import MapMentorsPage from "../pages/lms/mmp/mapMentorMentee/MapMentorsPage";

import MapMenteesPage from "../pages/lms/mmp/mapMentorMentee/MapMenteesPage";
import MentoringSessionPage from "../pages/lms/mmp/mentoringSession/MentoringSessionPage";
import MmpConfigurationPage from "../pages/lms/mmp/configuration/MmpConfigurationPage";
import DeptConfigurationPage from "../pages/lms/mmp/deptConfiguration/DeptConfigurationPage";
import MmpReportPage from "../pages/lms/mmp/reports/MmpReportPage";
import MentorListPage from "../pages/lms/mmp/reports/MentorListPage";
import IssueObservationReportPage from "../pages/lms/mmp/reports/IssueObservationReportPage";
import CourseRegistrationPage from "../pages/curriculum/CourseRegistrationPage";
import QuestionnairePage from "../pages/lms/mmp/questionnaire/QuestionnairePage";
import QuestionnaireCreatePage from "../pages/lms/mmp/questionnaire/QuestionnaireCreatePage";

import ManageTopicInstructor from "../pages/lms/manageTopicInstructor/ManageTopicInstructor";
import ManageShareMaterialsPage from "../pages/lms/manageshare/ManageShareMaterialsPage";
import TimetableCalendarPage from "../pages/lms/timetableCalendar/TimetableCalendarPage";
import ManageQuizPage from "../pages/lms/manageQuiz/ManageQuizPage";

import TimetableListPage from "../pages/lms/timetable/timetableListPage";
import StudentQuizReport from "../pages/lms/reports/student_StudentQuiz";
import DCTRReport from "../pages/lms/reports/student_DCTRReport";
import StudentRegistrationReport from "../pages/lms/reports/student_StudentRegistrationReport";
import sharedmaterial from "../pages/lms/reports/student_sharedmaterial";

import AnnouncementPage from "../pages/lms/announcement/AnnouncementPage";
import ManageAssignmentPage from "../pages/lms/manageAssignment/ManageAssignmentPage";
import MyAssignmentPage from "../pages/lms/my_assignment/MyAssignmentPage";
import MyQuizPage from "../pages/lms/myQuiz/MyQuizPage";
import AttendanceManagementPage from "../pages/lms/AttendanceManagement/AttendanceManagementPage";
import StudentAssignmentReport from "../pages/lms/studentAssignmentReport/StudentAssignmentReport";
import AttendanceStatusReportPage from "../pages/lms/attendanceStatusReport/AttendanceStatusReportPage";
import StudentRecordPage from "../pages/lms/studentRecord/StudentRecordPage";
import ConsolidatedAttendanceReportPage from "../pages/lms/consolidated_attendance/ConsolidatedAttendanceReportPage";

import ReceiveAnnouncementPage from "../pages/lms/receiveAnnouncement/ReceiveAnnouncementPage";
import SendAnnouncementPage from "../pages/lms/sendAnnouncement/SendAnnouncementPage";
import { AttendanceReportPage } from "../pages/lms/reports";
import ConsolidatedAbsenteesReport from "../pages/lms/consolidatedAbsenteesReport/ConsolidatedAbsenteesReport";
import TopicCoverageAndTracking from "../pages/lms/TopicCoverageAndTracking/TopicCoverageAndTracking";
import MyClass from "../pages/lms/student_myClass/MyClass";

export const LMSROUTE = [
  {
    name: "LMS",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "Manage Topic Instructor",
        href: "manage-topic-instructor",
        roles: [],
        element: ManageTopicInstructor,
      },
      {
        name: "Manage Share Materials",
        href: "manage-share-materials",
        roles: [],
        element: ManageShareMaterialsPage,
      },
      {
        name: "Timetable",
        href: "timetable",
        roles: [],
        element: TimetableListPage,
      },
      {
        name: "Timetable Calendar",
        href: "timetable-calendar",
        roles: [],
        element: TimetableCalendarPage,
      },
      {
        name: "Manage Quiz",
        href: "manage-quiz",
        roles: [],
        element: ManageQuizPage,
      },
      {
        name: "Receive Announcement",
        href: "receive-announcement",
        roles: [],
        element: ReceiveAnnouncementPage,
      },
      {
        name: "Send Announcement",
        href: "send-announcement",
        roles: [],
        element: SendAnnouncementPage,
      },
       {
        name: "Announcement",
        href: "announcement",
        roles: [],
        element: AnnouncementPage,
      },
      {
        name: "Manage Assignment",
        href: "manage-assignment",
        roles: ["faculty"],
        element: ManageAssignmentPage,
      },
      {
        name: "My Assignment",
        href: "my-assignment",
        roles: ["student"],
        element: MyAssignmentPage,
      },
      {
        name: "My Quiz",
        href: "my-quiz",
        roles: ["student"],
        element: MyQuizPage,
      },
      
      {
        name: "Attendance Management",
        href: "attendance-management",
        roles: ["faculty"],
        element: AttendanceManagementPage,
      },
       {
        name: "Manage Material",
        href: "material",
        element: ManageShareMaterialsPage,
        roles: [],
      },

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
{
  name: "Course Registration",
  href: "/curriculum",
  element: CourseRegistrationPage,
  roles: [],
  subItems: [],
},
];