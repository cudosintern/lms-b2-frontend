import Home from "../pages/ems/home";
// import Bos from "../pages/ioncudos/configuration/bos/Bos";
// import AddExistingUser from "../pages/ioncudos/configuration/bos/AddExistingUser";
// import AddNewMember from "../pages/ioncudos/configuration/bos/AddNewMember";
// import GenericPOPage from "../pages/ioncudos/configuration/genericPO/genericPOPage";
// import ProgramMode from "../pages/ioncudos/configuration/program_mode/ProgramMode";
// import PeoPage from "../pages/ioncudos/curriculum/peo";
// import PsoPage from "../pages/ioncudos/curriculum/pso";
// import AssessmentPage from "../pages/ioncudos/assessment/manage_mte_qp";
// import UploadMteQpPage from "../pages/ioncudos/assessment/manage_mte_qp/UploadMteQpPage";
// import CreateMteQpPage from "../pages/ioncudos/assessment/manage_mte_qp/CreateMteQpPage";
// import ManageMteDetailsPage from "../pages/ioncudos/assessment/manage_mte_qp/ManageMteDetailsPage";
// import DefineRubricsPage from "../pages/ioncudos/assessment/manage_mte_qp/DefineRubricsPage";
// import AttainmentThresholdLevelsPage from "../pages/ioncudos/attainment/attainment_threshold_levels";
// import PsoFormPage from "../pages/ioncudos/curriculum/pso/PsoFormPage";

// import Masters from "../pages/ems/configuration/masters/mastersPage";
// import UserRolePage from "../pages/ems/configuration/userRole/userRolePage";
// import UserMasterPage from "../pages/ems/configuration/userMaster/userMasterPage";
// import UserAccessPage from "../pages/ems/configuration/userAccess/userAccessPage";
import DepartmentPage from "../pages/ems/configuration/departmentDetail/departmentPage";
// import BloomDomainPage from "../pages/ioncudos/configuration/bloomDomain/bloomDomainPage";
// import OutcomePage from "../pages/ioncudos/configuration/program/outcomePage";
// import MapLevelWeightagePage from "../pages/ioncudos/configuration/mapLevelWeightage/mapLevelWeightagePage";
// import DeliveryMethodPage from "../pages/ioncudos/curriculum/deliveryMethod/deliveryMethodPage";
// import ProgramTypePage from "../pages/ems/configuration/programType/programTypePage";
// import ProgramPage from "../pages/ems/configuration/program/programPage";
// import AcademicCalendarPage from "../pages/ems/academics/academicCalendar/academicCalendarPage";
// import AcademicBatchPage from "../pages/ems/academics/academicBatch/academicBatchPage";
// import SemesterPage from "../pages/ems/academics/semester/semesterPage";
// import AcademicCalenderForm from "../pages/ems/academics/academicCalendar/academicCalenderForm";
import { Outlet } from "react-router-dom";
// import CoursePage from "../pages/ems/academics/course/coursePage";
// import CourseForm from "../pages/ems/academics/course/courseForm";
// import UpdateCourseForm from "../pages/ems/academics/course/updatecourseForm";
// import BulkImportCoursePage from "../pages/ems/academics/bulkcourseimport/coursePage";

