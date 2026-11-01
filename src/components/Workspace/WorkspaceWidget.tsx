import { Blocks, ShieldAlert } from "lucide-react";
import { useFullPath } from "raviger";
import { Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import {
  useCareAppEncounterWidgets,
  type CareAppEncounterWidget,
} from "@/hooks/useCareAppEncounterWidgets";
import { useCareApps } from "@/hooks/useCareApps";
import { ScopedQueryParamsProvider } from "@/hooks/useScopedQueryParams";
import { FavoriteFormsQuickActions } from "@/pages/Encounters/tabs/overview/FavoriteFormsQuickActions";
import { FormSubmissionDrafts } from "@/pages/Encounters/tabs/overview/FormSubmissionDrafts";
import { QuickActions } from "@/pages/Encounters/tabs/overview/quick-actions";
import { SummaryPanel } from "@/pages/Encounters/tabs/overview/summary-panel";
import { SummaryPanelActionsTab } from "@/pages/Encounters/tabs/overview/summary-panel-actions.tab";
import { Account } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/account";
import { AuditLogs } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/auditlogs";
import { DepartmentsAndTeams } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/department-and-team";
import { DischargeDetails } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/discharge-summary";
import { EncounterTags } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/encounter-tags";
import { HospitalizationDetails } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/hospitalisation";
import { Locations } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/locations";
import { ManageCareTeam } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/manage-care-team";
import { SummaryPanelReportsTab } from "@/pages/Encounters/tabs/overview/summary-panel-reports-tab";
import { PLUGIN_Component } from "@/PluginEngine";
import {
  ENCOUNTER_WIDGET_TYPES,
  encounterPageKeySchema,
} from "@/types/workspace/encounterWorkspace";
import { encounterSummaryConfigSchema } from "@/types/workspace/widgetConfigSchemas";

import { EncounterReferralsWidget } from "@/pages/Encounters/widgets/EncounterReferralsWidget";
import { EncounterResponsesWidget } from "@/pages/Encounters/widgets/EncounterResponsesWidget";
import { EncounterServiceRequestsWidget } from "@/pages/Encounters/widgets/EncounterServiceRequestsWidget";
import { EncounterVitalsWidget } from "@/pages/Encounters/widgets/EncounterVitalsWidget";
import { ObservationChartWidget } from "@/pages/Encounters/widgets/ObservationChartWidget";
import { OutstandingOrdersWidget } from "@/pages/Encounters/widgets/OutstandingOrdersWidget";
import {
  getWidgetAvailability,
  getWidgetRequirements,
  patientHistoryAccess,
  type WorkspaceWidgetContext,
} from "@/types/workspace/widgetAvailability";

import { CurrentMedicationsWidget } from "./CurrentMedicationsWidget";
import { RecentEncountersWidget } from "./RecentEncountersWidget";
import { workspaceWidgetLabel } from "./workspaceEditorCatalog";

export interface WorkspaceWidgetProps {
  type: string;
  title?: string;
  config?: Record<string, unknown>;
  showEmpty?: boolean;
  context: WorkspaceWidgetContext;
}

export function WorkspaceWidget(props: WorkspaceWidgetProps) {
  return (
    <ScopedQueryParamsProvider>
      <WorkspaceWidgetContent {...props} />
    </ScopedQueryParamsProvider>
  );
}

// A shared default keeps memoised children from seeing a new object each render.
const EMPTY_CONFIG: Record<string, unknown> = {};

function WorkspaceWidgetContent({
  type,
  title,
  config = EMPTY_CONFIG,
  showEmpty = false,
  context,
}: WorkspaceWidgetProps) {
  const { t } = useTranslation();
  const fullPath = useFullPath();
  const returnPage =
    encounterPageKeySchema.safeParse(fullPath.split("/").pop()).data ??
    "updates";
  const { widgets, loadingPlugins } = useCareAppEncounterWidgets();
  const careApps = useCareApps();
  const {
    facilityId,
    patientId,
    selectedEncounter,
    canReadSelectedEncounter,
    canWriteSelectedEncounter,
    canReadClinicalData,
    canWriteClinicalData,
  } = context;
  const selectedEncounterId = selectedEncounter?.id;

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

  const requirements = getWidgetRequirements(type, pluginWidget);
  const noClinicalAccess = (
    <EmptyState
      icon={<ShieldAlert className="size-8 text-placeholder-foreground" />}
      title={t(
        requirements.encounter === "none" ||
          (requirements.encounter === "optional" && !selectedEncounter)
          ? "workspace_patient_history_access_denied"
          : "no_permission_to_view_clinical_data",
      )}
      description={t("no_permission_to_view_clinical_data_description")}
    />
  );

  const availability = getWidgetAvailability(
    { type, config },
    context,
    pluginWidget,
  );
  if (availability.state === "hidden") return null;
  if (availability.state === "denied") return noClinicalAccess;

  const frame = (content: ReactNode) => (
    <section
      aria-label={title ?? workspaceWidgetLabel(type, t)}
      className="min-w-0 rounded-xl border border-border bg-background"
    >
      <h2 className="flex min-h-11 items-center border-b border-border px-3 py-1 text-sm font-bold tracking-wide text-soft-foreground uppercase [overflow-wrap:anywhere]">
        {title ?? workspaceWidgetLabel(type, t)}
      </h2>
      <div className="min-w-0 overflow-auto p-3">{content}</div>
    </section>
  );

  if (selectedEncounter && selectedEncounter.patient.id !== patientId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t("fill_patient_encounter_mismatch")}
        </AlertDescription>
      </Alert>
    );
  }

  // Widgets that merely tune an embedded tab still refuse to render with a
  // configuration the studio could not have saved.
  const invalidConfig = frame(
    <Alert variant="destructive">
      <AlertDescription>
        {t("encounter_widget_config_invalid")}
      </AlertDescription>
    </Alert>,
  );

  if (type === "current_medications") {
    return (
      <CurrentMedicationsWidget
        patientId={patientId}
        facilityId={facilityId}
        title={title}
        showEmpty={showEmpty}
        config={config}
      />
    );
  }
  if (type === "recent_encounters") {
    return (
      <RecentEncountersWidget
        patientId={patientId}
        facilityId={facilityId}
        selectedEncounterId={selectedEncounterId}
        title={title}
        showEmpty={showEmpty}
        config={config}
      />
    );
  }

  // Scoped to the selected encounter when there is one; history pages have
  // none, so these read across the patient's encounters instead.
  const historyGrants = patientHistoryAccess(context);
  const scope = {
    patientId,
    encounterId: selectedEncounterId,
    canRead: selectedEncounter
      ? canReadClinicalData
      : historyGrants.clinicalData,
  };
  const readOnly = !selectedEncounter || !canWriteClinicalData;
  const listProps = {
    facilityId,
    patientId,
    encounterId: selectedEncounterId,
    readOnly,
    title,
    showEmpty,
    showViewEncounter: !selectedEncounter,
    presentation: "panel" as const,
  };
  switch (type) {
    case "vitals":
      return (
        <EncounterVitalsWidget
          {...scope}
          title={title}
          showEmpty={showEmpty}
          config={config}
        />
      );
    case "observation_chart":
      return (
        <ObservationChartWidget {...scope} title={title} config={config} />
      );
    case "questionnaire_responses":
      return (
        <EncounterResponsesWidget
          {...scope}
          canRead={
            selectedEncounter ? canReadClinicalData : historyGrants.responses
          }
          facilityId={
            selectedEncounter && facilityId
              ? selectedEncounter.facility.id
              : facilityId
          }
          readOnly={readOnly}
          title={title}
          showEmpty={showEmpty}
          config={config}
        />
      );
    case "allergies":
      return (
        <AllergyList
          {...listProps}
          encounterStatus={selectedEncounter?.status}
        />
      );
    case "symptoms":
      return <SymptomsList {...listProps} />;
    case "diagnosis":
      return <DiagnosisList {...listProps} />;
  }

  const renderPlugin = (plugin: CareAppEncounterWidget, content: ReactNode) => (
    <div className="min-w-0 @container/encounter-widget">
      <PluginErrorBoundary
        key={`${type}:${patientId}:${selectedEncounterId ?? ""}:${JSON.stringify(config)}`}
        pluginName={plugin.pluginSlug}
        resetKey={plugin.component}
        fallback={
          <Alert variant="destructive">
            <AlertTitle>{title ?? type}</AlertTitle>
            <AlertDescription>
              {t("encounter_workspace_widget_error")}
            </AlertDescription>
          </Alert>
        }
      >
        <Suspense fallback={loading}>{content}</Suspense>
      </PluginErrorBoundary>
    </div>
  );

  if (pluginWidget?.supportsPatientHistory) {
    const Component = pluginWidget.component;
    return renderPlugin(
      pluginWidget,
      <Component
        patientId={patientId}
        encounterId={selectedEncounterId}
        encounter={selectedEncounter}
        facilityId={facilityId}
        title={title}
        config={config}
        readOnly={readOnly}
      />,
    );
  }

  if (!selectedEncounter || !selectedEncounterId) return null;

  // These cards contain encounter metadata and retain their own edit controls.
  if (canReadSelectedEncounter || canReadClinicalData) {
    switch (type) {
      case "encounter_tags":
        return <EncounterTags title={title} />;
      case "locations":
        return <Locations title={title} />;
      case "care_team":
        return (
          <ManageCareTeam
            key={selectedEncounterId}
            title={title ?? t("care_team")}
          />
        );
      case "departments":
        return <DepartmentsAndTeams title={title} />;
      case "hospitalization":
        return <HospitalizationDetails title={title} />;
      case "discharge":
        return <DischargeDetails title={title} />;
      case "audit_logs":
        return <AuditLogs title={title ?? t("workspace_widget_audit_logs")} />;
      case "account":
        return <Account title={title} />;
      case "encounter_summary": {
        const summaryConfig = encounterSummaryConfigSchema.safeParse(config);
        if (!summaryConfig.success) return invalidConfig;
        const only =
          summaryConfig.data?.tabs?.length === 1
            ? summaryConfig.data.tabs[0]
            : undefined;
        // A lone tab already carries its own header, so skip the frame.
        if (only === "reports")
          return (
            <SummaryPanelReportsTab
              title={title}
              activeTab="reports"
              embedded
            />
          );
        if (only === "actions")
          return facilityId && canWriteSelectedEncounter ? (
            <SummaryPanelActionsTab title={title} embedded />
          ) : null;
        return frame(
          <SummaryPanel
            embedded
            tabs={summaryConfig.data?.tabs}
            defaultTab={summaryConfig.data?.default_tab}
          />,
        );
      }
      case "referrals":
        // Referral access is granted separately from clinical data access.
        return (
          <EncounterReferralsWidget
            title={title}
            showEmpty={showEmpty}
            config={config}
          />
        );
    }
  }

  if (!canReadClinicalData) return noClinicalAccess;

  const actionProps = { title, showEmpty, returnPage };
  switch (type) {
    case "encounter_extensions": {
      // An empty frame tells users nothing; wait for apps, then hide if none contribute.
      const contributes =
        context.hasEncounterExtensions ??
        careApps.some(
          (app) => app.isLoading || !!app.components?.EncounterOverviewTop,
        );
      if (!contributes) return null;
      return frame(
        <PLUGIN_Component
          __name="EncounterOverviewTop"
          encounter={selectedEncounter}
          patientId={patientId}
          encounterId={selectedEncounterId}
        />,
      );
    }
    case "quick_actions":
      return facilityId &&
        (canWriteClinicalData ||
          context.selectedEncounterPermissions?.canCreateReferral) ? (
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
    case "service_requests":
      return (
        <EncounterServiceRequestsWidget
          title={title}
          showEmpty={showEmpty}
          config={config}
        />
      );
    case "outstanding_orders":
      return (
        <OutstandingOrdersWidget
          title={title}
          showEmpty={showEmpty}
          config={config}
        />
      );
  }

  if (!pluginWidget) return loading;

  const Component = pluginWidget.component;
  return renderPlugin(
    pluginWidget,
    <Component
      patientId={patientId}
      encounterId={selectedEncounterId}
      encounter={selectedEncounter}
      facilityId={facilityId}
      title={title}
      config={config}
      readOnly={!canWriteClinicalData}
    />,
  );
}
