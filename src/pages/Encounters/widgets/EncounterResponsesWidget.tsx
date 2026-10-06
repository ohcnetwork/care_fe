import { useTranslation } from "react-i18next";

import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { responsesConfigSchema } from "@/types/workspace/widgetConfigSchemas";

interface EncounterResponsesWidgetProps {
  title?: string;
  showEmpty?: boolean;
  config?: Record<string, unknown>;
}

export function EncounterResponsesWidget({
  title,
  showEmpty = false,
  config = {},
}: EncounterResponsesWidgetProps) {
  const { t } = useTranslation();
  const {
    patientId,
    selectedEncounterId,
    selectedEncounter,
    facilityId,
    canReadClinicalData,
    canWriteClinicalData,
  } = useEncounter();
  const parsedConfig = responsesConfigSchema.safeParse(config);
  if (!parsedConfig.success) {
    return (
      <section aria-label={title ?? t("questionnaire_responses")}>
        <Alert variant="destructive">
          <AlertDescription>
            {t("encounter_widget_config_invalid")}
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <QuestionnaireResponsesList
      patientId={patientId}
      encounterId={selectedEncounterId}
      facilityId={facilityId ? selectedEncounter?.facility.id : undefined}
      canAccess={canReadClinicalData}
      readOnly={!canWriteClinicalData}
      title={title}
      showEmpty={showEmpty}
      questionnaireSlug={parsedConfig.data.questionnaire_slug}
      onlyUnstructured={parsedConfig.data.only_unstructured}
      limit={parsedConfig.data.limit}
      presentation="panel"
    />
  );
}
