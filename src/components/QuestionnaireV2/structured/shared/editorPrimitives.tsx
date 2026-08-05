import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { RowStatusOption } from "@/components/QuestionnaireV2/structured/core/RowStatusSelect";
import type { StructuredControlProps } from "@/components/QuestionnaireV2/structured/core/StructuredList";

/** Today as the bare `yyyy-MM-dd` a native `<input type="date">` speaks —
 *  the `max` bound every editor puts on an onset/occurrence field so a
 *  clinical date cannot be recorded in the future. */
export function todayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export interface EnumSelectProps<TValue extends string> {
  /** `null`/`undefined` renders the placeholder — `diagnosis.severity` is
   *  nullable on the wire. */
  value: TValue | null | undefined;
  /** The full option set, in display order. Each member doubles as its own
   *  locale key. */
  options: readonly TValue[];
  onValueChange: (value: TValue) => void;
  disabled?: boolean;
  placeholder?: string;
  controlProps: StructuredControlProps;
  /** Extra classes for each option row (`diagnosis` capitalizes its
   *  clinical statuses). */
  itemClassName?: string;
}

/**
 * The row-cell select over a closed string enum whose members are their own
 * locale keys — the shape every editor's clinical-status/severity/
 * criticality column had copied. Options are translated here rather than at
 * the call site (unlike `core/RowStatusSelect`, which stays i18next-free
 * because `structured/core` is the presentation layer).
 *
 * Every member of `options` is offered: use `core/RowStatusSelect` instead
 * when an option has to be withheld from rows the server does not have yet.
 *
 * `next as TValue` is safe by construction: Radix hands back one of the
 * `value`s this component rendered, all of which came from `options`.
 */
export function EnumSelect<TValue extends string>({
  value,
  options,
  onValueChange,
  disabled,
  placeholder,
  controlProps,
  itemClassName,
}: EnumSelectProps<TValue>) {
  const { t } = useTranslation();
  return (
    <Select
      value={value ?? undefined}
      onValueChange={(next) => onValueChange(next as TValue)}
      disabled={disabled}
    >
      <SelectTrigger {...controlProps} className="h-9 w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option} className={itemClassName}>
            {t(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * A closed status enum → `RowStatusSelect`'s pre-translated options — the
 * one adapter that lets `structured/core` stay i18next-free. The enum
 * members are the locale keys; `values` must be a stable reference (a
 * module-level constant), since it keys the memo.
 */
export function useTranslatedOptions<TValue extends string>(
  values: readonly TValue[],
): RowStatusOption<TValue>[] {
  const { t } = useTranslation();
  return useMemo(
    () => values.map((value) => ({ value, label: t(value) })),
    [values, t],
  );
}