// import AcademicBatchForm from "../pages/ems/academics/academicBatch/academicBatchForm";
// import SemesterForm from "../pages/ems/academics/semester/semesterForm";
// import UserMasterForm from "../pages/ems/configuration/userMaster/userMasterForm";
// import UserAccessAddEditForm from "../pages/ems/configuration/userAccess/userAccessAddEditForm";
// import UserRoleAddEditForm from "../pages/ems/configuration/userRole/userRoleAddEditForm";
// import EventCalendarPage from "../pages/ems/academics/eventCalender/eventlistPage";
// import ExamAttendance from "../pages/ems/evalution/examAttendance/examAttendance";
// import ExamMarks from "../pages/ems/evalution/examMarks/examMarks";
// import GradeProcessing from "../pages/ems/evalution/gradeProcessing/gradeProcessing";
// import GradeMarkSee from "../pages/ems/evalution/gradeMarksSee/gradeMarkSee";
// import ReEvaluateMarkEntry from "../pages/ems/evalution/reevalutionMarks/reEvaluateMarkEntry";
// import ReEvaluateGradeList from "../pages/ems/evalution/reevaluationGrade/reEvaluateGradelist";
// import ExamTimeTable from "../pages/ems/examination/examtimetable/examTimeTable";
// import LabBatchAllocation from "../pages/ems/examination/LabBatchAllocation/LabBatchAllocation";
// import ExamHallAllocation from "../pages/ems/examination/ExamHallAllocation/ExamHallAllocation";
// import ExaminorLabExamMark from "../pages/ems/examination/ExaminorLabExamMark/ExaminorLabExamMark";
// import Result from "../pages/ems/examination/TransitionalGrade/result";
// import OpenElectiveEntry from "../pages/ems/examEligibility/OpenElectiveEntry/OpenElectiveEntry";
// import Eligibility from "../pages/ems/examEligibility/EligibilityList/Eligibility";
// import GradeAttendance from "../pages/ems/examEligibility/GradeAttendance/GradeAttendance";
// import AttendanceEntry from "../pages/ems/examEligibility/Attendance/AttendanceEntry";
// import ClassTimetable from "../pages/ems/academics/classTimeTable/classTimeTable";
// import CourseAllocation from "../pages/ems/configuration/CourseAllocation/CourseAllocation";
// import BulkCourseForm from "../pages/ems/academics/bulkcourseimport/courseForm";
// import BulkUpdateCourseForm from "../pages/ems/academics/bulkcourseimport/updatecourseForm";
// import StudentAdmissionLitePage from "../pages/ems/registration/studentLite/StudentLitePage";
// import StudentForm from "../pages/ems/registration/studentLite/studentForm";
// import StudentAdmissionPage from "../pages/ems/registration/studentAdmission/StudentAdmissionPage";
// import StudentAdmissionForm from "../pages/ems/registration/studentAdmission/studentForm";
// import StudentBulkImportForm from "../pages/ems/registration/studentAdmission/bulkimport";
// import StudentAllocationPage from "../pages/ems/registration/studentAllocation/stucentAllocationPage";
// import CourseRegisterPage from "../pages/ems/registration/courseregestation/CourseRegisterPage";
// import BulkCourseRegisterPage from "../pages/ems/registration/bulkcourseregestation/BulkCourseRegisterPage";
// import StudentExamRegister from "../pages/ems/registration/studentExamRegister/StudentExamRegisterPage";
// import ExaminerRegistrationPage from "../pages/ems/registration/ExaminerRegistration/ExaminerRegistrationPage";
// import CIAProcess from "../pages/ems/examEligibility/CIAProcess/CIAProcess";
// import SubOccCIAProcess from "../pages/ems/examEligibility/SubOccussionCIAProcess/SubOccCIAProcess";
// import ExaminerLabBatchAllocation from "../pages/ems/examination/ExaminerLabBatchAllocation/ExaminerLabBatchAllocation";
// import HallAllocationDetails from "../pages/ems/examination/ExamHallAllocation/HallAllocationDetails";
// import Vertical from "../pages/ems/evalution/VerticalProgression/Vertical";
// import RegisterReevalPage from "../pages/ems/registration/registerreeval/registerreevalPage";
// import MakeupRegistationPage from "../pages/ems/registration/makeupRegistation/makeupRegistation";
// import FastTrackRegistationPage from "../pages/ems/registration/fastTrackRegistation/fastTrackRegistation";
// import BacklockRegistationPage from "../pages/ems/registration/backlogRegistation/backlogRegistation";
// import SupplementaryRegistationPage from "../pages/ems/registration/supplementaryRegistation/SupplementaryRegistation";
// import DepartmentChangePage from "../pages/ems/registration/departmentChange/departmentChange";
// import StudentTrackReports from "../pages/ems/reports/student_track_reports/student_track_reports";
// import NADReports from "../pages/ems/reports/NADReports/NADReports";
// import CIAReports from "../pages/ems/reports/CIAReports/CIAReports";
// import EligibilityIneligibilityReports from "../pages/ems/reports/EligibilityIneligibilityReports/EligibilityIneligibilityReports";
// import ConsolidatedneStudentsListReports from "../pages/ems/reports/ConsolidatedneStudentsList/ConsolidatedneStudentsList";

