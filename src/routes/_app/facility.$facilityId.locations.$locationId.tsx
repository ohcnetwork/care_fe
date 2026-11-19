import {
  createFileRoute,
  Outlet,
  useLocation,
  useParams,
} from "@tanstack/react-router";
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
    <div>
      <Outlet />
    </div>
  );
}
