import { ChevronDown, MoreVertical, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { formatDateTime, formatName } from "@/Utils/utils";

import { ProcessSpecimen } from "./ProcessSpecimen";
import { SpecimenDiscardDialog } from "./SpecimenDiscardDialog";
import { SpecimenNameCell } from "./SpecimenNameCell";
import { SpecimenRequirementsInfo } from "./SpecimenRequirements";
import { type CollectedSpecimen, formatQuantity } from "./specimenCollection";
import { useSpecimenWorkflowActions } from "./useSpecimenWorkflowActions";

/** The collected table's columns, shared with its column headings. */
export const COLLECTED_ROW_COLUMNS =
  "lg:grid-cols-[minmax(0,1fr)_8rem_6.5rem_10rem_5.75rem_5.25rem]";

interface CollectedSpecimenRowProps {
  item: CollectedSpecimen;
  facilityId: string;
  disableEdit: boolean;
  onPrint: () => void;
}

export function CollectedSpecimenRow({
  item: { key, request, requirement, specimen },
  facilityId,
  disableEdit,
  onPrint,
}: CollectedSpecimenRowProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const {
    discardSpecimen,
    isDiscarding,
    handleAddProcessing,
    handleUpdateProcessing,
  } = useSpecimenWorkflowActions({
    facilityId,
    serviceRequestId: request.id,
    collectedSpecimen: specimen,
  });
  const { collection } = specimen;
  const container = requirement.type_tested?.container;
  const steps = specimen.processing?.length ?? 0;
  const specimenId = specimen.accession_identifier || specimen.id;
  const collectedAt =
    collection?.collected_date_time &&
    formatDateTime(collection.collected_date_time, "hh:mm A, DD MMM YYYY");
  const collectedBy = collection?.collector_object
    ? formatName(collection.collector_object)
    : collection?.collector && t("unknown");
  const quantity = formatQuantity(collection?.quantity);
  const details = [
    [t("method"), collection?.method?.display || collection?.method?.code],
    [
      t("body_site"),
      collection?.body_site?.display || collection?.body_site?.code,
    ],
    [
      t("fasting_status"),
      [
        collection?.fasting_status_codeable_concept?.display ||
          collection?.fasting_status_codeable_concept?.code,
        formatQuantity(collection?.fasting_status_duration),
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    [t("note"), specimen.note],
  ].filter(([, value]) => !!value);
  // Steps can be added until a report is started.
  const hasReport = !!request.diagnostic_reports?.length;
  const canAddStep = !disableEdit && !hasReport;
  const hasDetails = details.length > 0 || steps > 0 || !hasReport;
  // Opens the row, where the processing steps live.
  const processing = steps ? (
    <button
      type="button"
      onClick={() => setShowDetails(true)}
      className="justify-self-start rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {t("processing_steps_count", { count: steps })}
    </button>
  ) : canAddStep ? (
    <Button
      variant="link"
      className="h-auto justify-self-start p-0"
      aria-label={t("process_specimen")}
      onClick={() => setShowDetails(true)}
    >
      <Plus />
      {t("add")}
    </Button>
  ) : (
    <span className="text-sm text-soft-foreground">{t("none")}</span>
  );

  return (
    <div
      id={key}
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 px-4 py-2.5 sm:px-5",
        COLLECTED_ROW_COLUMNS,
      )}
    >
      <SpecimenNameCell
        requirement={requirement}
        title={requirement.title}
        subtitle={[
          specimen.specimen_type?.display,
          container?.cap?.display,
          container?.description,
        ]
          .filter(Boolean)
          .join(" · ")}
        info={<SpecimenRequirementsInfo requirement={requirement} />}
      />
      <span
        className="hidden truncate font-mono text-sm font-medium text-foreground lg:block"
        title={specimenId}
      >
        {specimenId}
      </span>
      <span
        className="hidden truncate text-sm text-foreground lg:block"
        title={quantity ?? undefined}
      >
        {quantity ?? "-"}
      </span>
      <div className="hidden min-w-0 lg:block">
        <p className="truncate text-sm text-foreground">{collectedAt ?? "-"}</p>
        {collectedBy && (
          <p
            className="truncate text-sm text-soft-foreground"
            title={collectedBy}
          >
            {collectedBy}
          </p>
        )}
      </div>
      <div className="hidden lg:grid">{processing}</div>
      <div className="flex justify-end gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-soft-foreground"
              aria-label={t("actions")}
            >
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onPrint}>{t("print")}</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDetails(true)}
              disabled={!canAddStep}
            >
              {t("process_specimen")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDiscardOpen(true)}
              disabled={disableEdit}
            >
              {t("discard")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          className={cn("text-soft-foreground", showDetails && "bg-muted")}
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          aria-label={t("more_details")}
          disabled={!hasDetails}
        >
          <ChevronDown
            className={cn("transition-transform", showDetails && "rotate-180")}
          />
        </Button>
      </div>
      <div className="col-span-full flex flex-wrap items-center gap-x-1.5 gap-y-1 pl-5.5 text-sm text-soft-foreground lg:hidden">
        <span className="font-mono font-medium break-all text-foreground">
          {specimenId}
        </span>
        {[quantity, collectedAt, collectedBy].filter(Boolean).map((part) => (
          <span key={part}>· {part}</span>
        ))}
        {steps > 0 && <span className="ml-auto">{processing}</span>}
      </div>
      {showDetails && hasDetails && (
        <div className="col-span-full mt-1.5 grid grid-cols-1 gap-2.5 rounded-lg bg-soft-background p-3 lg:ml-5.5">
          {details.length > 0 && (
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="flex min-w-0 gap-1.5">
                  <dt className="shrink-0 text-soft-foreground">{label}</dt>
                  <dd className="min-w-0 break-words text-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <ProcessSpecimen
            existingProcessing={specimen.processing ?? []}
            onAddProcessing={handleAddProcessing}
            onUpdateProcessing={handleUpdateProcessing}
            hasReport={hasReport}
            disableEdit={disableEdit}
          />
        </div>
      )}
      <SpecimenDiscardDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        isDiscarding={isDiscarding}
        onDiscard={(status) =>
          discardSpecimen(status, { onSuccess: () => setDiscardOpen(false) })
        }
      />
    </div>
  );
}
