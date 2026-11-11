import { useTranslation } from "react-i18next";

import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { Alert, AlertDescription } from "@/components/ui/alert";

import useAuthUser from "@/hooks/useAuthUser";

import { responsesConfigSchema } from "@/types/workspace/widgetConfigSchemas";

interface EncounterResponsesWidgetProps {
  patientId: string;
  /** Omit on history pages to list responses from every encounter. */
  encounterId?: string;
  facilityId?: string;
  canRead: boolean;
  readOnly: boolean;
  title?: string;
  showEmpty?: boolean;
  config?: Record<string, unknown>;
}

export function EncounterResponsesWidget({
  patientId,
  encounterId,
  facilityId,
  canRead,
  readOnly,
  title,
  showEmpty = false,
  config = {},
}: EncounterResponsesWidgetProps) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
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
      encounterId={encounterId}
      facilityId={facilityId}
      canAccess={canRead}
      readOnly={readOnly}
      title={title}
      showEmpty={showEmpty}
      questionnaireSlug={parsedConfig.data.questionnaire_slug}
      authorRoleId={parsedConfig.data.role}
      createdBy={
        parsedConfig.data.authored_by === "me" ? authUser.id : undefined
      }
      onlyUnstructured={parsedConfig.data.only_unstructured}
      limit={parsedConfig.data.limit}
      presentation="panel"
    />
  );
}
