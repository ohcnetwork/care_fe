import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import ErrorBoundary from "@/components/Common/ErrorBoundary";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { EncounterWidget } from "@/pages/Encounters/widgets/EncounterWidget";

import { RenderPage } from "./parseEncounterWorkspace";

interface EncounterWorkspacePageProps {
  page: Extract<RenderPage, { kind: "custom" }>;
}

export function EncounterWorkspacePage({ page }: EncounterWorkspacePageProps) {
  const { t } = useTranslation();
  const { selectedEncounter, isSelectedEncounterLoading } = useEncounter();

  if (isSelectedEncounterLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (!selectedEncounter) {
    return <p role="alert">{t("encounter_not_found")}</p>;
  }

  const columns = page.columns
    .map((column) => ({
      ...column,
      widgets: column.widgets.filter((widget) => {
        if ("error" in widget) return true;
        const statuses = widget.visible_when?.["encounter.status"];
        return !statuses || statuses.includes(selectedEncounter.status);
      }),
    }))
    .filter((column) => column.invalid || column.widgets.length > 0);

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
        <div
          className={cn(
            "grid min-w-0 grid-cols-1 items-start gap-3 @4xl:grid-cols-[var(--workspace-columns)]",
            columns.length > 1 && "@xl:grid-cols-2",
          )}
          style={
            {
              "--workspace-columns": columns
                .map(({ span }) => `minmax(0, ${span}fr)`)
                .join(" "),
            } as React.CSSProperties
          }
        >
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="min-w-0 space-y-3">
              {column.invalid && (
                <Alert>
                  <AlertDescription>
                    {t("encounter_workspace_column_invalid")}
                  </AlertDescription>
                </Alert>
              )}
              {column.widgets.map((widget, widgetIndex) =>
                "error" in widget ? (
                  <Alert key={widgetIndex}>
                    {widget.title && <AlertTitle>{widget.title}</AlertTitle>}
                    <AlertDescription>
                      {t("encounter_widget_config_invalid")}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ErrorBoundary
                    key={`${selectedEncounter.id}:${widgetIndex}:${JSON.stringify(widget)}`}
                    fallback={
                      <Alert variant="destructive">
                        <AlertTitle>{widget.title ?? widget.type}</AlertTitle>
                        <AlertDescription>
                          {t("encounter_workspace_widget_error")}
                        </AlertDescription>
                      </Alert>
                    }
                  >
                    <EncounterWidget
                      type={widget.type}
                      title={widget.title}
                      config={widget.config}
                      showEmpty
                    />
                  </ErrorBoundary>
                ),
              )}
            </div>
          ))}
        </div>
      ) : (
        !page.invalid && (
          <p className="rounded-lg border border-dashed p-6 text-sm text-gray-600">
            {t("encounter_workspace_empty_page")}
          </p>
        )
      )}
    </div>
  );
}
