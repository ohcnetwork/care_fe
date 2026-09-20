import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  ChevronsDownUp,
  ChevronsUpDown,
  FileUp,
  MoreVertical,
  NotepadText,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import useFileUpload from "@/hooks/useFileUpload";

import { Code } from "@/types/base/code/code";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import {
  ObservationComponent,
  ObservationStatus,
  ObservationUpsertRequest,
  QuestionnaireSubmitResultValue,
} from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import {
  ObservationDefinitionComponent,
  ObservationDefinitionEmbedded,
  ObservationDefinitionRead,
} from "@/types/emr/observationDefinition/observationDefinition";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";
import { Status as ServiceRequestStatus } from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenRead, SpecimenStatus } from "@/types/emr/specimen/specimen";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";
import { BACKEND_ALLOWED_EXTENSIONS, FileType } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";
import { hasMarkdownContent } from "@/Utils/markdown";
import { BatchRequestObject, useBatchRequest } from "@/Utils/request/batch";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import { Avatar } from "@/components/Common/Avatar";
import { RichTextEditor } from "@/components/Common/RichTextEditor";
import { FileListTable } from "@/components/Files/FileListTable";
import FileUploadDialog from "@/components/Files/FileUploadDialog";
import { Badge } from "@/components/ui/badge";
import { PLUGIN_Component } from "@/PluginEngine";

import { DottedDivider } from "@/components/careui/dotted-divider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ObservationHistorySheet } from "@/pages/Facility/services/serviceRequests/components/ObservationHistorySheet";
import { Interpretation } from "@/types/base/qualifiedRange/qualifiedRange";
import { formatName } from "@/Utils/utils";
import { DiagnosticReportObservationInput } from "./DiagnosticReportObservationInput";
import { DiagnosticReportObservationPicker } from "./DiagnosticReportObservationPicker";
import { DiagnosticReportTimestamps } from "./DiagnosticReportTimestamps";

interface DiagnosticReportFormProps {
  patientId: string;
  facilityId: string;
  serviceRequestId: string;
  observationDefinitions: ObservationDefinitionRead[];
  diagnosticReports: DiagnosticReportRead[];
  activityDefinition?: {
    diagnostic_report_codes?: Code[];
    classification?: string;
    specimen_requirements?: SpecimenDefinitionRead[];
  };
  specimens: SpecimenRead[];
  disableEdit: boolean;
  serviceRequestStatus: ServiceRequestStatus;
  onReportSaved: (report: SavedReportSignal) => void;
}

export interface SavedReportSignal {
  id: string;
  savedAt: number;
}

// Interface for component values
interface ComponentValue {
  value: string;
  unit: string;
  interpretation?: Interpretation;
}

// Interface for observation values
interface ObservationValue {
  id: string;
  value: string;
  unit: string;
  interpretation?: Interpretation;
  status: ObservationStatus;
  components: Record<string, ComponentValue>;
}

// New interface to handle multiple observations per definition
interface ObservationsByDefinition {
  [definitionId: string]: ObservationValue[];
}

function reportCodeKey(code: Code) {
  return JSON.stringify([code.system, code.code]);
}

function getReportObservations(
  report?: DiagnosticReportRead,
): ObservationsByDefinition {
  const values: ObservationsByDefinition = {};
  for (const observation of report?.observations ?? []) {
    if (
      !observation.observation_definition ||
      observation.status === ObservationStatus.ENTERED_IN_ERROR
    )
      continue;
    const components: Record<string, ComponentValue> = {};
    for (const component of observation.component ?? []) {
      if (!component.code) continue;
      components[component.code.code] = {
        value: component.value.value ?? "",
        unit: component.value.unit?.code ?? "",
        interpretation: component.interpretation,
      };
    }
    const definitionId = observation.observation_definition.id;
    (values[definitionId] ??= []).push({
      id: observation.id,
      value: observation.value.value ?? "",
      unit: observation.value.unit?.code ?? "",
      interpretation: observation.interpretation,
      status: observation.status,
      components,
    });
  }
  return values;
}

