import { GlobeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import Callout from "@/CAREUI/display/Callout";

import {
  getAppointmentsSchedulingTimeZone,
  getSchedulingTimeZoneAbbreviation,
  shouldShowSchedulingTimeZoneHint,
} from "@/pages/Appointments/schedulingTimeZone";

export function SchedulingTimeZoneCallout() {
  const { t } = useTranslation();
  const schedulingTimeZone = getAppointmentsSchedulingTimeZone();

  if (!shouldShowSchedulingTimeZoneHint(schedulingTimeZone)) {
    return null;
  }

  return (
    <Callout
      variant="warning"
      badge={
        <>
          <GlobeIcon className="size-4 shrink-0" aria-hidden />
          <span className="sr-only">{t("info")}</span>
        </>
      }
    >
      {t("appointment_times_in_timezone", {
        abbreviation: getSchedulingTimeZoneAbbreviation(schedulingTimeZone),
        timezone: schedulingTimeZone.replace(/_/g, " "),
      })}
    </Callout>
  );
}
