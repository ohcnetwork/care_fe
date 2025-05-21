import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  MoreVertical,
  PlusIcon,
  PrinterIcon,
} from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import useBreakpoints from "@/hooks/useBreakpoints";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import {
  SpecimenRead,
  SpecimenStatus,
  getActiveAndDraftSpecimens,
} from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

import AddMultipleChargeItemsSheet from "./components/AddMultipleChargeItemsSheet";
import { ChargeItemCard } from "./components/ChargeItemCard";
import { DiagnosticReportForm } from "./components/DiagnosticReportForm";
import { DiagnosticReportReview } from "./components/DiagnosticReportReview";
import { MultiQRCodePrintSheet } from "./components/MultiQRCodePrintSheet";
import { PatientHeader } from "./components/PatientHeader";
import { ServiceRequestDetails } from "./components/ServiceRequestDetails";
import { SpecimenForm } from "./components/SpecimenForm";
import { SpecimenHistorySheet } from "./components/SpecimenHistorySheet";
import { SpecimenWorkflowCard } from "./components/SpecimenWorkflowCard";
import { WorkflowProgress } from "./components/WorkflowProgress";

interface ServiceRequestShowProps {
  facilityId: string;
  serviceRequestId: string;
  locationId?: string;
  serviceId?: string;
}

export default function ServiceRequestShow({
  facilityId,
  serviceRequestId,
  locationId,
  serviceId,
}: ServiceRequestShowProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isMobile = useBreakpoints({
    default: true,
    lg: false,
  });

  const [isMultiAddOpen, setIsMultiAddOpen] = useState(false);
  const [isPrintingAllQRCodes, setIsPrintingAllQRCodes] = useState(false);
  const [isQRCodeSheetOpen, setIsQRCodeSheetOpen] = useState(false);
  const [selectedSpecimenDefinition, setSelectedSpecimenDefinition] =
    useState<SpecimenDefinitionRead | null>(null);

  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ["serviceRequest", serviceRequestId],
    queryFn: query(serviceRequestApi.retrieveServiceRequest, {
      pathParams: {
        facilityId: facilityId,
        serviceRequestId: serviceRequestId,
      },
    }),
  });

  const { data: chargeItems, isLoading: _isLoadingChargeItems } = useQuery({
    queryKey: ["chargeItems", serviceRequestId],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: {
        facilityId: facilityId,
      },
      queryParams: {
        service_resource: "service_request",
        service_resource_id: serviceRequestId,
      },
    }),
    enabled: !!serviceRequestId,
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
        queryKey: ["serviceRequest", serviceRequestId],
      });
    },
    onError: () => {
      toast.error(t("specimen_draft_create_error"));
    },
  });

  const { mutate: executeBatch } = useMutation({
    mutationFn: mutate(routes.batchRequest, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", serviceRequestId],
      });
      setIsPrintingAllQRCodes(false);
      setIsQRCodeSheetOpen(true);
    },
    onError: () => {
      toast.error(t("specimen_draft_create_error"));
      setIsPrintingAllQRCodes(false);
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
          method: requirement.collection,
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

  const activityDefinitionId = request?.activity_definition?.id;

  const { data: activityDefinition, isLoading: isLoadingActivityDefinition } =
    useQuery({
      queryKey: ["activityDefinition", activityDefinitionId],
      queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
        pathParams: {
          facilityId: facilityId,
          activityDefinitionId: activityDefinitionId || "",
        },
      }),
      enabled: !!activityDefinitionId,
    });
  if (
    isLoadingRequest ||
    (!!activityDefinitionId && isLoadingActivityDefinition)
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
    specimenDefinitionId: string,
  ): SpecimenRead | undefined {
    const specimen = request?.specimens.find(
      (spec) =>
        spec.specimen_definition?.id === specimenDefinitionId &&
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
    const missingDraftDefinitions = specimenRequirements.filter(
      (requirement) => {
        // Check if there's no draft or available specimen for this definition
        return !request.specimens.some(
          (spec) =>
            spec.specimen_definition?.id === requirement.id &&
            (spec.status === SpecimenStatus.draft ||
              spec.status === SpecimenStatus.available),
        );
      },
    );

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
      <div className="flex-1 p-4 max-w-6xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            {locationId && serviceId ? (
              <Button
                variant="link"
                className="underline underline-offset-2 text-gray-950 font-semibold pl-0"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/services/${serviceId}/requests/locations/${locationId}`,
                  )
                }
              >
                <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
                Back
              </Button>
            ) : (
              <Button
                variant="link"
                className="underline underline-offset-2 text-gray-950 font-semibold pl-0 cursor-pointer"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/patient/${request.encounter.patient.id}/encounter/${request.encounter.id}/service_requests`,
                  )
                }
              >
                <ArrowLeftIcon className="size-4" />
                Back to encounter
              </Button>
            )}

            {isMobile && <WorkflowProgress request={request} variant="sheet" />}
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("charge_items")}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMultiAddOpen(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {t("add_charge_items")}
              </Button>
            </div>
            {chargeItems &&
              chargeItems.results.length > 0 &&
              chargeItems.results.map((chargeItem) => (
                <ChargeItemCard key={chargeItem.id} chargeItem={chargeItem} />
              ))}
          </div>

          <AddMultipleChargeItemsSheet
            open={isMultiAddOpen}
            onOpenChange={setIsMultiAddOpen}
            facilityId={facilityId}
            serviceRequestId={serviceRequestId}
            onChargeItemsAdded={() => {
              queryClient.invalidateQueries({
                queryKey: ["chargeItems", serviceRequestId],
              });
            }}
          />

          {specimenRequirements.length > 0 && !selectedSpecimenDefinition && (
            <div className="space-y-6">
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
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      {isPrintingAllQRCodes
                        ? t("preparing")
                        : t("print_all_qr_codes")}
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
                        specimens={request?.specimens || []}
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
                  Collect Specimen: {selectedSpecimenDefinition?.title}
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
                    selectedSpecimenDefinition.id,
                  )}
                  serviceRequestId={serviceRequestId}
                />
              </CardContent>
            </Card>
          )}

          {observationRequirements.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t("test_results")}</h2>
              {(!diagnosticReports.length ||
                diagnosticReports[0]?.status !==
                  DiagnosticReportStatus.final) && (
                <DiagnosticReportForm
                  facilityId={facilityId}
                  serviceRequestId={serviceRequestId}
                  observationDefinitions={observationRequirements}
                  diagnosticReports={diagnosticReports}
                  activityDefinition={activityDefinition}
                />
              )}
            </div>
          )}

          {diagnosticReports.length > 0 && (
            <DiagnosticReportReview
              facilityId={facilityId}
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
