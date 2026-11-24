import { CheckIcon, CircleCheck, PrinterIcon, TestTube } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import GenericQRScanDialog from "@/components/Scan/GenericQRScanDialog";

import useAuthUser from "@/hooks/useAuthUser";

import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";

import { MultiQRCodePrintSheet } from "./MultiQRCodePrintSheet";
import { SpecimenCollectionGroup } from "./SpecimenCollectionGroup";
import { SpecimenCollectionRow } from "./SpecimenCollectionRow";
import { type PendingSpecimen, drawOrder } from "./specimenCollection";
import { useBatchSpecimenCollection } from "./useBatchSpecimenCollection";
import { useSpecimenEntries } from "./useSpecimenEntries";

interface BatchSpecimenCollectionSheetProps {
  facilityId: string;
  /** One patient's service requests. */
  requests: ServiceRequestReadSpec[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function BatchSpecimenCollectionSheet({
  facilityId,
  requests,
  open,
  onOpenChange,
  onSaved,
}: BatchSpecimenCollectionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="xl">
        <BatchSpecimenCollectionForm
          facilityId={facilityId}
          requests={requests}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </SheetContent>
    </Sheet>
  );
}

const specimenType = ({ requirement }: PendingSpecimen) =>
  requirement.type_collected?.display ?? "";

function BatchSpecimenCollectionForm({
  facilityId,
  requests,
  onClose,
  onSaved,
}: {
  facilityId: string;
  requests: ServiceRequestReadSpec[];
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const { id: collector } = useAuthUser();
  const {
    pending,
    collectedCount,
    isError,
    isLoading,
    isSaving,
    save,
    prepareDrafts,
    isPreparingDrafts,
  } = useBatchSpecimenCollection(facilityId, requests, () => {
    onSaved?.();
    onClose();
  });
  const [skipped, setSkipped] = useState<string[]>([]);
  const [printOpen, setPrintOpen] = useState(false);

  // One group per specimen type, its tubes in order of draw.
  const byType = new Map<string, PendingSpecimen[]>();
  for (const item of pending) {
    byType.set(specimenType(item), [
      ...(byType.get(specimenType(item)) ?? []),
      item,
    ]);
  }
  const groups = [...byType]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([type, items]) =>
        [
          type,
          items.sort(
            (a, b) => drawOrder(a.requirement) - drawOrder(b.requirement),
          ),
        ] as const,
    );
  const isIncluded = ({ key }: PendingSpecimen) => !skipped.includes(key);
  const included = groups.flatMap(([, items]) => items).filter(isIncluded);
  const {
    identifierOf,
    identifierInputs,
    rowProps,
    collect,
    cameraFor,
    setCameraFor,
    handleCameraScan,
  } = useSpecimenEntries(included);

  // After a tick changes, the next scan should still land in an ID box.
  useEffect(() => {
    [...identifierInputs.current.values()]
      .find((input) => !input.value.trim())
      ?.focus();
  }, [skipped, identifierInputs]);

  const firstToScan = included.find((item) => !identifierOf(item));
  const scannedCount = included.filter(identifierOf).length;

  // Tubes with a scanned label need no printed one.
  const toLabel = included.filter((item) => !identifierOf(item));
  const draftsToMake = toLabel.filter(({ draft }) => !draft);
  const labelDrafts = toLabel.flatMap(({ draft }) => (draft ? [draft] : []));
  const labels = new Map(
    pending.map(({ draft, request }) => [
      draft?.id,
      `${request.encounter.patient.name} · ${request.title}`,
    ]),
  );

  const handleSave = () => {
    if (!collector) {
      toast.error(t("specimen_collector_unavailable"));
      return;
    }
    const requests = collect(included, facilityId, collector);
    if (requests) save(requests);
  };

  const isReady = !isError && !isLoading && pending.length > 0;
  const specimenTotal = pending.length + collectedCount;

  return (
    <>
      <SheetHeader>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
          <SheetTitle>{t("collect_specimen")}</SheetTitle>
          {!isError && !isLoading && specimenTotal > 0 && (
            <span className="flex items-center gap-1 text-sm text-soft-foreground">
              {!pending.length && (
                <CircleCheck
                  aria-hidden="true"
                  className="size-4 text-green-600"
                />
              )}
              {t("specimens_collected_progress", {
                collected: collectedCount,
                total: specimenTotal,
              })}
            </span>
          )}
        </div>
        <SheetDescription>
          {requests[0]?.encounter.patient.name}
        </SheetDescription>
      </SheetHeader>

      <SheetBody>
        {isError ? (
          <p role="alert" className="text-sm text-muted-foreground">
            {t("error_loading_sq_or_ad")}
          </p>
        ) : isLoading ? (
          <CardGridSkeleton count={2} />
        ) : !pending.length ? (
          collectedCount ? (
            <EmptyState
              icon={<CircleCheck className="size-6 text-green-600" />}
              title={t("all_specimens_collected")}
              description={t("all_specimens_collected_description")}
              className="border-green-200 bg-green-50/60"
            />
          ) : (
            <EmptyState
              icon={<TestTube className="size-6 text-primary" />}
              title={t("no_specimens_available")}
            />
          )
        ) : (
          <div className="space-y-4">
            {groups.map(([type, items]) => {
              const groupIncluded = items.filter(isIncluded);
              return (
                <SpecimenCollectionGroup
                  key={type}
                  title={type}
                  total={items.length}
                  included={groupIncluded.length}
                  scanned={groupIncluded.filter(identifierOf).length}
                  disabled={isSaving}
                  onIncludedChange={(checked) =>
                    setSkipped((keys) => [
                      ...keys.filter(
                        (key) => !items.some((item) => item.key === key),
                      ),
                      ...(checked ? [] : items.map(({ key }) => key)),
                    ])
                  }
                >
                  {items.map((item) => (
                    <SpecimenCollectionRow
                      key={item.key}
                      item={item}
                      title={item.request.title}
                      subtitle={[
                        item.requirement.type_tested?.container?.cap?.display,
                        item.requirement.title,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      {...rowProps(item)}
                      included={isIncluded(item)}
                      disabled={isSaving}
                      autoFocus={item === firstToScan}
                      onIncludedChange={(checked) =>
                        setSkipped((keys) =>
                          checked
                            ? keys.filter((key) => key !== item.key)
                            : [...keys, item.key],
                        )
                      }
                    />
                  ))}
                </SpecimenCollectionGroup>
              );
            })}
          </div>
        )}
      </SheetBody>

      <SheetFooter>
        {isReady && (
          <p className="text-sm text-muted-foreground sm:mr-auto sm:self-center">
            {t("specimens_scanned", {
              scanned: scannedCount,
              total: included.length,
            })}
            {pending.length > included.length &&
              ` · ${t("specimens_left_out", { count: pending.length - included.length })}`}
          </p>
        )}
        {!isLoading && !isError && !pending.length ? (
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
        ) : (
          <>
            {draftsToMake.length ? (
              // Labels need specimen IDs, so make drafts first, then open the print sheet.
              <Button
                variant="outline"
                onClick={() =>
                  prepareDrafts(draftsToMake).then(() => setPrintOpen(true))
                }
                disabled={isError || isLoading || isSaving || isPreparingDrafts}
              >
                <PrinterIcon className="size-4" />
                {isPreparingDrafts ? t("preparing") : t("print_all_qr_codes")}
              </Button>
            ) : (
              // Keyed so a changed set starts fully ticked; it ticks only what it first gets.
              <MultiQRCodePrintSheet
                key={labelDrafts.map(({ id }) => id).join()}
                specimens={labelDrafts}
                open={printOpen}
                onOpenChange={setPrintOpen}
                getLabelText={(specimen) => labels.get(specimen.id) ?? ""}
              >
                <Button
                  variant="outline"
                  disabled={isError || isLoading || !labelDrafts.length}
                >
                  <PrinterIcon className="size-4" />
                  {t("print_all_qr_codes")}
                </Button>
              </MultiQRCodePrintSheet>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={
                isError ||
                isLoading ||
                isSaving ||
                isPreparingDrafts ||
                !included.length
              }
            >
              <CheckIcon className="size-4" />
              {t("mark_as_collected")}
            </Button>
          </>
        )}
      </SheetFooter>

      <GenericQRScanDialog
        open={!!cameraFor}
        onOpenChange={(open) => !open && setCameraFor(null)}
        onScanSuccess={handleCameraScan}
        title={t("scan_qr")}
        inputLabel={t("specimen_id")}
        inputPlaceholder={t("enter_specimen_id")}
        autoStartScanning
      />
    </>
  );
}
