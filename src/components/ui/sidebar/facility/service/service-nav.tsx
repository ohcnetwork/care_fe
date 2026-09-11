import { CalendarClock, CalendarDays, MapPin, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import useCurrentService from "@/pages/Facility/services/utils/useCurrentService";

export function ServiceNav() {
  const { t } = useTranslation();

  const { service, facilityId } = useCurrentService();

  const baseUrl = `/facility/${facilityId}/services/${service?.id}`;

  return (
    <NavMain
      links={[
        {
          section: t("services"),
          name: t("locations"),
          url: `${baseUrl}/locations`,
          icon: <MapPin />,
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
      ]}
    />
  );
}
