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

// Inventory and Pharmacy pages, for locations that use inventory
const INVENTORY_PAGES = [
  "inventory",
  "medication_requests",
  "medication_dispense",
  "medication_return",
];

// To Receive and the stock requests and deliveries it opens stay open, so
// transfers already on their way to the location can still be received, but
// not the forms that raise or edit them
function needsInventory(path: string) {
  const [page, kind, type, ...rest] = path.split("/").filter(Boolean);
  if (!INVENTORY_PAGES.includes(page)) return false;
  const isReceiving =
    page === "inventory" && kind === "internal" && type === "receive";
  return !isReceiving || rest.includes("new") || rest.includes("edit");
}

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
  // The path below the location, read the way the router matches it: the
  // router has already decoded it, and matching ignores case
  const path = (
    pathname.replace(new RegExp(`^${basePath}`, "i"), "") || "/"
  ).toLowerCase();

  // External supply is only for Store locations
  if (path.startsWith("/inventory/external")) {
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

  // Inventory and Pharmacy are only for locations that use inventory
  if (needsInventory(path)) {
    if (isLoading) return <Loading />;
    if ((location?.inventory_usage ?? "none") === "none") {
      return (
        <ErrorPage
          forError="CUSTOM_ERROR"
          title={t("inventory_unavailable")}
          message={t("inventory_needs_usage")}
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
