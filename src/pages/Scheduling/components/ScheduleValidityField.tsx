import { startOfDay } from "date-fns";
import { useId } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ValidityFields {
  valid_from?: Date;
  valid_to?: Date;
}

/**
 * Edits a schedule's `valid_from` and `valid_to` as one required date range.
 * Must be rendered inside a `<Form>` whose values include both fields.
 */
export function ScheduleValidityField({
  disablePast,
}: {
  disablePast?: boolean;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const { control } = useFormContext<ValidityFields>();
  const { field: validTo, fieldState: validToState } = useController({
    control,
    name: "valid_to",
  });

  return (
    <FormField
      control={control}
      name="valid_from"
      render={({ field, fieldState }) => {
        const error = fieldState.error ?? validToState.error;
        return (
          <FormItem>
            <FormLabel id={labelId} aria-required>
              {t("valid_period")}
            </FormLabel>
            <FormControl aria-invalid={!!error}>
              <DateRangePicker
                aria-labelledby={labelId}
                className="w-full"
                value={{ from: field.value, to: validTo.value }}
                minDate={disablePast ? startOfDay(new Date()) : undefined}
                allowOpenEnded={false}
                onApply={({ from, to }) => {
                  field.onChange(from);
                  validTo.onChange(to);
                }}
              />
            </FormControl>
            <FormMessage>{error?.message}</FormMessage>
          </FormItem>
        );
      }}
    />
  );
}
