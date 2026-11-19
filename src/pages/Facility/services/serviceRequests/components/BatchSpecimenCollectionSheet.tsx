import { CheckIcon, PrinterIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenRead } from "@/types/emr/specimen/specimen";

import { MultiQRCodePrintSheet } from "./MultiQRCodePrintSheet";
import { SpecimenCollectCard } from "./SpecimenCollectCard";
import { SpecimenForm, type SpecimenFormHandle } from "./SpecimenForm";
import {
  type PendingSpecimen,
  useBatchSpecimenCollection,
} from "./useBatchSpecimenCollection";

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
  const { pending, isError, isPreparing, isSaving, save } =
    useBatchSpecimenCollection(facilityId, requests, () => {
      onSaved?.();
      onClose();
    });
  const [skipped, setSkipped] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const forms = useRef(new Map<string, SpecimenFormHandle>());

  const toCollect = pending.filter(({ key }) => !skipped.includes(key));
  const drafts = toCollect.flatMap(({ draft }) => (draft ? [draft] : []));
  const labels = new Map(
    pending.map(({ draft, request }) => [
      draft?.id,
      `${request.encounter.patient.name} · ${request.title}`,
    ]),
  );

  const samples = new Map<string, PendingSpecimen[]>();
  for (const item of pending) {
    const sample = item.requirement.type_collected?.display ?? "";
    samples.set(sample, [...(samples.get(sample) ?? []), item]);
  }

  const handleSave = () => {
    const specimens = toCollect.map(
      ({ key }) => forms.current.get(key)?.collect() ?? null,
    );
    const invalid = toCollect.filter((_, index) => !specimens[index]);
    if (invalid.length) {
      setCollapsed((keys) =>
        keys.filter((key) => !invalid.some((item) => item.key === key)),
      );
      document
        .getElementById(invalid[0].key)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    save(specimens as SpecimenRead[]);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{t("collect_specimen")}</SheetTitle>
        <SheetDescription>
          {requests[0]?.encounter.patient.name}
        </SheetDescription>
      </SheetHeader>

      <SheetBody>
        {isError ? (
          <p role="alert" className="text-sm text-muted-foreground">
            {t("error_loading_sq_or_ad")}
          </p>
        ) : isPreparing ? (
          <CardGridSkeleton count={2} />
        ) : !pending.length ? (
          <p className="text-sm text-muted-foreground">
            {t("no_specimens_available")}
          </p>
        ) : (
          <div className="space-y-6">
            {[...samples].map(([sample, items]) => (
              <div key={sample} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h5 className="text-foreground font-semibold">{sample}</h5>
                  <Badge variant="orange">{items.length}</Badge>
                </div>
                {items.map(({ key, request, requirement, draft }) => (
                  <div key={key} id={key}>
                    <SpecimenCollectCard
                      requirement={requirement}
                      hasDraft={!!draft}
                      testName={request.title}
                      checked={!skipped.includes(key)}
                      onCheckedChange={(checked) => {
                        const update = (keys: string[]) =>
                          checked
                            ? keys.filter((other) => other !== key)
                            : [...keys, key];
                        setSkipped(update);
                        setCollapsed(update);
                      }}
                      collapsed={collapsed.includes(key)}
                      onToggle={() =>
                        setCollapsed((keys) =>
                          keys.includes(key)
                            ? keys.filter((other) => other !== key)
                            : [...keys, key],
                        )
                      }
                    >
                      <SpecimenForm
                        ref={(form) => {
                          if (form) forms.current.set(key, form);
                          else forms.current.delete(key);
                        }}
                        specimenDefinition={requirement}
                        onCancel={onClose}
                        facilityId={facilityId}
                        draftSpecimen={draft}
                        serviceRequestId={request.id}
                        disableEdit={isSaving}
                        hideActions
                      />
                    </SpecimenCollectCard>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </SheetBody>

      <SheetFooter>
        {/* The print sheet ticks only the specimens it first gets. */}
        <MultiQRCodePrintSheet
          specimens={isPreparing ? [] : drafts}
          getLabelText={(specimen) => labels.get(specimen.id) ?? ""}
        >
          <Button
            variant="outline"
            disabled={isError || isPreparing || !drafts.length}
          >
            <PrinterIcon className="size-4" />
            {t("print_qr_codes")}
          </Button>
        </MultiQRCodePrintSheet>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isError || isPreparing || isSaving || !toCollect.length}
        >
          <CheckIcon className="size-4" />
          {t("mark_as_collected")}
        </Button>
      </SheetFooter>
    </>
  );
}
