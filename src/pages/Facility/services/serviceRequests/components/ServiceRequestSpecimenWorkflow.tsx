import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  CircleCheck,
  MoreVertical,
  PrinterIcon,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import GenericQRScanDialog from "@/components/Scan/GenericQRScanDialog";

import { useShortcutSubContext } from "@/context/ShortcutContext";

import useAuthUser from "@/hooks/useAuthUser";

import { BatchRequestObject } from "@/Utils/request/batch";
import mutate from "@/Utils/request/mutate";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import {
  SpecimenRead,
  SpecimenStatus,
  getActiveAndDraftSpecimens,
} from "@/types/emr/specimen/specimen";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

import {
  COLLECTED_ROW_COLUMNS,
  CollectedSpecimenRow,
} from "./CollectedSpecimenRow";
import { MultiQRCodePrintSheet } from "./MultiQRCodePrintSheet";
import { SpecimenCollectionRow } from "./SpecimenCollectionRow";
import { SpecimenHistorySheet } from "./SpecimenHistorySheet";
import {
  type PendingSpecimen,
  drawOrder,
  matchRequirements,
} from "./specimenCollection";
import { useServiceRequestSpecimens } from "./useServiceRequestSpecimens";
import { useSpecimenEntries } from "./useSpecimenEntries";

