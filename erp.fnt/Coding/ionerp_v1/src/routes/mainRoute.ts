import MainPage from "../pages/mainPage";
import DepartmentPage from "../pages/ems/configuration/departmentDetail/departmentPage";
import { Outlet } from "react-router-dom";
import ChangePasswordPage from "../pages/changepassword";
export const MAINROUTE = [
  {
    name: "Home",
    href: "/",
    element: MainPage,
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
