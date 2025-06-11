import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  CloudUpload,
  Info,
  NotepadText,
  PlusCircle,
  Save,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import { FileListTable } from "@/components/Files/FileListTable";
import FileUploadDialog from "@/components/Files/FileUploadDialog";

import useFileUpload from "@/hooks/useFileUpload";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Code } from "@/types/base/code/code";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import {
  ObservationComponent,
  ObservationFromDefinitionCreate,
  ObservationStatus,
  QuestionnaireSubmitResultValue,
} from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import {
  ObservationDefinitionComponentSpec,
  ObservationDefinitionReadSpec,
} from "@/types/emr/observationDefinition/observationDefinition";
import { SpecimenRead, SpecimenStatus } from "@/types/emr/specimen/specimen";

interface DiagnosticReportFormProps {
  facilityId: string;
  serviceRequestId: string;
  observationDefinitions: ObservationDefinitionReadSpec[];
  diagnosticReports: DiagnosticReportRead[];
  activityDefinition?: {
    diagnostic_report_codes?: Code[];
    category?: string;
  };
  specimens: SpecimenRead[];
}

// Interface for component values
interface ComponentValue {
  value: string;
  unit: string;
  isNormal: boolean;
}

// Interface for observation values
interface ObservationValue {
  id: string;
  value: string;
  unit: string;
  isNormal: boolean;
  components: Record<string, ComponentValue>;
}