// import ResultSheetReports from "../pages/ems/reports/ResultSheetReports/ResultSheetReports";
// import ConsolidateFormAReports from "../pages/ems/reports/ConsolidateFormA/ConsolidateFormAReports";
// import SearchStudentReports from "../pages/ems/reports/SearchStudent/SearchStudentReports";
// import ProvisionalCardReports from "../pages/ems/reports/ProvisionalCard/ProvisionalCard";
// import GradeCardReports from "../pages/ems/reports/GradeCard/GradeCard";
// import GradeReports from "../pages/ems/reports/GradeReport/GradeReport";
// import GradeCardAcknowledgementReport from "../pages/ems/reports/GradeCardAcknowledgementReport/GradeCardAcknowledgementReport";
// import StudentResultReport from "../pages/ems/reports/StudentResult/StudentResult";
// import StudentPromotionReport from "../pages/ems/reports/StudentPromotion/StudentPromotion";

// import ConsolidatedCourseRegistrationReport from "../pages/ems/reports/ConsolidatedCourseRegistrationReport/ConsolidatedCourseRegistrationReport";
// import ConsolidatedSEEAbsenteesList from "../pages/ems/reports/ConsolidatedSEEAbsenteesList/ConsolidatedSEEAbsenteesList";
// import AwardOfDegreeReports from "../pages/ems/reports/AwardOfDegree/AwardOfDegree";
// import StudentListReport from "../pages/ems/reports/StudentListReport/StudentListReport";
// import AnnualReport from "../pages/ems/reports/AnnualReport/AnnualReport";
// import ConvocationReport from "../pages/ems/reports/ConvocationReport/ConvocationReport";
// import Transcript from "../pages/ems/reports/Transcript/Transcript";
// import EligibilityListReport from "../pages/ems/reports/EligibilityListReport/EligibilityListReport";
// import AnalysisReport from "../pages/ems/reports/AnalysisReport/AnalysisReport";
import ChangePasswordPage from "../pages/changepassword";
// import genericKPPage from "../pages/ioncudos/configuration/generickp/genericKPPage";
// import GenericPOForm from "../pages/ioncudos/configuration/genericPO/GenericPOForm";
// import LabCategoryPage from "../pages/ioncudos/configuration/labCategory/labCategoryPage";
// import CurriculumPage from "../pages/ioncudos/curriculum/curriculum/CurriculumPage";
// import CurriculumForm from "../pages/ioncudos/curriculum/curriculum/CurriculumForm";
// import ManageKnowledgeProfile from "../pages/ioncudos/curriculum/manageKnowledgeProfile/ManageKnowledgeProfile";
// import ManageKnowledgeProfileForm from "../pages/ioncudos/curriculum/manageKnowledgeProfile/ManageKnowledgeProfileForm";
// import PoPeoMappingPage from "../pages/ioncudos/curriculum/poPeoMapping/PoPeoMappingPage";
//import CurriculumSettingsPage from "../pages/ioncudos/curriculum/curriculumSettings/CurriculumSettingsPage";
// import BloomLevel from "../pages/ioncudos/configuration/bloomLevel/BloomLevel";
// import CurriculumSettingsPage from "../pages/ioncudos/curriculum/curriculumSettings/CurriculumSettingsPage";
// import PoPeoMappingPage from "../pages/ioncudos/curriculum/poPeoMapping/PoPeoMappingPage";
//import CurriculumSettingsPage from "../pages/ioncudos/curriculum/curriculumSettings/curriculumSettingsPage";
// import CourseOutcomePage from "../pages/ioncudos/curriculum/courseOutcome/CourseOutcomePage";

