import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationUpsertRequest } from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import { ObservationDefinitionRead } from "@/types/emr/observationDefinition/observationDefinition";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";
import { BatchRequestObject, useBatchRequest } from "@/Utils/request/batch";
import query from "@/Utils/request/query";

import { DiagnosticReportItemProps } from "./diagnosticReportFormTypes";
import {
  formatReportObservations,
  getReportValidationError,
  observationHasValue,
} from "./diagnosticReportObservationUtils";
import { DiagnosticReportDraft } from "./useDiagnosticReportDraft";

async function resolveDefinitionSlugs(
  queryClient: QueryClient,
  facilityId: string,
  requiredDefinitions: ObservationDefinitionRead[],
  draft: DiagnosticReportDraft,
) {
  // Existing observations update by ID. Only new results need a definition slug.
  const slugs = new Map(
    [...requiredDefinitions, ...draft.addedDefinitions].map((definition) => [
      definition.id,
      definition.slug,
    ]),
  );
  for (const [definitionId, values] of Object.entries(draft.observations)) {
    if (!values.some((value) => !value.id && observationHasValue(value)))
      continue;
    const definition = draft.definitionsById.get(definitionId);
    if (!definition) throw new Error("Missing observation definition");
    if (slugs.has(definitionId)) continue;
    const catalog = await queryClient.fetchQuery({
      queryKey: [
        "diagnostic-report-observation-slug",
        facilityId,
        definition.id,
      ],
      queryFn: query.paginated(observationDefinitionApi.list, {
        queryParams: { facility: facilityId, title: definition.title },
      }),
    });
    const slug = catalog.results.find(
      (candidate) => candidate.id === definitionId,
    )?.slug;
    if (!slug) return null;
    slugs.set(definitionId, slug);
  }
  return slugs;
}

function buildSaveRequests(
  patientId: string,
  report: DiagnosticReportRead,
  conclusion: string,
  observations: ObservationUpsertRequest[],
) {
  const pathParams = { patient_external_id: patientId, external_id: report.id };
  const requests: BatchRequestObject[] = [];
  if (observations.length > 0) {
    requests.push({
      api: observationApi.upsertObservations,
      referenceId: "upsert-observations",
      pathParams,
      body: { observations },
    });
  }
  requests.push({
    api: diagnosticReportApi.updateDiagnosticReport,
    referenceId: "update-report",
    pathParams,
    body: {
      id: report.id,
      status: report.status,
      category: report.category,
      code: report.code,
      note: report.note,
      conclusion,
    },
  });
  return requests;
}

interface UseDiagnosticReportSaveOptions extends Pick<
  DiagnosticReportItemProps,
  | "report"
  | "patientId"
  | "facilityId"
  | "serviceRequestId"
  | "observationDefinitions"
  | "disableEdit"
  | "onReportSaved"
> {
  fullReport?: DiagnosticReportRead;
  draft: DiagnosticReportDraft;
  onSaved: () => void;
}

export function useDiagnosticReportSave({
  report,
  patientId,
  facilityId,
  serviceRequestId,
  observationDefinitions,
  disableEdit,
  fullReport,
  draft,
  onReportSaved,
  onSaved,
}: UseDiagnosticReportSaveOptions) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isResolvingDefinitions, setIsResolvingDefinitions] = useState(false);
  const { mutate: saveReport, isPending: isSubmitting } = useBatchRequest({
    onSuccess: async ({ results }) => {
      toast.success(
        t(
          results.some(
            (result) => result.reference_id === "upsert-observations",
          )
            ? "test_results_saved_successfully"
            : "diagnostic_report_saved_successfully",
        ),
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest", facilityId, serviceRequestId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport", report.id],
        }),
      ]);
      draft.resetDraft();
      onSaved();
      onReportSaved({ id: report.id, savedAt: Date.now() });
    },
  });
  const isReadOnly =
    disableEdit ||
    !fullReport ||
    isSubmitting ||
    isResolvingDefinitions ||
    fullReport.status === DiagnosticReportStatus.final;

  async function handleSubmit() {
    if (isReadOnly) return;
    try {
      const error = getReportValidationError(
        draft.observations,
        draft.conclusion,
        observationDefinitions.length > 0,
      );
      if (error) {
        toast.error(t(error));
        return;
      }
      setIsResolvingDefinitions(true);
      const slugs = await resolveDefinitionSlugs(
        queryClient,
        facilityId,
        observationDefinitions,
        draft,
      );
      if (!slugs) {
        toast.error(t("error_loading_observation_definition"));
        return;
      }
      const observations = formatReportObservations(
        draft.observations,
        draft.definitionsById,
        slugs,
      );
      // The detail query can change while a definition lookup is pending (for
      // example, when the review card approves this report).
      const currentReport = queryClient.getQueryData<DiagnosticReportRead>([
        "diagnosticReport",
        report.id,
      ]);
      if (
        !currentReport ||
        currentReport.status === DiagnosticReportStatus.final
      )
        return;
      saveReport(
        buildSaveRequests(
          patientId,
          currentReport,
          draft.conclusion,
          observations,
        ),
      );
    } catch (_error) {
      toast.error(t("error_validating_form"));
    } finally {
      setIsResolvingDefinitions(false);
    }
  }

  return { isReadOnly, handleSubmit };
}