export function DiagnosticReportForm({
  facilityId,
  serviceRequestId,
  observationDefinitions,
  diagnosticReports,
  activityDefinition,
  specimens,
}: DiagnosticReportFormProps) {
  const { t } = useTranslation();
  const [observations, setObservations] = useState<
    Record<string, ObservationValue>
  >({});
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedReportCode, setSelectedReportCode] = useState<Code | null>(
    null,
  );
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [conclusion, setConclusion] = useState<string>("");
  const queryClient = useQueryClient();

  const isImagingReport = activityDefinition?.category === "imaging";

  // Get the latest report if any exists
  const latestReport =
    diagnosticReports.length > 0 ? diagnosticReports[0] : null;
  const hasReport = !!latestReport;

  // Check if all required specimens are collected
  const hasCollectedSpecimens =
    activityDefinition?.category !== "laboratory" ||
    specimens.some((specimen) => specimen.status === SpecimenStatus.available);

  // Fetch the full diagnostic report to get observations
  const { data: fullReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ["diagnosticReport", latestReport?.id],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        facility_external_id: facilityId,
        external_id: latestReport?.id || "",
      },
    }),
    enabled: !!latestReport?.id,
  });

  // Query to fetch files for the diagnostic report
  const { data: files = { results: [], count: 0 }, refetch: refetchFiles } =
    useQuery({
      queryKey: ["files", "diagnostic_report", fullReport?.id],
      queryFn: query(routes.viewUpload, {
        queryParams: {
          file_type: "diagnostic_report",
          associating_id: fullReport?.id,
          limit: 100,
          offset: 0,
        },
      }),
      enabled: !!fullReport?.id,
    });

  // Creating a new diagnostic report
  const { mutate: createDiagnosticReport, isPending: isCreatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.createDiagnosticReport, {
        pathParams: {
          facility_external_id: facilityId,
        },
      }),
      onSuccess: () => {
        toast.success("Diagnostic report created successfully");
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest"],
        });
        // Fetch the newly created report
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport"],
        });
      },
      onError: (err: any) => {
        toast.error(
          `Failed to create diagnostic report: ${err.message || "Unknown error"}`,
        );
      },
    });

  // Effect to handle diagnostic reports changes
  useEffect(() => {
    const latestReport = diagnosticReports[0];
    if (latestReport) {
      // If we have a new report, update the UI accordingly
      setSelectedReportCode(latestReport.code || null);
      setIsExpanded(true);
    }
  }, [diagnosticReports]);

  // Effect to handle fullReport changes
  useEffect(() => {
    if (fullReport) {
      // When we get the full report details, ensure UI is in correct state
      setSelectedReportCode(fullReport.code || null);
      setIsExpanded(true);
    }
  }, [fullReport]);

  // Upserting observations for a diagnostic report
  const { mutate: upsertObservations, isPending: isUpsertingObservations } =
    useMutation({
      mutationFn: mutate(observationApi.upsertObservations, {
        pathParams: {
          facility_external_id: facilityId,
          external_id: latestReport?.id || "",
        },
      }),
      onSuccess: () => {
        toast.success("Test results saved successfully");
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest", serviceRequestId],
        });
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport", latestReport?.id],
        });
      },
      onError: (err: any) => {
        toast.error(
          `Failed to save test results: ${err.message || "Unknown error"}`,
        );
      },
    });

  const { mutate: updateDiagnosticReport, isPending: isUpdatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.updateDiagnosticReport, {
        pathParams: {
          facility_external_id: facilityId,
          external_id: latestReport?.id || "",
        },
      }),
      onSuccess: () => {
        toast.success(t("conclusion_updated_successfully"));
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport", latestReport?.id],
        });
      },
      onError: () => {
        toast.success(t("failed_to_update_conclusion"));
      },
    });

  // Initialize file upload hook
  const fileUpload = useFileUpload({
    type: "diagnostic_report" as any,
    multiple: true,
    allowedExtensions: ["pdf"],
    allowNameFallback: false,
    onUpload: () => {
      queryClient.invalidateQueries({
        queryKey: ["diagnosticReport", latestReport?.id],
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
  }, [openUploadDialog]);

  // Initialize form with existing observations from the full report
  useEffect(() => {
    if (fullReport?.observations && fullReport.observations.length > 0) {
      const initialObservations: Record<string, ObservationValue> = {};

      fullReport.observations.forEach((obs) => {
        if (obs.observation_definition) {
          const components: Record<string, ComponentValue> = {};

          // Initialize components if they exist
          if (obs.component && obs.component.length > 0) {
            obs.component.forEach((comp: ObservationComponent) => {
              if (comp.code) {
                components[comp.code.code] = {
                  value: comp.value.value || "",
                  unit: comp.value.unit?.code || "",
                  isNormal: comp.interpretation === "normal",
                };
              }
            });
          }

          initialObservations[obs.observation_definition.id] = {
            id: obs.id,
            value: obs.value.value || "",
            unit: obs.value.unit?.code || "",
            isNormal: obs.interpretation === "normal",
            components,
          };
        }
      });

      setObservations(initialObservations);

      if (fullReport.conclusion) {
        setConclusion(fullReport.conclusion);
      }
    }
  }, [fullReport]);

  function handleValueChange(definitionId: string, value: string) {
    setObservations((prev) => ({
      ...prev,
      [definitionId]: {
        ...(prev[definitionId] || { unit: "", isNormal: true, components: {} }),
        value,
      },
    }));
  }

  function handleUnitChange(definitionId: string, unit: string) {
    setObservations((prev) => ({
      ...prev,
      [definitionId]: {
        ...(prev[definitionId] || {
          value: "",
          isNormal: true,
          components: {},
        }),
        unit,
      },
    }));
  }

  function handleNormalChange(definitionId: string, isNormal: boolean) {
    setObservations((prev) => ({
      ...prev,
      [definitionId]: {
        ...(prev[definitionId] || { value: "", unit: "", components: {} }),
        isNormal,
      },
    }));
  }

  function handleComponentValueChange(
    definitionId: string,
    componentCode: string,
    value: string,
    unit: string,
  ) {
    setObservations((prev) => {
      const observation = prev[definitionId] || {
        value: "",
        unit: "",
        isNormal: true,
        components: {},
      };
      const components = { ...observation.components };

      components[componentCode] = {
        ...(components[componentCode] || { isNormal: true }),
        value,
        unit,
      };

      return {
        ...prev,
        [definitionId]: {
          ...observation,
          components,
        },
      };
    });
  }

  function handleComponentUnitChange(
    definitionId: string,
    componentCode: string,
    unit: string,
  ) {
    setObservations((prev) => {
      const observation = prev[definitionId] || {
        value: "",
        unit: "",
        isNormal: true,
        components: {},
      };
      const components = { ...observation.components };

      components[componentCode] = {
        ...(components[componentCode] || { value: "", isNormal: true }),
        unit,
      };

      return {
        ...prev,
        [definitionId]: {
          ...observation,
          components,
        },
      };
    });
  }

  function handleComponentNormalChange(
    definitionId: string,
    componentCode: string,
    isNormal: boolean,
  ) {
    setObservations((prev) => {
      const observation = prev[definitionId] || {
        value: "",
        unit: "",
        isNormal: true,
        components: {},
      };
      const components = { ...observation.components };

      components[componentCode] = {
        ...(components[componentCode] || { value: "", unit: "" }),
        isNormal,
      };

      return {
        ...prev,
        [definitionId]: {
          ...observation,
          components,
        },
      };
    });
  }

  function handleCreateReport() {
    // Only create a new report if no reports exist
    if (!hasReport) {
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
        code: selectedReportCode || undefined,
      });
    }
  }

  function handleSubmit() {
    if (!hasReport) {
      // First create a report if none exists
      handleCreateReport();
      return;
    }

    try {
      // Check if at least one observation has a value or component value
      const hasObservationValue = Object.values(observations).some((obs) => {
        const hasMainValue = obs.value.trim() !== "";
        const hasComponentValue = Object.values(obs.components).some(
          (comp) => comp.value.trim() !== "",
        );
        return hasMainValue || hasComponentValue;
      });

      // Check if either observations or conclusion is provided
      if (!hasObservationValue && !conclusion.trim()) {
        toast.error(t("at_least_one_result"));
        return;
      }

      const formattedObservations: ObservationFromDefinitionCreate[] =
        Object.entries(observations)
          .map(([definitionId, obsData]) => {
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

            // For regular observations, skip if no value is entered
            // For component-based observations, check component values
            if (!hasComponents && !obsData.value.trim()) {
              return null;
            }

            if (hasComponents && !hasComponentValues) {
              return null;
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
                      interpretation: componentData.isNormal
                        ? "normal"
                        : "abnormal",
                    });
                  }
                },
              );
            }

            return {
              ...(obsData.id
                ? { observation_id: obsData.id }
                : { observation_definition: definitionId }),
              observation: {
                status: ObservationStatus.FINAL,
                subject_type: "patient",
                value_type:
                  observationDefinition?.permitted_data_type || "float",
                effective_datetime: new Date().toISOString(),
                value,
                encounter: null,
                interpretation: obsData.isNormal ? "normal" : "abnormal",
                component: components.length > 0 ? components : undefined,
              },
            };
          })
          .filter(Boolean) as ObservationFromDefinitionCreate[];

      if (fullReport) {
        // Upsert observations
        if (formattedObservations.length > 0) {
          upsertObservations({
            observations: formattedObservations,
          });
        }

        updateDiagnosticReport({
          id: fullReport.id,
          status: fullReport.status,
          category: fullReport.category,
          code: fullReport.code,
          note: fullReport.note,
          conclusion,
        });
      }
    } catch (_error) {
      toast.error(t("error_validating_form"));
    }
  }

  // Helper to render component inputs for multi-component observations like blood pressure
  function renderComponentInputs(
    definition: ObservationDefinitionReadSpec,
    observationData: ObservationValue,
  ) {
    if (!definition.component || definition.component.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        <Separator />
        {definition.component.map((component, index) => {
          const componentData = observationData.components[
            component.code.code
          ] || {
            value: "",
            unit: component.permitted_unit?.code,
            isNormal: true,
          };

          return (
            <div key={component.code.code} className="mt-2">
              <Label className="text-sm/10 font-semibold mb-1 block text-gray-950">
                {index + 1}. {component.code.display || component.code.code}
              </Label>
              <div className="flex space-x-4 items-center">
                {component.permitted_unit && (
                  <div className="w-32">
                    <Label className="text-sm font-medium mb-1 block text-gray-700">
                      Unit
                    </Label>
                    <Select
                      value={componentData.unit}
                      onValueChange={(unit) =>
                        handleComponentUnitChange(
                          definition.id,
                          component.code.code,
                          unit,
                        )
                      }
                    >
                      <SelectTrigger>
                        {componentData.unit ? (
                          componentData.unit
                        ) : (
                          <SelectValue placeholder="Unit" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={component.permitted_unit.code}>
                          <div className="flex flex-col">
                            <span>{component.permitted_unit.code}</span>
                            {component.permitted_unit.display && (
                              <span className="text-xs text-gray-500">
                                ({component.permitted_unit.display})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex-1">
                  <Label className="text-sm font-medium mb-1 block text-gray-700">
                    Result
                  </Label>
                  <Input
                    value={componentData.value}
                    onChange={(e) =>
                      handleComponentValueChange(
                        definition.id,
                        component.code.code,
                        e.target.value,
                        componentData.unit,
                      )
                    }
                    placeholder="Component value"
                    type={
                      component.permitted_data_type === "decimal" ||
                      component.permitted_data_type === "integer"
                        ? "number"
                        : "text"
                    }
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id={`abnormal-checkbox-${definition.id}-${component.code.code}`}
                    checked={!componentData.isNormal}
                    onCheckedChange={(checked) =>
                      handleComponentNormalChange(
                        definition.id,
                        component.code.code,
                        !checked, // isNormal is the opposite of checked (isAbnormal)
                      )
                    }
                  />
                  <Label
                    htmlFor={`abnormal-checkbox-${definition.id}-${component.code.code}`}
                    className="text-sm font-medium text-gray-950 cursor-pointer"
                  >
                    Abnormal
                  </Label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const isSubmitting =
    isCreatingReport || isUpsertingObservations || isUpdatingReport;

  // Show loading state while fetching the report
  if (hasReport && isLoadingReport) {
    return (
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <div className="flex justify-between items-center rounded-md">
              <div className="flex items-center gap-2">
                <CardTitle>
                  <p className="flex items-center gap-1.5">
                    <NotepadText className="size-[24px] text-gray-950 font-normal text-base stroke-[1.5px]" />{" "}
                    {fullReport?.code ? (
                      <>
                        {fullReport?.code?.display}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="size-4 text-gray-600 inline-block cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {fullReport?.code?.system}
                                {", "}
                                {fullReport?.code?.code}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    ) : (
                      <span className="text-base/9 text-gray-950 font-medium">
                        {t("test_results_entry")}
                      </span>
                    )}
                  </p>
                </CardTitle>
              </div>
              <div className="flex items-center gap-5">
                {hasReport && fullReport?.created_by && (
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={
                        fullReport.created_by.first_name ||
                        fullReport.created_by.username ||
                        ""
                      }
                      className="size-5"
                      imageUrl={fullReport.created_by.profile_picture_url}
                    />
                    <span className="text-sm/9 text-gray-700 font-medium">
                      {fullReport.created_by.first_name || ""}{" "}
                      {fullReport.created_by.last_name || ""}
                    </span>
                  </div>
                )}
                {hasReport && fullReport && (
                  <Badge
                    className={"bg-pink-100 text-pink-800"}
                    variant="outline"
                  >
                    {t(fullReport.status)}
                  </Badge>
                )}
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
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-2 bg-gray-100">
            {hasReport && fullReport ? (
              <div className="space-y-6">
                {fullReport.status !== DiagnosticReportStatus.final &&
                  observationDefinitions.map((definition) => {
                    const hasComponents =
                      definition.component && definition.component.length > 0;
                    const observationData = observations[definition.id] || {
                      value: "",
                      unit: "",
                      isNormal: true,
                      components: {},
                    };

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

                            {/* For blood pressure and similar observations with components, we may or may not need to show the main value field */}
                            {(!hasComponents ||
                              definition.permitted_data_type !==
                                "quantity") && (
                              <div className="flex space-x-4 items-center">
                                {definition.permitted_unit && (
                                  <div className="w-32">
                                    <Label className="text-sm font-medium mb-1 block text-gray-700">
                                      Unit
                                    </Label>
                                    <Select
                                      value={observationData.unit}
                                      onValueChange={(unit) =>
                                        handleUnitChange(definition.id, unit)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Unit" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem
                                          value={definition.permitted_unit.code}
                                        >
                                          {definition.permitted_unit.display ||
                                            definition.permitted_unit.code}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                <div className="flex-1">
                                  <Label className="text-sm font-medium mb-1 block text-gray-700">
                                    Result
                                  </Label>
                                  <Input
                                    value={observationData.value}
                                    onChange={(e) =>
                                      handleValueChange(
                                        definition.id,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Result value"
                                    type={
                                      definition.permitted_data_type ===
                                        "decimal" ||
                                      definition.permitted_data_type ===
                                        "integer"
                                        ? "number"
                                        : "text"
                                    }
                                  />
                                </div>

                                <div className="flex items-center space-x-2 pt-6">
                                  <Checkbox
                                    id={`abnormal-checkbox-${definition.id}`}
                                    checked={!observationData.isNormal}
                                    onCheckedChange={(checked) =>
                                      handleNormalChange(
                                        definition.id,
                                        !checked, // isNormal is the opposite of checked (isAbnormal)
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`abnormal-checkbox-${definition.id}`}
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                  >
                                    Abnormal
                                  </Label>
                                </div>
                              </div>
                            )}

                            {/* Render component inputs for multi-component observations */}
                            {hasComponents &&
                              renderComponentInputs(
                                definition,
                                observationData,
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                {fullReport.status !== DiagnosticReportStatus.final && (
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
                        placeholder={t("enter") + " " + t("conclusion")}
                        value={conclusion}
                        onChange={(e) => setConclusion(e.target.value)}
                        rows={3}
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
                        disabled={isSubmitting}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Results
                      </Button>
                    </div>
                  )}

                  {isImagingReport && (
                    <>
                      {files?.results && files.results.length > 0 && (
                        <div className="mt-6">
                          <div className="text-lg font-medium">
                            {t("uploaded_files")}
                          </div>
                          <FileListTable
                            files={files.results}
                            type="diagnostic_report"
                            associatingId={fullReport.id}
                            canEdit={true}
                            showHeader={false}
                            onRefetch={refetchFiles}
                          />
                        </div>
                      )}

                      {fullReport?.status ===
                        DiagnosticReportStatus.preliminary && (
                        <Card className="mt-4 bg-gray-50 border-gray-200 shadow-none">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              <div className="flex flex-col items-center justify-between gap-1">
                                <CloudUpload className="size-10 border border-gray-100 rounded-md p-2 bg-white" />
                                <Label className="text-base font-medium">
                                  {t("choose_file")}
                                </Label>
                                <div className="text-sm text-gray-500">
                                  {t("pdf")}
                                </div>
                                <Label
                                  htmlFor="file_upload_diagnostic_report"
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
                                      : t("select") + " " + t("files")}
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
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-gray-50 rounded-lg">
                <div className="text-gray-500 flex justify-center items-center">
                  <p></p>
                  <p className="mt-2 text-sm text-gray-500">
                    {!hasCollectedSpecimens
                      ? t("collect_specimen_before_report")
                      : t("no_test_results_recorded")}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 p-1">
                  {activityDefinition?.diagnostic_report_codes &&
                    activityDefinition.diagnostic_report_codes.length > 0 && (
                      <div className="flex-1">
                        <Select
                          value={selectedReportCode?.code}
                          onValueChange={(value) => {
                            const code =
                              activityDefinition.diagnostic_report_codes?.find(
                                (c) => c.code === value,
                              );
                            setSelectedReportCode(code || null);
                          }}
                          disabled={!hasCollectedSpecimens}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("select_diagnostic_report_type")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {activityDefinition.diagnostic_report_codes.map(
                              (code) => (
                                <SelectItem key={code.code} value={code.code}>
                                  <div className="flex flex-col">
                                    <span>
                                      {code.display} ({code.code})
                                    </span>
                                  </div>
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  <Button
                    onClick={handleCreateReport}
                    disabled={
                      isCreatingReport ||
                      !hasCollectedSpecimens ||
                      (!!activityDefinition?.diagnostic_report_codes?.length &&
                        !selectedReportCode)
                    }
                    className="shrink-0"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {t("create_report")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {fileUpload.Dialogues}
      <FileUploadDialog
        open={openUploadDialog}
        onOpenChange={setOpenUploadDialog}
        fileUpload={fileUpload}
        associatingId={fullReport?.id || ""}
        type="diagnostic_report"
      />
    </Card>
  );
}