// import CompetenciesAndPIsPage from "../pages/ioncudos/curriculum/competenciesAndPIs/CompetenciesAndPIsPage";
// import CoPoMapPage from "../pages/ioncudos/curriculum/co_po_map";
// import ManageTopicsPage from "../pages/ioncudos/curriculum/manageTopics/ManageTopicsPage";
// import CiaList from "../pages/ioncudos/assessment/cia/CiaList";
// import CceDataImportList from "../pages/ioncudos/attainment/cceDataImport/CceDataImportList";
// import CiaQpList from "../pages/ioncudos/assessment/manage_cia_qp_rubrics/CiaQpList";
// import CiaQpEditor from "../pages/ioncudos/assessment/manage_cia_qp_rubrics/CiaQpEditor";
// import ManageModelQPPage from "../pages/ioncudos/assessment/manageModelQP/ManageModelQPPage";
// import SeeCourseWiseImport from "../pages/ioncudos/attainment/seeCourseWiseImport/SeeCourseWiseImport";
// import MteDataImportPage from "../pages/ioncudos/attainment/mtedataimport/MteDataImportPage";
// import MTEImportReviewPage from "../pages/ioncudos/attainment/mtedataimport/mteImportReview/MTEImportReviewPage";
// import ManageMTEMarksPage from "../pages/ioncudos/attainment/mtedataimport/ManageMTEMarksPage";
// import MTEUploadPage from "../pages/ioncudos/attainment/mtedataimport/mteUpload/MTEUploadPage";
// import ManageQuestionTypePage from "../pages/ioncudos/survey/manage-survey-question-type/ManageQuestionTypePage";
// import ManageResponseTemplatePage from "../pages/ioncudos/survey/manage-response-template/ManageResponseTemplatePage";
// import ManageStakeholderGroupPage from "../pages/ioncudos/survey/manage-stakeholder-group/ManageStakeholderGroupPage";
// import ManageStakeholderPage from "../pages/ioncudos/survey/manage-stakeholder/ManageStakeholderPage";
// import ManageSurveyTemplatePage from "../pages/ioncudos/survey/manage-survey-template/ManageSurveyTemplatePage";

