import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import { getPermissions } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import useCurrentService from "@/pages/Facility/services/utils/useCurrentService";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Logs } from "lucide-react";

export function ServiceNav() {
  const { t } = useTranslation();

  const { service, facilityId } = useCurrentService();
  const { facility } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const { canViewSchedule, canViewAppointments, canListTokens } =
    getPermissions(hasPermission, service?.permissions ?? []);
  const {
    canViewSchedule: canViewScheduleForFacility,
    canViewAppointments: canViewAppointmentsForFacility,
    canListTokens: canListTokensForFacility,
    canReadHealthcareService,
  } = getPermissions(hasPermission, facility?.permissions ?? []);

  const baseUrl = `/facility/${facilityId}/services/${service?.id}`;

  return (
    <NavMain
      links={[
        {
          name: t("locations"),
          url: `${baseUrl}/locations`,
          icon: <CareIcon icon="l-map-pin" />,
          visibility: canReadHealthcareService,
        },
        {
          name: t("schedule"),
          url: `${baseUrl}/schedule`,
          icon: <CareIcon icon="l-calender" />,
          visibility: canViewSchedule || canViewScheduleForFacility,
        },
        {
          name: t("appointments"),
          url: `${baseUrl}/appointments`,
          icon: <CareIcon icon="d-calendar" />,
          visibility: canViewAppointments || canViewAppointmentsForFacility,
        },
        {
          name: t("queues"),
          url: `${baseUrl}/queues`,
          icon: <Logs />,
          visibility: canListTokens || canListTokensForFacility,
        },
      ]}
    />
  );
}
