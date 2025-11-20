import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export interface FilterSelectProps {
  /** Already translated label text */
  label: string;
  /** Current selected value (should match one of the option values) */
  value: string;
  /** Callback when selection changes */
  onValueChange: (value: string | undefined) => void;
  /** Array of option objects with value (for selection) and label (already translated for display) */
  options: Array<{ value: string; label: string }>;
  /** Callback when clear button is clicked */
  onClear: () => void;
  /** Optional icon to display instead of default filter icon */
  icon?: React.ReactNode;
  /** Optional CSS class name */
  className?: string;
  /** Optional already translated placeholder text */
  placeholder?: string;
  /** Already translated text for the "is" conjunction (defaults to "is") */
  conjunctionText?: string;
}

export function FilterSelect({
  value,
  onValueChange,
  options,
  label,
  onClear,
  icon,
  className,
  placeholder,
  conjunctionText = "is",
}: FilterSelectProps) {
  // Find the label for the selected value
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label || value;

  return (
    <div
      className={cn(
        "flex items-center overflow-hidden rounded-md border border-gray-400",
        className,
      )}
    >
      <Select
        value={value}
        onValueChange={(newValue) => onValueChange(newValue || undefined)}
      >
        <SelectTrigger className="border-0 hover:bg-transparent rounded-none focus:ring-0 focus:ring-offset-0">
          <div className="flex w-full items-center gap-2">
            {icon || <CareIcon icon="l-filter" className="size-4" />}
            {value ? (
              <>
                <span className="text-gray-950">{label}</span>
                <span className="text-gray-600 lowercase">
                  {conjunctionText}
                </span>
                <span className="text-gray-950 underline">{selectedLabel}</span>
              </>
            ) : (
              <span className="text-gray-500">{placeholder || label}</span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 border-l hover:bg-transparent w-9 rounded-none text-gray-400 border-gray-400"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