const DISCARDED_STATUSES = [
  SpecimenStatus.entered_in_error,
  SpecimenStatus.unavailable,
  SpecimenStatus.unsatisfactory,
];

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
  useShortcutSubContext(requirements.length ? "facility:service" : undefined);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id: collector } = useAuthUser();
  const {
    isPrintingAllQRCodes,
    isQRCodeSheetOpen,
    setIsQRCodeSheetOpen,
    preparePrintAllQRCodes,
  } = useServiceRequestSpecimens({
    request,
    requirements,
    facilityId,
    serviceRequestId,
  });
  const { pending, collected } = matchRequirements(request, requirements);
  pending.sort((a, b) => drawOrder(a.requirement) - drawOrder(b.requirement));
  const {
    identifierOf,
    rowProps,
    collect,
    resetEntries,
    cameraFor,
    setCameraFor,
    handleCameraScan,
  } = useSpecimenEntries(
    pending,
    ({ requirement }) => requirement.title,
    false,
  );
  const queryKey = ["serviceRequest", facilityId, serviceRequestId];

  const {
    mutate: save,
    isPending: isSaving,
    variables: saving,
  } = useMutation({
    mutationFn: ({ api, pathParams, body }: BatchRequestObject) =>
      mutate(api, { pathParams })(body),
    onSuccess: async (_, { referenceId }) => {
      toast.success(t("specimen_collected"));
      // Keeps the row as it is until it moves to the collected list.
      await queryClient.invalidateQueries({ queryKey });
      resetEntries([referenceId]);
    },
    onError: () => toast.error(t("specimen_update_error")),
  });

  // One label, printed on its own as the old QR card's button did.
  const [label, setLabel] = useState<SpecimenRead | null>(null);
  const printLabel = (specimen: SpecimenRead) => {
    flushSync(() => setLabel(specimen));
    window.print();
    setLabel(null);
  };
  const [expanded, setExpanded] = useState<boolean | null>(null);

  const handleCollect = (item: PendingSpecimen) => {
    if (isSaving) return;
    if (!collector) {
      toast.error(t("specimen_collector_unavailable"));
      return;
    }
    const [collectRequest] = collect([item], facilityId, collector) ?? [];
    if (collectRequest) save(collectRequest);
  };

  if (!requirements.length) return null;

  const firstToScan = pending.find((item) => !identifierOf(item));
  const allCollected = pending.length === 0 && collected.length > 0;
  // Folds away once every tube is in and results have started; a tube that
  // goes back to pending always shows.
  const isOpen =
    !allCollected || (expanded ?? request.diagnostic_reports.length === 0);
  const groupHeading = (title: string, count: number, dot: string) => (
    <div className="flex items-center gap-2 border-y border-border bg-soft-background px-4 py-2 sm:px-5">
      <span className={cn("size-2 rounded-full", dot)} />
      <h6 className="text-sm font-semibold text-muted-foreground">{title}</h6>
      <span className="text-sm text-soft-foreground">{count}</span>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-white shadow-xs">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-4 py-3 sm:px-5">
        <h5 className="font-semibold text-foreground">{t("specimens")}</h5>
        <span className="flex items-center gap-1 text-sm text-soft-foreground">
          {allCollected && (
            <CircleCheck aria-hidden="true" className="size-4 text-green-600" />
          )}
          {t("specimens_collected_progress", {
            collected: collected.length,
            total: requirements.length,
          })}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <MultiQRCodePrintSheet
            specimens={getActiveAndDraftSpecimens(request.specimens)}
            open={isQRCodeSheetOpen}
            onOpenChange={setIsQRCodeSheetOpen}
            isLoading={isPrintingAllQRCodes}
          >
            <Button
              variant="outline"
              aria-label={t("print_all_qr_codes")}
              onClick={preparePrintAllQRCodes}
              disabled={isPrintingAllQRCodes}
            >
              <PrinterIcon />
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
                className="text-soft-foreground"
                aria-label={t("view_specimen_history")}
              >
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <SpecimenHistorySheet
                specimens={request.specimens.filter(({ status }) =>
                  DISCARDED_STATUSES.includes(status),
                )}
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("view_specimen_history")}
                </DropdownMenuItem>
              </SpecimenHistorySheet>
            </DropdownMenuContent>
          </DropdownMenu>
          {allCollected && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("text-soft-foreground", isOpen && "bg-muted")}
              onClick={() => setExpanded(!isOpen)}
              aria-expanded={isOpen}
              aria-label={t(isOpen ? "collapse" : "expand")}
            >
              <ChevronDown
                className={cn("transition-transform", isOpen && "rotate-180")}
              />
            </Button>
          )}
        </div>
      </div>

      {isOpen && pending.length > 0 && (
        <>
          {groupHeading(t("to_collect"), pending.length, "bg-amber-600")}
          <div className="divide-y divide-soft-border">
            {pending.map((item) => {
              const container = item.requirement.type_tested?.container;
              const isSavingRow = isSaving && saving?.referenceId === item.key;
              return (
                <SpecimenCollectionRow
                  key={item.key}
                  item={item}
                  title={item.requirement.title}
                  subtitle={[
                    item.requirement.type_collected?.display,
                    container?.cap?.display,
                    container?.description,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {...rowProps(item)}
                  disabled={disableEdit || isSavingRow}
                  onCollect={() => handleCollect(item)}
                  collecting={isSavingRow}
                  shortcut={!disableEdit && item === firstToScan}
                />
              );
            })}
          </div>
        </>
      )}

      {isOpen && collected.length > 0 && (
        <>
          {groupHeading(t("collected"), collected.length, "bg-green-600")}
          <div
            className={cn(
              "hidden gap-x-3.5 border-b border-soft-border px-5 pt-2 pb-1.5 text-sm text-soft-foreground lg:grid",
              COLLECTED_ROW_COLUMNS,
            )}
          >
            <span>{t("specimen")}</span>
            <span>{t("specimen_id")}</span>
            <span>{t("qty")}</span>
            <span>{t("collected")}</span>
            <span>{t("processing")}</span>
            <span className="sr-only">{t("actions")}</span>
          </div>
          <div className="divide-y divide-soft-border">
            {collected.map((item) => (
              <CollectedSpecimenRow
                key={item.key}
                item={item}
                facilityId={facilityId}
                disableEdit={disableEdit}
                onPrint={() => printLabel(item.specimen)}
              />
            ))}
          </div>
        </>
      )}

      {label && (
        <div id="single-print" className="hidden print:scale-60">
          <div className="flex flex-row items-start gap-6">
            <QRCodeSVG
              value={label.accession_identifier || label.id}
              size={100}
              className="shrink-0 bg-white"
              imageSettings={{
                src: "/images/care_logo_mark.svg",
                height: 25,
                width: 25,
                excavate: true,
              }}
              level="H"
            />
            <div className="text-left">
              {label.specimen_type?.display && (
                <div className="pt-2.5 text-lg font-semibold">
                  {label.specimen_type.display}
                </div>
              )}
              {label.specimen_definition?.title && (
                <div className="text-sm text-soft-foreground">
                  {label.specimen_definition.title}
                </div>
              )}
              <div className="text-sm font-semibold break-all text-muted-foreground uppercase">
                {label.accession_identifier || label.id}
              </div>
            </div>
          </div>
        </div>
      )}

      <GenericQRScanDialog
        open={!!cameraFor}
        onOpenChange={(open) => !open && setCameraFor(null)}
        onScanSuccess={handleCameraScan}
        title={t("scan_qr")}
        inputLabel={t("specimen_id")}
        inputPlaceholder={t("enter_specimen_id")}
      />
    </section>
  );
}
