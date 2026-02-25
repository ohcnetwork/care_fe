import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import Autocomplete from "@/components/ui/autocomplete";

import {
  fhirDosageToFrequencyValue,
  generateManSuggestions,
  MAN_FREQUENCY_PRESETS,
  manToFhirTiming,
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequestDosageInstruction,
} from "@/types/emr/medicationRequest/medicationRequest";

interface DosageFrequencyInputProps {
  dosageInstruction: MedicationRequestDosageInstruction;
  onDosageInstructionChange: (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => void;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

/**
 * Smart single-field frequency autocomplete.
 *
 * Doctors type naturally -- "1-0-1", "1/2-0-1", "SOS", "Q6H" -- and the
 * system dynamically generates suggestions. Under the hood it maps to FHIR
 * Timing structures where possible, and falls back to dosageInstruction.text
 * for freeform patterns.
 */
export function DosageFrequencyInput({
  dosageInstruction,
  onDosageInstructionChange,
  disabled = false,
  hasError = false,
  className,
}: DosageFrequencyInputProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  // Derive current value from existing dosage instruction (reverse mapping)
  // Only the fields read by fhirDosageToFrequencyValue are listed as deps
  // to avoid recomputing when unrelated dosageInstruction fields change.
  const currentValue = useMemo(
    () => fhirDosageToFrequencyValue(dosageInstruction),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      dosageInstruction?.text,
      dosageInstruction?.timing,
      dosageInstruction?.as_needed_boolean,
    ],
  );

  // Dynamically generate options based on what the user is typing
  const options = useMemo(() => {
    const query = searchQuery.trim();
    const results: { value: string; label: string }[] = [];
    const seen = new Set<string>();

    const add = (value: string, label: string) => {
      if (seen.has(value)) return;
      seen.add(value);
      results.push({ value, label });
    };

    // 1. Generate M-A-N pattern suggestions
    const manSuggestions = generateManSuggestions(query);
    for (const s of manSuggestions) {
      add(s.value, s.label);
    }

    // 2. Add SOS option
    if (!query || "sos".startsWith(query.toLowerCase())) {
      add("SOS", "SOS (As needed)");
    }

    // 3. Add STAT option
    if (!query || "stat".startsWith(query.toLowerCase())) {
      add("STAT", "STAT (Immediately)");
    }

    // 4. Filter FHIR timing options by code or display text
    if (query) {
      const lowerQuery = query.toLowerCase();
      for (const [key, opt] of Object.entries(
        MEDICATION_REQUEST_TIMING_OPTIONS,
      )) {
        // Skip options that are already represented as M-A-N presets
        const isManPreset = MAN_FREQUENCY_PRESETS.some(
          (p) => p.timingKey === key,
        );
        if (isManPreset) continue;

        if (
          key.toLowerCase().startsWith(lowerQuery) ||
          opt.display.toLowerCase().includes(lowerQuery) ||
          opt.timing.code?.display.toLowerCase().includes(lowerQuery)
        ) {
          add(key, opt.display);
        }
      }
    } else {
      // When empty, show a few common FHIR codes after M-A-N presets
      for (const key of ["QD", "QOD", "Q6H", "Q8H", "Q12H", "BED", "WK"]) {
        const opt = MEDICATION_REQUEST_TIMING_OPTIONS[key];
        if (opt) add(key, opt.display);
      }
    }

    // 5. Always include the currently selected value so the button displays correctly
    if (currentValue && !seen.has(currentValue)) {
      const preset = MAN_FREQUENCY_PRESETS.find((p) => p.man === currentValue);
      add(
        currentValue,
        preset ? `${currentValue} (${preset.label})` : currentValue,
      );
    }

    // 6. If query looks like a valid M-A-N but isn't in our generated list,
    //    add it as a "custom" entry so freeform is always allowed.
    const manFullRe = /^[\d]+(?:\/[\d]+)?(-[\d]+(?:\/[\d]+)?){1,3}$/;
    if (query && manFullRe.test(query) && !seen.has(query)) {
      add(query, query);
    }

    return results;
  }, [searchQuery, currentValue]);

  const handleChange = (value: string) => {
    if (!value) {
      // Cleared
      onDosageInstructionChange({
        timing: undefined,
        as_needed_boolean: false,
        as_needed_for: undefined,
        text: undefined,
      });
      return;
    }

    // Try to map to FHIR timing
    const fhirMapping = manToFhirTiming(value);

    if (fhirMapping) {
      if (fhirMapping.asNeeded) {
        // SOS / PRN
        onDosageInstructionChange({
          timing: undefined,
          as_needed_boolean: true,
          text: "SOS",
        });
      } else {
        // Standard FHIR timing (from M-A-N preset or direct FHIR code)
        const preset = MAN_FREQUENCY_PRESETS.find((p) => p.man === value);
        onDosageInstructionChange({
          timing: fhirMapping.timing,
          as_needed_boolean: false,
          as_needed_for: undefined,
          text: preset ? preset.man : undefined,
        });
      }
    } else {
      // Non-standard M-A-N or freeform -- store as text
      onDosageInstructionChange({
        text: value,
        as_needed_boolean: false,
        as_needed_for: undefined,
        timing: undefined,
      });
    }
  };

  return (
    <Autocomplete
      options={options}
      value={currentValue}
      onChange={handleChange}
      onSearch={setSearchQuery}
      placeholder={t("frequency_placeholder")}
      inputPlaceholder={t("frequency_input_placeholder")}
      noOptionsMessage={t("no_frequency_found")}
      disabled={disabled}
      className={cn("h-9 text-sm", hasError && "border-red-500", className)}
      popoverContentClassName="w-80"
      showClearButton={false}
    />
  );
}
