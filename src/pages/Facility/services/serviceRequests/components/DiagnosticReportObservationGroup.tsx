import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ObservationStatus } from "@/types/emr/observation/observation";
import { ObservationDefinitionEmbedded } from "@/types/emr/observationDefinition/observationDefinition";

import { DiagnosticReportObservationActions } from "./DiagnosticReportObservationActions";
import { DiagnosticReportObservationFields } from "./DiagnosticReportObservationFields";
import { emptyObservation } from "./diagnosticReportObservationUtils";
import { DiagnosticReportDraft } from "./useDiagnosticReportDraft";

interface DiagnosticReportObservationGroupProps {
  reportId: string;
  definition: ObservationDefinitionEmbedded;
  draft: DiagnosticReportDraft;
  isReadOnly: boolean;
  isRequired: boolean;
}

export function DiagnosticReportObservationGroup({
  reportId,
  definition,
  draft,
  isReadOnly,
  isRequired,
}: DiagnosticReportObservationGroupProps) {
  const { t } = useTranslation();
  const observations = draft.observations[definition.id] ?? [
    emptyObservation(definition.permitted_unit?.code),
  ];
  const titleId = `observation-title-${reportId}-${definition.id}`;
  const hasComponents = !!definition.component?.length;
  return (
    <Card
      role="group"
      aria-labelledby={titleId}
      className="rounded-none border-0 not-first:border-t border-border bg-transparent shadow-none"
    >
      <CardContent className="grid gap-1.5 px-0 py-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-x-4">
        <div
          id={titleId}
          className={cn(
            "text-sm font-medium text-foreground wrap-break-word",
            // Components take the label column themselves, so the title gets its own line.
            hasComponents ? "sm:col-span-2" : "sm:pt-2",
          )}
        >
          {definition.title || definition.code.display}
        </div>
        <div
          className={cn("min-w-0 space-y-2", hasComponents && "sm:contents")}
        >
          {observations.map((observation, index) => {
            const isErrored =
              observation.status === ObservationStatus.ENTERED_IN_ERROR;
            const canDelete =
              !isErrored && !(index === 0 && !observation.id && isRequired);
            const fields = (actions?: ReactNode) => (
              <DiagnosticReportObservationFields
                reportId={reportId}
                definition={definition}
                observation={observation}
                index={index}
                disabled={isErrored || isReadOnly}
                draft={draft}
                actions={actions}
              />
            );
            const actions = !isReadOnly && (
              <DiagnosticReportObservationActions
                index={index}
                canDelete={canDelete}
                onAdd={() => draft.handleAddResult(definition)}
                onDelete={() =>
                  draft.handleDeleteObservation(definition.id, index)
                }
              />
            );
            return (
              <div
                key={index}
                role="group"
                aria-label={`${t("result")} ${index + 1}`}
                className={cn(
                  "space-y-1.5",
                  hasComponents &&
                    "not-first:border-t not-first:border-border not-first:pt-2 sm:col-span-2 sm:grid sm:grid-cols-subgrid sm:gap-y-1.5 sm:space-y-0",
                )}
              >
                {isErrored && (
                  <p className="text-sm text-red-600 sm:col-span-2">
                    {t("marked_for_deletion")}
                  </p>
                )}
                {hasComponents ? (
                  <>
                    {observations.length > 1 && (
                      <p className="text-sm text-muted-foreground sm:col-span-2">
                        {t("result")} {index + 1}
                      </p>
                    )}
                    {fields(actions)}
                  </>
                ) : (
                  <div className="flex items-start gap-2">
                    {observations.length > 1 && (
                      <span
                        aria-hidden="true"
                        className="w-5 shrink-0 pt-3.5 text-sm text-muted-foreground tabular-nums md:pt-2.5"
                      >
                        {index + 1}.
                      </span>
                    )}
                    {fields()}
                    {actions}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
