import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth, BYPASS_LOGIN } from "../hooks/useAuth"; // add bypass constant
import { roleRoutes, RouteItem } from "./routeConfig";
import Login from "../pages/login/loginPage";
import { VerticalLayout, HorizontalLayout } from "../components/Layout/index";
import { useLayout } from "../contexts/LayoutContext";
import { LocalStorageHelper } from "../utils/localStorageHelper";
import ForgotPasswordPage from "../pages/login/forgotPassword";

const ProtectedRoute: React.FC<{
  element: React.ReactElement;
  roles?: string[];
}> = ({ element }) => {
  const { isAuthenticated, setApplicationRole } = useAuth();

  // console.log('ProtectedRoute: isAuthenticated=', isAuthenticated, 'role=', localStorage.getItem("role"));
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }
  // Simplification: asking for a role check that might be causing the loop
  // If user is authenticated but no role is set, default to 'main'
  if (isAuthenticated && !localStorage.getItem("role")) {
    console.warn("No role found in localStorage, setting to 'main'");
    LocalStorageHelper.setObject("role", "main");
    setApplicationRole("main");
  }
  return element;
};

const renderRoutes = (
  routes: RouteItem[],
  parentPath: string = "",
): React.ReactNode => {
  return routes.map((route) => {
    const fullPath = `${parentPath}/${route.href}`.replace(/\/+/g, "/");
    return (
      <Route
        key={fullPath}
        path={fullPath}
        element={
          <ProtectedRoute
            element={route.subItems ? <Outlet /> : <route.element />}
            roles={route.roles}
          />
        }
      >
        {route.subItems && renderRoutes(route.subItems, fullPath)}
        {route.subItems && route.subItems.length === 0 && (
          <Route index element={<route.element />} />
        )}
      </Route>
    );
  });
};

const AppRoutes: React.FC = () => {
  const { layout } = useLayout();
  const { isAuthenticated, applicationRole } = useAuth();
  // const [applicationRole, setApplicationRole] = React.useState<string>(() => {
  //   const savedRole = localStorage.getItem(AUTH_APPLICATION_ROLE);
  //   return savedRole ? savedRole : 'main';
  // });
  // Memoize routes based on the applicationRole to avoid unnecessary recalculations
  const routesForProduct = React.useMemo(() => {
    const routes = roleRoutes[applicationRole as keyof typeof roleRoutes];
    if (!routes) {
      console.warn(
        `Routes for role '${applicationRole}' not found. Falling back to 'main'.`,
      );
      return roleRoutes["main"];
    }
    return routes;
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
          // if the user is already authenticated or bypass mode is active,
          // send them straight to the home page instead of showing login.
          isAuthenticated || BYPASS_LOGIN ? <Navigate to="/" replace /> : <Login />
        }
      />
      <Route element={<Layout />}>
        {routesForProduct && renderRoutes(routesForProduct)}
      </Route>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
