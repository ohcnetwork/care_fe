import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { ArrowLeft, ChevronDown, QrCode, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Country,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
} from "react-phone-number-input";
import countryLabels from "react-phone-number-input/locale/en.json";
import { toast } from "sonner";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CountrySelect } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { cn } from "@/lib/utils";

import { encounterSearchPreferenceAtom } from "@/atoms/encounterSearchAtom";
import PatientIDScanDialog from "@/components/Scan/PatientIDScanDialog";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { PartialPatientModel, PatientRead } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { PatientIdentifierConfig } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import query from "@/Utils/request/query";

import { AppliedSearch, EncounterSearchChips } from "./EncounterSearchChips";
import {
  checkIdentifier,
  configOfField,
  IdentifierCheck,
  identifierField,
  isNumericText,
  isPhoneConfig,
  isPhoneTooLong,
  parseFieldPrefix,
  sanitizePhoneInput,
  scannedPatientId,
  SearchField,
} from "./encounterSearchFields";
import { PatientBirthYearCheck } from "./PatientBirthYearCheck";
import { useScannerBurst } from "./useScannerBurst";

export type VisitField = "name" | "visit";

const countryOptions = getCountries()
  .map((country) => ({ value: country, label: countryLabels[country] }))
  .sort((a, b) => a.label.localeCompare(b.label));

export interface SelectedPatient {
  id: string;
  name?: string;
}

type Row =
  | { kind: "name"; key: string; term: string }
  | { kind: "visit"; key: string; term: string }
  | {
      kind: "identifier";
      key: string;
      config: PatientIdentifierConfig;
      check: IdentifierCheck;
    }
  | {
      kind: "patient";
      key: string;
      patient: PatientRead | PartialPatientModel;
    };

interface RowGroup {
  value: string;
  label: string;
  items: Row[];
}

interface Lookup {
  config: PatientIdentifierConfig;
  value: string;
  display: string;
}

interface EncounterSearchProps {
  /** The list's filters without its search keys, for the visit counts. */
  previewQueryParams: Record<string, string | number | undefined>;
  /** What the URL applies, shown as removable chips before the input. */
  applied: AppliedSearch;
  onApplyText: (field: VisitField, term: string) => void;
  onRemoveText: () => void;
  onSelectPatient: (
    patient: SelectedPatient,
    source: "lookup" | "scan",
  ) => void;
  onRemovePatient: () => void;
  className?: string;
}

/**
 * One input for the All Encounters list: it filters visits by name or visit
 * ID, or looks up a patient by an identifier. The input holds only the draft;
 * the list reads what the URL applies, shown as chips before the input.
 */
