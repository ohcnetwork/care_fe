import { usePath, useRoutes } from "raviger";

import { Spinner } from "@/components/ui/spinner";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import {
  useCareApps,
  useOrganizationRoutes,
  usePluginRoutes,
} from "@/hooks/useCareApps";

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

/**
 * The legacy catch-all (`src/routes/_app/_legacy/$.tsx`). Every core page is
 * a file route now. This renders only the routes that still come from
 * plugin manifests here: plugin `routes` (the TanStack tree also attaches
 * them, and a TanStack match always wins) and plugin organization tabs
 * (`/organization/:id/<slug>`). An unknown path shows a spinner while
 * plugin manifests load, and not-found after that.
 */
export default function AppRouter() {
  const pluginRoutes = usePluginRoutes();
  const organizationRoutes = useOrganizationRoutes();
  const careApps = useCareApps();
  const pages = useRoutes({ ...pluginRoutes, ...organizationRoutes });
  const currentPath = usePath();

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
