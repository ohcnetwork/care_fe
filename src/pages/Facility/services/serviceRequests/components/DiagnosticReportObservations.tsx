import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { ObservationDefinitionRead } from "@/types/emr/observationDefinition/observationDefinition";

import { DiagnosticReportObservationGroup } from "./DiagnosticReportObservationGroup";
import { DiagnosticReportObservationPicker } from "./DiagnosticReportObservationPicker";
import { DiagnosticReportDraft } from "./useDiagnosticReportDraft";

interface DiagnosticReportObservationsProps {
  reportId: string;
  facilityId: string;
  observationDefinitions: ObservationDefinitionRead[];
  draft: DiagnosticReportDraft;
  isReadOnly: boolean;
}

export function DiagnosticReportObservations({
  reportId,
  facilityId,
  observationDefinitions,
  draft,
  isReadOnly,
}: DiagnosticReportObservationsProps) {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby={`observations-${reportId}`}
      className="rounded-lg border border-border bg-background px-3"
    >
      {/* The report's own header names it; the rows start right away. */}
      <h3 id={`observations-${reportId}`} className="sr-only">
        {t("observations")}
      </h3>
      <div>
        {draft.reportDefinitions.map((definition) => (
          <DiagnosticReportObservationGroup
            key={definition.id}
            reportId={reportId}
            definition={definition}
            draft={draft}
            isReadOnly={isReadOnly}
            isRequired={observationDefinitions.some(
              (required) => required.id === definition.id,
            )}
          />
        ))}
      </div>
      <div
        className={cn(
          "flex py-2",
          draft.reportDefinitions.length > 0 && "border-t border-border",
        )}
      >
        <DiagnosticReportObservationPicker
          facilityId={facilityId}
          selectedIds={draft.reportDefinitions.map(
            (definition) => definition.id,
          )}
          disabled={isReadOnly}
          onSelect={draft.handleAddDefinition}
        />
      </div>
    </section>
  );
}
