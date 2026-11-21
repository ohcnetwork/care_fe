import { useId } from "react";

import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SegmentedRadioGroupProps<T extends string> {
  value: T | undefined;
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
  const groupId = useId();

  return (
    <RadioGroup<T>
      // Async form values must keep this controlled from the first render.
      value={value ?? ""}
      onValueChange={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2"
    >
      {options.map((option, index) => {
        const id = `${groupId}-${index}`;
        return (
          <FieldLabel
            key={option.value}
            htmlFor={id}
            className="max-w-full flex-1 basis-auto has-[>[data-slot=field]]:w-auto"
          >
            <Field
              orientation="horizontal"
              data-disabled={disabled || undefined}
            >
              <RadioGroupItem id={id} value={option.value} />
              <FieldContent className="min-w-0">
                <FieldTitle className="whitespace-normal wrap-anywhere">
                  {option.label}
                </FieldTitle>
              </FieldContent>
            </Field>
          </FieldLabel>
        );
      })}
    </RadioGroup>
  );
}
