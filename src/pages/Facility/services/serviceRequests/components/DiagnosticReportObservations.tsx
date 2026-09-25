import { useTranslation } from "react-i18next";

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
      className="rounded-lg border border-gray-200 bg-white px-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 py-3">
        <h3
          id={`observations-${reportId}`}
          className="text-base font-semibold text-gray-950"
        >
          {t("observations")}
        </h3>
        <DiagnosticReportObservationPicker
          facilityId={facilityId}
          selectedIds={draft.reportDefinitions.map(
            (definition) => definition.id,
          )}
          disabled={isReadOnly}
          onSelect={draft.handleAddDefinition}
        />
      </div>
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
    </section>
  );
}
