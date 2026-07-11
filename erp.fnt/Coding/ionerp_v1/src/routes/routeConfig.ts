import { EMSROUTE } from "./emsRoute";
// import { ADMISSIONROUTE } from "./admissionRoute";
// import { TRANSPORTROUTE } from "./transportRoute";
// import { HOSTELROUTE } from "./hostelRoute";
import { MAINROUTE } from "./mainRoute";
import { CUDOSROUTE } from "./cudosRoute";
import { PLACEMENTROUTE } from "./placementRoute";
import type { RoleRoutes } from "./routeTypes";

export type { RoleRoutes, RouteItem } from "./routeTypes";

export const roleRoutes: RoleRoutes = {
  main: MAINROUTE,
  ionems: EMSROUTE,
  ioncudos: CUDOSROUTE,
  // ionadmission: ADMISSIONROUTE,
  // iontransport: TRANSPORTROUTE,
  // ionhostel: HOSTELROUTE,
};
