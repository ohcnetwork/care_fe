import {
  Bed,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  House,
  Package,
  Pill,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

export function LocationNav() {
  const { t } = useTranslation();

  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();

  const baseUrl = `/facility/${facilityId}/locations/${locationId}`;

  return (
    <NavMain
      links={[
        {
          name: t("overview"),
          url: `${baseUrl}/overview`,
          icon: <House />,
        },
        {
          section: t("patient_care"),
          name: t("beds"),
          url: `${baseUrl}/beds`,
          icon: <Bed />,
        },
        {
          name: t("service_requests"),
          url: `${baseUrl}/service_requests`,
          icon: <FlaskConical />,
        },
        {
          section: t("services"),
          name: t("pharmacy"),
          url: `${baseUrl}/pharmacy`,
          icon: <Pill />,
          children: [
            {
              name: t("prescription_queue"),
              url: `${baseUrl}/medication_requests`,
            },
            {
              name: "℞ " + t("dispense"),
              url: `${baseUrl}/medication_dispense`,
            },
            {
              name: t("medication_return"),
              url: `${baseUrl}/medication_return`,
            },
          ],
        },
        {
          name: t("inventory"),
          url: `${baseUrl}/inventory/summary`,
          icon: <Package />,
          children: [
            {
              name: t("items"),
              url: `${baseUrl}/inventory/summary`,
            },
            {
              header: t("internal_transfers"),
              name: t("to_receive"),
              url: `${baseUrl}/inventory/internal/receive/`,
            },
            {
              name: t("to_dispatch"),
              url: `${baseUrl}/inventory/internal/dispatch/`,
            },
            {
              header: t("external_supply"),
              name: t("purchase_orders"),
              url: `${baseUrl}/inventory/external/orders/outgoing`,
            },
            {
              name: t("purchase_deliveries"),
              url: `${baseUrl}/inventory/external/deliveries/incoming`,
            },
          ],
        },
        {
          section: t("scheduling"),
          name: t("schedule"),
          url: `${baseUrl}/schedule`,
          icon: <CalendarClock />,
        },
        {
          name: t("appointments"),
          url: `${baseUrl}/appointments`,
          icon: <CalendarDays />,
        },
        {
          name: t("queues"),
          url: `${baseUrl}/queues`,
          icon: <Users />,
        },
        {
          section: t("forms"),
          name: t("responses"),
          url: `${baseUrl}/responses`,
          icon: <ClipboardList />,
        },
      ]}
    />
  );
}
