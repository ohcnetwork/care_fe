import { Blocks, ShieldAlert } from "lucide-react";
import { useFullPath } from "raviger";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import { useCareAppEncounterWidgets } from "@/hooks/useCareAppEncounterWidgets";
import { FavoriteFormsQuickActions } from "@/pages/Encounters/tabs/overview/FavoriteFormsQuickActions";
import { FormSubmissionDrafts } from "@/pages/Encounters/tabs/overview/FormSubmissionDrafts";
import { QuickActions } from "@/pages/Encounters/tabs/overview/quick-actions";
import { SummaryPanelActionsTab } from "@/pages/Encounters/tabs/overview/summary-panel-actions.tab";
import { AuditLogs } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/auditlogs";
import { DepartmentsAndTeams } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/department-and-team";
import { DischargeDetails } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/discharge-summary";
import { EncounterTags } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/encounter-tags";
import { HospitalizationDetails } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/hospitalisation";
import { Locations } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/locations";
import { ManageCareTeam } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/manage-care-team";
import { SummaryPanelReportsTab } from "@/pages/Encounters/tabs/overview/summary-panel-reports-tab";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  ENCOUNTER_WIDGET_TYPES,
  encounterPageKeySchema,
} from "@/types/workspace/encounterWorkspace";

import { EncounterResponsesWidget } from "./EncounterResponsesWidget";
import { EncounterServiceRequestsWidget } from "./EncounterServiceRequestsWidget";
import { EncounterVitalsWidget } from "./EncounterVitalsWidget";

interface EncounterWidgetProps {
  type: string;
  title?: string;
  config?: Record<string, unknown>;
  showEmpty?: boolean;
}

export function EncounterWidget({
  type,
  title,
  config = {},
  showEmpty = false,
}: EncounterWidgetProps) {
  const { t } = useTranslation();
  const fullPath = useFullPath();
  const returnPage =
    encounterPageKeySchema.safeParse(fullPath.split("/").pop()).data ??
    "updates";
  const { widgets, loadingPlugins } = useCareAppEncounterWidgets();
  const {
    facilityId,
    patientId,
    selectedEncounterId,
    selectedEncounter,
    isSelectedEncounterLoading,
    canReadSelectedEncounter,
    canReadClinicalData,
    canWriteClinicalData,
  } = useEncounter();

  const loading = (
    <div role="status" aria-label={t("loading")}>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
  const isCoreWidget = ENCOUNTER_WIDGET_TYPES.includes(type);
  const pluginWidget = widgets.get(type);
  const isPluginLoading =
    type.includes(".") && loadingPlugins.has(type.split(".")[0]);

  if (!isCoreWidget && !pluginWidget && !isPluginLoading) {
    return (
      <Alert>
        <Blocks aria-hidden="true" />
        <AlertTitle className="line-clamp-none break-words">
          {title ?? type}
        </AlertTitle>
        <AlertDescription>
          {t("encounter_workspace_widget_unavailable")}
        </AlertDescription>
      </Alert>
    );
  }

  if (isSelectedEncounterLoading) return loading;

  const noClinicalAccess = (
    <EmptyState
      icon={<ShieldAlert className="size-8 text-gray-400" />}
      title={t("no_permission_to_view_clinical_data")}
      description={t("no_permission_to_view_clinical_data_description")}
    />
  );

  if (!selectedEncounter) return noClinicalAccess;

  if (selectedEncounter.patient.id !== patientId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t("fill_patient_encounter_mismatch")}
        </AlertDescription>
      </Alert>
    );
  }

  // These cards contain encounter metadata and retain their own edit controls.
  if (canReadSelectedEncounter || canReadClinicalData) {
    switch (type) {
      case "encounter_tags":
        return <EncounterTags title={title} />;
      case "locations":
        return <Locations title={title} />;
      case "care_team":
        return <ManageCareTeam key={selectedEncounterId} title={title} />;
      case "departments":
        return <DepartmentsAndTeams title={title} />;
      case "hospitalization":
        return <HospitalizationDetails title={title} />;
      case "discharge":
        return <DischargeDetails title={title} />;
      case "audit_logs":
        return <AuditLogs title={title} />;
    }
  }

  if (!canReadClinicalData) return noClinicalAccess;

  const actionProps = { title, showEmpty, returnPage };
  switch (type) {
    case "quick_actions":
      return facilityId && canWriteClinicalData ? (
        <QuickActions {...actionProps} />
      ) : null;
    case "favorite_forms":
      return facilityId && canWriteClinicalData ? (
        <FavoriteFormsQuickActions {...actionProps} />
      ) : null;
    case "draft_forms":
      return facilityId && canWriteClinicalData ? (
        <FormSubmissionDrafts
          {...actionProps}
          facilityId={facilityId}
          patientId={patientId}
          encounterId={selectedEncounterId}
        />
      ) : null;
    case "encounter_actions":
      return facilityId && canWriteClinicalData ? (
        <SummaryPanelActionsTab title={title} embedded />
      ) : null;
    case "reports":
      return (
        <SummaryPanelReportsTab title={title} activeTab="reports" embedded />
      );
    case "vitals":
      return <EncounterVitalsWidget title={title} showEmpty={showEmpty} />;
    case "service_requests":
      return (
        <EncounterServiceRequestsWidget
          title={title}
          showEmpty={showEmpty}
          config={config}
        />
      );
    case "questionnaire_responses":
      return (
        <EncounterResponsesWidget
          title={title}
          showEmpty={showEmpty}
          config={config}
        />
      );
  }

  const props = {
    facilityId,
    patientId,
    encounterId: selectedEncounterId,
    readOnly: !canWriteClinicalData,
    title,
    showEmpty,
    showViewEncounter: false,
    presentation: "panel" as const,
  };

  switch (type) {
    case "allergies":
      return (
        <AllergyList {...props} encounterStatus={selectedEncounter.status} />
      );
    case "symptoms":
      return <SymptomsList {...props} />;
    case "diagnosis":
      return <DiagnosisList {...props} />;
  }

  if (!pluginWidget) return loading;

  const Component = pluginWidget.component;
  return (
    <div className="min-w-0 @container/encounter-widget">
      <PluginErrorBoundary
        key={`${type}:${patientId}:${selectedEncounterId}:${JSON.stringify(config)}`}
        pluginName={pluginWidget.pluginSlug}
        resetKey={Component}
        fallback={
          <Alert variant="destructive">
            <AlertTitle>{title ?? type}</AlertTitle>
            <AlertDescription>
              {t("encounter_workspace_widget_error")}
            </AlertDescription>
          </Alert>
        }
      >
        <Suspense fallback={loading}>
          <Component
            patientId={patientId}
            encounterId={selectedEncounterId}
            encounter={selectedEncounter}
            facilityId={facilityId}
            title={title}
            config={config}
            readOnly={!canWriteClinicalData}
          />
        </Suspense>
      </PluginErrorBoundary>
    </div>
  );
}
