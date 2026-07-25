// import React from "react";
// import { Routes, Route, Navigate, Outlet } from "react-router-dom";
// //import { useAuth } from "../hooks/useAuth";
// // import { roleRoutes, RouteItem } from "./routeConfig";
// import { roleRoutes } from "./routeConfig";
// import type { RouteItem } from "./routeTypes";
// import { useAuth, BYPASS_LOGIN } from "../hooks/useAuth"; // add bypass constant
// //import type { RouteItem } from "./routeTypes";
// import Login from "../pages/login/loginPage";
// import { VerticalLayout, HorizontalLayout } from "../components/Layout/index";
// import { useLayout } from "../contexts/LayoutContext";
// import { LocalStorageHelper } from "../utils/localStorageHelper";
// import ForgotPasswordPage from "../pages/login/forgotPassword";


// // import MainPage from "../pages/mainPage";

// const ProtectedRoute: React.FC<{
//   element: React.ReactElement;
//   roles?: string[];
// }> = ({ element }) => {
//   const { isAuthenticated, setApplicationRole } = useAuth();

//   // console.log('applicationRole:', applicationRole);

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   if (isAuthenticated && !localStorage.getItem("role")) {
//     LocalStorageHelper.setObject("role", "main");
//     setApplicationRole("main");
//     return <Navigate to="/" replace />;
//   }
//   return element;
// };

// const renderRoutes = (
//   routes: RouteItem[],
//   parentPath: string = ""
// ): React.ReactNode => {
//   return routes.map((route) => {
//     // const fullPath = `${parentPath}/${route.href}`.replace(/\/+/g, "/");
//     const hasNamedChildren =
//       route.subItems &&
//       route.subItems.length > 0 &&
//       route.subItems.some(
//         (s) => s.name !== "" && s.name !== "Create" && s.name !== "Update" && !s.hidden
//       );
//     // For nested routes, use the relative path (href)
//     // For top-level routes or routes with absolute paths, use the full path
//     const fullPath = route.href.startsWith("/")
//       ? route.href
//       : `${parentPath}/${route.href}`.replace(/\/+/g, "/");
    
//     // For the React Router path prop:
//     // - If this is a nested route (parentPath is set), use only the route.href
//     // - Otherwise use the fullPath
//     const routePath = parentPath ? route.href : fullPath;
    
//     const RouteElement = route.subItems && route.subItems.length > 0 ? Outlet : route.element;

//     return (
//       <Route
//         key={fullPath}
//         path={routePath}
//         element={
//           <ProtectedRoute
//             element={hasNamedChildren ? <Outlet /> : <route.element />}
//             element={<RouteElement />}
//             roles={route.roles}
//           />
//         }
//       >
//         {/* If this route has named sub-routes, add parent's component as index */}
//         {hasNamedChildren && (
//           <Route index element={<route.element />} />
//         )}
//         {/* Render named sub-route children */}
//         {route.subItems && renderRoutes(route.subItems, fullPath)}
//         {/* Legacy: index for routes with empty subItems array */}
//         {route.subItems && route.subItems.length === 0 && (
//           <Route index element={<route.element />} />
//         )}
//       </Route>
//     );
//   });
// };

// const AppRoutes: React.FC = () => {
//   const { layout } = useLayout();
//   const { isAuthenticated, applicationRole } = useAuth();
//   // const [applicationRole, setApplicationRole] = React.useState<string>(() => {
//   //   const savedRole = localStorage.getItem(AUTH_APPLICATION_ROLE);
//   //   return savedRole ? savedRole : 'main';
//   // });
//   // Memoize routes based on the applicationRole to avoid unnecessary recalculations
//   const routesForProduct = React.useMemo(() => {
//     return roleRoutes[applicationRole as keyof typeof roleRoutes];
//     try {
//       const { roleRoutes } = require("./routeConfig") as any;
//       const routes = roleRoutes[applicationRole as string];
//       if (!routes) {
//         console.warn(
//           `Routes for role '${applicationRole}' not found. Falling back to 'main'.`,
//         );
//         return roleRoutes["main"];
//       }
//       return routes;
//     } catch (e) {
//       console.error("Failed to load roleRoutes:", e);
//       return [];
//     }
//   }, [applicationRole]);

//   const Layout =
//     layout === "HORIZONTAL" || applicationRole === "main"
//       ? HorizontalLayout
//       : VerticalLayout;

//   return (
//     <Routes>
//       <Route
//         path="/login"
//         element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
//       />

//       <Route element={<Layout />}>
//         {routesForProduct && renderRoutes(routesForProduct)}
//       </Route>

//       <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//       <Route path="*" element={<Navigate to="/login" replace />} />
//     </Routes>
//   );
// };

// export default AppRoutes;
import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { roleRoutes } from "./routeConfig";
import type { RouteItem } from "./routeTypes";
import { useAuth } from "../hooks/useAuth";
import Login from "../pages/login/loginPage";
import { VerticalLayout, HorizontalLayout } from "../components/Layout";
import { useLayout } from "../contexts/LayoutContext";
import { LocalStorageHelper } from "../utils/localStorageHelper";
import ForgotPasswordPage from "../pages/login/forgotPassword";

const ProtectedRoute: React.FC<{
  element: React.ReactElement;
  roles?: string[];
}> = ({ element }) => {
  const { isAuthenticated, setApplicationRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && !localStorage.getItem("role")) {
    LocalStorageHelper.setObject("role", "main");
    setApplicationRole("main");
    return <Navigate to="/" replace />;
  }

  return element;
};

const renderRoutes = (
  routes: RouteItem[],
  parentPath = ""
): React.ReactNode => {
  return routes.map((route) => {
    const fullPath = route.href.startsWith("/")
      ? route.href
      : `${parentPath}/${route.href}`.replace(/\/+/g, "/");

    const routePath = parentPath ? route.href : fullPath;

    const hasNamedChildren =
      route.subItems &&
      route.subItems.length > 0 &&
      route.subItems.some(
        (s) =>
          s.name !== "" &&
          s.name !== "Create" &&
          s.name !== "Update" &&
          !s.hidden
      );

    const RouteElement =
      route.subItems && route.subItems.length > 0
        ? Outlet
        : route.element;

    return (
      <Route
        key={fullPath}
        path={routePath}
        element={
          <ProtectedRoute
            element={
              hasNamedChildren ? <Outlet /> : <RouteElement />
            }
            roles={route.roles}
          />
        }
      >
        {hasNamedChildren && route.element && (
          <Route index element={<route.element />} />
        )}

        {route.subItems &&
          renderRoutes(route.subItems, fullPath)}

        {route.subItems &&
          route.subItems.length === 0 &&
          route.element && (
            <Route index element={<route.element />} />
          )}
      </Route>
    );
  });
};

const AppRoutes: React.FC = () => {
  const { layout } = useLayout();
  const { isAuthenticated, applicationRole } = useAuth();

  const routesForProduct = React.useMemo(() => {
    return (
      roleRoutes[applicationRole as keyof typeof roleRoutes] ||
      roleRoutes.main
    );
  }, [applicationRole]);

  const Layout =
    layout === "HORIZONTAL" || applicationRole === "main"
      ? HorizontalLayout
      : VerticalLayout;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route element={<Layout />}>
        {routesForProduct &&
          renderRoutes(routesForProduct)}
      </Route>

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;