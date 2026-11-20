import { t } from "i18next";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

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
        "overflow-hidden rounded-lg shadow-xs",
        isDiscarded && "opacity-70 bg-soft-background",
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-3 bg-background">
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <div className="min-w-0">
                <span className="text-sm text-muted-foreground">
                  {t("required")}:
                </span>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
                  <span className="truncate">{requirement.title}</span>
                  {isDraft && <Badge variant="indigo">{t("draft")}</Badge>}
                </CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0 justify-between">
                <Badge variant="orange">{t("collection_pending")}</Badge>

                {isDraft ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCollect}
                    disabled={disableEdit}
                    aria-label={t("collect_specimen")}
                  >
                    <ChevronsUpDown className="size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={onCollect}
                    variant="outline_primary"
                    disabled={disableEdit}
                  >
                    <Plus className="size-4" />
                    {t("collect_specimen")}
                    <ShortcutBadge actionId="collect-specimen" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
          {/* === Accordion for Instructions, Collection Details, Processing, Discard === */}
          <CardContent className="p-2">
            {collectedSpecimen && (
              <div className="rounded-lg mb-3 p-4 text-center bg-soft-background">
                <PrintableQRCode
                  value={
                    collectedSpecimen.accession_identifier ||
                    collectedSpecimen.id
                  }
                  title={collectedSpecimen.specimen_type?.display}
                  subtitle={collectedSpecimen.specimen_definition?.title}
                />
              </div>
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
                <AccordionItem
                  value="collection-details"
                  className="border-none"
                >
                  <AccordionTrigger className="px-4 py-2 text-sm hover:bg-soft-background/50 aria-[expanded=false]:bg-muted aria-expanded:bg-soft-background aria-expanded:rounded-b-none">
                    {t("specimen_collection")}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-1 pb-4 space-y-4 bg-soft-background rounded-b-lg">
                    <p className="font-semibold text-xs mb-2">
                      {t("collected_specimen_details")}
                    </p>
                    {collectedSpecimen.collection && (
                      <SpecimenCollectionDetails
                        collection={collectedSpecimen.collection}
                      />
                    )}
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
