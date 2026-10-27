import { useTranslation } from "react-i18next";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { visibleWorkspaceColumns } from "@/components/Workspace/visibleWorkspaceColumns";
import { WorkspacePageLayout } from "@/components/Workspace/WorkspacePageLayout";
import { WorkspaceWidget } from "@/components/Workspace/WorkspaceWidget";
import { useCareAppEncounterWidgets } from "@/hooks/useCareAppEncounterWidgets";
import { useCareApps } from "@/hooks/useCareApps";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import type { WorkspaceWidgetContext } from "@/types/workspace/widgetAvailability";

import { RenderPage } from "./parseEncounterWorkspace";

interface EncounterWorkspacePageProps {
  page: Extract<RenderPage, { kind: "custom" }>;
}

export function EncounterWorkspacePage({ page }: EncounterWorkspacePageProps) {
  const { t } = useTranslation();
  const encounter = useEncounter();
  const careApps = useCareApps();
  const { selectedEncounter, isSelectedEncounterLoading } = encounter;
  // Known before layout so a column holding only the extension slot collapses
  // instead of leaving an empty grid track.
  const hasEncounterExtensions = careApps.some(
    (app) => app.isLoading || !!app.components?.EncounterOverviewTop,
  );
  const context: WorkspaceWidgetContext = {
    ...encounter,
    // Patient-level responses need their own grant, unlike encounter responses.
    canReadPatientResponses:
      encounter.patientPermissions.canViewPatientQuestionnaireResponses,
    hasEncounterExtensions,
  };

  if (isSelectedEncounterLoading) {
    return (
      <div role="status" aria-label={t("loading")}>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!selectedEncounter) {
    return <p role="alert">{t("encounter_not_found")}</p>;
  }

  return <WorkspacePage page={page} context={context} />;
}

export function WorkspacePage({
  page,
  context,
}: EncounterWorkspacePageProps & { context: WorkspaceWidgetContext }) {
  const { t } = useTranslation();
  const { widgets: plugins } = useCareAppEncounterWidgets();
  const columns = visibleWorkspaceColumns(
    page.columns,
    context,
    (type) => plugins.get(type)?.requiresActiveEncounter === true,
  );

  return (
    <div className="@container space-y-3">
      {page.invalid && (
        <Alert>
          <AlertDescription>
            {t("encounter_workspace_page_invalid")}
          </AlertDescription>
        </Alert>
      )}
      {columns.length ? (
        <WorkspacePageLayout
          columns={columns}
          renderColumnError={() => (
            <Alert>
              <AlertDescription>
                {t("encounter_workspace_column_invalid")}
              </AlertDescription>
            </Alert>
          )}
          renderWidget={(widget, widgetIndex) =>
            "error" in widget ? (
              <Alert key={widgetIndex}>
                {widget.title && <AlertTitle>{widget.title}</AlertTitle>}
                <AlertDescription>
                  {t("encounter_widget_config_invalid")}
                </AlertDescription>
              </Alert>
            ) : (
              <ErrorBoundary
                key={`${context.patientId}:${context.selectedEncounter?.id ?? "history"}:${widgetIndex}:${JSON.stringify(widget)}`}
                fallback={
                  <Alert variant="destructive">
                    <AlertTitle>{widget.title ?? widget.type}</AlertTitle>
                    <AlertDescription>
                      {t("encounter_workspace_widget_error")}
                    </AlertDescription>
                  </Alert>
                }
              >
                <WorkspaceWidget
                  type={widget.type}
                  title={widget.title}
                  config={widget.config}
                  context={context}
                  showEmpty
                />
              </ErrorBoundary>
            )
          }
        />
      ) : (
        !page.invalid && (
          <p className="rounded-lg border border-dashed p-6 text-sm text-soft-foreground">
            {t("encounter_workspace_empty_page")}
          </p>
        )
      )}
    </div>
  );
}
