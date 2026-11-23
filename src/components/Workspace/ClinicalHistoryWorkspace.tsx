import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getPermissions } from "@/common/Permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NavTabs } from "@/components/ui/nav-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/context/PermissionContext";
import useBreakpoints from "@/hooks/useBreakpoints";
import { ScopedQueryParamsProvider } from "@/hooks/useScopedQueryParams";
import { WorkspacePage } from "@/pages/Encounters/workspace/EncounterWorkspacePage";
import { parseEncounterWorkspace } from "@/pages/Encounters/workspace/parseEncounterWorkspace";
import { useEncounterWorkspaces } from "@/pages/Encounters/workspace/useEncounterWorkspaces";
import {
  useClinicalHistoryTabs,
  type ClinicalHistoryAccess,
} from "@/pages/Patient/History/clinicalHistoryTabs";
import patientApi from "@/types/emr/patient/patientApi";
import { hasHistoryPages } from "@/types/workspace/encounterWorkspace";
import type { WorkspaceWidgetContext } from "@/types/workspace/widgetAvailability";
import query from "@/Utils/request/query";

export function ClinicalHistoryWorkspace({
  patientId,
  facilityId,
  currentTab,
  onTabChange,
  access,
  embedded = false,
}: {
  patientId: string;
  facilityId?: string;
  currentTab: string;
  onTabChange: (tab: string) => void;
  /** Scoped access decided by the caller; otherwise the patient's permissions apply. */
  access?: ClinicalHistoryAccess;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  // The workspace chosen for encounters also shapes clinical history; one
  // that leaves history unconfigured keeps the standard tabs.
  const { defaults, list, workspace } = useEncounterWorkspaces();
  const showMoreAfterIndex = useBreakpoints({
    default: 1,
    xs: 2,
    sm: 6,
    xl: 9,
    "2xl": 12,
  });
  const patient = useQuery({
    queryKey: ["patient", patientId, facilityId],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientId },
      queryParams: { facility: facilityId },
      silent: true,
    }),
    enabled: !access,
  });
  const patientPermissions = getPermissions(
    hasPermission,
    patient.data?.permissions ?? [],
  );
  // Responses and clinical data are granted separately; either opens history
  // and each section then checks its own grant.
  const grants = access ?? {
    clinicalData: patientPermissions.canViewClinicalData,
    responses: patientPermissions.canViewPatientQuestionnaireResponses,
  };
  const canRead = grants.clinicalData || grants.responses;
  const context: WorkspaceWidgetContext = {
    patientId,
    facilityId,
    canReadClinicalData: grants.clinicalData,
    canReadPatientHistory: grants.clinicalData,
    canReadPatientResponses: grants.responses,
    canReadSelectedEncounter: false,
    canWriteSelectedEncounter: false,
    canWriteClinicalData: false,
  };
  const systemTabs = useClinicalHistoryTabs({
    patientId,
    facilityId,
    embedded,
    access: grants,
  });
  const parsed =
    workspace && hasHistoryPages(workspace.template)
      ? parseEncounterWorkspace(
          workspace.template,
          Object.keys(systemTabs),
          "patient_history",
        )
      : undefined;
  const tabs: Record<
    string,
    {
      label: string;
      component: ReactNode;
      visible?: boolean;
    }
  > = {};
  if (parsed) {
    for (const page of parsed.pages) {
      if (page.kind === "system") {
        const systemTab = systemTabs[page.key as keyof typeof systemTabs];
        if (systemTab)
          tabs[page.key] = {
            ...systemTab,
            visible: !page.hidden && systemTab.visible,
            component: (
              <ScopedQueryParamsProvider key={`${workspace?.id}:${page.key}`}>
                {systemTab.component}
              </ScopedQueryParamsProvider>
            ),
          };
      } else {
        tabs[page.key] = {
          label: page.title,
          visible: !page.hidden,
          component:
            page.kind === "custom" ? (
              <WorkspacePage
                key={`${workspace?.id}:${page.key}`}
                page={page}
                context={context}
              />
            ) : (
              <Alert>
                <AlertDescription>
                  {t("encounter_workspace_page_unavailable")}
                </AlertDescription>
              </Alert>
            ),
        };
      }
    }
  } else {
    for (const [key, tab] of Object.entries(systemTabs)) {
      tabs[key] = {
        ...tab,
        component: embedded ? (
          <ScopedQueryParamsProvider key={key}>
            {tab.component}
          </ScopedQueryParamsProvider>
        ) : (
          tab.component
        ),
      };
    }
  }
  // Deep links (e.g. "View medication history") name a standard history tab.
  // Keep them reachable even when the chosen layout omits or hides that tab.
  const requestedSystemTab = Object.hasOwn(systemTabs, currentTab)
    ? systemTabs[currentTab as keyof typeof systemTabs]
    : undefined;
  if (
    !embedded &&
    parsed &&
    requestedSystemTab?.visible &&
    tabs[currentTab]?.visible !== true
  ) {
    tabs[currentTab] = {
      ...requestedSystemTab,
      visible: true,
      component: (
        <ScopedQueryParamsProvider key={`${workspace?.id}:${currentTab}`}>
          {requestedSystemTab.component}
        </ScopedQueryParamsProvider>
      ),
    };
  }
  const firstTab = Object.keys(tabs).find((key) => tabs[key].visible !== false);
  const activeTab =
    Object.hasOwn(tabs, currentTab) && tabs[currentTab].visible !== false
      ? currentTab
      : firstTab;
  const loading = patient.isLoading || defaults.isLoading || list.isLoading;

  if (patient.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t("workspace_history_patient_load_error")}
          <Button variant="outline" onClick={() => patient.refetch()}>
            {t("try_again")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (loading)
    return (
      <div role="status" aria-label={t("loading")}>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!canRead)
    return (
      <EmptyState
        icon={<ShieldAlert className="size-8 text-placeholder-foreground" />}
        title={t("workspace_patient_history_access_denied")}
        description={t("no_permission_to_view_clinical_data_description")}
      />
    );

  return (
    <div className="min-w-0 space-y-3">
      {(defaults.isError || list.isError) && (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1">
              {t("workspace_history_load_error")}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                defaults.refetch();
                list.refetch();
              }}
            >
              {t("try_again")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {parsed && (parsed.invalid || parsed.unsupportedVersion) && (
        <Alert>
          <AlertDescription>
            {t("encounter_workspace_invalid")}
          </AlertDescription>
        </Alert>
      )}
      {activeTab ? (
        <NavTabs
          tabs={tabs}
          currentTab={activeTab}
          onTabChange={onTabChange}
          setPageTitle={false}
          showMoreAfterIndex={showMoreAfterIndex}
          tabContentClassName="mt-4"
        />
      ) : (
        <Alert>
          <AlertDescription>
            {t("encounter_workspace_no_pages")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
