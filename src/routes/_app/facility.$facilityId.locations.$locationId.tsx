import {
  createFileRoute,
  Outlet,
  useLocation,
  useParams,
} from "@tanstack/react-router";
import { RouterProvider as RavigerBasePathProvider } from "raviger";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId",
)({
  component: RouteComponent,
  staticData: { workspace: "location" },
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId",
  });
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { location, isLoading } = useCurrentLocation();
  const basePath = `/facility/${facilityId}/locations/${locationId}`;
  // Location pages still write links and `navigate()` calls relative to this
  // base, as raviger's nested `useRoutes` did. Keep that context until the
  // links use absolute routes.
  const relativePath =
    pathname.replace(new RegExp(`^${basePath}`, "i"), "") || "/";

  if (pathname.startsWith(`${basePath}/inventory/external`)) {
    if (isLoading) return <Loading />;
    if (location?.inventory_usage !== "store") {
      return (
        <ErrorPage
          forError="CUSTOM_ERROR"
          title={t("external_supply_unavailable")}
          message={t("external_supply_store_only")}
        />
      );
    }
  }

  return (
    <RavigerBasePathProvider basePath={basePath} path={relativePath}>
      <div>
        <Outlet />
      </div>
    </RavigerBasePathProvider>
  );
}
