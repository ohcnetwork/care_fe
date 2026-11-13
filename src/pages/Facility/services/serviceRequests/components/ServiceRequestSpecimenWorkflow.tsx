import { ChevronsDownUp, MoreVertical, PrinterIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import {
  SpecimenStatus,
  getActiveAndDraftSpecimens,
} from "@/types/emr/specimen/specimen";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";
import { MultiQRCodePrintSheet } from "./MultiQRCodePrintSheet";
import { SpecimenForm } from "./SpecimenForm";
import { SpecimenHistorySheet } from "./SpecimenHistorySheet";
import { SpecimenWorkflowCard } from "./SpecimenWorkflowCard";
import { useServiceRequestSpecimens } from "./useServiceRequestSpecimens";

interface ServiceRequestSpecimenWorkflowProps {
  request: ServiceRequestReadSpec;
  requirements: SpecimenDefinitionRead[];
  facilityId: string;
  serviceRequestId: string;
  disableEdit: boolean;
}

export function ServiceRequestSpecimenWorkflow({
  request,
  requirements,
  facilityId,
  serviceRequestId,
  disableEdit,
}: ServiceRequestSpecimenWorkflowProps) {
  const { t } = useTranslation();
  const [selectedSpecimenDefinition, setSelectedSpecimenDefinition] =
    useState<SpecimenDefinitionRead | null>(null);
  const {
    isPrintingAllQRCodes,
    isQRCodeSheetOpen,
    setIsQRCodeSheetOpen,
    isCreatingDraftSpecimen,
    createDraftSpecimen,
    preparePrintAllQRCodes,
  } = useServiceRequestSpecimens({
    request,
    requirements,
    facilityId,
    serviceRequestId,
  });
  const assignedSpecimenIds = new Set<string>();
  const getExistingDraftSpecimen = (slug: string) =>
    request.specimens.find(
      (specimen) =>
        specimen.specimen_definition?.slug === slug &&
        specimen.status === SpecimenStatus.draft,
    );
  const allSpecimensCollected = requirements.every((requirement) =>
    request.specimens.some(
      (specimen) =>
        specimen.specimen_definition?.id === requirement.id &&
        specimen.status === SpecimenStatus.available,
    ),
  );
  const pendingRequirementsCount = requirements.filter(
    (requirement) =>
      !request.specimens.some(
        (specimen) =>
          specimen.specimen_definition?.id === requirement.id &&
          specimen.status === SpecimenStatus.available,
      ),
  ).length;
  return (
    <>
      {requirements.length > 0 && !selectedSpecimenDefinition && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h5 className="text-gray-950 font-semibold">
                {allSpecimensCollected
                  ? t("collected_specimen")
                  : t("pending_specimen_collection")}
              </h5>
              <Badge
                variant={allSpecimensCollected ? "green" : "orange"}
                className="mr-3"
              >
                {allSpecimensCollected
                  ? requirements.length
                  : pendingRequirementsCount}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <MultiQRCodePrintSheet
                specimens={getActiveAndDraftSpecimens(request?.specimens)}
                open={isQRCodeSheetOpen}
                onOpenChange={setIsQRCodeSheetOpen}
                isLoading={isPrintingAllQRCodes}
              >
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={t("print_all_qr_codes")}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("view_specimen_history")}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <SpecimenHistorySheet
                    specimens={(request?.specimens || []).filter(
                      (specimen) =>
                        specimen.status === SpecimenStatus.entered_in_error ||
                        specimen.status === SpecimenStatus.unavailable ||
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
          {requirements.map((requirement) => {
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
        <div className="space-y-3">
          <div className="flex items-center gap-2 py-1.5">
            <h5 className="text-gray-950 font-semibold">
              {t("pending_specimen_collection")}
            </h5>
            <Badge variant="orange">{pendingRequirementsCount}</Badge>
          </div>
          <Card className="overflow-hidden rounded-lg shadow-xs">
            <CardHeader
              className="flex cursor-pointer flex-col gap-3 bg-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
              onClick={() => setSelectedSpecimenDefinition(null)}
            >
              <div className="min-w-0 m-0">
                <span className="text-sm text-gray-600">{t("required")}:</span>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
                  <span className="truncate">
                    {selectedSpecimenDefinition.title}
                  </span>
                  {getExistingDraftSpecimen(
                    selectedSpecimenDefinition.slug,
                  ) && <Badge variant="indigo">{t("draft")}</Badge>}
                </CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0 justify-between">
                <Badge variant="orange">{t("collection_pending")}</Badge>
                <ChevronsDownUp className="size-4 mx-2" />
              </div>
            </CardHeader>
            <CardContent className="bg-gray-100 p-2 pt-0">
              <SpecimenForm
                specimenDefinition={selectedSpecimenDefinition}
                onCancel={() => setSelectedSpecimenDefinition(null)}
                facilityId={facilityId}
                draftSpecimen={getExistingDraftSpecimen(
                  selectedSpecimenDefinition.slug,
                )}
                serviceRequestId={serviceRequestId}
                disableEdit={disableEdit}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
