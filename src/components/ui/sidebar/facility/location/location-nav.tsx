import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { CalendarIcon, Logs } from "lucide-react";

export function LocationNav() {
  const { t } = useTranslation();

  const { facility } = useCurrentFacility();
  const { location } = useCurrentLocation();

  const baseUrl = `/facility/${facility?.id}/locations/${location?.id}`;

  return (
    <NavMain
      links={[
        {
          name: t("beds"),
          url: `${baseUrl}/beds`,
          icon: <CareIcon icon="l-bed" />,
        },
        {
          name: t("laboratory"),
          url: `${baseUrl}/laboratory`,
          icon: <CareIcon icon="l-microscope" />,
          children: [
            {
              name: t("service_requests"),
              url: `${baseUrl}/service_requests`,
            },
          ],
        },
        {
          name: t("pharmacy"),
          url: `${baseUrl}/pharmacy`,
          icon: <CareIcon icon="l-medical-drip" />,
          children: [
            {
              name: t("prescription_queue"),
              url: `${baseUrl}/medication_requests`,
            },
            {
              name: "℞ " + t("dispense"),
              url: `${baseUrl}/medication_dispense`,
            },
          ],
        },
        {
          name: t("inventory"),
          url: `${baseUrl}/inventory`,
          icon: <CareIcon icon="l-shop" />,
          children: [
            {
              name: t("items"),
              url: `${baseUrl}/inventory`,
            },
            {
              header: t("orders"),
              name: t("outgoing_orders"),
              url: `${baseUrl}/internal_transfers/orders/outgoing`,
            },
            {
              name: t("incoming_orders"),
              url: `${baseUrl}/internal_transfers/orders/incoming`,
            },

            {
              header: t("deliveries"),
              name: t("outgoing_deliveries"),
              url: `${baseUrl}/internal_transfers/dispatched`,
            },
            {
              name: t("incoming_deliveries"),
              url: `${baseUrl}/internal_transfers/received`,
            },
            {
              header: t("external_supply"),
              name: t("purchase_orders"),
              url: `${baseUrl}/external_supply/request_orders`,
            },
            {
              name: t("purchase_deliveries"),
              url: `${baseUrl}/external_supply/delivery_orders`,
            },
          ],
        },
        {
          name: t("schedule"),
          url: `${baseUrl}/schedule`,
          icon: <CalendarIcon />,
        },
        {
          name: t("appointments"),
          url: `${baseUrl}/appointments`,
          icon: <CareIcon icon="d-calendar" />,
        },
        {
          name: t("queues"),
          url: `${baseUrl}/queues`,
          icon: <Logs />,
        },
      ]}
    />
  );
}
