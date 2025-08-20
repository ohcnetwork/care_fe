import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import {
  CheckCheck,
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleDashed,
  Eye,
  FileText,
  MoreVertical,
  PackageSearch,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

// Import Accordion components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";
import { PrintableQRCode } from "@/components/PrintableQRCode";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import { formatName } from "@/Utils/utils";
import { ProcessSpecimen } from "@/pages/Facility/services/serviceRequests/components/ProcessSpecimen";
import {
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import {
  ProcessingSpec,
  SPECIMEN_DISCARD_REASONS,
  SPECIMEN_STATUS_COLORS,
  SpecimenRead,
  SpecimenStatus,
} from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

// --- Helper function (keep or move to utils) ---
function formatQuantity(quantity: any): string {
  if (!quantity) return "N/A";
  if (quantity.string) return quantity.string;
  if (quantity.quantity?.value && quantity.quantity?.unit?.display) {
    return `${quantity.quantity.value} ${quantity.quantity.unit.display}`;
  }
  return "N/A";
}

// --- Main Combined Component ---
interface SpecimenWorkflowCardProps {
  facilityId: string;
  serviceRequestId: string;
  requirement: SpecimenDefinitionRead;
  specimen?: SpecimenRead; // Collected specimen is optional
  onCollect: () => void; // Function to trigger collection form
  request: ServiceRequestReadSpec;
}

export function SpecimenWorkflowCard({
  facilityId,
  serviceRequestId,
  requirement,
  specimen,
  onCollect,
  request,
}: SpecimenWorkflowCardProps) {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  const currentUserId = authUser.id;
  const isDraft = specimen?.status === SpecimenStatus.draft;
  const collectedSpecimen = !isDraft ? specimen : undefined;
  const container = requirement.type_tested?.container;
  const hasCollected = !!collectedSpecimen;

  // --- Mutations (specific to the collected specimen) ---
  const { mutate: updateProcessing } = useMutation({
    mutationFn: (processingSteps: ProcessingSpec[]) => {
      if (!collectedSpecimen) return Promise.reject("No specimen to update");

      // Use the imported SpecimenUpdatePayload type
      const payload: SpecimenRead = {
        ...collectedSpecimen,
        processing: processingSteps,
      };

      return mutate(specimenApi.updateSpecimen, {
        pathParams: { facilityId, specimenId: collectedSpecimen.id },
      })(payload);
    },
    onSuccess: () => {
      toast.success(`Processing updated for ${collectedSpecimen?.id}`);
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
    },
    onError: (err: any) => {
      toast.error(
        `Failed to update processing: ${err.message || "Unknown error"}`,
      );
    },
  });

  const [selectedDiscardReason, setSelectedDiscardReason] =
    useState<SpecimenStatus | null>(null);

  const { mutate: discardSpecimen, isPending: isDiscarding } = useMutation({
    mutationFn: (status: SpecimenStatus) => {
      if (!collectedSpecimen) return Promise.reject("No specimen to discard");
      return mutate(specimenApi.updateSpecimen, {
        pathParams: { facilityId, specimenId: collectedSpecimen.id },
      })({
        ...collectedSpecimen,
        status,
      });
    },
    onSuccess: () => {
      toast.success(`Specimen ${collectedSpecimen?.id} marked as discarded.`);
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
    },
    onError: (err: any) => {
      toast.error(
        `Failed to discard specimen: ${err.message || "Unknown error"}`,
      );
    },
  });

  // --- Handlers (acting on the collected specimen) ---
  const handleAddProcessing = (newStep: ProcessingSpec) => {
    if (!currentUserId || !collectedSpecimen) return; // Need user and specimen
    const stepWithPerformer: ProcessingSpec = {
      ...newStep,
      performer: currentUserId,
      time_date_time: new Date().toISOString(),
    };
    const updatedProcessing = [
      ...(collectedSpecimen.processing ?? []),
      stepWithPerformer,
    ];
    updateProcessing(updatedProcessing);
  };

  const handleUpdateProcessing = (
    index: number,
    updatedStepData: ProcessingSpec,
  ) => {
    if (!currentUserId || !collectedSpecimen) return;
    const updatedProcessing = [...(collectedSpecimen.processing ?? [])];
    if (updatedProcessing[index]) {
      updatedProcessing[index] = {
        ...updatedProcessing[index],
        ...updatedStepData,
        performer: currentUserId,
        time_date_time:
          updatedStepData.time_date_time ??
          updatedProcessing[index].time_date_time,
      };
      updateProcessing(updatedProcessing);
    } else {
      toast.error("Attempted to update non-existent processing step");
    }
  };

  const isDiscarded =
    collectedSpecimen?.status === SpecimenStatus.unavailable ||
    collectedSpecimen?.status === SpecimenStatus.entered_in_error;

  const [isOpen, setIsOpen] = useState(!hasCollected);

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-lg",
        isDiscarded && "opacity-70 bg-gray-50",
      )}
    >
      <Collapsible open={isOpen}>
        <CollapsibleTrigger
          asChild
          className={cn(hasCollected && "cursor-pointer")}
        >
          {/* === Header: Changes based on collection status === */}
          <CardHeader
            className={cn("p-4  bg-white", isOpen && "bg-gray-100")}
            onClick={() => hasCollected && setIsOpen(!isOpen)}
          >
            {hasCollected && collectedSpecimen ? (
              // --- Collected Header ---
              <div className="flex justify-between items-start overflow-x-auto">
                <div className="space-y-1.5">
                  <span className="text-sm text-gray-600">
                    {t("collected_specimen")}:
                  </span>
                  <CardTitle className="text-base font-semibold">
                    {collectedSpecimen.specimen_definition.title}
                  </CardTitle>
                  {/* Mimic original UI structure */}
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-700 mt-4">
                    {collectedSpecimen.specimen_definition?.type_tested
                      ?.container?.cap?.display && (
                      <span className="flex flex-col">
                        <span className="text-sm text-gray-600 flex items-center">
                          {t("container_cap")}:
                        </span>
                        <span className="text-base capitalize">
                          {
                            collectedSpecimen.specimen_definition.type_tested
                              .container.cap.display
                          }
                        </span>
                      </span>
                    )}
                    {collectedSpecimen.specimen_type?.display && (
                      <span className="flex flex-col">
                        <span className="text-sm text-gray-600 flex items-center">
                          {t("specimen")}:
                        </span>
                        <span className="text-base font-semibold capitalize">
                          {collectedSpecimen.specimen_type.display}
                        </span>
                      </span>
                    )}
                    {collectedSpecimen.collection?.collector_object && (
                      <span className="flex flex-col">
                        <span className="text-sm text-gray-600 flex items-center">
                          {t("collected_by")}:
                        </span>
                        <div className="flex items-center gap-2">
                          <Avatar
                            imageUrl={
                              collectedSpecimen.collection.collector_object
                                .profile_picture_url
                            }
                            name={formatName(
                              collectedSpecimen.collection.collector_object,
                              true,
                            )}
                            className="size-5 rounded-full"
                          />
                          <span className="text-base">
                            {collectedSpecimen.collection.collector_object
                              ? formatName(
                                  collectedSpecimen.collection.collector_object,
                                )
                              : "--"}
                          </span>
                        </div>
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge on Right */}
                <div className="flex items-center flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={SPECIMEN_STATUS_COLORS[collectedSpecimen.status]}
                      className="capitalize font-medium h-fit"
                    >
                      {collectedSpecimen.status ===
                        SpecimenStatus.available && (
                        <CheckCircle2 className="size-4 mr-1" />
                      )}
                      {collectedSpecimen.status?.replace(/_/g, " ") ||
                        t("unknown")}
                    </Badge>
                    {isOpen ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 border border-gray-400 bg-white shadow p-4"
                      >
                        <ChevronsDownUp className="size-5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 border border-gray-400 bg-white shadow p-4"
                      >
                        <ChevronsUpDown className="size-5" />
                      </Button>
                    )}
                  </div>
                  <div className="flex self-end gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onSelect={(e) => e.preventDefault()}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Trash2 className="size-4 mr-2" />
                              {t("discard")}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                            onClick={(e) => e.stopPropagation()}
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("are_you_sure")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("specimen_discard_dialog_description")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <RadioGroup
                              defaultValue=""
                              onValueChange={(value: SpecimenStatus) =>
                                setSelectedDiscardReason(value)
                              }
                              className="space-y-3 justify-center items-center"
                            >
                              {SPECIMEN_DISCARD_REASONS.map((reason) => (
                                <div
                                  key={reason.status}
                                  className="flex items-start space-x-2 p-2 rounded-md border border-gray-200 hover:bg-gray-50"
                                >
                                  <RadioGroupItem
                                    value={reason.status}
                                    id={reason.status}
                                  />
                                  <Label
                                    htmlFor={reason.status}
                                    className="flex flex-col gap-0.5 px-1"
                                  >
                                    <span className="font-medium text-sm text-gray-950">
                                      {reason.label}
                                    </span>
                                    <span className="text-sm text-gray-500 font-normal">
                                      {reason.description}
                                    </span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>

                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isDiscarding}>
                                {t("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  selectedDiscardReason &&
                                  discardSpecimen(selectedDiscardReason)
                                }
                                disabled={
                                  isDiscarding || !selectedDiscardReason
                                }
                              >
                                {isDiscarding ? t("discarding") : t("discard")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ) : (
              // --- Pending Collection Header ---
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <PackageSearch className="size-5 text-gray-600" />
                  <span className="truncate">
                    {t("required")}: {requirement.title}
                  </span>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="orange">
                    <CircleDashed className="size-4 mr-1.5" />
                    {t("collection_pending")}
                  </Badge>

                  {isDraft && (
                    <Badge variant="secondary">
                      <FileText className="size-4 mr-1.5 stroke-1.5" />
                      {t("draft")}
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={onCollect}
                  variant="outline_primary"
                  disabled={request.status === Status.completed}
                >
                  <Plus className="size-4" />
                  {t("collect_specimen")}
                </Button>
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
          {/* === Accordion for Instructions, Collection Details, Processing, Discard === */}
          <CardContent className="p-2 bg-gray-100">
            {hasCollected && collectedSpecimen && (
              <Card className="p-4 w-full my-2 shadow-none border-none rounded-md">
                <PrintableQRCode
                  value={
                    collectedSpecimen.accession_identifier ||
                    collectedSpecimen.id
                  }
                  title={collectedSpecimen.specimen_type?.display}
                  subtitle={collectedSpecimen.specimen_definition?.title}
                />
              </Card>
            )}
            <Accordion
              type="multiple"
              className="w-full space-y-2"
              defaultValue={[]}
            >
              {/* 1. Instructions */}
              <AccordionItem value="instructions" className="border-none">
                <AccordionTrigger
                  className={cn(
                    "px-4 py-2 text-sm hover:bg-gray-50/50 data-[state=closed]:bg-white data-[state=open]:bg-gray-50 data-[state=open]:rounded-b-none",
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 mr-4">
                    <FileText className="size-4 text-gray-500" />
                    <span className="font-medium flex items-center gap-2 underline">
                      {t("specimen_collection_instructions")}
                      {hasCollected ? (
                        <CheckCheck className="size-4 text-blue-500" />
                      ) : (
                        <Eye className="size-4 text-gray-500" />
                      )}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-1 pb-4 space-y-4 bg-gray-50 rounded-b-lg">
                  <div className="space-y-1">
                    <p className="font-medium text-xs text-gray-950 uppercase tracking-wide">
                      {t("specimen_collection")}
                    </p>
                    <Card className="rounded-xl overflow-clip">
                      <Table>
                        <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                          <TableRow>
                            <TableHead className="w-[150px] text-gray-700 ">
                              {t("field")}
                            </TableHead>
                            <TableHead className="text-gray-700">
                              {t("details")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableHead className="w-[150px] text-gray-700">
                              {t("required_type")}
                            </TableHead>
                            <TableCell className="text-gray-950 font-semibold">
                              {requirement.type_collected?.display ?? t("na")}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableHead className="text-gray-700">
                              {t("required_method")}
                            </TableHead>
                            <TableCell className="text-gray-950 font-semibold">
                              {requirement.collection?.display ?? t("na")}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableHead className="text-gray-700">
                              {t("patient_prep")}
                            </TableHead>
                            <TableCell className="text-gray-950 font-semibold break-words whitespace-pre-wrap">
                              {requirement.patient_preparation &&
                              requirement.patient_preparation.length > 0
                                ? requirement.patient_preparation
                                    .map((p) => p.display)
                                    .join(", ")
                                : t("na")}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                  {container && (
                    <div className="space-y-1">
                      <p className="font-medium text-xs text-gray-950 uppercase tracking-wide">
                        {t("required_container")}
                      </p>
                      <Card className="rounded-xl overflow-clip">
                        <Table>
                          <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                            <TableRow>
                              <TableHead className="w-[150px] text-gray-700 ">
                                {t("field")}
                              </TableHead>
                              <TableHead className="text-gray-700">
                                {t("details")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableHead className="w-[150px] text-gray-700">
                                {t("container")}
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {container.cap?.display ?? t("na")}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableHead className="text-gray-700">
                                {t("capacity")}
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {container.capacity
                                  ? formatQuantity({
                                      quantity: container.capacity,
                                    })
                                  : t("na")}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableHead className="text-gray-700">
                                {t("min_volume")}
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {container.minimum_volume
                                  ? formatQuantity(container.minimum_volume)
                                  : t("na")}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableHead className="text-gray-700">
                                {t("preparation")}
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {container.preparation ?? t("na")}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Card>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="font-medium text-xs text-gray-950 uppercase tracking-wide">
                      {t("required_processing_storage")}
                    </p>
                    <Card className="rounded-xl overflow-clip border">
                      <Table>
                        <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                          <TableRow>
                            <TableHead className="w-[150px] text-gray-700">
                              {t("field")}
                            </TableHead>
                            <TableHead className="text-gray-700">
                              {t("details")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableHead className="w-[150px] text-gray-700">
                              {t("retention")}
                            </TableHead>
                            <TableCell className="text-gray-950 font-semibold">
                              {requirement.type_tested?.retention_time
                                ? `${requirement.type_tested.retention_time.value} ${requirement.type_tested.retention_time.unit.display}`
                                : t("na")}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Collection Details (Only if collected) */}
              {hasCollected && collectedSpecimen && (
                <AccordionItem
                  value="collection-details"
                  className="border-none"
                >
                  <AccordionTrigger
                    className={cn(
                      "px-4 py-2 text-sm hover:bg-gray-50/50 data-[state=closed]:bg-white data-[state=open]:bg-gray-50 data-[state=open]:rounded-b-none",
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <Receipt className="size-4 text-gray-500" />
                      <span className="font-medium underline">
                        {t("specimen_collection")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="green"> 1/1 {t("collected")}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-1 pb-4 space-y-4 bg-gray-50 rounded-b-lg">
                    <p className="font-semibold text-xs mb-2 flex items-center gap-2">
                      {t("collected_specimen_details")}
                    </p>
                    <Card className="rounded-xl overflow-clip border-none shadow-md">
                      <Table>
                        <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                          <TableRow>
                            <TableHead className="w-[150px] text-gray-700 ">
                              {t("field")}
                            </TableHead>
                            <TableHead className="text-gray-700">
                              {t("details")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {collectedSpecimen.collection?.collector && (
                            <TableRow>
                              <TableHead className="w-[150px] text-gray-700">
                                {t("collector")}
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {collectedSpecimen.collection.collector_object
                                  ? formatName(
                                      collectedSpecimen.collection
                                        .collector_object,
                                    )
                                  : "--"}
                              </TableCell>
                            </TableRow>
                          )}
                          {collectedSpecimen.collection
                            ?.collected_date_time && (
                            <TableRow>
                              <TableHead className="text-gray-700">
                                {t("collected_time")}
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {new Date(
                                  collectedSpecimen.collection.collected_date_time,
                                ).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          )}
                          {collectedSpecimen.collection?.body_site && (
                            <TableRow>
                              <TableHead className="text-gray-700">
                                {t("body_site")}
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {collectedSpecimen.collection.body_site.display}
                              </TableCell>
                            </TableRow>
                          )}
                          {collectedSpecimen.collection?.quantity && (
                            <TableRow>
                              <TableHead className="text-gray-700">
                                {t("quantity")}
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {formatQuantity({
                                  quantity:
                                    collectedSpecimen.collection.quantity,
                                })}
                              </TableCell>
                            </TableRow>
                          )}
                          {collectedSpecimen.collection
                            ?.fasting_status_codeable_concept && (
                            <TableRow>
                              <TableHead className="text-gray-700">
                                {t("fasting_status")}
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {
                                  collectedSpecimen.collection
                                    .fasting_status_codeable_concept.display
                                }{" "}
                                {collectedSpecimen.collection
                                  .fasting_status_duration &&
                                  `(${formatQuantity({ quantity: collectedSpecimen.collection.fasting_status_duration })})`}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* 3. Processing (Only if collected and not discarded) */}
              {hasCollected && !isDiscarded && (
                <div className="px-1 pt-3 pb-4">
                  <ProcessSpecimen
                    existingProcessing={collectedSpecimen?.processing ?? []}
                    onAddProcessing={handleAddProcessing}
                    onUpdateProcessing={handleUpdateProcessing}
                    diagnosticReports={request.diagnostic_reports ?? []}
                  />
                </div>
              )}
            </Accordion>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
