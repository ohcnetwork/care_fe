import { ReactNode } from "react";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { FormControl, useFormField } from "@/components/ui/form";

interface Props {
  label: string;
  description?: string;
  required?: boolean;
  orientation?: "vertical" | "horizontal";
  children: ReactNode;
}

export function ReferralAvailabilityField({
  label,
  description,
  required,
  orientation = "vertical",
  children,
}: Props) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Field orientation={orientation} data-invalid={!!error}>
      <FieldContent>
        <FieldLabel htmlFor={formItemId} aria-required={required}>
          {label}
        </FieldLabel>
        {description && (
          <FieldDescription id={formDescriptionId}>
            {description}
          </FieldDescription>
        )}
      </FieldContent>
      <FormControl>{children}</FormControl>
      <FieldError id={formMessageId} errors={[error]} />
    </Field>
  );
}
