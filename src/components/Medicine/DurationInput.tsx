import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import Autocomplete from "@/components/ui/autocomplete";

import {
  BoundsDuration,
  decodeDurationValue,
  encodeDurationValue,
  formatDurationLabel,
  generateDurationSuggestions,
  parseDurationString,
} from "@/types/emr/medicationRequest/medicationRequest";

interface DurationInputProps {
  value?: BoundsDuration;
  onChange: (duration: BoundsDuration | undefined) => void;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

/**
 * Smart single-field duration autocomplete.
 *
 * Type a number and see contextual suggestions:
 *   "5"  → 5 days, 5 weeks, 5 months
 *   "2w" → 2 weeks
 *   ""   → popular defaults: 3 days, 5 days, 7 days, 14 days, 1 month
 */
export function DurationInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  className,
}: DurationInputProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  // Encode current value for the autocomplete
  const currentValue = useMemo(() => encodeDurationValue(value), [value]);

  // Dynamic suggestions based on input
  const options = useMemo(() => {
    const suggestions = generateDurationSuggestions(searchQuery);

    // If there's a current value and it's not in suggestions, add it at the top
    if (currentValue && !suggestions.find((s) => s.value === currentValue)) {
      const currentLabel = formatDurationLabel(value);
      if (currentLabel) {
        suggestions.unshift({ value: currentValue, label: currentLabel });
      }
    }

    return suggestions;
  }, [searchQuery, currentValue, value]);

  const handleChange = (selectedValue: string) => {
    if (!selectedValue) {
      onChange(undefined);
      return;
    }

    // Try encoded format first (e.g. "5-d"), then raw text (e.g. "5 days")
    const decoded =
      decodeDurationValue(selectedValue) || parseDurationString(selectedValue);
    if (decoded) {
      onChange(decoded);
    }
  };

  return (
    <Autocomplete
      options={options}
      value={currentValue}
      onChange={handleChange}
      onSearch={setSearchQuery}
      placeholder={t("duration_placeholder")}
      inputPlaceholder={t("duration_input_placeholder")}
      noOptionsMessage={t("no_duration_found")}
      disabled={disabled}
      className={cn("h-9 text-sm", hasError && "border-red-500", className)}
      popoverContentClassName="w-56"
      showClearButton={false}
    />
  );
}
