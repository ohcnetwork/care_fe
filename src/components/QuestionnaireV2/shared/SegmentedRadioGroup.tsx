import { cn } from "@/lib/utils";

interface SegmentedRadioGroupProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  "aria-label"?: string;
}

export function SegmentedRadioGroup<T extends string>({
  value,
  onChange,
  options,
  disabled,
  "aria-label": ariaLabel,
}: SegmentedRadioGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex w-full divide-x divide-gray-200 overflow-hidden rounded-md border border-gray-200"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm",
              selected
                ? "bg-primary-50 font-medium text-primary-800"
                : "bg-white text-gray-600 hover:bg-gray-50",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full border",
                selected ? "border-primary-700" : "border-gray-300",
              )}
            >
              {selected && (
                <span className="size-2 rounded-full bg-primary-700" />
              )}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
