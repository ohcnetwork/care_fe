import { useRef } from "react";

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
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );

  // ARIA APG radiogroup pattern: one Tab stop for the whole group (roving
  // tabindex on the selected option), ArrowLeft/ArrowRight move selection.
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    buttonRefs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      // flex-wrap + min-w-fit keep every option label fully visible in
      // narrow containers (e.g. the 280px detail sidebar) instead of
      // clipping the text.
      className="flex w-full flex-wrap divide-x divide-gray-200 overflow-hidden rounded-md border border-gray-200"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === selectedIndex ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "flex min-w-fit flex-1 items-center justify-center gap-1.5 px-2 py-2 text-sm",
              selected
                ? "bg-primary-50 font-medium text-primary-800"
                : "bg-white text-gray-600 hover:bg-gray-50",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border",
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
