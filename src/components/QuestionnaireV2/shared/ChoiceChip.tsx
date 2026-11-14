import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ChoiceChipProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  control: "checkbox" | "radio";
  disabled?: boolean;
  /** Shared by radio chips in one group. */
  name?: string;
  /** Assigned by ChoiceChipGroup; callers retain the checked/callback contract. */
  radioValue?: string;
}

/** Connect existing independently controlled choices to CareUI's radio navigation. */
export function ChoiceChipGroup({
  children,
  ...props
}: Omit<
  React.ComponentProps<typeof RadioGroup>,
  "value" | "defaultValue" | "onValueChange"
>) {
  const choices = React.Children.toArray(children);
  const isChoice = (
    child: React.ReactNode,
  ): child is React.ReactElement<ChoiceChipProps> =>
    React.isValidElement<ChoiceChipProps>(child) && child.type === ChoiceChip;
  const selectedIndex = choices.findIndex(
    (child) => isChoice(child) && child.props.checked,
  );
  const firstChoice = choices.find(isChoice);

  return (
    <RadioGroup
      name={firstChoice?.props.name}
      value={selectedIndex < 0 ? "" : String(selectedIndex)}
      onValueChange={(next) => {
        const child = choices[Number(next)];
        if (isChoice(child) && !child.props.disabled)
          child.props.onCheckedChange(true);
      }}
      {...props}
    >
      {choices.map((child, index) =>
        isChoice(child)
          ? React.cloneElement(child, { radioValue: String(index) })
          : child,
      )}
    </RadioGroup>
  );
}

export function ChoiceChip({
  checked,
  onCheckedChange,
  label,
  control,
  disabled,
  radioValue,
}: ChoiceChipProps) {
  const id = React.useId();
  return (
    <Field
      orientation="horizontal"
      data-disabled={disabled || undefined}
      className="w-auto"
    >
      {control === "radio" ? (
        <RadioGroupItem
          id={id}
          value={radioValue ?? label}
          disabled={disabled}
          onClick={() => {
            // Optional boolean answers clear when the selected answer is activated again.
            if (checked && !disabled) onCheckedChange(true);
          }}
        />
      ) : (
        <Checkbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
        />
      )}
      <FieldLabel
        htmlFor={id}
        className="cursor-pointer"
        onClick={(event) => {
          if (control === "radio" && checked && !disabled) {
            event.preventDefault();
            onCheckedChange(true);
          }
        }}
      >
        {label}
      </FieldLabel>
    </Field>
  );
}
