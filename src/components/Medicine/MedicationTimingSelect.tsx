import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import Autocomplete from "@/components/ui/autocomplete";

import {
  MEDICATION_REQUEST_TIMING_OPTIONS,
  Timing,
} from "@/types/emr/medicationRequest/medicationRequest";

const PRN_VALUE = "PRN";

interface MedicationTimingSelectProps {
  timing?: Timing;
  asNeeded?: boolean;
  onTimingChange: (timing: Timing | undefined, asNeeded: boolean) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  hasError?: boolean;
  /**
   * If true, hides the PRN option from the dropdown
   */
  hidePRN?: boolean;
}

/**
 * Reusable component for selecting medication timing/frequency.
 * Uses Autocomplete for searchable selection of timing options.
 */
export function MedicationTimingSelect({
  timing,
  asNeeded = false,
  onTimingChange,
  disabled = false,
  className,
  placeholder,
  hasError = false,
  hidePRN = false,
}: MedicationTimingSelectProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  // Build options from MEDICATION_REQUEST_TIMING_OPTIONS
  const options = useMemo(() => {
    const timingOptions = Object.entries(MEDICATION_REQUEST_TIMING_OPTIONS).map(
      ([key, option]) => ({
        value: key,
        label: option.display,
      }),
    );

    // Add PRN option at the beginning if not hidden
    if (!hidePRN) {
      return [
        { value: PRN_VALUE, label: t("as_needed_prn") },
        ...timingOptions,
      ];
    }

    return timingOptions;
  }, [t, hidePRN]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, searchQuery]);

  // Get current value based on timing or asNeeded
  const currentValue = useMemo(() => {
    if (asNeeded) return PRN_VALUE;
    if (!timing?.code?.code) return "";

    // Find the key that matches the timing code
    const matchingEntry = Object.entries(
      MEDICATION_REQUEST_TIMING_OPTIONS,
    ).find(([, option]) => option.timing.code?.code === timing.code?.code);

    return matchingEntry?.[0] || "";
  }, [timing, asNeeded]);

  const handleChange = (value: string) => {
    if (value === PRN_VALUE) {
      onTimingChange(undefined, true);
    } else if (value === "") {
      onTimingChange(undefined, false);
    } else {
      const selectedOption =
        MEDICATION_REQUEST_TIMING_OPTIONS[
          value as keyof typeof MEDICATION_REQUEST_TIMING_OPTIONS
        ];
      if (selectedOption) {
        onTimingChange(selectedOption.timing, false);
      }
    }
  };

  return (
    <Autocomplete
      options={filteredOptions}
      value={currentValue}
      onChange={handleChange}
      onSearch={setSearchQuery}
      placeholder={placeholder || t("select_frequency")}
      inputPlaceholder={t("search_frequency")}
      noOptionsMessage={t("no_frequency_found")}
      disabled={disabled}
      className={cn("h-9 text-sm", hasError && "border-red-500", className)}
      popoverContentClassName="w-80"
      showClearButton={false}
    />
  );
}

/**
 * Helper function to reverse lookup a timing key from a timing object.
 * Moved here from MedicationRequestQuestion.tsx for reuse.
 */
export function reverseFrequencyOption(timing?: Timing): string {
  if (!timing?.code?.code) return "";

  const matchingEntry = Object.entries(MEDICATION_REQUEST_TIMING_OPTIONS).find(
    ([, option]) => option.timing.code?.code === timing.code?.code,
  );

  return matchingEntry?.[0] || "";
}
