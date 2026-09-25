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
      className="rounded-none border-0 not-first:border-t border-gray-200 bg-transparent shadow-none"
    >
      <CardContent className="grid gap-3 px-0 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6">
        <div
          id={titleId}
          className="sm:pt-2 text-sm font-medium text-gray-950 wrap-break-word"
        >
          {definition.title || definition.code.display}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="space-y-3">
            {observations.map((observation, index) => {
              const isErrored =
                observation.status === ObservationStatus.ENTERED_IN_ERROR;
              const canDelete =
                !isErrored && !(index === 0 && !observation.id && isRequired);
              return (
                <div
                  key={index}
                  role="group"
                  aria-label={`${t("result")} ${index + 1}`}
                  className={cn(
                    "space-y-1.5",
                    hasComponents &&
                      "not-first:border-t not-first:border-gray-100 not-first:pt-3",
                  )}
                >
                  {isErrored && (
                    <p className="text-sm text-red-600">
                      {t("marked_for_deletion")}
                    </p>
                  )}
                  <div className="flex items-start gap-2">
                    {observations.length > 1 && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "w-4 shrink-0 pt-2.5 text-xs text-gray-500 tabular-nums",
                          hasComponents && "pt-1",
                        )}
                      >
                        {index + 1}.
                      </span>
                    )}
                    <DiagnosticReportObservationFields
                      reportId={reportId}
                      definition={definition}
                      observation={observation}
                      index={index}
                      disabled={isErrored || isReadOnly}
                      draft={draft}
                    />
                    {!isReadOnly && (
                      <DiagnosticReportObservationActions
                        index={index}
                        hasComponents={hasComponents}
                        canDelete={canDelete}
                        onAdd={() => draft.handleAddResult(definition)}
                        onDelete={() =>
                          draft.handleDeleteObservation(definition.id, index)
                        }
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
