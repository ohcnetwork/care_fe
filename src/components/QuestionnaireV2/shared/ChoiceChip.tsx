import { Square, SquareCheck } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChoiceChipProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  control: "checkbox" | "radio";
  disabled?: boolean;
  /** Shared by radio chips in one group; native controls provide arrow navigation. */
  name?: string;
}

export function ChoiceChip({
  checked,
  onCheckedChange,
  label,
  control,
  disabled,
  name,
}: ChoiceChipProps) {
  const className = cn(
    "relative inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 has-focus-visible:ring-2 has-focus-visible:ring-primary-500",
    checked ? "font-medium text-gray-900" : "text-gray-700 hover:bg-gray-50",
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
  );

  if (control === "radio") {
    return (
      <label className={className}>
        <input
          type="radio"
          name={name}
          checked={checked}
          aria-checked={checked}
          disabled={disabled}
          onChange={() => onCheckedChange(true)}
          // An optional boolean can be cleared by activating its selected
          // answer again; native radios otherwise emit no change for this.
          onClick={() => {
            if (checked) onCheckedChange(true);
          }}
          className="absolute inset-0 size-full cursor-inherit opacity-0"
        />
        <span
          aria-hidden
          className={cn(
            "flex size-4 items-center justify-center rounded-full border",
            checked ? "border-primary-700" : "border-gray-300",
          )}
        >
          {checked && <span className="size-2 rounded-full bg-primary-700" />}
        </span>
        {label}
      </label>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={className}
    >
      {checked ? (
        <SquareCheck className="size-4 text-primary-700" />
      ) : (
        <Square className="size-4 text-gray-400" />
      )}
      {label}
    </button>
  );
}
