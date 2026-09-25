import { t } from "i18next";
import { CircleDashed, FileText, PackageSearch, Plus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { PrintableQRCode } from "@/components/PrintableQRCode";

import { useShortcutSubContext } from "@/context/ShortcutContext";

import { ProcessSpecimen } from "@/pages/Facility/services/serviceRequests/components/ProcessSpecimen";
import {
  EDITABLE_SERVICE_REQUEST_STATUSES,
  ServiceRequestReadSpec,
} from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenRead, SpecimenStatus } from "@/types/emr/specimen/specimen";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

import { CollectedSpecimenHeader } from "./CollectedSpecimenHeader";
import { SpecimenCollectionDetails } from "./SpecimenCollectionDetails";
import { SpecimenCollectionInstructions } from "./SpecimenCollectionInstructions";

import { useSpecimenWorkflowActions } from "./useSpecimenWorkflowActions";

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
  useShortcutSubContext("facility:service");

  const isDraft = specimen?.status === SpecimenStatus.draft;
  const collectedSpecimen = !isDraft ? specimen : undefined;
  const hasCollected = !!collectedSpecimen;
  const disableEdit = !EDITABLE_SERVICE_REQUEST_STATUSES.includes(
    request.status,
  );

  const {
    discardSpecimen,
    isDiscarding,
    handleAddProcessing,
    handleUpdateProcessing,
  } = useSpecimenWorkflowActions({
    facilityId,
    serviceRequestId,
    collectedSpecimen,
  });

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
            {collectedSpecimen ? (
              // --- Collected Header ---
              <CollectedSpecimenHeader
                collectedSpecimen={collectedSpecimen}
                isOpen={isOpen}
                disableEdit={disableEdit}
                isDiscarding={isDiscarding}
                onDiscard={discardSpecimen}
              />
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
                  disabled={disableEdit}
                >
                  <Plus className="size-4" />
                  {t("collect_specimen")}
                  <ShortcutBadge actionId="collect-specimen" />
                </Button>
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
          {/* === Accordion for Instructions, Collection Details, Processing, Discard === */}
          <CardContent className="p-2 bg-gray-100">
            {collectedSpecimen && (
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
              <SpecimenCollectionInstructions
                requirement={requirement}
                hasCollected={hasCollected}
              />

              {/* 2. Collection Details (Only if collected) */}
              {collectedSpecimen && (
                <SpecimenCollectionDetails specimen={collectedSpecimen} />
              )}

              {/* 3. Processing (Only if collected and not discarded) */}
              {hasCollected && !isDiscarded && (
                <div className="px-1 pt-3 pb-4">
                  <ProcessSpecimen
                    existingProcessing={collectedSpecimen?.processing ?? []}
                    onAddProcessing={handleAddProcessing}
                    onUpdateProcessing={handleUpdateProcessing}
                    diagnosticReports={request.diagnostic_reports ?? []}
                    disableEdit={disableEdit}
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
