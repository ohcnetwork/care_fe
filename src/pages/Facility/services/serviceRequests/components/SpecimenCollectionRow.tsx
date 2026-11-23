import { Camera, ChevronDown, CircleCheck, ScanBarcode } from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { useShortcutDisplay } from "@/context/ShortcutContext";

import { SPECIMEN_DEFINITION_UNITS_CODES } from "@/types/emr/specimenDefinition/specimenDefinition";
import dayjs from "@/Utils/dayjs";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

import {
  COMPACT_PICKER,
  MIN_ACCESSION_IDENTIFIER_LENGTH,
  type PendingSpecimen,
  type SpecimenEntry,
  type SpecimenEntryErrors,
} from "./specimenCollection";
import { SpecimenNameCell } from "./SpecimenNameCell";
import { SpecimenRequirementsInfo } from "./SpecimenRequirements";

/** The batch sheet's columns, shared with its column headings. */
export const SHEET_ROW_COLUMNS =
  "md:grid-cols-[1.125rem_minmax(0,1fr)_13.75rem_10.5rem_2.5rem]";

// Joins a picker with a short input, the picker taking the free width.
const JOINED_FIELD = cn(
  COMPACT_PICKER,
  "w-full min-w-0 [&>button]:flex-1 [&>input]:h-auto [&>input]:min-h-12 md:[&>input]:min-h-10 [&>input]:flex-none [&>input]:bg-white",
);

interface SpecimenCollectionRowProps {
  item: PendingSpecimen;
  title: string;
  subtitle: string;
  /** The batch sheet's scanner rules; the request page keeps its old form's. */
  scanner?: boolean;
  entry: SpecimenEntry;
  errors: SpecimenEntryErrors;
  disabled: boolean;
  autoFocus?: boolean;
  identifierRef: (input: HTMLInputElement | null) => void;
  onChange: (patch: Partial<SpecimenEntry>) => void;
  onIdentifierEnter: () => void;
  onCameraScan: () => void;
  /** In the batch sheet: whether the test is in the batch. */
  included?: boolean;
  onIncludedChange?: (included: boolean) => void;
  /** On the request page: saves this test on its own. */
  onCollect?: () => void;
  collecting?: boolean;
  /** Makes the collect shortcut jump to this row's ID field. */
  shortcut?: boolean;
}

