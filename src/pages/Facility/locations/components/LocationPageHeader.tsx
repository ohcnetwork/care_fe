import { usePath } from "raviger";
import { useTranslation } from "react-i18next";

import { InnerPageHeader } from "@/components/Common/InnerPageHeader";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";

export function LocationPageHeader() {
  const { t } = useTranslation();
  const { facilityId, locationId, location } = useCurrentLocation();
  const path = usePath() ?? "";
  const baseUrl = `/facility/${facilityId}/locations/${locationId}`;
  const section = path.slice(baseUrl.length);
  const pageTitles = [
    ["/responses", t("responses")],
    ["/forms", t("responses")],
    ["/beds", t("beds")],
    ["/service_requests", t("service_requests")],
    ["/medication_requests", t("prescription_queue")],
    ["/medication_dispense", t("dispense")],
    ["/medication_return", t("medication_return")],
    ["/inventory/internal/receive", t("to_receive")],
    ["/inventory/internal/dispatch", t("to_dispatch")],
    ["/inventory/external/orders", t("purchase_orders")],
    ["/inventory/external/deliveries", t("purchase_deliveries")],
    ["/inventory", t("inventory")],
    ["/schedule", t("schedule")],
    ["/appointments", t("appointments")],
    ["/queues", t("queues")],
  ];
  const pageTitle =
    pageTitles.find(([prefix]) => section.startsWith(prefix))?.[1] ??
    t("overview");

  return (
    <InnerPageHeader
      dataCy="location-page-header"
      breadcrumbs={[
        { label: location?.name ?? t("location"), href: `${baseUrl}/overview` },
        { label: pageTitle },
      ]}
    />
  );
}
