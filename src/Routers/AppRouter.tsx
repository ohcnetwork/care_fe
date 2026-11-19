import { usePath, useRoutes } from "raviger";

import IconIndex from "@/CAREUI/icons/Index";

import { Spinner } from "@/components/ui/spinner";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import {
  useCareApps,
  useOrganizationRoutes,
  usePluginRoutes,
} from "@/hooks/useCareApps";

import ConsultationRoutes from "@/Routers/routes/ConsultationRoutes";
import FacilityRoutes from "@/Routers/routes/FacilityRoutes";
import OrganizationRoutes from "@/Routers/routes/OrganizationRoutes";
import PatientRoutes from "@/Routers/routes/PatientRoutes";
import ResourceRoutes from "@/Routers/routes/ResourceRoutes";
import ScheduleRoutes from "@/Routers/routes/ScheduleRoutes";
import UserRoutes from "@/Routers/routes/UserRoutes";
import AdminRoutes from "@/Routers/routes/adminRoutes";

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

// "/", "/session-expired", "/licenses", "/referrals/*", "/user" and the
// public pages are routes in src/routes/.
const Routes: AppRoutes = {
  ...ConsultationRoutes,
  ...FacilityRoutes,
  ...PatientRoutes,
  ...ResourceRoutes,
  ...ScheduleRoutes,
  ...UserRoutes,
  ...OrganizationRoutes,

  "/not-found": () => <ErrorPage />,
  "/icons": () => <IconIndex />,

  // Only include the icon route in development environment
  ...(import.meta.env.PROD ? { "/icons": () => <IconIndex /> } : {}),
};

const AdminRouter: AppRoutes = {
  ...AdminRoutes,
};

/**
 * Legacy staff route tables. The `_legacy` layout
 * (`src/routes/_app/_legacy.tsx`) renders them for every staff path that is
 * not migrated yet; shared routes render them for staff users. The staff shell lives in `AppShell`. Plugin
 * routes still merge here; the TanStack tree also attaches them, and a
 * TanStack match always wins over the splat.
 */
export default function AppRouter() {
  const pluginRoutes = usePluginRoutes();
  const organizationRoutes = useOrganizationRoutes();
  const careApps = useCareApps();
  let routes = Routes;

  // Merge in Plugin Routes
  routes = {
    ...pluginRoutes,
    ...organizationRoutes,
    ...routes,
  };

  const appPages = useRoutes(routes);
  const adminPages = useRoutes(AdminRouter);
  const currentPath = usePath();

  const pages = appPages || adminPages;
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
