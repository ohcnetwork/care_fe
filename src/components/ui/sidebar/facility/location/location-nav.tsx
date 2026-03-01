import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { CalendarIcon, Logs } from "lucide-react";

export function LocationNav() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  const { facilityId, facility, isFacilityLoading } = useCurrentFacility();
  const { locationId } = useCurrentLocation();

  const {
    canListFacilityLocations,
    canReadServiceRequest,
    isPharmacist,
    canReadMedicationDispense,
    canReadInventoryItem,
    canReadSupplyRequest,
    canReadSupplyDelivery,
    canViewSchedule,
    canViewAppointments,
    canListTokens,
  } = getPermissions(hasPermission, facility?.permissions ?? []);

  if (isFacilityLoading) return null;

  const baseUrl = `/facility/${facilityId}/locations/${locationId}`;

  return (
    <NavMain
      links={[
        {
          name: t("beds"),
          url: `${baseUrl}/beds`,
          icon: <CareIcon icon="l-bed" />,
          visibility: canListFacilityLocations,
        },
        {
          name: t("laboratory"),
          url: `${baseUrl}/laboratory`,
          icon: <CareIcon icon="l-microscope" />,
          visibility: canReadServiceRequest,
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
          visibility: isPharmacist || canReadMedicationDispense,
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
          icon: <CareIcon icon="l-shop" />,
          children: [
            {
              name: t("items"),
              url: `${baseUrl}/inventory/summary`,
              visibility: canReadInventoryItem,
            },
            {
              header: t("internal_transfers"),
              name: t("to_receive"),
              url: `${baseUrl}/inventory/internal/receive/`,
              visibility: canReadSupplyRequest,
            },
            {
              name: t("to_dispatch"),
              url: `${baseUrl}/inventory/internal/dispatch/`,
              visibility: canReadSupplyRequest || canReadSupplyDelivery,
            },
            {
              header: t("external_supply"),
              name: t("purchase_orders"),
              url: `${baseUrl}/inventory/external/orders/outgoing`,
              visibility: canReadSupplyRequest,
            },
            {
              name: t("purchase_deliveries"),
              url: `${baseUrl}/inventory/external/deliveries/incoming`,
              visibility: canReadSupplyDelivery,
            },
          ],
        },
        {
          name: t("schedule"),
          url: `${baseUrl}/schedule`,
          icon: <CalendarIcon />,
          visibility: canViewSchedule,
        },
        {
          name: t("appointments"),
          url: `${baseUrl}/appointments`,
          icon: <CareIcon icon="d-calendar" />,
          visibility: canViewAppointments,
        },
        {
          name: t("queues"),
          url: `${baseUrl}/queues`,
          icon: <Logs />,
          visibility: canListTokens,
        },
      ]}
    />
  );
}
