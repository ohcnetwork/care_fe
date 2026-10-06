import { MoreVertical, PrinterIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
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
  return (
    <>
      {requirements.length > 0 && !selectedSpecimenDefinition && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("specimens")}</h2>
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
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="pb-0 flex flex-row justify-between items-center">
            <CardTitle>
              {t("collect_specimen")}: {selectedSpecimenDefinition?.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("back")}
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
              disableEdit={disableEdit}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
