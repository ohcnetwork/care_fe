import { Redirect, usePath, useRedirect, useRoutes } from "raviger";

import IconIndex from "@/CAREUI/icons/Index";

import { Spinner } from "@/components/ui/spinner";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import SessionExpired from "@/components/ErrorPages/SessionExpired";

import {
  useCareApps,
  useOrganizationRoutes,
  usePluginRoutes,
} from "@/hooks/useCareApps";

import { routes as publicRoutes } from "@/Routers/PublicRouter";
import ConsultationRoutes from "@/Routers/routes/ConsultationRoutes";
import FacilityRoutes from "@/Routers/routes/FacilityRoutes";
import OrganizationRoutes from "@/Routers/routes/OrganizationRoutes";
import PatientRoutes from "@/Routers/routes/PatientRoutes";
import ReferralRoutes from "@/Routers/routes/ReferralRoutes";
import ResourceRoutes from "@/Routers/routes/ResourceRoutes";
import ScheduleRoutes from "@/Routers/routes/ScheduleRoutes";
import UserRoutes from "@/Routers/routes/UserRoutes";
import AdminRoutes from "@/Routers/routes/adminRoutes";
import { LicensesPage } from "@/pages/Licenses/Licenses";
import UserDashboard from "@/pages/UserDashboard";

export type RouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [_ in Param | keyof RouteParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
      ? { [_ in Param]: string }
      : Record<string, never>;

export type RouteFunction<T extends string> = (
  params: RouteParams<T>,
) => React.ReactNode;

export type AppRoutes = {
  [K in string]: RouteFunction<K>;
};

const Routes: AppRoutes = {
  "/": () => <UserDashboard />,
  ...ConsultationRoutes,
  ...FacilityRoutes,
  ...PatientRoutes,
  ...ReferralRoutes,
  ...ResourceRoutes,
  ...ScheduleRoutes,
  ...UserRoutes,
  ...OrganizationRoutes,

  "/session-expired": () => <SessionExpired />,
  "/not-found": () => <ErrorPage />,
  "/icons": () => <IconIndex />,
  "/licenses": () => <LicensesPage />,

  // Only include the icon route in development environment
  ...(import.meta.env.PROD ? { "/icons": () => <IconIndex /> } : {}),
};

const AdminRouter: AppRoutes = {
  ...AdminRoutes,
};

const publicRedirects = Object.fromEntries(
  Object.keys(publicRoutes).map((path) => [path, () => <Redirect to="/" />]),
);

/**
 * Legacy route tables, rendered by the `$` splat of the TanStack route tree
 * (`src/routes/_app/$.tsx`) for every path that is not migrated yet. The app
 * chrome lives in `AppShell`. Plugin routes still merge here; the TanStack
 * tree also attaches them, and a TanStack match always wins over the splat.
 */
export default function AppRouter() {
  const pluginRoutes = usePluginRoutes();
  const organizationRoutes = useOrganizationRoutes();
  const careApps = useCareApps();
  let routes = Routes;

  useRedirect("/user", "/users");

  // Merge in Plugin Routes
  routes = {
    ...pluginRoutes,
    ...organizationRoutes,
    ...routes,
  };

  const appPages = useRoutes(routes);
  const adminPages = useRoutes(AdminRouter);
  const publicRedirectsPages = useRoutes(publicRedirects);
  const currentPath = usePath();

  const pages = appPages || adminPages || publicRedirectsPages;
  if (pages) return pages;

  // A plugin may still own this path. Show a spinner until every manifest has
  // loaded, and not-found only after that.
  if (careApps.some((app) => app.isLoading)) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        data-cy="plugin-routes-loading"
        data-path={currentPath}
      >
        <Spinner role="status" aria-label="Loading" className="size-6" />
      </div>
    );
  }

  return <ErrorPage />;
}
