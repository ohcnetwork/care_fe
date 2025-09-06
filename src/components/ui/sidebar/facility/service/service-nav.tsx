import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
          name: t("locations"),
          url: `${baseUrl}/locations`,
          icon: <CareIcon icon="l-map-pin" />,
        },
        {
          name: t("queues"),
          url: `${baseUrl}/queues`,
          icon: <CareIcon icon="l-calender" />,
        },
      ]}
    />
  );
}
