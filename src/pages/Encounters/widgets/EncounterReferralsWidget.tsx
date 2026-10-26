import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { ReferralList } from "@/components/Referral/ReferralList";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { parseEncounterWorkspace } from "@/pages/Encounters/workspace/parseEncounterWorkspace";
import { useEncounterWorkspaces } from "@/pages/Encounters/workspace/useEncounterWorkspaces";
import { SYSTEM_PAGE_KEYS } from "@/types/workspace/encounterWorkspace";
import { referralsConfigSchema } from "@/types/workspace/widgetConfigSchemas";

interface EncounterReferralsWidgetProps {
  title?: string;
  showEmpty?: boolean;
  config?: Record<string, unknown>;
}

export function EncounterReferralsWidget({
  title,
  showEmpty = false,
  config = {},
}: EncounterReferralsWidgetProps) {
  const { t } = useTranslation();
  const {
    selectedEncounter,
    selectedEncounterId,
    primaryEncounterId,
    selectedEncounterPermissions,
    patientId,
  } = useEncounter();
  const { defaults, list, workspace } = useEncounterWorkspaces(
    selectedEncounter?.encounter_class,
  );
  const canViewAll =
    !defaults.isLoading &&
    !list.isLoading &&
    (!workspace ||
      parseEncounterWorkspace(workspace.template, SYSTEM_PAGE_KEYS).pages.some(
        (page) =>
          page.kind === "system" && page.key === "referrals" && !page.hidden,
      ));
  const { canReadReferral } = selectedEncounterPermissions;
  if (
    !selectedEncounter ||
    selectedEncounter.id !== selectedEncounterId ||
    selectedEncounter.patient.id !== patientId ||
    !canReadReferral
  )
    return null;

  const heading = title ?? t("referrals");
  const parsedConfig = referralsConfigSchema.safeParse(config);
  if (!parsedConfig.success) {
    return (
      <section aria-label={heading}>
        <Alert variant="destructive">
          <AlertDescription>
            {t("encounter_widget_config_invalid")}
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <ReferralList
      scope={{ patientId, encounterId: selectedEncounterId }}
      variant="widget"
      title={heading}
      showEmpty={showEmpty}
      widgetConfig={parsedConfig.data}
      onViewAll={
        canViewAll
          ? () =>
              navigate("referrals", {
                query:
                  selectedEncounterId !== primaryEncounterId
                    ? { selectedEncounter: selectedEncounterId }
                    : undefined,
              })
          : undefined
      }
    />
  );
}
