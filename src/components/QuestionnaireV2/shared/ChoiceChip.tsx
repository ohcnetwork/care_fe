import { Square, SquareCheck } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChoiceChipProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  control: "checkbox" | "radio";
  disabled?: boolean;
}

export function ChoiceChip({
  checked,
  onCheckedChange,
  label,
  control,
  disabled,
}: ChoiceChipProps) {
  return (
    <button
      type="button"
      role={control}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(control === "radio" ? true : !checked)}
      className={cn(
        // Bare option row (reference design): circle/square + label, no
        // chip border — selection reads from the control glyph and weight.
        "inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        checked
          ? "font-medium text-gray-900"
          : "text-gray-700 hover:bg-gray-50",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {control === "radio" ? (
        <span
          className={cn(
            "flex size-4 items-center justify-center rounded-full border",
            checked ? "border-primary-700" : "border-gray-300",
          )}
        >
          {checked && <span className="size-2 rounded-full bg-primary-700" />}
        </span>
      ) : checked ? (
        <SquareCheck className="size-4 text-primary-700" />
      ) : (
        <Square className="size-4 text-gray-400" />
      )}
      {label}
    </button>
  );
}
