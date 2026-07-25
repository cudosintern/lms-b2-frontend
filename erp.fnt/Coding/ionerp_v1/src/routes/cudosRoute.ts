import { Outlet } from "react-router-dom";
import BloomDomainPage from "../pages/ioncudos/configuration/bloomDomain/bloomDomainPage";

import type { RouteItem } from "./routeTypes";

/**
 * IonCUDOS Route Configuration
 * Defines navigation structure and routing for CUDOS module (Outcome-Based Education)
 *
 * Phase A - Master Data CRUD Modules:
 * - Bloom's Domain (Cognitive, Affective, Psychomotor)
 */

export const CUDOSROUTE: RouteItem[] = [
  {
    name: "Configuration",
    href: "/configuration",
    element: Outlet, // Parent route with nested children
    roles: [],
    subItems: [
      {
        name: "Bloom's Domain",
        href: "bloom_domain", // Relative path - will be combined with parent
        element: BloomDomainPage,
        roles: [],
      },
    
    ],
  },
];
export default CUDOSROUTE;
