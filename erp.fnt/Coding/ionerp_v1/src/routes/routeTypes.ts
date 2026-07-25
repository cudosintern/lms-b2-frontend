import type { ComponentType, ReactNode } from "react";

export interface RouteItem {
  name: string;
  href: string;
  icon?: ReactNode;
  element: ComponentType<any>;
  subItems?: RouteItem[];
  roles?: string[];
  hidden?: boolean;
}

export interface RoleRoutes {
  [key: string]: RouteItem[];
}