export const EMSROUTE = [
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
    name: "Configuration",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      //   { name: "All Masters", href: "all_masters", roles: [], element: Masters },
      //   {
      //     name: "User Roles",
      //     href: "user_roles",
      //     roles: [],
      //     element: Outlet,
      //     subItems: [
      //       { name: "", href: "", roles: [], element: UserRolePage },
      //       { name: "Create", href: "create", roles: [], element: UserRoleAddEditForm },
      //       { name: "Update", href: "update", roles: [], element: UserRoleAddEditForm },
      //     ],
      //   },
      //   {
      //     name: "User Master",
      //     href: "user_master",
      //     roles: [],
      //     element: Outlet,
      //     subItems: [
      //       { name: "", href: "", roles: [], element: UserMasterPage },
      //       { name: "Create", href: "create", roles: [], element: UserMasterForm },
      //       { name: "Update", href: "update", roles: [], element: UserMasterForm },
      //     ],
      //   },
      //   {
      //     name: "User Access",
      //     href: "user_access",
      //     roles: [],
      //     element: Outlet,
      //     subItems: [
      //       { name: "", href: "", roles: [], element: UserAccessPage },
      //       { name: "Create", href: "create", roles: [], element: UserAccessAddEditForm },
      //       { name: "Update", href: "update", roles: [], element: UserAccessAddEditForm },
      //     ],
      //   },
      {
        name: "Department",
        href: "department",
        roles: [],
        element: DepartmentPage,
      },

      // {
      //   name: "Program Mode",
      //   href: "program_mode",
      //   element: ProgramMode,
      //   roles: [],
      // },

      // {
      //   name: "BoS Members",
      //   href: "bos",
      //   roles: [],
      //   element: Bos,
      // },
      // {
      //   name: "",
      //   href: "bos/add-existing",
      //   element: AddExistingUser,
      //   roles: [],
      // },
      // {
      //   name: "",
      //   href: "bos/add-new",
      //   element: AddNewMember,
      //   roles: [],
      // },
      // {
      //   name: "",
      //   href: "bos/edit/:id",
      //   element: AddNewMember,
      //   roles: [],
      // },
      // {
      //   name: "Program Outcome (PO) Type",
      //   href: "program_outcome",
      //   element: OutcomePage,
      //   roles: [],
      // },

      // {
      //   name: "Generic Program Outcomes (POs)",
      //   href: "po",
      //   element: Outlet,
      //   roles: [],
      //   subItems: [
      //     {
      //       name: "",
      //       href: "",
      //       element: GenericPOPage,
      //       roles: [],
      //     },
      //     {
      //       name: "Add",
      //       href: "create",
      //       element: GenericPOForm,
      //       roles: [],
      //       hidden: true,
      //     },
      //     {
      //       name: "Edit",
      //       href: "edit/:id",
      //       element: GenericPOForm,
      //       roles: [],
      //       hidden: true,
      //     },
      //   ],
      // },
      // {
      //   name: "Generic Knowledge and Attitude Profile (KPs)",
      //   href: "knowledge_profile",
      //   element: genericKPPage,
      //   roles: [],
      // },
      // {
      //   name: "Delivery Method",
      //   href: "delivery_method",
      //   roles: [],
      //   element: DeliveryMethodPage,
      // },
      // {
      //   name: "Lab Category",
      //   href: "labCategory",
      //   element: LabCategoryPage,
      //   roles: [],
      // },
      // {
      //   name: "Bloom's Domain",
      //   href: "bloom_domain",
      //   roles: [],
      //   element: BloomDomainPage,
      // },
      // {
      //   name: "Bloom's Level",
      //   href: "bloom_level",
      //   roles: [],
      //   element: BloomLevel,
      // },
      // {
      //   name: "Map Level Weightage",
      //   href: "map_level_weightage",
      //   roles: [],
      //   element: MapLevelWeightagePage,
      // },

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

  // {
  //   name: "Curriculum",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "Manage Knowledge and Attitude Profile",
  //       href: "/curriculum/manage_knowledge_profile",
  //       element: ManageKnowledgeProfile,
  //       roles: [],
  //     },
  //     {
  //       name: "Curriculum",
  //       href: "/curriculum",
  //       element: CurriculumPage,
  //       roles: [],
  //     },
  //     {
  //       name: "", // Hidden
  //       href: "/curriculum/create",
  //       element: CurriculumForm,
  //       roles: [],
  //     },
  //     {
  //       name: "", // Hidden
  //       href: "/curriculum/edit/:id",
  //       element: CurriculumForm,
  //       roles: [],
  //     },

  //     {
  //       name: "", // Hidden
  //       href: "/curriculum/manage_knowledge_profile/create",
  //       element: ManageKnowledgeProfileForm,
  //       roles: [],
  //     },
  //     {
  //       name: "", // Hidden
  //       href: "/curriculum/manage_knowledge_profile/edit/:id",
  //       element: ManageKnowledgeProfileForm,
  //       roles: [],
  //     },
  //     {
  //       name: "Program Educational Objectives (PEO)",
  //       href: "/curriculum/program_educational_objectives",
  //       element: PeoPage,
  //       roles: [],
  //       subItems: [],
  //     },

  //     {
  //       name: "POs / PSOs",
  //       href: "/curriculum/program_outcomes",
  //       element: Outlet,
  //       roles: [],
  //       subItems: [
  //         {
  //           name: "",
  //           href: "",
  //           element: PsoPage,
  //           roles: [],
  //         },
  //         {
  //           name: "Add PO / PSO",
  //           href: "create",
  //           element: PsoFormPage,
  //           roles: [],
  //           hidden: true,
  //         },
  //         {
  //           name: "Edit PO / PSO",
  //           href: "edit/:id",
  //           element: PsoFormPage,
  //           roles: [],
  //           hidden: true,
  //         },
  //       ],
  //     },
  //     {
  //       name: "PO to PEO Mapping",
  //       href: "/curriculum/po_peo_mapping",
  //       element: PoPeoMappingPage,
  //       roles: [],
  //     },

  //     {
  //       name: "Curriculum Settings",
  //       href: "/curriculum/curriculum_settings",
  //       element: CurriculumSettingsPage,
  //       roles: [],
  //     },
  //     {
  //       href: "/curriculum/competencies_and_pis",
  //       name: "Competencies and PIs",
  //       element: CompetenciesAndPIsPage,
  //       roles: [],
  //     },
  //     {
  //       name: "Course Outcomes (COs)",
  //       href: "/curriculum/course_outcomes",
  //       element: CourseOutcomePage,
  //       roles: [],
  //     },
  //     {
  //       name: "CO–PO Mapping",
  //       href: "/curriculum/co_po_mapping",
  //       element: CoPoMapPage,
  //       roles: [],
  //     },

  //     {
  //       name: "Manage Topics & TLOs",
  //       href: "/curriculum/manage_topics",
  //       element: ManageTopicsPage,
  //       roles: [],
  //     },
  //   ],
  // },
  // {
  //   name: "Assessment",
  //   href: "",
  //   element: Outlet, // or TempAssessment if you created one
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "Manage CIA Occasions",
  //       href: "/assessment/manage_cia_occasion",
  //       element: CiaList,
  //       roles: [],
  //     },
  //     {
  //       name: "Manage CIA QP & Rubrics",
  //       href: "/assessment/manage_cia_qp",
  //       element: CiaQpList,
  //       roles: [],
  //     },
  //     {
  //       name: "", // Hidden route for editor
  //       href: "/assessment/manage_cia_qp/edit/:ao_id",
  //       element: CiaQpEditor,
  //       roles: [],
  //     },
  //     {
  //       name: "Manage MTE QP",
  //       href: "/assessment/manage_mte_qp",
  //       element: AssessmentPage,
  //       roles: [],
  //     },
  //     {
  //       name: "Upload MTE QP",
  //       href: "/assessment/manage_mte_qp/import",
  //       element: UploadMteQpPage,
  //       roles: [],
  //       hidden: true,
  //     },
  //     {
  //       name: "Create New MTE",
  //       href: "/assessment/manage_mte_qp/create",
  //       element: CreateMteQpPage,
  //       roles: [],
  //       hidden: true,
  //     },
  //     {
  //       name: "Manage MTE Details",
  //       href: "/assessment/manage_mte_qp/details",
  //       element: ManageMteDetailsPage,
  //       roles: [],
  //       hidden: true,
  //     },
  //     {
  //       name: "Define Rubrics",
  //       href: "/assessment/manage_mte_qp/rubrics",
  //       element: DefineRubricsPage,
  //       roles: [],
  //       hidden: true,
  //     },
  //     {
  //       name: "Manage Model QP",
  //       href: "/assessment/manage_model_qp",
  //       element: ManageModelQPPage,
  //       roles: [],
  //     },
  //   ],
  // },
  // {
  //   name: "Attainment",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "Attainment - Threshold / Levels",
  //       href: "/attainment/attainment_threshold_levels",
  //       element: AttainmentThresholdLevelsPage,
  //       roles: [],
  //     },
  //     {
  //       name: "CCE Data Entry / Import",
  //       href: "/attainment/cce_data_import",
  //       element: CceDataImportList,
  //       roles: [],
  //     },
  //     {
  //       name: "MTE Data Import",
  //       href: "/attainment/mte_data_import",
  //       element: MteDataImportPage,
  //       roles: [],
  //     },
  //     {
  //       name: "",
  //       href: "/attainment/mte_data_import/manage/:courseId",
  //       element: ManageMTEMarksPage,
  //       roles: [],
  //     },
  //     {
  //       name: "",
  //       href: "/attainment/mte_data_import/review/:occasionId",
  //       element: MTEImportReviewPage,
  //       roles: [],
  //     },
  //     {
  //       name: "",
  //       href: "/attainment/mte_data_import/upload/:occasionId",
  //       element: MTEUploadPage,
  //       roles: [],
  //     },
  //     {
  //       name: "SEE Data Import",
  //       href: "/attainment/see_data_import",
  //       element: SeeCourseWiseImport,
  //       roles: [],
  //     },
  //   ],
  // },
  // {
  //   name: "Attainment",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "Attainment - Threshold / Levels",
  //       href: "/attainment/attainment_threshold_levels",
  //       element: AttainmentThresholdLevelsPage,
  //       roles: [],
  //     },
  //   ],
  // }
  // {
  //   name: "Survey",
  //   href: "",
  //   element: Outlet,
  //   roles: [],
  //   subItems: [
  //     {
  //       name: "Manage Question Paper Type",
  //       href: "/survey/manage-survey-question-type",
  //       element: ManageQuestionTypePage,
  //       roles: [],
  //     },
  //     {
  //       name: "Manage Response Template",
  //       href: "/survey/manage-response-template",
  //       element: ManageResponseTemplatePage,
  //       roles: [],
  //     },
  //     {
  //       name: "Manage Stakeholder Group",
  //       href: "/survey/manage-stakeholder-group",
  //       element: ManageStakeholderGroupPage,
  //       roles: [],
  //     },
  //     {
  //       name: "Manage Stakeholder",
  //       href: "/survey/manage-stakeholder",
  //       element: ManageStakeholderPage,
  //       roles: [],
  //     },
  //     {
  //       name: "Manage Survey Templates",
  //       href: "/survey/manage-survey-templates",
  //       element: ManageSurveyTemplatePage,
  //       roles: [],
  //     },
  //   ],
  // },
];

export default EMSROUTE;