export function SpecimenCollectionRow({
  item: { key, requirement, draft },
  title,
  subtitle,
  scanner = true,
  entry,
  errors,
  disabled,
  autoFocus = false,
  identifierRef,
  onChange,
  onIdentifierEnter,
  onCameraScan,
  included = true,
  onIncludedChange,
  onCollect,
  collecting = false,
  shortcut = false,
}: SpecimenCollectionRowProps) {
  const { t } = useTranslation();
  const getShortcutDisplay = useShortcutDisplay();
  const [showDetails, setShowDetails] = useState(false);
  // Opens the details when a check fails on a field inside them.
  const [fastingError, setFastingError] = useState(errors.fastingHours);
  if (errors.fastingHours !== fastingError) {
    setFastingError(errors.fastingHours);
    if (errors.fastingHours) setShowDetails(true);
  }
  const identifierInput = useRef<HTMLInputElement | null>(null);
  const inSheet = !!onIncludedChange;
  const quantityError = errors.quantityValue ?? errors.quantityUnit;
  const identifier = entry.accessionIdentifier.trim();
  // Ticked only once the ID can be saved.
  const scanned =
    identifier.length >= (scanner ? MIN_ACCESSION_IDENTIFIER_LENGTH : 1) &&
    !errors.accessionIdentifier;
  // Like the old form, Enter in a field saves the tube.
  const handleFormEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (
      scanner ||
      !onCollect ||
      e.key !== "Enter" ||
      e.nativeEvent.isComposing ||
      !(e.target instanceof HTMLInputElement) ||
      !e.currentTarget.contains(e.target)
    )
      return;
    e.preventDefault();
    onCollect();
  };
  const summary = [
    entry.method?.display,
    entry.bodySite?.display,
    entry.fastingStatus?.display,
    entry.fastingHours !== null && `${entry.fastingHours} ${t("hours")}`,
  ]
    .filter(Boolean)
    .join(" · ");
  // collectedAt is a datetime-local value: "YYYY-MM-DDTHH:mm".
  const collectedDate = entry.collectedAt.slice(0, 10);
  const collectedTime = entry.collectedAt.slice(11, 16);
  const detailsToggle = (
    <Button
      variant="ghost"
      size="icon"
      className={cn("text-soft-foreground", showDetails && "bg-muted")}
      onClick={() => setShowDetails(!showDetails)}
      aria-expanded={showDetails}
      aria-label={t("more_details")}
    >
      <ChevronDown
        className={cn("transition-transform", showDetails && "rotate-180")}
      />
    </Button>
  );
  return (
    <div
      id={key}
      onKeyDown={handleFormEnter}
      className={cn(
        "grid items-center gap-x-3.5 gap-y-2",
        inSheet
          ? cn("grid-cols-[auto_minmax(0,1fr)_auto] px-4", SHEET_ROW_COLUMNS)
          : "grid-cols-[minmax(0,1fr)_auto] px-4 md:grid-cols-[minmax(0,1fr)_13.75rem_10.5rem_auto] sm:px-5",
        included ? "py-2.5" : "bg-soft-background py-2",
      )}
    >
      {inSheet && (
        <Checkbox
          checked={included}
          onCheckedChange={onIncludedChange}
          disabled={disabled}
          aria-label={title}
        />
      )}
      <SpecimenNameCell
        requirement={requirement}
        title={title}
        badge={
          !scanner &&
          draft && (
            <Badge variant="indigo" size="sm">
              {t("draft")}
            </Badge>
          )
        }
        subtitle={subtitle}
        info={<SpecimenRequirementsInfo requirement={requirement} />}
        note={included && !showDetails ? summary : undefined}
        muted={!included}
      />
      {included && (
        <>
          {inSheet ? (
            <div className="md:order-last">{detailsToggle}</div>
          ) : (
            <div className="flex items-center gap-1 md:order-last">
              <Button
                variant="primary"
                onClick={onCollect}
                disabled={disabled || collecting}
              >
                {collecting ? t("saving") : t("collect")}
              </Button>
              {detailsToggle}
            </div>
          )}
          <div
            className={cn(
              inSheet
                ? "col-span-2 col-start-2 md:col-span-1 md:col-start-auto"
                : "col-span-full md:col-span-1",
            )}
          >
            <InputGroup
              className={cn(
                "bg-background",
                scanned && "border-green-600/50 bg-green-50/60",
              )}
            >
              <InputGroupInput
                ref={(input) => {
                  identifierInput.current = input;
                  identifierRef(input);
                }}
                value={entry.accessionIdentifier}
                onChange={(e) =>
                  onChange({ accessionIdentifier: e.target.value })
                }
                onKeyDown={(e) => {
                  if (scanner && e.key === "Enter") {
                    e.preventDefault();
                    onIdentifierEnter();
                  }
                }}
                placeholder={t("scan_specimen_id")}
                aria-label={t("specimen_id")}
                aria-invalid={!!errors.accessionIdentifier}
                autoComplete="off"
                autoFocus={autoFocus}
                disabled={disabled}
                className="font-mono placeholder:font-sans"
              />
              <InputGroupAddon>
                {shortcut && !entry.accessionIdentifier ? (
                  <>
                    {/* What the collect shortcut clicks: it moves to this ID field. */}
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-hidden
                      onClick={() => identifierInput.current?.focus()}
                      className="group-focus-within/input-group:hidden"
                    >
                      <ShortcutBadge actionId="collect-specimen" />
                    </button>
                    {/* Phones show no shortcut badge, so the icon fills its place. */}
                    <ScanBarcode
                      className={cn(
                        !!getShortcutDisplay("collect-specimen") &&
                          "hidden group-focus-within/input-group:block",
                      )}
                    />
                  </>
                ) : scanned ? (
                  <CircleCheck className="text-green-600" />
                ) : (
                  <ScanBarcode />
                )}
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                {/* Skipped by Tab, so one Tab goes from the ID to Qty. */}
                <InputGroupButton
                  size="icon-xs"
                  tabIndex={-1}
                  onClick={onCameraScan}
                  disabled={disabled}
                  aria-label={t("scan_with_camera")}
                  title={t("scan_with_camera")}
                >
                  <Camera />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {errors.accessionIdentifier && (
              <p className="mt-1 text-sm text-destructive">
                {errors.accessionIdentifier}
              </p>
            )}
          </div>
          <div
            className={cn(
              inSheet
                ? "col-span-2 col-start-2 md:col-span-1 md:col-start-auto"
                : "col-span-full md:col-span-1",
            )}
          >
            <div className="flex">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={entry.quantityValue ?? ""}
                onChange={(e) =>
                  onChange({
                    quantityValue:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder={t("qty")}
                aria-label={t("quantity")}
                aria-invalid={!!errors.quantityValue}
                disabled={disabled}
                className="w-16 rounded-r-none bg-white focus-visible:z-10"
              />
              <Select
                value={entry.quantityUnit?.code}
                onValueChange={(code) => {
                  const unit = SPECIMEN_DEFINITION_UNITS_CODES.find(
                    (option) => option.code === code,
                  );
                  if (unit) onChange({ quantityUnit: unit });
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  className="min-w-0 flex-1 rounded-l-none border-l-0 bg-white"
                  aria-label={t("unit")}
                >
                  <SelectValue placeholder={t("unit")} />
                </SelectTrigger>
                <SelectContent>
                  {SPECIMEN_DEFINITION_UNITS_CODES.map((unit) => (
                    <SelectItem key={unit.code} value={unit.code}>
                      {unit.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {quantityError && (
              <p className="mt-1 text-sm text-destructive">{quantityError}</p>
            )}
          </div>
          {showDetails && (
            // Values stand in for labels; the wider column holds the long ones.
            <div
              className={cn(
                "order-last col-span-full grid gap-2 rounded-lg bg-soft-background p-3 md:ml-5.5 md:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]",
                inSheet && "md:col-start-2",
              )}
            >
              <ButtonGroup
                aria-label={t("collected_at")}
                className={cn(JOINED_FIELD, "[&>input]:w-36")}
              >
                <DatePicker
                  date={
                    collectedDate ? dayjs(collectedDate).toDate() : undefined
                  }
                  onChange={(date) =>
                    onChange({
                      collectedAt: date
                        ? `${dayjs(date).format("YYYY-MM-DD")}T${collectedTime || dayjs().format("HH:mm")}`
                        : "",
                    })
                  }
                  disabled={scanner ? (date) => date > new Date() : undefined}
                  disablePicker={disabled}
                  dateFormat="d MMM yyyy"
                />
                <Input
                  type="time"
                  value={collectedTime}
                  onChange={(e) => {
                    // The sheet ignores an emptied time; the old form saved it empty.
                    if (e.target.value) {
                      onChange({
                        collectedAt: `${collectedDate || dayjs().format("YYYY-MM-DD")}T${e.target.value}`,
                      });
                    } else if (!scanner) {
                      onChange({ collectedAt: "" });
                    }
                  }}
                  aria-label={t("time")}
                  disabled={disabled}
                />
              </ButtonGroup>
              <div
                role="group"
                aria-label={t("body_site")}
                className={cn(COMPACT_PICKER, "min-w-0 [&>button]:w-full")}
              >
                <ValueSetSelect
                  system="system-body-site"
                  placeholder={t("body_site")}
                  value={entry.bodySite}
                  onSelect={(bodySite) => onChange({ bodySite })}
                  disabled={disabled}
                />
              </div>
              <div
                role="group"
                aria-label={t("collection_method")}
                className={cn(COMPACT_PICKER, "min-w-0 [&>button]:w-full")}
              >
                <ValueSetSelect
                  system="system-collection-method-code"
                  placeholder={t("collection_method")}
                  value={entry.method}
                  onSelect={(method) => onChange({ method })}
                  disabled={disabled}
                />
              </div>
              {scanner ? (
                <Input
                  value={entry.note}
                  onChange={(e) => onChange({ note: e.target.value })}
                  placeholder={t("notes")}
                  aria-label={t("notes")}
                  disabled={disabled}
                  className="order-last bg-white md:order-none"
                />
              ) : (
                <Textarea
                  rows={1}
                  value={entry.note}
                  onChange={(e) => onChange({ note: e.target.value })}
                  placeholder={t("notes")}
                  aria-label={t("notes")}
                  disabled={disabled}
                  className="order-last min-h-12 bg-white py-2.75 md:order-none md:min-h-10 md:py-2.25"
                />
              )}
              <div className="min-w-0">
                <ButtonGroup
                  aria-label={t("fasting_status")}
                  className={cn(JOINED_FIELD, "[&>input]:w-20")}
                >
                  <ValueSetSelect
                    system="system-fasting-status-code"
                    placeholder={t("fasting_status")}
                    value={entry.fastingStatus}
                    onSelect={(fastingStatus) => onChange({ fastingStatus })}
                    disabled={disabled}
                  />
                  <Input
                    type="number"
                    min={scanner ? 0 : undefined}
                    value={entry.fastingHours ?? ""}
                    onChange={(e) =>
                      onChange({
                        fastingHours:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder={t("hours")}
                    aria-label={t("fasting_duration")}
                    aria-invalid={!!errors.fastingHours}
                    disabled={disabled}
                  />
                </ButtonGroup>
                {errors.fastingHours && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.fastingHours}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
