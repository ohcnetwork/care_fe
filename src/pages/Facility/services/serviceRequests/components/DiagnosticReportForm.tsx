import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  CloudUpload,
  FileUp,
  NotepadText,
  Plus,
  PlusCircle,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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
  ObservationDefinitionComponentSpec,
  ObservationDefinitionReadSpec,
} from "@/types/emr/observationDefinition/observationDefinition";
import { SpecimenRead, SpecimenStatus } from "@/types/emr/specimen/specimen";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";
import { BACKEND_ALLOWED_EXTENSIONS, FileType } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import { Avatar } from "@/components/Common/Avatar";
import { FileListTable } from "@/components/Files/FileListTable";
import FileUploadDialog from "@/components/Files/FileUploadDialog";
import { Badge } from "@/components/ui/badge";
import { PLUGIN_Component } from "@/PluginEngine";
import { Interpretation } from "@/types/base/qualifiedRange/qualifiedRange";
import { formatName } from "@/Utils/utils";
import { format } from "date-fns";

interface DiagnosticReportFormProps {
  patientId: string;
  facilityId: string;
  serviceRequestId: string;
  observationDefinitions: ObservationDefinitionReadSpec[];
  diagnosticReports: DiagnosticReportRead[];
  activityDefinition?: {
    diagnostic_report_codes?: Code[];
    classification?: string;
    specimen_requirements?: SpecimenDefinitionRead[];
  };
  specimens: SpecimenRead[];
  disableEdit: boolean;
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

  facilityId?: string;
}

