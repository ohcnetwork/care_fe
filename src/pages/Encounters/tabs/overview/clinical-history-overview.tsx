import { Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { HrefLink } from "@/lib/router/HrefLink";
import { usePathname } from "@/lib/router/location";
import { useQueryParams } from "@/lib/router/queryParams";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export const ClinicalHistoryOverview = () => {
  const { t } = useTranslation();
  const { facilityId, patientId } = useEncounter();
  const path = usePathname();
  const [queryParams] = useQueryParams();
  const search = new URLSearchParams(queryParams).toString();
  const sourceUrl = search ? `${path}?${search}` : path;
  const patientPath = facilityId
    ? `/facility/${facilityId}/patient/${patientId}`
    : `/patient/${patientId}`;

  return (
    <Button
      asChild
      variant="link"
      className="h-10 gap-2 px-0 text-sm font-semibold text-gray-950 underline underline-offset-2 hover:text-gray-700"
    >
      <HrefLink
        href={`${patientPath}/history/responses?sourceUrl=${encodeURIComponent(sourceUrl)}`}
      >
        <Stethoscope aria-hidden="true" className="size-4" strokeWidth={1.75} />
        {t("clinical_history")}
        <ShortcutBadge actionId="clinical-history" alwaysShow={false} />
      </HrefLink>
    </Button>
  );
};