export function EncounterSearch({
  previewQueryParams,
  applied,
  onApplyText,
  onRemoveText,
  onSelectPatient,
  onRemovePatient,
  className,
}: EncounterSearchProps) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();
  // The field and phone country last picked stay for the next visit.
  const [preference, setPreference] = useAtom(encounterSearchPreferenceAtom);
  const { country } = preference;
  const setField = (next: SearchField) =>
    setPreference((prev) => ({ ...prev, field: next }));
  const setCountry = (next: Country) =>
    setPreference((prev) => ({ ...prev, country: next }));
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [pending, setPending] = useState<PartialPatientModel | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const keepOpen = useRef(false);
  const fieldPicked = useRef(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();
  const scanner = useScannerBurst();

  const configs = useMemo(
    () => [
      ...(facility?.patient_instance_identifier_configs ?? []),
      ...(facility?.patient_facility_identifier_configs ?? []),
    ],
    [facility],
  );
  // A stored identifier the facility no longer has falls back to Auto, without
  // forgetting it while the facility's configs are still loading.
  const field: SearchField =
    preference.field.startsWith("identifier:") &&
    !configOfField(preference.field, configs)
      ? "auto"
      : preference.field;
  const fieldConfig = configOfField(field, configs);
  const fieldLabel =
    field === "name"
      ? t("encounter_search_field_name")
      : field === "visit"
        ? t("encounter_search_field_visit_id")
        : (fieldConfig?.config.display ?? t("encounter_search_field_auto"));

  const term = draft.trim();
  // The phone field, or Auto with a number typed, shows the country of the
  // number; a number with its own `+` code shows that code's country.
  const showCountry = fieldConfig
    ? isPhoneConfig(fieldConfig)
    : field === "auto" && configs.some(isPhoneConfig) && isNumericText(term);
  const shownCountry =
    (term.startsWith("+") && parsePhoneNumber(term)?.country) || country;
  // One search applies at a time: with any chip applied, the search stays off
  // until the chip is removed.
  const locked = !!(applied.patient || applied.name || applied.visitId);
  // A chip applied from outside (the URL) while a draft was typed: the draft
  // and its lookup go, rather than return once the chip is removed.
  const [wasLocked, setWasLocked] = useState(locked);
  if (locked !== wasLocked) {
    setWasLocked(locked);
    if (locked) {
      setDraft("");
      setOpen(false);
      setLookup(null);
      setPending(null);
    }
  }
  const popupOpen = open && (!!term || !!lookup);
  // A number too long for its country can't become valid by typing more.
  const phoneTooLong =
    !!fieldConfig &&
    isPhoneConfig(fieldConfig) &&
    isPhoneTooLong(term, shownCountry);

  // Counts preview each visit filter with the applied filters; they have
  // their own keys, so they never change the list.
  const previewEnabled = (kind: VisitField) =>
    popupOpen && !lookup && !!term && (field === "auto" || field === kind);
  const namePreview = useQuery({
    queryKey: ["encounter-search-preview", "name", term, previewQueryParams],
    queryFn: query.debounced(encounterApi.list, {
      queryParams: { ...previewQueryParams, name: term, limit: 1, offset: 0 },
    }),
    enabled: previewEnabled("name"),
  });
  const visitPreview = useQuery({
    queryKey: ["encounter-search-preview", "visit", term, previewQueryParams],
    queryFn: query.debounced(encounterApi.list, {
      queryParams: {
        ...previewQueryParams,
        external_identifier: term,
        limit: 1,
        offset: 0,
      },
    }),
    enabled: previewEnabled("visit"),
  });

  // The patient search runs only for a chosen, complete identifier.
  const patientLookup = useQuery({
    queryKey: [
      "encounter-search-patient-lookup",
      lookup?.config.id,
      lookup?.value,
    ],
    queryFn: query(patientApi.search, {
      body: {
        config: lookup?.config.id,
        value: lookup?.value,
        page_size: 20,
      },
    }),
    enabled: !!lookup,
  });

  // A picked field and country are kept: only the draft is cleared.
  const reset = () => {
    setDraft("");
    setOpen(false);
    setLookup(null);
    setPending(null);
    scanner.reset();
  };

  // A value that is plainly a complete identifier (a valid phone number in the
  // country shown, or a regex match) is looked up at once, with the patients
  // under it listed directly: no row to confirm. A picked field already says
  // what the text is. Auto does the same when exactly one identifier
  // recognises it; if several do, it is ambiguous and the rows stay. Back
  // returns to the rows (name, visit) when the guess was wrong.
  const lookupIfReady = (
    nextField: SearchField,
    text: string,
    nextCountry: Country,
  ) => {
    const value = text.trim();
    if (!value) return false;
    const picked = configOfField(nextField, configs);
    const candidates = picked ? [picked] : nextField === "auto" ? configs : [];
    const ready = candidates
      .map((config) => ({
        config,
        check: checkIdentifier(config, value, nextCountry),
      }))
      .filter(({ check }) => check.detected && check.status === "complete");
    if (ready.length !== 1) return false;
    const [{ config, check }] = ready;
    setPending(null);
    setLookup({ config, value: check.value, display: check.display });
    return true;
  };

  // How the applied search was made takes the field selector's place: the
  // text field, or how the patient was found (the identifier, or a scan). The
  // URL keeps only the patient, so that is known for a pick made here, and
  // matched to the applied patient by name. With two chips (only from a URL)
  // the field is ambiguous, so none shows and the chips keep their prefixes.
  const [foundBy, setFoundBy] = useState<{
    name?: string;
    label: string;
  } | null>(null);
  const hasText = !!(applied.name || applied.visitId);
  const foundByLabel =
    hasText && applied.patient
      ? undefined
      : applied.name
        ? t("encounter_search_field_name")
        : applied.visitId
          ? t("encounter_search_field_visit_id")
          : applied.patient && foundBy && foundBy.name === applied.patient.name
            ? foundBy.label
            : undefined;
  const selectFound = (patient: SelectedPatient) => {
    setFoundBy(
      lookup
        ? { name: patient.name, label: lookup.config.config.display }
        : null,
    );
    onSelectPatient(patient, "lookup");
  };

  const applyScan = (patientId: string) => {
    setFoundBy({ name: t("scanned_patient"), label: t("scan") });
    onSelectPatient({ id: patientId, name: t("scanned_patient") }, "scan");
    toast.info(t("patient_details_scanned_successfully"));
    reset();
  };

  // A scanner used with nothing focused keeps today's behaviour.
  useBarcodeScanner({
    onScan: (scanned) => applyScan(scannedPatientId(scanned) ?? scanned),
    enabled: !locked && !popupOpen && !scanOpen,
    preventDefault: false,
    maxLength: 500,
    timeout: 500,
  });

  const groups = ((): RowGroup[] => {
    if (lookup) {
      return [
        {
          value: "patients",
          label: t("encounter_search_patients_found", {
            count: patientLookup.data?.results.length ?? 0,
          }),
          items: (patientLookup.data?.results ?? []).map((patient) => ({
            kind: "patient" as const,
            key: patient.id,
            patient,
          })),
        },
      ];
    }
    if (!term) return [];

    const visitRows: Row[] = (["name", "visit"] as const)
      .filter((kind) => field === "auto" || field === kind)
      .map((kind): Row =>
        kind === "name" ? { kind, key: kind, term } : { kind, key: kind, term },
      );
    // Numbers are more often visit IDs than names.
    if (isNumericText(term)) visitRows.reverse();

    const checked = (
      fieldConfig ? [fieldConfig] : field === "auto" ? configs : []
    ).map((config) => ({
      kind: "identifier" as const,
      key: identifierField(config),
      config,
      check: checkIdentifier(config, term, country),
    }));
    // In Auto, a value whose format matches a config (a valid phone number, a
    // regex) offers only those configs, phone first: the rest are guesses.
    // Without a match, a partly typed phone number leads, as the country
    // picker shows; then usable guesses, then the disabled ones.
    const matched = checked
      .filter((row) => row.check.detected && row.check.status === "complete")
      .sort((a, b) => +isPhoneConfig(b.config) - +isPhoneConfig(a.config));
    const detected = !fieldConfig && matched.length > 0;
    const rank = (row: (typeof checked)[number]) =>
      isPhoneConfig(row.config) ? 0 : row.check.status === "complete" ? 1 : 2;
    const identifierRows: Row[] = fieldConfig
      ? checked
      : detected
        ? matched
        : checked
            .filter((row) => row.check.status !== "unlikely")
            .sort((a, b) => rank(a) - rank(b));

    // Detection only orders and narrows the rows; nothing is searched until
    // chosen.
    const visits = {
      value: "visits",
      label: t("encounter_search_group_visits"),
      items: visitRows,
    };
    const patients = {
      value: "patients",
      label: t("encounter_search_group_patients"),
      items: identifierRows,
    };
    return (detected ? [patients, visits] : [visits, patients]).filter(
      (group) => group.items.length > 0,
    );
  })();

  const choose = (row: Row) => {
    if (row.kind === "name" || row.kind === "visit") {
      onApplyText(row.kind, row.term);
      reset();
    } else if (row.kind === "identifier") {
      keepOpen.current = true;
      setPending(null);
      setLookup({
        config: row.config,
        value: row.check.value,
        display: row.check.display,
      });
    } else if (patientLookup.data?.partial) {
      // A partial record's id is temporary: confirm the year of birth first.
      keepOpen.current = true;
      setPending(row.patient as PartialPatientModel);
    } else {
      selectFound({ id: row.patient.id, name: row.patient.name });
      reset();
    }
  };

  const changeDraft = (value: string) => {
    const prefixed = parseFieldPrefix(value, configs);
    if (prefixed) setField(prefixed.field);
    const nextField = prefixed ? prefixed.field : field;
    const nextConfig = configOfField(nextField, configs);
    const typed = prefixed ? prefixed.rest : value;
    // A phone field takes only what a phone number holds.
    const next =
      nextConfig && isPhoneConfig(nextConfig)
        ? sanitizePhoneInput(typed)
        : typed;
    setDraft(next);
    setPending(null);
    if (!lookupIfReady(nextField, next, country)) setLookup(null);
    setOpen(next.trim() !== "");
  };

  const hasApplied = locked;
  // The input is read-only while a chip is applied, and the chip's button
  // unmounts when it is removed: the input takes focus once the removal (a
  // URL update) has unlocked it.
  const refocusOnUnlock = useRef(false);
  useEffect(() => {
    if (locked || !refocusOnUnlock.current) return;
    refocusOnUnlock.current = false;
    // The combobox updates its input a render later.
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [locked]);
  // Backspace on the read-only input first highlights the last chip, then
  // removes it, as in tag and recipient fields: one stray key can't clear
  // the search, and the highlight shows what the next press removes.
  const lastChip = applied.patient ? "patient" : hasText ? "text" : null;
  const [armed, setArmed] = useState<"patient" | "text" | null>(null);
  const armedChip = armed !== null && armed === lastChip ? armed : null;
  const removeText = () => {
    setArmed(null);
    refocusOnUnlock.current = true;
    onRemoveText();
    // With a patient chip left, the input stays locked but keeps focus.
    inputRef.current?.focus();
  };
  const removePatient = () => {
    setArmed(null);
    // A later apply of the same patient (a link, say) may not be by the
    // same identifier.
    setFoundBy(null);
    refocusOnUnlock.current = true;
    onRemovePatient();
    inputRef.current?.focus();
  };

  const describe = (row: Row) => {
    if (row.kind === "patient") return row.patient.name;
    if (row.kind === "identifier") return row.config.config.display;
    return row.term;
  };

  const renderRow = (row: Row) => {
    if (row.kind === "name" || row.kind === "visit") {
      const preview = row.kind === "name" ? namePreview : visitPreview;
      return (
        <>
          <span className="min-w-0 flex-1 truncate">
            <Trans
              i18nKey={
                row.kind === "name"
                  ? "encounter_search_name_contains"
                  : "encounter_search_visit_id_contains"
              }
              values={{ term: row.term }}
              components={{ strong: <strong className="font-semibold" /> }}
            />
          </span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {preview.isFetching || !preview.data ? (
              <Spinner className="size-3.5" />
            ) : (
              t("encounter_search_visit_count", { count: preview.data.count })
            )}
          </span>
        </>
      );
    }
    if (row.kind === "identifier") {
      const display = row.config.config.display;
      return (
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">
            <Trans
              i18nKey="encounter_search_identifier_row"
              values={{ identifier: display, term: row.check.display }}
              components={{ strong: <strong className="font-semibold" /> }}
            />
          </span>
          {row.check.status !== "complete" && (
            <span className="text-xs text-muted-foreground">
              {isPhoneConfig(row.config)
                ? phoneTooLong
                  ? t("encounter_search_hint_phone_too_long", {
                      country: countryLabels[shownCountry],
                    })
                  : t("encounter_search_hint_phone")
                : t("encounter_search_hint_identifier", {
                    identifier: display,
                  })}
            </span>
          )}
        </span>
      );
    }
    return (
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{row.patient.name}</span>
        {patientLookup.data?.partial && (
          <span className="text-xs text-muted-foreground">
            {t("encounter_search_needs_year_of_birth")}
          </span>
        )}
      </span>
    );
  };

  return (
    <>
      <Combobox<Row>
        items={groups}
        value={null}
        inputValue={draft}
        open={popupOpen && !locked}
        // Read-only, not disabled, so the input still takes focus and
        // Backspace can remove the patient chip.
        readOnly={locked}
        filter={null}
        autoHighlight
        itemToStringLabel={describe}
        onInputValueChange={(value, details) => {
          // Only typing edits the draft. On close, Base UI syncs the input
          // to the (empty) selection as an "input-clear": ignore it.
          if (details.reason === "input-change") changeDraft(value);
        }}
        onValueChange={(row) => {
          if (row) choose(row);
        }}
        onOpenChange={(next, details) => {
          if (next) {
            if (term || lookup) setOpen(true);
            return;
          }
          if (details.reason === "item-press" && keepOpen.current) {
            keepOpen.current = false;
            details.cancel();
            return;
          }
          setOpen(false);
          setLookup(null);
          setPending(null);
        }}
      >
        {/* Grows taller when the chips and the input wrap; the addons
            center without padding, so one line keeps the field's height. */}
        <InputGroup
          ref={anchorRef}
          data-slot="encounter-search"
          className={cn(
            "h-auto min-h-(--input-group-height) *:data-[slot=input-group-addon]:py-0",
            className,
          )}
        >
          {/* With a chip applied, how the search was made takes the field
              selector's place; nothing can be picked or scanned until the
              chip is removed. */}
          {locked ? (
            foundByLabel && (
              <>
                <InputGroupAddon
                  align="inline-start"
                  className="min-w-0 shrink pe-2.5"
                  data-slot="encounter-search-found-by"
                >
                  <span className="block min-w-0 truncate">{foundByLabel}</span>
                </InputGroupAddon>
                <Separator
                  orientation="vertical"
                  className="order-first bg-input"
                />
              </>
            )
          ) : (
            <>
              {/* Before the input, so Shift+Tab from the input reaches it. It
              shrinks before the input does. */}
              <InputGroupAddon align="inline-start" className="min-w-0 shrink">
                <Select<SearchField>
                  value={field}
                  onValueChange={(next) => {
                    fieldPicked.current = true;
                    setField(next);
                    setPending(null);
                    if (!lookupIfReady(next, term, country)) setLookup(null);
                    setOpen(term !== "");
                  }}
                  // Select returns focus to its trigger; after a pick, typing
                  // continues in the input.
                  onOpenChangeComplete={(isOpen: boolean) => {
                    if (isOpen || !fieldPicked.current) return;
                    fieldPicked.current = false;
                    inputRef.current?.focus();
                  }}
                >
                  {/* A dropdown in an input group is an InputGroupButton. */}
                  <SelectPrimitive.Trigger
                    aria-label={t("encounter_search_field_label")}
                    render={
                      <InputGroupButton
                        size="xs"
                        className="max-w-56 min-w-0 gap-1 font-medium text-foreground"
                      />
                    }
                  >
                    <SelectValue className="block min-w-0 truncate" />
                    <ChevronDown
                      aria-hidden="true"
                      className="size-3.5 text-muted-foreground"
                    />
                  </SelectPrimitive.Trigger>
                  <SelectContent position="popper" align="start">
                    {/* Groups give the items their inset from the popup's edge. */}
                    <SelectGroup>
                      <SelectItem value="auto">
                        {t("encounter_search_field_auto")}
                      </SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>
                        {t("encounter_search_filter_visits_by")}
                      </SelectLabel>
                      <SelectItem value="name">
                        {t("encounter_search_field_name")}
                      </SelectItem>
                      <SelectItem value="visit">
                        {t("encounter_search_field_visit_id")}
                      </SelectItem>
                    </SelectGroup>
                    {configs.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>
                          {t("encounter_search_look_up_patient_by")}
                        </SelectLabel>
                        {configs.map((config) => (
                          <SelectItem
                            key={config.id}
                            value={identifierField(config)}
                          >
                            {config.config.display}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </InputGroupAddon>
              {/* Full-height dividers read as part of the field's border. */}
              <Separator
                orientation="vertical"
                className="order-first bg-input"
              />
              {showCountry && (
                // As in the shared PhoneInput: the country, then the number.
                <CountrySelect
                  value={shownCountry}
                  options={countryOptions}
                  aria-label={t("encounter_search_phone_country", {
                    country: countryLabels[shownCountry],
                    code: getCountryCallingCode(shownCountry),
                  })}
                  pickedFocus={inputRef}
                  onChange={(next) => {
                    setCountry(next);
                    setPending(null);
                    if (!lookupIfReady(field, term, next)) setLookup(null);
                    setOpen(term !== "");
                  }}
                />
              )}
            </>
          )}
          {/* The chips, then the input. When the chips don't fit beside it,
              the input wraps to a second line inside the field. */}
          <div
            data-slot="encounter-search-entry"
            className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-0.5"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                inputRef.current?.focus();
              }
            }}
          >
            <EncounterSearchChips
              {...applied}
              hideTextPrefix={!!foundByLabel}
              highlighted={armedChip}
              onRemoveText={removeText}
              onRemovePatient={removePatient}
            />
            {/* The search icon leads the input, after any chips, so it marks
                where the search continues; the two wrap together. With a
                chip applied the input stays focusable but read-only, and
                its hint (shown while focused) says how to remove the chip. */}
            <div
              className={cn(
                "flex items-center",
                hasApplied ? "min-w-20 grow basis-20" : "min-w-28 flex-1",
              )}
              onClick={(event) => {
                if (event.target !== inputRef.current) {
                  inputRef.current?.focus();
                }
              }}
            >
              {!showCountry && !locked && (
                <Search
                  aria-hidden="true"
                  className="ms-2 size-4 shrink-0 text-muted-foreground"
                />
              )}
              <ComboboxPrimitive.Input
                render={
                  <InputGroupInput
                    ref={inputRef}
                    className={cn(
                      "h-8 ps-1.5 pe-1.5",
                      locked &&
                        "caret-transparent placeholder:text-transparent focus:placeholder:text-muted-foreground",
                    )}
                  />
                }
                aria-label={t("encounter_search_label")}
                aria-describedby={descriptionId}
                aria-invalid={phoneTooLong || undefined}
                inputMode={
                  fieldConfig && isPhoneConfig(fieldConfig) ? "tel" : undefined
                }
                placeholder={
                  locked
                    ? armedChip
                      ? t("encounter_search_remove_again")
                      : t("encounter_search_remove_hint")
                    : field !== "auto"
                      ? t("encounter_search_placeholder_field", {
                          field: fieldLabel,
                        })
                      : t("encounter_search_placeholder")
                }
                onBlur={() => setArmed(null)}
                onKeyDown={(event) => {
                  if (locked) {
                    // Read-only. Backspace or Delete highlights the last
                    // chip, and again removes it; a held key does neither.
                    // Escape, or any other key, drops the highlight.
                    if (event.key === "Backspace" || event.key === "Delete") {
                      event.preventDefault();
                      if (event.repeat || !lastChip) return;
                      if (!armedChip) setArmed(lastChip);
                      else if (lastChip === "patient") removePatient();
                      else removeText();
                    } else if (event.key === "Escape" && armedChip) {
                      event.preventDefault();
                      setArmed(null);
                    } else if (
                      !["Shift", "Control", "Alt", "Meta"].includes(event.key)
                    ) {
                      setArmed(null);
                    }
                    return;
                  }
                  scanner.track(event);
                  if (
                    event.key === "Enter" &&
                    scanner.isScannerEnter(draft, event)
                  ) {
                    const patientId = scannedPatientId(draft);
                    if (patientId) {
                      event.preventDefault();
                      event.preventBaseUIHandler();
                      applyScan(patientId);
                      return;
                    }
                  }
                  // Backspace in the empty input does nothing more: the field
                  // stays as picked.
                }}
              />
            </div>
          </div>
          {/* Announces the highlight, which the placeholder shows. */}
          <span aria-live="polite" className="sr-only">
            {armedChip ? t("encounter_search_remove_again") : ""}
          </span>
          <span id={descriptionId} className="sr-only">
            {locked
              ? t("encounter_search_description_locked")
              : field === "auto"
                ? t("encounter_search_description_auto")
                : t("encounter_search_description_field", {
                    field: fieldLabel,
                  })}
          </span>
          {draft && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={t("encounter_search_clear")}
                onClick={() => {
                  changeDraft("");
                  inputRef.current?.focus();
                }}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
          {!locked && (
            <>
              <Separator
                orientation="vertical"
                className="order-last bg-input"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="xs"
                  aria-label={t("scan_patient_qr")}
                  onClick={() => setScanOpen(true)}
                >
                  <QrCode />
                  <span className="hidden @lg/toolbar:inline">{t("scan")}</span>
                </InputGroupButton>
              </InputGroupAddon>
            </>
          )}
        </InputGroup>
        <ComboboxContent
          anchor={anchorRef}
          data-chips={false}
          className="flex w-(--anchor-width) min-w-(--anchor-width) flex-col"
        >
          {lookup && (
            <div className="flex items-center gap-1 border-b p-1">
              <InputGroupButton
                size="icon-xs"
                aria-label={t("back")}
                onClick={() => {
                  setLookup(null);
                  setPending(null);
                  inputRef.current?.focus();
                }}
              >
                <ArrowLeft />
              </InputGroupButton>
              <span className="truncate text-sm">
                <Trans
                  i18nKey="encounter_search_identifier_row"
                  values={{
                    identifier: lookup.config.config.display,
                    term: lookup.display,
                  }}
                  components={{ strong: <strong className="font-semibold" /> }}
                />
              </span>
            </div>
          )}
          {lookup && patientLookup.isFetching ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground"
            >
              <Spinner className="size-4" />
              {t("encounter_search_searching")}
            </div>
          ) : (
            <>
              <ComboboxEmpty className="not-empty:p-4">
                {t("encounter_search_no_patients", {
                  identifier: lookup?.config.config.display,
                })}
              </ComboboxEmpty>
              <ComboboxList>
                {(group: RowGroup) => (
                  <ComboboxGroup key={group.value} items={group.items}>
                    <ComboboxLabel>{group.label}</ComboboxLabel>
                    <ComboboxCollection>
                      {(row: Row) => (
                        <ComboboxItem
                          key={row.key}
                          value={row}
                          disabled={
                            row.kind === "identifier" &&
                            row.check.status !== "complete"
                          }
                          className="min-h-11 pr-2 md:min-h-9"
                        >
                          {renderRow(row)}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </>
          )}
          {pending && (
            <PatientBirthYearCheck
              key={pending.id}
              patient={pending}
              onVerified={(patient) => {
                // Filter by the full record's id, never the partial one.
                selectFound({ id: patient.id, name: patient.name });
                reset();
              }}
              onCancel={() => {
                setPending(null);
                inputRef.current?.focus();
              }}
            />
          )}
        </ComboboxContent>
      </Combobox>
      <PatientIDScanDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        onScanSuccess={applyScan}
      />
    </>
  );
}