// New interface to handle multiple observations per definition
interface ObservationsByDefinition {
  [definitionId: string]: ObservationValue[];
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
}: DiagnosticReportFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showReportTypeSelect, setShowReportTypeSelect] = useState(false);
  const [selectedReportCode, setSelectedReportCode] = useState<Code | null>(
    null,
  );

  // Check if all required specimens are collected
  const hasCollectedSpecimens =
    activityDefinition?.specimen_requirements?.length === 0 ||
    specimens.some((specimen) => specimen.status === SpecimenStatus.available);

  const isMultipleDiagnosticReport =
    !!activityDefinition?.diagnostic_report_codes &&
    activityDefinition.diagnostic_report_codes.length > 0;

  // Creating a new diagnostic report
  const { mutate: createDiagnosticReport, isPending: isCreatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.createDiagnosticReport, {
        pathParams: {
          patient_external_id: patientId,
        },
      }),
      onSuccess: () => {
        toast.success(t("diagnostic_report_created_successfully"));
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest"],
        });
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport"],
        });
      },
    });

  function handleCreateReport(code?: Code) {
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
      {diagnosticReports.length > 0 && (
        <div className="relative">
          <div className="relative z-10 space-y-3">
            {diagnosticReports.map((report) => (
              <DiagnosticReportItem
                key={report.id}
                report={report}
                patientId={patientId}
                serviceRequestId={serviceRequestId}
                observationDefinitions={observationDefinitions}
                disableEdit={disableEdit}
                isMultipleDiagnosticReport={isMultipleDiagnosticReport}
                facilityId={facilityId}
              />
            ))}
          </div>
          {isMultipleDiagnosticReport && (
            <div className="-mt-3 rounded-b-lg bg-gray-100 px-2 pb-2 pt-4">
              {showReportTypeSelect ? (
                <div className="flex flex-col items-stretch gap-2 rounded-lg border border-gray-200 bg-gray-100 p-4">
                  <Button
                    onClick={() => setShowReportTypeSelect(false)}
                    variant="ghost"
                    size="icon"
                    className="self-end"
                  >
                    <X className="size-4" />
                  </Button>
                  <div className="w-full flex-1 space-y-2">
                    <Label className="text-sm font-medium text-gray-950">
                      {t("select_diagnostic_report_type")}
                    </Label>
                    <Select
                      value={selectedReportCode?.code ?? ""}
                      onValueChange={(value) => {
                        const code =
                          activityDefinition?.diagnostic_report_codes?.find(
                            (c) => c.code === value,
                          );
                        setSelectedReportCode(code || null);
                      }}
                      disabled={!hasCollectedSpecimens || disableEdit}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue
                          placeholder={t("select_diagnostic_report_type")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {activityDefinition?.diagnostic_report_codes?.map(
                          (code) => (
                            <SelectItem key={code.code} value={code.code}>
                              <div className="flex flex-col">
                                <span className="truncate">
                                  {code.display} ({code.code})
                                </span>
                              </div>
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex ml-auto items-center gap-2">
                    <Button
                      variant="ghost"
                      className="underline"
                      onClick={() => {
                        setSelectedReportCode(null);
                      }}
                      disabled={disableEdit || isCreatingReport}
                    >
                      {t("clear")}
                    </Button>
                    <Button
                      onClick={() => {
                        if (!selectedReportCode) return;
                        handleCreateReport(selectedReportCode);
                        setShowReportTypeSelect(false);
                        setSelectedReportCode(null);
                      }}
                      disabled={
                        disableEdit ||
                        isCreatingReport ||
                        !hasCollectedSpecimens ||
                        !selectedReportCode
                      }
                      className="w-full sm:w-auto"
                    >
                      <Plus className="size-4 mr-2" />
                      {t("create_report")}
                    </Button>
                  </div>
                </div>
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
      {diagnosticReports.length === 0 && (
        <CreateDiagnosticReportForm
          hasCollectedSpecimens={hasCollectedSpecimens}
          isMultipleDiagnosticReport={isMultipleDiagnosticReport}
          activityDefinition={activityDefinition}
          specimens={specimens}
          isCreatingReport={isCreatingReport}
          disableEdit={disableEdit}
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
}: {
  report: DiagnosticReportRead;
  patientId: string;
  serviceRequestId: string;
  observationDefinitions: ObservationDefinitionReadSpec[];
  disableEdit: boolean;
  facilityId: string;
  isMultipleDiagnosticReport: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [observations, setObservations] = useState<ObservationsByDefinition>(
    {},
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [conclusion, setConclusion] = useState("");

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
    queryFn: query(fileApi.list, {
      queryParams: {
        file_type: "diagnostic_report",
        associating_id: report.id,
        limit: 100,
        offset: 0,
      },
    }),
    enabled: !!report.id && isExpanded,
  });

  // Upserting observations for a diagnostic report
  const { mutate: upsertObservations, isPending: isUpsertingObservations } =
    useMutation({
      mutationFn: mutate(observationApi.upsertObservations, {
        pathParams: {
          patient_external_id: patientId,
          external_id: report.id,
        },
      }),
      onSuccess: () => {
        toast.success(t("test_results_saved_successfully"));
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest", facilityId, serviceRequestId],
        });
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport", report.id],
        });
      },
    });

  const { mutate: updateDiagnosticReport, isPending: isUpdatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.updateDiagnosticReport, {
        pathParams: {
          patient_external_id: patientId,
          external_id: report.id,
        },
      }),
      onSuccess: () => {
        toast.success(t("conclusion_updated_successfully"));
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport", report.id],
        });
        setIsExpanded(false);
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

  // Handle file upload dialog
  useEffect(() => {
    if (
      fileUpload.files.length > 0 &&
      fileUpload.files[0] !== undefined &&
      !fileUpload.previewing
    ) {
      setOpenUploadDialog(true);
    } else {
      setOpenUploadDialog(false);
    }
  }, [fileUpload.files, fileUpload.previewing]);

  useEffect(() => {
    if (!openUploadDialog) {
      fileUpload.clearFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUploadDialog]);

  // Initialize form with existing observations from the report
  useEffect(() => {
    if (fullReport?.observations && fullReport.observations.length > 0) {
      const initialObservations: ObservationsByDefinition = {};

      fullReport.observations
        .filter((obs) => obs.status !== ObservationStatus.ENTERED_IN_ERROR)
        .forEach((obs) => {
          if (obs.observation_definition) {
            const components: Record<string, ComponentValue> = {};

            // Initialize components if they exist
            if (obs.component && obs.component.length > 0) {
              obs.component.forEach((comp: ObservationComponent) => {
                if (comp.code) {
                  components[comp.code.code] = {
                    value: comp.value.value || "",
                    unit: comp.value.unit?.code || "",
                    interpretation: comp.interpretation,
                  };
                }
              });
            }

            const observationValue = {
              id: obs.id,
              value: obs.value.value || "",
              unit: obs.value.unit?.code || "",
              interpretation: obs.interpretation,
              status: obs.status,
              components,
            };

            const definitionId = obs.observation_definition.id;
            if (!initialObservations[definitionId]) {
              initialObservations[definitionId] = [];
            }
            initialObservations[definitionId].push(observationValue);
          }
        });

      setObservations(initialObservations);
    }

    if (fullReport) {
      setConclusion(fullReport.conclusion || "");
    }
  }, [fullReport]);

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

  function handleSubmit() {
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
        conclusion.trim() &&
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

      const formattedObservations: ObservationUpsertRequest[] = Object.entries(
        observations,
      )
        .flatMap(([definitionId, obsList]) =>
          obsList.map((obsData): ObservationUpsertRequest | null => {
            const observationDefinition = observationDefinitions.find(
              (def) => def.id === definitionId,
            );

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
              observationDefinition.component.forEach(
                (componentDef: ObservationDefinitionComponentSpec) => {
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
                : { observation_definition: observationDefinition?.slug }),
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

      // Upsert observations
      if (formattedObservations.length > 0) {
        upsertObservations({
          observations: formattedObservations,
        });
      }

      updateDiagnosticReport({
        id: report.id,
        status: report.status,
        category: report.category,
        code: report.code,
        note: report.note,
        conclusion,
      });
    } catch (_error) {
      toast.error(t("error_validating_form"));
    }
  }

  function handleDeleteObservation(definitionId: string, index: number) {
    const observationsList = observations[definitionId];
    if (!observationsList || !observationsList[index]) return;

    const observation = observationsList[index];
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
          newList.length > 0
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

  // Helper to render component inputs for multi-component observations like blood pressure
  function renderComponentInputs(
    definition: ObservationDefinitionReadSpec,
    observationData: ObservationValue,
    index: number,
  ) {
    if (!definition.component || definition.component.length === 0) {
      return null;
    }
    const isErrored =
      observationData.status === ObservationStatus.ENTERED_IN_ERROR;

    return (
      <div className="space-y-2">
        {definition.component.map((component, componentIndex) => {
          const componentData = observationData.components[
            component.code.code
          ] || {
            value: "",
            unit: component.permitted_unit?.code || "",
            interpretation: "",
          };

          return (
            <div key={component.code.code}>
              <Label className="text-sm/10 mb-1 block text-gray-950">
                {componentIndex + 1}.{" "}
                {component.code.display || component.code.code}
              </Label>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-stretch sm:items-center">
                {component.permitted_unit && (
                  <div className="w-full sm:w-32">
                    <Label className="text-sm font-medium mb-1 block text-gray-700">
                      {t("unit")}
                    </Label>
                    <Select
                      value={componentData.unit}
                      onValueChange={(unit) =>
                        handleComponentUnitChange(
                          definition.id,
                          index,
                          component.code.code,
                          unit,
                        )
                      }
                      disabled={isErrored || disableEdit}
                    >
                      <SelectTrigger className="w-full">
                        {componentData.unit ? (
                          componentData.unit
                        ) : (
                          <SelectValue placeholder={t("unit")} />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={component.permitted_unit.code}>
                          <div className="flex flex-col">
                            <span>
                              {component.permitted_unit.code ||
                                component.permitted_unit.display}
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex-1">
                  <Label className="text-sm font-medium mb-1 block text-gray-700">
                    {t("result")}
                  </Label>
                  <Input
                    value={componentData.value}
                    onChange={(e) =>
                      handleComponentValueChange(
                        definition.id,
                        index,
                        component.code.code,
                        e.target.value,
                        componentData.unit,
                      )
                    }
                    placeholder={t("component_value")}
                    type={
                      component.permitted_data_type === "decimal" ||
                      component.permitted_data_type === "integer"
                        ? "number"
                        : "text"
                    }
                    disabled={isErrored || disableEdit}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <Separator className="mt-4" />
      </div>
    );
  }

  const isSubmitting = isUpsertingObservations || isUpdatingReport;

  return (
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg cursor-pointer bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild className="px-2 py-4">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 rounded-md">
              <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                <CardTitle className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <NotepadText className="size-6 shrink-0 text-gray-950 stroke-[1.5px]" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-base text-gray-950 font-medium truncate">
                        {isMultipleDiagnosticReport
                          ? report.code?.display
                          : report.service_request?.title}
                      </span>
                      <span className="text-sm text-gray-500 truncate">
                        {t("last_updated")}:{" "}
                        {fullReport
                          ? format(
                              fullReport.modified_date,
                              "hh:mm a, MMM dd, yyyy",
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto">
                {fullReport && (
                  <div className="flex items-center gap-2 min-w-0">
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

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}
                  >
                    {t(report.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10"
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
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-2 bg-gray-100">
            <PLUGIN_Component
              __name="ServiceRequestAction"
              serviceRequestId={serviceRequestId}
            />
            <div className="space-y-6">
              {report.status !== DiagnosticReportStatus.final && (
                <PLUGIN_Component
                  __name="DiagnosticReportOverride"
                  observationDefinitions={observationDefinitions}
                  handleComponentValueChange={handleComponentValueChange}
                  handleValueChange={handleValueChange}
                  handleUnitChange={handleUnitChange}
                  disabled={disableEdit}
                />
              )}
              {report.status !== DiagnosticReportStatus.final &&
                observationDefinitions.map((definition) => {
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

                  return (
                    <Card
                      key={definition.id}
                      className="mb-4 shadow-none rounded-lg border-gray-200 bg-gray-50"
                    >
                      <CardContent className="p-4">
                        <div className="grid gap-4">
                          <div className="flex justify-between items-start">
                            <Label className="text-base font-semibold text-gray-950">
                              {definition.title || definition.code?.display}
                            </Label>
                          </div>

                          {observationsList.map((observationData, index) => {
                            const hasComponents =
                              definition.component &&
                              definition.component.length > 0;
                            const isErrored =
                              observationData.status ===
                              ObservationStatus.ENTERED_IN_ERROR;
                            return (
                              <div
                                key={index}
                                className={cn(
                                  "space-y-1 bg-gray-200/50 p-4 rounded-lg",
                                  isErrored && "bg-gray-100",
                                )}
                              >
                                <div className="flex justify-between items-center">
                                  <Label className="text-sm font-semibold text-gray-950">
                                    {t("observation") + " " + (index + 1)}
                                  </Label>
                                  {isErrored ? (
                                    <span className="text-sm text-red-500">
                                      {t("marked_for_deletion")}
                                    </span>
                                  ) : (
                                    !disableEdit && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                                        onClick={() =>
                                          handleDeleteObservation(
                                            definition.id,
                                            index,
                                          )
                                        }
                                        disabled={
                                          isErrored ||
                                          (index === 0 && !observationData.id)
                                        }
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    )
                                  )}
                                </div>

                                {/* For blood pressure and similar observations with components, we may or may not need to show the main value field */}
                                {!hasComponents && (
                                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-stretch sm:items-center">
                                    {definition.permitted_unit && (
                                      <div className="w-full sm:w-32">
                                        <Label className="text-sm font-medium mb-1 block text-gray-700">
                                          {t("unit")}
                                        </Label>
                                        <Select
                                          value={observationData.unit}
                                          onValueChange={(unit) =>
                                            handleUnitChange(
                                              definition.id,
                                              index,
                                              unit,
                                            )
                                          }
                                          disabled={isErrored || disableEdit}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue
                                              placeholder={t("unit")}
                                            />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem
                                              value={
                                                definition.permitted_unit.code
                                              }
                                            >
                                              {definition.permitted_unit.code ||
                                                definition.permitted_unit
                                                  .display}
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}

                                    <div className="flex-1">
                                      <Label className="text-sm font-medium mb-1 block text-gray-700">
                                        {t("result")}
                                      </Label>
                                      <Input
                                        value={observationData.value}
                                        onChange={(e) =>
                                          handleValueChange(
                                            definition.id,
                                            index,
                                            e.target.value,
                                            observationData.unit,
                                          )
                                        }
                                        placeholder={t("result_value")}
                                        type={
                                          definition.permitted_data_type ===
                                            "decimal" ||
                                          definition.permitted_data_type ===
                                            "integer"
                                            ? "number"
                                            : "text"
                                        }
                                        disabled={isErrored || disableEdit}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Render component inputs for multi-component observations */}
                                {hasComponents &&
                                  renderComponentInputs(
                                    definition,
                                    observationData,
                                    index,
                                  )}
                              </div>
                            );
                          })}

                          {/* Add button for multiple observations */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setObservations((prev) => {
                                const currentList = prev[definition.id] || [];
                                return {
                                  ...prev,
                                  [definition.id]: [
                                    ...currentList,
                                    {
                                      id: "",
                                      value: "",
                                      unit:
                                        definition.permitted_unit?.code || "",
                                      status: ObservationStatus.AMENDED,
                                      components: {},
                                    },
                                  ],
                                };
                              });
                            }}
                            disabled={disableEdit}
                          >
                            <PlusCircle className="size-4 mr-2" />
                            {t("add_another_result")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              <div className="space-y-4">
                {files?.results && files.results.length > 0 && (
                  <div className="mt-6">
                    <div className="text-lg font-medium">
                      {t("uploaded_files")}
                    </div>
                    <FileListTable
                      files={files.results}
                      type="diagnostic_report"
                      associatingId={report.id}
                      canEdit={!disableEdit}
                      showHeader={false}
                    />
                  </div>
                )}

                {report?.status === DiagnosticReportStatus.preliminary && (
                  <Card className="mt-4 bg-gray-50 border-gray-200 shadow-none cursor-auto">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex flex-col items-center justify-between gap-1">
                          <CloudUpload className="size-10 border border-gray-100 rounded-md p-2 bg-white" />
                          <Label className="text-base font-medium">
                            {t("choose_file")}
                          </Label>
                          <div className="text-sm text-gray-500 mb-2">
                            {t("allowed_formats_are", {
                              formats:
                                BACKEND_ALLOWED_EXTENSIONS.slice(0, 5).join(
                                  ", ",
                                ) +
                                ", " +
                                t("etc"),
                            })}
                          </div>
                          <Label
                            htmlFor={inputId}
                            className="inline-flex items-center px-4 py-2 cursor-pointer border rounded-md hover:bg-accent hover:text-accent-foreground border-gray-300 shadow-sm"
                          >
                            <Upload className="mr-2 size-4" />
                            <span
                              className="truncate font-semibold"
                              title={fileUpload.files
                                .map((file) => file.name)
                                .join(", ")}
                            >
                              {fileUpload.files.length > 0
                                ? fileUpload.files
                                    .map((file) => file.name)
                                    .join(", ")
                                : t("select_files")}
                            </span>
                            {fileUpload.Input({ className: "hidden" })}
                          </Label>
                        </div>

                        {fileUpload.files.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => fileUpload.clearFiles()}
                          >
                            {t("clear")}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {report.status !== DiagnosticReportStatus.final && (
                  <Card className="mb-4 shadow-none rounded-lg border-gray-200 bg-gray-50">
                    <CardContent className="p-4 space-y-2">
                      <Label
                        htmlFor="conclusion"
                        className="text-base font-semibold text-gray-950"
                      >
                        {t("conclusion")}
                      </Label>
                      <textarea
                        id="conclusion"
                        className="w-full field-sizing-content focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-lg border border-gray-300 p-2"
                        placeholder={t("enter_conclusion")}
                        value={conclusion}
                        onChange={(e) => setConclusion(e.target.value)}
                        rows={3}
                        disabled={disableEdit}
                      />
                    </CardContent>
                  </Card>
                )}
                {report?.status === DiagnosticReportStatus.preliminary && (
                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting || disableEdit}
                    >
                      <Save className="size-4 mr-2" />
                      {t("save_results")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {fileUpload.Dialogues}
      <FileUploadDialog
        open={openUploadDialog}
        onOpenChange={setOpenUploadDialog}
        fileUpload={fileUpload}
        associatingId={report?.id || ""}
        type="diagnostic_report"
        instanceId={report?.id || ""}
      />
    </Card>
  );
}

const CreateDiagnosticReportForm = ({
  activityDefinition,
  isCreatingReport,
  disableEdit,
  serviceRequestId,
  handleCreateReport,
  hasCollectedSpecimens,
  isMultipleDiagnosticReport,
}: {
  activityDefinition?: {
    diagnostic_report_codes?: Code[];
    classification?: string;
    specimen_requirements?: SpecimenDefinitionRead[];
  };
  specimens: SpecimenRead[];
  isCreatingReport: boolean;
  disableEdit: boolean;
  serviceRequestId: string;
  handleCreateReport: (code?: Code) => void;
  hasCollectedSpecimens: boolean;
  isMultipleDiagnosticReport: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { t } = useTranslation();

  const [selectedReportCode, setSelectedReportCode] = useState<Code | null>(
    null,
  );

  return (
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg cursor-pointer bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild className="px-2 py-4">
          <CardHeader>
            <div className="flex flex-row justify-between items-start sm:items-center gap-4 sm:gap-2 rounded-md">
              <div className="flex items-center gap-2">
                <CardTitle>
                  <p className="flex items-center gap-1.5">
                    <NotepadText className="size-6 text-gray-950 font-normal text-base stroke-[1.5px]" />{" "}
                    <span className="text-base/9 text-gray-950 font-medium">
                      {t("test_results_entry")}
                    </span>
                  </p>
                </CardTitle>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 border border-gray-400 bg-white shadow p-4"
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
        </CollapsibleTrigger>
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
                    onClick={() =>
                      handleCreateReport(selectedReportCode || undefined)
                    }
                    disabled={
                      disableEdit ||
                      isCreatingReport ||
                      !hasCollectedSpecimens ||
                      (!!activityDefinition?.diagnostic_report_codes?.length &&
                        !selectedReportCode)
                    }
                    className="w-full sm:w-auto"
                  >
                    <Plus className="size-4 mr-2" />
                    {t("create_report")}
                  </Button>
                )}
              </div>
              {isMultipleDiagnosticReport && (
                <div className="flex flex-col items-stretch sm:items-center gap-4 justify-center bg-gray-500/3 border border-gray-200 rounded-lg p-4">
                  <div className="flex-1 w-full   space-y-2">
                    <Label className="text-sm font-medium text-gray-950">
                      {t("select_diagnostic_report_type")}
                    </Label>
                    <Select
                      value={selectedReportCode?.code ?? ""}
                      onValueChange={(value) => {
                        const code =
                          activityDefinition?.diagnostic_report_codes?.find(
                            (c) => c.code === value,
                          );
                        setSelectedReportCode(code || null);
                      }}
                      disabled={!hasCollectedSpecimens || disableEdit}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("select_diagnostic_report_type")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {activityDefinition?.diagnostic_report_codes?.map(
                          (code) => (
                            <SelectItem key={code.code} value={code.code}>
                              <div className="flex flex-col">
                                <span className="truncate">
                                  {code.display} ({code.code})
                                </span>
                              </div>
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex ml-auto gap-2 items-center">
                    <Button
                      variant="ghost"
                      className="underline"
                      onClick={() => {
                        setSelectedReportCode(null);
                      }}
                      disabled={
                        disableEdit ||
                        isCreatingReport ||
                        !hasCollectedSpecimens ||
                        (!!activityDefinition?.diagnostic_report_codes
                          ?.length &&
                          !selectedReportCode)
                      }
                    >
                      {t("clear")}
                    </Button>
                    <Button
                      onClick={() =>
                        handleCreateReport(selectedReportCode || undefined)
                      }
                      disabled={
                        disableEdit ||
                        isCreatingReport ||
                        !hasCollectedSpecimens ||
                        (!!activityDefinition?.diagnostic_report_codes
                          ?.length &&
                          !selectedReportCode)
                      }
                      className="w-full sm:w-auto"
                    >
                      <Plus className="size-4 mr-2" />
                      {t("create_report")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
