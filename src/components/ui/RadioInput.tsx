import { useId } from "react";

import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface RadioInputProps extends React.ComponentProps<typeof RadioGroup> {
  options: { label: string; value: string }[];
}

export default function RadioInput({ options, ...props }: RadioInputProps) {
  const groupId = useId();
  return (
    <RadioGroup
      {...props}
      // Explicit form values may start undefined; omitted values stay uncontrolled.
      value={"value" in props ? (props.value ?? "") : undefined}
      className={cn("flex flex-wrap gap-3", props.className)}
    >
      {options.map((option, index) => {
        const id = `${groupId}-${index}`;
        return (
          <FieldLabel
            key={option.value}
            htmlFor={id}
            className="sm:has-[>[data-slot=field]]:w-auto"
            onClick={(event) => {
              if (
                !props.disabled &&
                !props.required &&
                props.value === option.value &&
                !(event.target instanceof HTMLInputElement)
              ) {
                event.preventDefault();
                props.onValueChange?.("");
              }
            }}
          >
            <Field
              orientation="horizontal"
              data-disabled={props.disabled || undefined}
            >
              <RadioGroupItem value={option.value} id={id} />
              <FieldContent>
                <FieldTitle>{option.label}</FieldTitle>
              </FieldContent>
            </Field>
          </FieldLabel>
        );
      })}
    </RadioGroup>
  );
}
