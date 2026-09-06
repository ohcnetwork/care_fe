import { useTranslation } from "react-i18next";

import { Separator } from "@/components/ui/separator";
import { NavMain } from "@/components/ui/sidebar/nav-main";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  Bed,
  CalendarDays,
  CalendarIcon,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Logs,
  Package,
  Pill,
} from "lucide-react";

export function LocationNav() {
  const { t } = useTranslation();

  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();

  const baseUrl = `/facility/${facilityId}/locations/${locationId}`;

  return (
    <>
      <NavMain
        appearance="careui"
        links={[
          {
            name: t("overview"),
            url: `${baseUrl}/overview`,
            icon: <LayoutDashboard />,
          },
        ]}
      />
      <Separator className="mx-4 bg-neutral-200 data-[orientation=horizontal]:w-auto group-data-[collapsible=icon]:mx-2" />
      <NavMain
        appearance="careui"
        label={t("patient_care")}
        links={[
          {
            name: t("beds"),
            url: `${baseUrl}/beds`,
            icon: <Bed />,
          },
          {
            name: t("service_requests"),
            url: `${baseUrl}/service_requests`,
            icon: <FlaskConical />,
          },
        ]}
      />
      <Separator className="mx-4 bg-neutral-200 data-[orientation=horizontal]:w-auto group-data-[collapsible=icon]:mx-2" />
      <NavMain
        appearance="careui"
        label={t("services")}
        links={[
          {
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
        ]}
      />
      <Separator className="mx-4 bg-neutral-200 data-[orientation=horizontal]:w-auto group-data-[collapsible=icon]:mx-2" />
      <NavMain
        appearance="careui"
        label={t("scheduling")}
        links={[
          {
            name: t("schedule"),
            url: `${baseUrl}/schedule`,
            icon: <CalendarIcon />,
          },
          {
            name: t("appointments"),
            url: `${baseUrl}/appointments`,
            icon: <CalendarDays />,
          },
          {
            name: t("queues"),
            url: `${baseUrl}/queues`,
            icon: <Logs />,
          },
        ]}
      />
      <Separator className="mx-4 bg-neutral-200 data-[orientation=horizontal]:w-auto group-data-[collapsible=icon]:mx-2" />
      <NavMain
        appearance="careui"
        label={t("forms")}
        links={[
          {
            name: t("responses"),
            url: `${baseUrl}/responses`,
            icon: <ClipboardList />,
          },
        ]}
      />
    </>
  );
}