export function DiagnosticReportForm({
  patientId,
  serviceRequestId,
  observationDefinitions,
  diagnosticReports,
  activityDefinition,
  specimens,
  disableEdit,
  facilityId,
  serviceRequestStatus,
  onReportSaved,
}: DiagnosticReportFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showReportTypeSelect, setShowReportTypeSelect] = useState(false);

  const hasCollectedSpecimens = (
    activityDefinition?.specimen_requirements ?? []
  ).every((requirement) =>
    specimens.some(
      (specimen) =>
        specimen.specimen_definition?.id === requirement.id &&
        specimen.status === SpecimenStatus.available,
    ),
  );

  const isMultipleDiagnosticReport =
    !!activityDefinition?.diagnostic_report_codes &&
    activityDefinition.diagnostic_report_codes.length > 0;

  // Report codes already used by existing diagnostic reports
  const usedReportCodes = new Set(
    diagnosticReports
      .map((report) => report.code && reportCodeKey(report.code))
      .filter((code): code is string => !!code),
  );

  // Report codes still available to create a new diagnostic report for
  const availableReportCodes =
    activityDefinition?.diagnostic_report_codes?.filter(
      (code) => !usedReportCodes.has(reportCodeKey(code)),
    ) ?? [];

  const activeDiagnosticReports = diagnosticReports.filter(
    (report) => report.status !== DiagnosticReportStatus.final,
  );

  // Show the "create report" form only when appropriate for the SR type:
  // - Single-report SR: show only when no report exists yet.
  // - Multi-report SR: show when codes remain AND no report is currently in progress.
  // Never show once the service request is completed.
  const showCreateReportForm =
    serviceRequestStatus !== ServiceRequestStatus.completed &&
    (isMultipleDiagnosticReport
      ? availableReportCodes.length > 0 && activeDiagnosticReports.length === 0
      : diagnosticReports.length === 0);

  // Creating a new diagnostic report
  const { mutate: createDiagnosticReport, isPending: isCreatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.createDiagnosticReport, {
        pathParams: {
          patient_external_id: patientId,
        },
      }),
      onSuccess: async () => {
        toast.success(t("diagnostic_report_created_successfully"));
        await queryClient.invalidateQueries({
          queryKey: ["serviceRequest", facilityId, serviceRequestId],
        });
      },
    });

  function handleCreateReport(code?: Code) {
    if (
      disableEdit ||
      isCreatingReport ||
      serviceRequestStatus === ServiceRequestStatus.completed
    )
      return;
    if (!hasCollectedSpecimens) {
      toast.error(t("specimen_collection_required"));
      return;
    }

    const category: Code = {
      code: "LAB",
      display: "Laboratory",
      system: "http://terminology.hl7.org/CodeSystem/v2-0074",
    };

    createDiagnosticReport({
      status: DiagnosticReportStatus.preliminary,
      category,
      service_request: serviceRequestId,
      code: code || undefined,
    });
  }

  return (
    <>
      {activeDiagnosticReports.length > 0 && (
        <div className="relative">
          <div className="relative z-10 space-y-3">
            {activeDiagnosticReports.map((report) => (
              <DiagnosticReportItem
                key={report.id}
                report={report}
                patientId={patientId}
                serviceRequestId={serviceRequestId}
                observationDefinitions={observationDefinitions}
                disableEdit={disableEdit}
                isMultipleDiagnosticReport={isMultipleDiagnosticReport}
                facilityId={facilityId}
                onReportSaved={onReportSaved}
              />
            ))}
          </div>
          {isMultipleDiagnosticReport && availableReportCodes.length > 0 && (
            <div className="-mt-3 rounded-b-lg bg-gray-100 px-2 pb-2 pt-4">
              {showReportTypeSelect ? (
                <ReportTypePicker
                  availableReportCodes={availableReportCodes}
                  hasCollectedSpecimens={hasCollectedSpecimens}
                  disableEdit={disableEdit || isCreatingReport}
                  onCreateReport={(code) => {
                    handleCreateReport(code);
                    setShowReportTypeSelect(false);
                  }}
                  onDismiss={() => setShowReportTypeSelect(false)}
                />
              ) : (
                <Button
                  variant="ghost"
                  className="gap-1.5 px-2 font-medium text-gray-950 underline hover:bg-transparent hover:text-gray-950"
                  onClick={() => {
                    setShowReportTypeSelect(true);
                  }}
                  disabled={
                    disableEdit || isCreatingReport || !hasCollectedSpecimens
                  }
                >
                  <Plus className="size-4" />
                  {t("another_diagnostic_report")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {showCreateReportForm && (
        <CreateDiagnosticReportForm
          availableReportCodes={availableReportCodes}
          hasCollectedSpecimens={hasCollectedSpecimens}
          isMultipleDiagnosticReport={isMultipleDiagnosticReport}
          disableEdit={disableEdit || isCreatingReport}
          serviceRequestId={serviceRequestId}
          handleCreateReport={handleCreateReport}
        />
      )}
    </>
  );
}

function DiagnosticReportItem({
  report,
  patientId,
  serviceRequestId,
  observationDefinitions,
  disableEdit,
  facilityId,
  isMultipleDiagnosticReport,
  onReportSaved,
}: {
  report: DiagnosticReportRead;
  patientId: string;
  serviceRequestId: string;
  observationDefinitions: ObservationDefinitionRead[];
  disableEdit: boolean;
  facilityId: string;
  isMultipleDiagnosticReport: boolean;
  onReportSaved: (report: SavedReportSignal) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [observationDraft, setObservationDraft] =
    useState<ObservationsByDefinition | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [addedDefinitions, setAddedDefinitions] = useState<
    ObservationDefinitionRead[]
  >([]);
  const [isResolvingDefinitions, setIsResolvingDefinitions] = useState(false);
  const [conclusionDraft, setConclusion] = useState<string | undefined>();

  const { data: fullReport } = useQuery({
    queryKey: ["diagnosticReport", report.id],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: report.id,
      },
    }),
    enabled: !!report.id && isExpanded,
  });

  // Query to fetch files for the diagnostic report
  const { data: files } = useQuery({
    queryKey: ["files", "diagnostic_report", report.id],
    queryFn: query.paginated(fileApi.list, {
      queryParams: {
        file_type: "diagnostic_report",
        associating_id: report.id,
      },
    }),
    enabled: !!report.id && isExpanded,
  });

  // Save observations and update the diagnostic report in a single batch request
  const { mutate: saveReport, isPending: isSubmitting } = useBatchRequest({
    onSuccess: async ({ results }) => {
      if (results.some((r) => r.reference_id === "upsert-observations")) {
        toast.success(t("test_results_saved_successfully"));
      } else {
        toast.success(t("diagnostic_report_saved_successfully"));
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest", facilityId, serviceRequestId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport", report.id],
        }),
      ]);
      setObservationDraft(null);
      setAddedDefinitions([]);
      setConclusion(undefined);
      setIsExpanded(false);
      onReportSaved({ id: report.id, savedAt: Date.now() });
    },
  });

  // Initialize file upload hook
  const inputId = `file_upload_diagnostic_report_${report.id}`;
  const fileUpload = useFileUpload({
    type: FileType.DIAGNOSTIC_REPORT,
    inputId,
    multiple: true,
    allowedExtensions: BACKEND_ALLOWED_EXTENSIONS,
    allowNameFallback: false,
    onUpload: () => {
      queryClient.invalidateQueries({
        queryKey: ["diagnosticReport", report.id],
      });
    },
    compress: false,
  });

  const openUploadDialog =
    !disableEdit && fileUpload.files.length > 0 && !fileUpload.previewing;
  // Each report can contain results beyond the service request's template.
  const definitionsById = new Map<string, ObservationDefinitionEmbedded>(
    observationDefinitions.map((definition) => [definition.id, definition]),
  );
  for (const observation of fullReport?.observations ?? []) {
    const definition = observation.observation_definition;
    if (
      definition &&
      observation.status !== ObservationStatus.ENTERED_IN_ERROR
    ) {
      definitionsById.set(definition.id, {
        ...definitionsById.get(definition.id),
        ...definition,
      });
    }
  }
  for (const definition of addedDefinitions) {
    definitionsById.set(definition.id, definition);
  }
  const reportDefinitions = [...definitionsById.values()];
  const observations = observationDraft ?? getReportObservations(fullReport);
  const conclusion = conclusionDraft ?? fullReport?.conclusion ?? "";
  const isReadOnly =
    disableEdit ||
    !fullReport ||
    isSubmitting ||
    isResolvingDefinitions ||
    fullReport.status === DiagnosticReportStatus.final;

  function setObservations(
    update: (previous: ObservationsByDefinition) => ObservationsByDefinition,
  ) {
    setObservationDraft((previous) =>
      update(previous ?? getReportObservations(fullReport)),
    );
  }

  function handleValueChange(
    definitionId: string,
    index: number,
    value: string,
    unit?: string,
  ) {
    setObservations((prev) => {
      const observationsList = [...(prev[definitionId] || [])];
      if (!observationsList[index]) {
        observationsList[index] = {
          id: "",
          value: "",
          unit: unit || "",
          status: ObservationStatus.AMENDED,
          components: {},
        };
      }
      observationsList[index] = {
        ...observationsList[index],
        value,
      };
      return {
        ...prev,
        [definitionId]: observationsList,
      };
    });
  }

  function handleUnitChange(definitionId: string, index: number, unit: string) {
    setObservations((prev) => {
      const observationsList = [...(prev[definitionId] || [])];
      if (!observationsList[index]) {
        observationsList[index] = {
          id: "",
          value: "",
          unit: "",
          status: ObservationStatus.AMENDED,
          components: {},
        };
      }
      observationsList[index] = {
        ...observationsList[index],
        unit,
      };
      return {
        ...prev,
        [definitionId]: observationsList,
      };
    });
  }

  function handleComponentValueChange(
    definitionId: string,
    index: number,
    componentCode: string,
    value: string,
    unit: string,
  ) {
    setObservations((prev) => {
      const observationsList = [...(prev[definitionId] || [])];
      if (!observationsList[index]) {
        observationsList[index] = {
          id: "",
          value: "",
          unit: "",
          status: ObservationStatus.AMENDED,
          components: {},
        };
      }
      const observation = observationsList[index];
      const components = { ...observation.components };

      components[componentCode] = {
        ...components[componentCode],
        value,
        unit,
      };

      observationsList[index] = {
        ...observation,
        components,
      };

      return {
        ...prev,
        [definitionId]: observationsList,
      };
    });
  }

  function handleComponentUnitChange(
    definitionId: string,
    index: number,
    componentCode: string,
    unit: string,
  ) {
    setObservations((prev) => {
      const observationsList = [...(prev[definitionId] || [])];
      if (!observationsList[index]) {
        observationsList[index] = {
          id: "",
          value: "",
          unit: "",
          status: ObservationStatus.AMENDED,
          components: {},
        };
      }
      const observation = observationsList[index];
      const components = { ...observation.components };

      components[componentCode] = {
        ...(components[componentCode] || { value: "", interpretation: "" }),
        unit,
      };

      observationsList[index] = {
        ...observation,
        components,
      };

      return {
        ...prev,
        [definitionId]: observationsList,
      };
    });
  }

  async function handleSubmit() {
    if (isReadOnly) return;
    try {
      // Check if all observations have values
      const hasObservationValue = Object.values(observations).some((obsList) =>
        obsList.some((obs) => {
          // Skip observations marked as deleted
          if (obs.status === ObservationStatus.ENTERED_IN_ERROR) {
            return false;
          }
          const hasMainValue = obs.value.trim() !== "";
          const hasComponentValue = Object.values(obs.components).some(
            (comp) => comp.value.trim() !== "",
          );
          return hasMainValue || hasComponentValue;
        }),
      );

      // Check if any observations are marked for deletion
      const hasDeletions =
        !hasObservationValue &&
        Object.values(observations).some((obsList) =>
          obsList.some(
            (obs) => obs.status === ObservationStatus.ENTERED_IN_ERROR,
          ),
        );

      // If there's a conclusion, we must have results first
      if (
        hasMarkdownContent(conclusion) &&
        !hasObservationValue &&
        observationDefinitions.length > 0
      ) {
        toast.error(t("cannot_add_conclusion_without_results"));
        return;
      }

      // Results are mandatory if observation definitions exist, unless an observation is being deleted
      if (
        !hasObservationValue &&
        !hasDeletions &&
        observationDefinitions.length > 0
      ) {
        toast.error(t("please_fill_all_results"));
        return;
      }

      // Templates and picker selections already include the definition slug.
      // Repeating a saved extra result after reopening needs a catalog lookup;
      // existing results are updated by observation ID.
      setIsResolvingDefinitions(true);
      const definitionSlugs = new Map(
        [...observationDefinitions, ...addedDefinitions].map((definition) => [
          definition.id,
          definition.slug,
        ]),
      );
      for (const [definitionId, values] of Object.entries(observations)) {
        const definition = definitionsById.get(definitionId);
        const hasNewResult = values.some(
          (value) =>
            !value.id &&
            value.status !== ObservationStatus.ENTERED_IN_ERROR &&
            (value.value.trim() ||
              Object.values(value.components).some((component) =>
                component.value.trim(),
              )),
        );
        if (!hasNewResult) continue;
        if (!definition) throw new Error("Missing observation definition");
        if (definitionSlugs.has(definitionId)) continue;
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
        if (!slug) {
          toast.error(t("error_loading_observation_definition"));
          return;
        }
        definitionSlugs.set(definitionId, slug);
      }

      const formattedObservations: ObservationUpsertRequest[] = Object.entries(
        observations,
      )
        .flatMap(([definitionId, obsList]) =>
          obsList.map((obsData): ObservationUpsertRequest | null => {
            const observationDefinition = definitionsById.get(definitionId);
            if (!observationDefinition)
              throw new Error("Missing observation definition");

            // If it's a component-based observation (like blood pressure), we should check if components have values
            const hasComponents =
              observationDefinition?.component &&
              observationDefinition.component.length > 0;
            const hasComponentValues =
              hasComponents &&
              Object.values(obsData.components).some(
                (comp) => comp.value.trim() !== "",
              );

            // For observations marked for deletion, always include them if they have an ID
            const isMarkedForDeletion =
              obsData.status === ObservationStatus.ENTERED_IN_ERROR &&
              obsData.id;

            // For regular observations, skip if no value is entered
            // For component-based observations, check component values
            // But always include observations marked for deletion
            if (!isMarkedForDeletion) {
              if (!hasComponents && !obsData.value.trim()) {
                return null;
              }

              if (hasComponents && !hasComponentValues) {
                return null;
              }
            }

            const value: QuestionnaireSubmitResultValue = {
              value: obsData.value,
            };

            if (obsData.unit && observationDefinition?.permitted_unit) {
              value.unit = {
                code: obsData.unit,
                system: observationDefinition.permitted_unit.system,
                display:
                  observationDefinition.permitted_unit.display || obsData.unit,
              };
            }

            // Create observation components if they exist and have values
            const components: ObservationComponent[] = [];

            if (hasComponents && observationDefinition) {
              observationDefinition.component?.forEach(
                (componentDef: ObservationDefinitionComponent) => {
                  const componentCode = componentDef.code.code;
                  const componentData = obsData.components[componentCode];

                  if (componentData && componentData.value.trim()) {
                    const componentValue: QuestionnaireSubmitResultValue = {
                      value: componentData.value,
                    };

                    if (componentData.unit && componentDef.permitted_unit) {
                      componentValue.unit = {
                        code: componentData.unit,
                        system: componentDef.permitted_unit.system,
                        display:
                          componentDef.permitted_unit.display ||
                          componentData.unit,
                      };
                    }

                    components.push({
                      code: componentDef.code,
                      value: componentValue,
                    });
                  }
                },
              );
            }

            return {
              ...(obsData.id
                ? { observation_id: obsData.id }
                : {
                    observation_definition: definitionSlugs.get(definitionId),
                  }),
              observation: {
                status:
                  obsData.status === ObservationStatus.ENTERED_IN_ERROR
                    ? ObservationStatus.ENTERED_IN_ERROR
                    : ObservationStatus.FINAL,
                value_type:
                  observationDefinition?.permitted_data_type || "decimal",
                effective_datetime: new Date().toISOString(),
                value,
                component: components.length > 0 ? components : undefined,
              },
            };
          }),
        )
        .filter((obs): obs is ObservationUpsertRequest => obs !== null);

      const requests: BatchRequestObject[] = [];

      // The detail query can change while a definition lookup is pending (for
      // example, when the review card approves this report).
      const currentReport = queryClient.getQueryData<DiagnosticReportRead>([
        "diagnosticReport",
        report.id,
      ]);
      if (
        !currentReport ||
        currentReport.status === DiagnosticReportStatus.final
      ) {
        return;
      }

      // Upsert observations only when there are results to save
      if (formattedObservations.length > 0) {
        requests.push({
          api: observationApi.upsertObservations,
          referenceId: "upsert-observations",
          pathParams: {
            patient_external_id: patientId,
            external_id: report.id,
          },
          body: {
            observations: formattedObservations,
          },
        });
      }

      requests.push({
        api: diagnosticReportApi.updateDiagnosticReport,
        referenceId: "update-report",
        pathParams: {
          patient_external_id: patientId,
          external_id: report.id,
        },
        body: {
          id: report.id,
          status: currentReport.status,
          category: currentReport.category,
          code: currentReport.code,
          note: currentReport.note,
          conclusion,
        },
      });

      saveReport(requests);
    } catch (_error) {
      toast.error(t("error_validating_form"));
    } finally {
      setIsResolvingDefinitions(false);
    }
  }

  function handleDeleteObservation(definitionId: string, index: number) {
    const observationsList = observations[definitionId];
    if (!observationsList || !observationsList[index]) return;

    const observation = observationsList[index];
    const isRequiredDefinition = observationDefinitions.some(
      (definition) => definition.id === definitionId,
    );
    if (
      !isRequiredDefinition &&
      !observation.id &&
      observationsList.length === 1
    ) {
      setAddedDefinitions((previous) =>
        previous.filter((definition) => definition.id !== definitionId),
      );
    }
    setObservations((prev) => {
      const updatedList = [...(prev[definitionId] || [])];
      let newList = [];
      if (observation.id) {
        // For existing observations, mark as ENTERED_IN_ERROR
        const updatedObservation = {
          ...observation,
          status: ObservationStatus.ENTERED_IN_ERROR,
        };
        newList = updatedList.map((obs, i) =>
          i === index ? updatedObservation : obs,
        );
      } else {
        // For new observations, remove them from the list
        newList = updatedList.filter((_, i) => i !== index);
      }
      return {
        ...prev,
        [definitionId]:
          newList.length > 0 || !isRequiredDefinition
            ? newList
            : [
                {
                  id: "",
                  value: "",
                  unit: "",
                  status: ObservationStatus.AMENDED,
                  components: {},
                },
              ],
      };
    });
  }

  function renderComponentInputs(
    definition: ObservationDefinitionEmbedded,
    observationData: ObservationValue,
    index: number,
  ) {
    const isErrored =
      observationData.status === ObservationStatus.ENTERED_IN_ERROR;

    return (
      <div className="min-w-0 flex-1 space-y-3">
        {definition.component?.map((component, componentIndex) => {
          const componentData = observationData.components[
            component.code.code
          ] || {
            value: "",
            unit: component.permitted_unit?.code || "",
            interpretation: "",
          };
          const inputId = `observation-${report.id}-${definition.id}-${index}-${componentIndex}`;
          const label = component.code.display || component.code.code;

          return (
            <div key={component.code.code} className="space-y-1.5">
              <Label htmlFor={inputId} className="text-sm text-gray-700">
                {label}
              </Label>
              <DiagnosticReportObservationInput
                id={inputId}
                label={label}
                value={componentData.value}
                unit={componentData.unit}
                permittedUnit={component.permitted_unit}
                dataType={component.permitted_data_type}
                placeholder={t("component_value")}
                disabled={isErrored || isReadOnly}
                onValueChange={(value) =>
                  handleComponentValueChange(
                    definition.id,
                    index,
                    component.code.code,
                    value,
                    componentData.unit,
                  )
                }
                onUnitChange={(unit) =>
                  handleComponentUnitChange(
                    definition.id,
                    index,
                    component.code.code,
                    unit,
                  )
                }
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="px-2 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 rounded-md">
            <div className="flex flex-1 items-center gap-2 min-w-0 w-full sm:w-auto">
              <CardTitle className="min-w-0 w-full">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 min-w-0 w-full text-left"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.stopPropagation();
                      }
                    }}
                  >
                    <NotepadText className="size-6 shrink-0 text-gray-950 stroke-[1.5px]" />
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-base text-gray-950 font-medium wrap-break-word">
                        {isMultipleDiagnosticReport
                          ? report.code?.display
                          : report.service_request?.title}
                      </span>
                      <DiagnosticReportTimestamps
                        report={fullReport ?? report}
                      />
                    </div>
                  </button>
                </CollapsibleTrigger>
              </CardTitle>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto">
              {fullReport && (
                <div
                  className="flex items-center gap-2 min-w-0"
                  title={t("created_by_user", {
                    name: formatName(fullReport.created_by),
                  })}
                >
                  <Avatar
                    name={formatName(fullReport.created_by, true)}
                    className="size-5 shrink-0"
                    imageUrl={fullReport.created_by.profile_picture_url}
                  />
                  <span className="text-sm text-gray-700 font-medium truncate">
                    {formatName(fullReport.created_by)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}>
                  {t(report.status)}
                </Badge>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10"
                    aria-label={isExpanded ? t("collapse") : t("expand")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.stopPropagation();
                      }
                    }}
                  >
                    {isExpanded ? (
                      <ChevronsDownUp className="size-5" />
                    ) : (
                      <ChevronsUpDown className="size-5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                {(reportDefinitions.length > 0 ||
                  !!fullReport?.observations?.length) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("view_observation_history")}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ObservationHistorySheet
                        patientId={patientId}
                        diagnosticReportId={report.id}
                      >
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {t("view_observation_history")}
                        </DropdownMenuItem>
                      </ObservationHistorySheet>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-2">
            <PLUGIN_Component
              __name="ServiceRequestAction"
              serviceRequestId={serviceRequestId}
            />
            <div className="space-y-6">
              {report.status !== DiagnosticReportStatus.final && (
                <PLUGIN_Component
                  __name="DiagnosticReportOverride"
                  observationDefinitions={reportDefinitions}
                  handleComponentValueChange={handleComponentValueChange}
                  handleValueChange={handleValueChange}
                  handleUnitChange={handleUnitChange}
                  disabled={isReadOnly}
                />
              )}
              {report.status !== DiagnosticReportStatus.final && (
                <section
                  aria-labelledby={`observations-${report.id}`}
                  className="rounded-lg border border-gray-200 bg-white px-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 py-3">
                    <h3
                      id={`observations-${report.id}`}
                      className="text-base font-semibold text-gray-950"
                    >
                      {t("observations")}
                    </h3>
                    <DiagnosticReportObservationPicker
                      facilityId={facilityId}
                      selectedIds={reportDefinitions.map(
                        (definition) => definition.id,
                      )}
                      disabled={isReadOnly}
                      onSelect={(definition) => {
                        setAddedDefinitions((previous) => [
                          ...previous,
                          definition,
                        ]);
                        setObservations((previous) => ({
                          ...previous,
                          [definition.id]: [
                            {
                              id: "",
                              value: "",
                              unit: definition.permitted_unit?.code || "",
                              status: ObservationStatus.AMENDED,
                              components: {},
                            },
                          ],
                        }));
                      }}
                    />
                  </div>
                  <div>
                    {reportDefinitions.map((definition) => {
                      const observationsList = observations[definition.id] || [
                        {
                          id: "",
                          value: "",
                          unit: definition.permitted_unit?.code || "",
                          interpretation: "",
                          status: ObservationStatus.AMENDED,
                          components: {},
                        },
                      ];
                      const title = definition.title || definition.code.display;
                      const titleId = `observation-title-${report.id}-${definition.id}`;
                      const hasComponents = !!definition.component?.length;

                      return (
                        <Card
                          key={definition.id}
                          role="group"
                          aria-labelledby={titleId}
                          className="rounded-none border-0 not-first:border-t border-gray-200 bg-transparent shadow-none"
                        >
                          <CardContent className="grid gap-3 px-0 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6">
                            <div
                              id={titleId}
                              className="sm:pt-2 text-sm font-medium text-gray-950 wrap-break-word"
                            >
                              {title}
                            </div>
                            <div className="min-w-0 space-y-2">
                              <div className="space-y-3">
                                {observationsList.map(
                                  (observationData, index) => {
                                    const isErrored =
                                      observationData.status ===
                                      ObservationStatus.ENTERED_IN_ERROR;
                                    const inputId = `observation-${report.id}-${definition.id}-${index}`;

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
                                          {observationsList.length > 1 && (
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
                                          {hasComponents ? (
                                            renderComponentInputs(
                                              definition,
                                              observationData,
                                              index,
                                            )
                                          ) : (
                                            <DiagnosticReportObservationInput
                                              id={inputId}
                                              label={title}
                                              value={observationData.value}
                                              unit={observationData.unit}
                                              permittedUnit={
                                                definition.permitted_unit
                                              }
                                              dataType={
                                                definition.permitted_data_type
                                              }
                                              placeholder={t("result_value")}
                                              disabled={isErrored || isReadOnly}
                                              onValueChange={(value) =>
                                                handleValueChange(
                                                  definition.id,
                                                  index,
                                                  value,
                                                  observationData.unit,
                                                )
                                              }
                                              onUnitChange={(unit) =>
                                                handleUnitChange(
                                                  definition.id,
                                                  index,
                                                  unit,
                                                )
                                              }
                                            />
                                          )}
                                          {!isReadOnly && (
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  className={cn(
                                                    "size-10 shrink-0 text-gray-500",
                                                    hasComponents && "-mt-2",
                                                  )}
                                                  aria-label={`${t("result_actions")} ${index + 1}`}
                                                  onKeyDown={(event) => {
                                                    if (
                                                      event.key === "Enter" ||
                                                      event.key === " "
                                                    ) {
                                                      event.stopPropagation();
                                                    }
                                                  }}
                                                >
                                                  <MoreVertical className="size-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent
                                                align="end"
                                                onKeyDown={(event) => {
                                                  if (
                                                    event.key === "Enter" ||
                                                    event.key === " "
                                                  ) {
                                                    event.stopPropagation();
                                                  }
                                                }}
                                              >
                                                <DropdownMenuItem
                                                  onSelect={() => {
                                                    setObservations((prev) => {
                                                      const currentList =
                                                        prev[definition.id] ??
                                                        observationsList;
                                                      return {
                                                        ...prev,
                                                        [definition.id]: [
                                                          ...currentList,
                                                          {
                                                            id: "",
                                                            value: "",
                                                            unit:
                                                              definition
                                                                .permitted_unit
                                                                ?.code || "",
                                                            status:
                                                              ObservationStatus.AMENDED,
                                                            components: {},
                                                          },
                                                        ],
                                                      };
                                                    });
                                                  }}
                                                >
                                                  <Plus className="size-4" />
                                                  {t("add_another_result")}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  variant="destructive"
                                                  onSelect={() =>
                                                    handleDeleteObservation(
                                                      definition.id,
                                                      index,
                                                    )
                                                  }
                                                  disabled={
                                                    isErrored ||
                                                    (index === 0 &&
                                                      !observationData.id &&
                                                      observationDefinitions.some(
                                                        (required) =>
                                                          required.id ===
                                                          definition.id,
                                                      ))
                                                  }
                                                >
                                                  <Trash2 className="size-4" />
                                                  {t("remove_observation")}
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="space-y-4">
                {report.status !== DiagnosticReportStatus.final && (
                  <Card className="mb-4 shadow-none rounded-lg border-gray-200 bg-white">
                    <CardContent className="p-4 space-y-2">
                      <h3 className="text-base font-semibold text-gray-950">
                        {t("conclusion")}
                      </h3>
                      <RichTextEditor
                        label={t("conclusion")}
                        placeholder={t("enter_conclusion")}
                        value={conclusion}
                        onChange={setConclusion}
                        disabled={isReadOnly}
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {fullReport?.status ===
                    DiagnosticReportStatus.preliminary && (
                    <div className="flex justify-end space-x-4">
                      <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isReadOnly}
                      >
                        <Save className="size-4 mr-2" />
                        {t("save_results")}
                      </Button>
                    </div>
                  )}
                  {files?.results && files.results.length > 0 && (
                    <div className="mt-3">
                      <div className="text-lg font-medium">
                        {t("uploaded_files")}
                      </div>
                      <FileListTable
                        files={files.results}
                        type="diagnostic_report"
                        associatingId={report.id}
                        canEdit={!isReadOnly}
                        showHeader={false}
                      />
                    </div>
                  )}

                  {fullReport?.status ===
                    DiagnosticReportStatus.preliminary && (
                    <div className="space-y-5">
                      <DottedDivider className=" text-gray-500" />
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-5 shadow-sm mt-2">
                        <div className="flex flex-col items-center text-center">
                          <h3 className="text-base font-semibold text-gray-950">
                            {t("attach_result_files")}
                          </h3>
                          <p className="mt-1.5 text-sm text-gray-600">
                            {t("add_supporting_photos_or_documents", {
                              formats:
                                BACKEND_ALLOWED_EXTENSIONS.slice(0, 5)
                                  .join(", ")
                                  .toUpperCase() + `, ${t("etc")}`,
                            })}
                          </p>
                          <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full sm:items-center sm:justify-center">
                            <Button
                              variant="outline"
                              className=" border-gray-300 bg-white font-semibold text-gray-950 shadow-sm hover:bg-white"
                              disabled={isReadOnly}
                              onClick={() => fileUpload.handleCameraCapture()}
                            >
                              <Camera className="size-4" />
                              {t("take_photo")}
                            </Button>
                            <Button
                              asChild
                              variant="outline"
                              className={cn(
                                "border-gray-300 bg-white font-semibold text-gray-950 shadow-sm hover:bg-white",
                                isReadOnly
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer",
                              )}
                            >
                              <Label htmlFor={isReadOnly ? undefined : inputId}>
                                <Upload className="size-4" />
                                {t("upload_files")}
                              </Label>
                            </Button>
                            <fileUpload.Input
                              className="hidden"
                              disabled={isReadOnly}
                            />
                          </div>

                          {fileUpload.files.length > 0 && (
                            <div className="mt-5 w-full max-w-md space-y-2">
                              <div
                                className="truncate text-sm text-gray-600"
                                title={fileUpload.files
                                  .map((file) => file.name)
                                  .join(", ")}
                              >
                                {fileUpload.files
                                  .map((file) => file.name)
                                  .join(", ")}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full border-gray-300 bg-white"
                                disabled={isReadOnly}
                                onClick={() => fileUpload.clearFiles()}
                              >
                                {t("clear")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {fileUpload.Dialogues}
      <FileUploadDialog
        open={openUploadDialog}
        onOpenChange={(open) => {
          if (!open) fileUpload.clearFiles();
        }}
        fileUpload={fileUpload}
        associatingId={report?.id || ""}
        type="diagnostic_report"
        instanceId={report?.id || ""}
      />
    </Card>
  );
}

function ReportTypePicker({
  availableReportCodes,
  hasCollectedSpecimens,
  disableEdit,
  onCreateReport,
  onDismiss,
}: {
  availableReportCodes: Code[];
  hasCollectedSpecimens: boolean;
  disableEdit: boolean;
  onCreateReport: (code: Code) => void;
  onDismiss?: () => void;
}) {
  const { t } = useTranslation();
  const [selectedCode, setSelectedCode] = useState<Code | null>(null);

  return (
    <div className="flex flex-col items-stretch gap-2 rounded-lg border border-gray-200 bg-gray-100 p-4">
      {onDismiss && (
        <Button
          aria-label={t("close")}
          onClick={() => {
            onDismiss();
            setSelectedCode(null);
          }}
          variant="ghost"
          size="icon"
          className="self-end"
        >
          <X className="size-4" />
        </Button>
      )}
      <div className="w-full flex-1 space-y-2">
        <Label className="text-sm font-medium text-gray-950">
          {t("select_diagnostic_report_type")}
        </Label>
        <Select
          value={selectedCode ? reportCodeKey(selectedCode) : ""}
          onValueChange={(value) => {
            const code = availableReportCodes.find(
              (c) => reportCodeKey(c) === value,
            );
            setSelectedCode(code ?? null);
          }}
          disabled={!hasCollectedSpecimens || disableEdit}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder={t("select_diagnostic_report_type")} />
          </SelectTrigger>
          <SelectContent>
            {availableReportCodes.map((code) => (
              <SelectItem key={reportCodeKey(code)} value={reportCodeKey(code)}>
                <span className="truncate">
                  {code.display} ({code.code})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex ml-auto items-center gap-2">
        <Button
          variant="ghost"
          className="underline"
          onClick={() => setSelectedCode(null)}
          disabled={!selectedCode}
        >
          {t("clear")}
        </Button>
        <Button
          onClick={() => {
            if (!selectedCode) return;
            onCreateReport(selectedCode);
            setSelectedCode(null);
          }}
          disabled={disableEdit || !hasCollectedSpecimens || !selectedCode}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4 mr-2" />
          {t("create_report")}
        </Button>
      </div>
    </div>
  );
}

const CreateDiagnosticReportForm = ({
  disableEdit,
  serviceRequestId,
  handleCreateReport,
  hasCollectedSpecimens,
  isMultipleDiagnosticReport,
  availableReportCodes,
}: {
  disableEdit: boolean;
  serviceRequestId: string;
  handleCreateReport: (code?: Code) => void;
  hasCollectedSpecimens: boolean;
  isMultipleDiagnosticReport: boolean;
  availableReportCodes: Code[];
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="px-2 py-4">
          <div className="flex flex-row justify-between items-start sm:items-center gap-4 sm:gap-2 rounded-md">
            <div className="flex items-center gap-2">
              <CardTitle>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-left"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ")
                        event.stopPropagation();
                    }}
                  >
                    <NotepadText className="size-6 text-gray-950 font-normal text-base stroke-[1.5px]" />{" "}
                    <span className="text-base/9 text-gray-950 font-medium">
                      {t("test_results_entry")}
                    </span>
                  </button>
                </CollapsibleTrigger>
              </CardTitle>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10"
                  aria-label={isExpanded ? t("collapse") : t("expand")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      event.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <ChevronsDownUp className="size-5" />
                  ) : (
                    <ChevronsUpDown className="size-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="px-2 bg-gray-100">
            <PLUGIN_Component
              __name="ServiceRequestAction"
              serviceRequestId={serviceRequestId}
            />

            <div className="flex flex-col gap-1 bg-gray-100 rounded-lg p-1">
              <div className="flex flex-col justify-center items-center rounded-lg bg-gray-500/3 p-3 border border-gray-200 gap-2">
                <FileUp size={24} className="text-gray-600" />
                <p className="mt-2 text-sm text-gray-700 text-center">
                  {!hasCollectedSpecimens
                    ? t("collect_specimen_before_report")
                    : t("no_test_results_recorded")}
                </p>
                {isMultipleDiagnosticReport && (
                  <p className="mt-2 text-sm text-gray-700 text-center">
                    {t("select_report_type_to_create")}
                  </p>
                )}
                {!isMultipleDiagnosticReport && (
                  <Button
                    onClick={() => handleCreateReport()}
                    disabled={disableEdit || !hasCollectedSpecimens}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="size-4 mr-2" />
                    {t("create_report")}
                  </Button>
                )}
              </div>
              {isMultipleDiagnosticReport && (
                <ReportTypePicker
                  availableReportCodes={availableReportCodes}
                  hasCollectedSpecimens={hasCollectedSpecimens}
                  disableEdit={disableEdit}
                  onCreateReport={handleCreateReport}
                />
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
