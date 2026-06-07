import Home from "../pages/ems/home";

import DepartmentPage from "../pages/ems/configuration/departmentDetail/departmentPage";

import { Outlet } from "react-router-dom";

import ChangePasswordPage from "../pages/changepassword";

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
    
      {
        name: "Department",
        href: "department",
        roles: [],
        element: DepartmentPage,
      },
    ],
  },

];

export default EMSROUTE;
