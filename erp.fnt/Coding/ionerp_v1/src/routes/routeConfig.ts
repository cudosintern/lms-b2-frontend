import { ComponentType } from "react";
import { EMSROUTE } from "./emsRoute";
// import { ADMISSIONROUTE } from "./admissionRoute";
// import { TRANSPORTROUTE } from "./transportRoute";
// import { HOSTELROUTE } from "./hostelRoute";
import { MAINROUTE } from "./mainRoute";
// import { CUDOSROUTE } from "./cudosRoute";
import PLACEMENTROUTE from "./placementRoute";

export interface RouteItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  element: ComponentType<any>;
  subItems?: RouteItem[];
  roles?: string[];
  hidden?: boolean;
}

export interface RoleRoutes {
  [key: string]: RouteItem[];
}

export const roleRoutes: RoleRoutes = {
  main: [...MAINROUTE],
  ionems: EMSROUTE,
  // ioncudos: CUDOSROUTE,
  // ionadmission: ADMISSIONROUTE,
  // iontransport: TRANSPORTROUTE,
  // ionhostel: HOSTELROUTE,
  ionplacement: PLACEMENTROUTE,
};
