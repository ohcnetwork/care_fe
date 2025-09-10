import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MoreVertical, PrinterIcon } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { ChargeItemsSection } from "@/components/Billing/ChargeItems/ChargeItemsSection";

import useAppHistory from "@/hooks/useAppHistory";
import useBreakpoints from "@/hooks/useBreakpoints";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import batchApi from "@/types/base/batch/batchApi";
import { ChargeItemServiceResource } from "@/types/billing/chargeItem/chargeItem";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import {
  Status,
  toServiceRequestUpdateSpec,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import {
  SpecimenRead,
  SpecimenStatus,
  getActiveAndDraftSpecimens,
} from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

import { PatientHeader } from "@/pages/Facility/services/serviceRequests/PatientHeader";
import { DiagnosticReportForm } from "./components/DiagnosticReportForm";
import { DiagnosticReportReview } from "./components/DiagnosticReportReview";
import { MultiQRCodePrintSheet } from "./components/MultiQRCodePrintSheet";
import { ObservationHistorySheet } from "./components/ObservationHistorySheet";
import { ServiceRequestDetails } from "./components/ServiceRequestDetails";
import { SpecimenForm } from "./components/SpecimenForm";
import { SpecimenHistorySheet } from "./components/SpecimenHistorySheet";
import { SpecimenWorkflowCard } from "./components/SpecimenWorkflowCard";
import { WorkflowProgress } from "./components/WorkflowProgress";

interface ServiceRequestShowProps {
  facilityId: string;
  serviceRequestId: string;
  locationId?: string;
}

export default function ServiceRequestShow({
  facilityId,
  serviceRequestId,
  locationId,
}: ServiceRequestShowProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { goBack } = useAppHistory();
  const isMobile = useBreakpoints({
    default: true,
    lg: false,
  });

  const [isPrintingAllQRCodes, setIsPrintingAllQRCodes] = useState(false);
  const [isQRCodeSheetOpen, setIsQRCodeSheetOpen] = useState(false);
  const [selectedSpecimenDefinition, setSelectedSpecimenDefinition] =
    useState<SpecimenDefinitionRead | null>(null);

  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ["serviceRequest", facilityId, serviceRequestId],
    queryFn: query(serviceRequestApi.retrieveServiceRequest, {
      pathParams: {
        facilityId: facilityId,
        serviceRequestId: serviceRequestId,
      },
    }),
  });

  const {
    mutate: createDraftSpecimenFromDefinition,
    isPending: isCreatingDraftSpecimen,
  } = useMutation({
    mutationFn: mutate(specimenApi.createSpecimenFromDefinition, {
      pathParams: {
        facilityId,
        serviceRequestId,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
    },
    onError: () => {
      toast.error(t("specimen_draft_create_error"));
    },
  });

  const { mutate: executeBatch } = useMutation({
    mutationFn: mutate(batchApi.batchRequest, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
      setIsPrintingAllQRCodes(false);
      setIsQRCodeSheetOpen(true);
    },
    onError: () => {
      toast.error(t("specimen_draft_create_error"));
      setIsPrintingAllQRCodes(false);
    },
  });

  const { mutate: markAsComplete } = useMutation({
    mutationFn: () => {
      if (!request) return Promise.reject("No request data");
      return mutate(serviceRequestApi.updateServiceRequest, {
        pathParams: { facilityId, serviceRequestId },
      })(toServiceRequestUpdateSpec(request, { status: Status.completed }));
    },
    onSuccess: () => {
      toast.success(t("service_request_completed"));
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
    },
  });

  const createDraftSpecimen = (requirement: SpecimenDefinitionRead) => {
    const matchingSpecimens = request?.specimens.filter(
      (spec) => spec.specimen_definition?.id === requirement.id,
    );

    if (
      matchingSpecimens?.some(
        (spec) =>
          spec.status === SpecimenStatus.available ||
          spec.status === SpecimenStatus.draft,
      )
    ) {
      return;
    }

    createDraftSpecimenFromDefinition({
      specimen_definition: requirement.id,
      specimen: {
        status: SpecimenStatus.draft,
        specimen_type: requirement.type_collected,
        accession_identifier: "", // Will be generated by the server
        received_time: null,
        collection: {
          method: requirement.collection || null,
          body_site: null,
          collector: null,
          collected_date_time: null,
          quantity: null,
          procedure: null,
          fasting_status_codeable_concept: null,
          fasting_status_duration: null,
        },
        processing: [],
        condition: [],
        note: null,
      },
    });
  };

  const activityDefinitionSlug = request?.activity_definition?.slug;

  const { data: activityDefinition, isLoading: isLoadingActivityDefinition } =
    useQuery({
      queryKey: ["activityDefinition", activityDefinitionSlug],
      queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
        pathParams: {
          facilityId: facilityId,
          activityDefinitionSlug: activityDefinitionSlug || "",
        },
      }),
      enabled: !!activityDefinitionSlug,
    });
  if (
    isLoadingRequest ||
    (!!activityDefinitionSlug && isLoadingActivityDefinition)
  ) {
    return (
      <div className="p-4 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!request || !activityDefinition) {
    return <div className="p-4">{t("error_loading_sq_or_ad")}</div>;
  }

  function getExistingDraftSpecimen(
    specimenDefinitionSlug: string,
  ): SpecimenRead | undefined {
    const specimen = request?.specimens.find(
      (spec) =>
        spec.specimen_definition?.slug === specimenDefinitionSlug &&
        spec.status === SpecimenStatus.draft,
    );

    return specimen;
  }

  const specimenRequirements = activityDefinition.specimen_requirements ?? [];
  const observationRequirements =
    activityDefinition.observation_result_requirements ?? [];
  const diagnosticReports = request.diagnostic_reports || [];

  const assignedSpecimenIds = new Set<string>();

  const preparePrintAllQRCodes = async () => {
    // First create drafts for any specimen definitions without specimens
    const missingDraftDefinitions =
      request.status !== Status.completed
        ? specimenRequirements.filter((requirement) => {
            // Check if there's no draft or available specimen for this definition
            return !request.specimens.some(
              (spec) =>
                spec.specimen_definition?.id === requirement.id &&
                (spec.status === SpecimenStatus.draft ||
                  spec.status === SpecimenStatus.available),
            );
          })
        : [];

    if (missingDraftDefinitions.length > 0) {
      setIsPrintingAllQRCodes(true);

      executeBatch({
        requests: missingDraftDefinitions.map((requirement, index) => ({
          url: `/api/v1/facility/${facilityId}/service_request/${serviceRequestId}/create_specimen_from_definition/`,
          method: "POST",
          reference_id: `create_specimen_${index}`,
          body: {
            specimen_definition: requirement.id,
            specimen: {
              status: SpecimenStatus.draft,
              specimen_type: requirement.type_collected,
              accession_identifier: "",
              received_time: null,
              collection: {
                method: requirement.collection,
                body_site: null,
                collector: null,
                collector_object: null,
                collected_date_time: null,
                quantity: null,
                procedure: null,
                fasting_status_codeable_concept: null,
                fasting_status_duration: null,
              },
              processing: [],
              condition: [],
              note: null,
            },
          },
        })),
      });
    } else {
      setIsQRCodeSheetOpen(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 relative">
      <div className="flex-1 p-4 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goBack()}
              className="font-semibold border border-gray-400 text-gray-950 underline underline-offset-2"
            >
              <ArrowLeft />
              {t("back")}
            </Button>

            <div className="flex items-end gap-2">
              {request?.diagnostic_reports?.[0]?.status ===
                DiagnosticReportStatus.final && (
                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={request.status === Status.completed}
                        className="font-semibold border border-gray-400"
                      >
                        {t("mark_as_complete")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("confirm_completion")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("service_request_completion_confirmation")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => markAsComplete()}>
                          {t("confirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    variant="primary"
                    className="font-semibold"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${request.encounter.patient.id}/diagnostic_reports/${request.diagnostic_reports[0].id}`,
                      )
                    }
                  >
                    {t("view_report")}
                  </Button>
                </div>
              )}

              {isMobile && (
                <WorkflowProgress request={request} variant="sheet" />
              )}
            </div>
          </div>
          <div className="px-2">
            <PatientHeader
              patient={request.encounter.patient}
              facilityId={facilityId}
            />
          </div>

          <ServiceRequestDetails
            facilityId={facilityId}
            request={request}
            activityDefinition={activityDefinition}
          />
          <div className="space-y-3 pt-5">
            <ChargeItemsSection
              facilityId={facilityId}
              resourceId={serviceRequestId}
              encounterId={request.encounter.id}
              serviceResourceType={ChargeItemServiceResource.service_request}
              sourceUrl={`/facility/${facilityId}${locationId ? `/locations/${locationId}` : ""}/services_requests/${serviceRequestId}`}
              locationId={locationId}
              patientId={request.encounter.patient.id}
            />
          </div>

          {specimenRequirements.length > 0 && !selectedSpecimenDefinition && (
            <div className="space-y-3 pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("specimens")}</h2>
                <div className="flex items-center gap-2">
                  <MultiQRCodePrintSheet
                    specimens={getActiveAndDraftSpecimens(request?.specimens)}
                    open={isQRCodeSheetOpen}
                    onOpenChange={setIsQRCodeSheetOpen}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={preparePrintAllQRCodes}
                      disabled={isCreatingDraftSpecimen || isPrintingAllQRCodes}
                    >
                      <PrinterIcon className="size-4" />
                      {isPrintingAllQRCodes ? (
                        t("preparing")
                      ) : (
                        <span className="hidden sm:inline">
                          {t("print_all_qr_codes")}
                        </span>
                      )}
                    </Button>
                  </MultiQRCodePrintSheet>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <SpecimenHistorySheet
                        specimens={(request?.specimens || []).filter(
                          (specimen) =>
                            specimen.status ===
                              SpecimenStatus.entered_in_error ||
                            specimen.status === SpecimenStatus.unsatisfactory,
                        )}
                      >
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {t("view_specimen_history")}
                        </DropdownMenuItem>
                      </SpecimenHistorySheet>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {specimenRequirements.map((requirement) => {
                const allMatchingForThisDefId = request.specimens.filter(
                  (spec) => spec.specimen_definition?.id === requirement.id,
                );

                const validSpecimens = allMatchingForThisDefId.filter(
                  (spec) =>
                    spec.status === SpecimenStatus.available ||
                    spec.status === SpecimenStatus.draft,
                );

                const collectedSpecimen = validSpecimens.find(
                  (spec) => !assignedSpecimenIds.has(spec.id),
                );

                if (collectedSpecimen) {
                  assignedSpecimenIds.add(collectedSpecimen.id);
                }

                return (
                  <SpecimenWorkflowCard
                    request={request}
                    key={requirement.id}
                    facilityId={facilityId}
                    serviceRequestId={serviceRequestId}
                    requirement={requirement}
                    specimen={collectedSpecimen}
                    onCollect={() => {
                      createDraftSpecimen(requirement);
                      setSelectedSpecimenDefinition(requirement);
                    }}
                  />
                );
              })}
            </div>
          )}

          {selectedSpecimenDefinition && (
            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader className="pb-0 flex flex-row justify-between items-center">
                <CardTitle>
                  {t("collect_specimen")}: {selectedSpecimenDefinition?.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSpecimenDefinition(null)}
                >
                  <CareIcon icon="l-arrow-left" className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="py-4">
                <SpecimenForm
                  specimenDefinition={selectedSpecimenDefinition}
                  onCancel={() => setSelectedSpecimenDefinition(null)}
                  facilityId={facilityId}
                  draftSpecimen={getExistingDraftSpecimen(
                    selectedSpecimenDefinition.slug,
                  )}
                  serviceRequestId={serviceRequestId}
                />
              </CardContent>
            </Card>
          )}

          {observationRequirements.length > 0 && (
            <div className="space-y-3 pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("test_results")}</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ObservationHistorySheet
                      patientId={request.encounter.patient.id}
                      diagnosticReportId={
                        request.diagnostic_reports[0]?.id || ""
                      }
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
              </div>
              {(!diagnosticReports.length ||
                diagnosticReports[0]?.status !==
                  DiagnosticReportStatus.final) && (
                <DiagnosticReportForm
                  patientId={request.encounter.patient.id}
                  facilityId={facilityId}
                  serviceRequestId={serviceRequestId}
                  observationDefinitions={observationRequirements}
                  diagnosticReports={diagnosticReports}
                  activityDefinition={activityDefinition}
                  specimens={request.specimens || []}
                />
              )}
            </div>
          )}

          {diagnosticReports.length > 0 && (
            <DiagnosticReportReview
              facilityId={facilityId}
              patientId={request.encounter.patient.id}
              serviceRequestId={serviceRequestId}
              diagnosticReports={diagnosticReports}
            />
          )}
        </div>
      </div>
      {!isMobile && (
        <div className="flex-1 p-2 min-w-90 md:max-w-90 mx-auto">
          <WorkflowProgress request={request} variant="card" />
        </div>
      )}
    </div>
  );
}
