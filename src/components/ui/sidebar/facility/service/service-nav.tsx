import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import useCurrentService from "@/pages/Facility/services/utils/useCurrentService";
import { Logs } from "lucide-react";

export function ServiceNav() {
  const { t } = useTranslation();

  const { service, facilityId } = useCurrentService();

  const baseUrl = `/facility/${facilityId}/services/${service?.id}`;

  return (
    <NavMain
      links={[
        {
          name: t("locations"),
          url: `${baseUrl}/locations`,
          icon: <CareIcon icon="l-map-pin" />,
        },
        {
          name: t("schedule"),
          url: `${baseUrl}/schedule`,
          icon: <CareIcon icon="l-calender" />,
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
