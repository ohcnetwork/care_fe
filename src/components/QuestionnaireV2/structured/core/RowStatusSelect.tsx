import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** One selectable status, already translated at the call site — this
 *  component never imports i18next, matching every other `structured/core`
 *  primitive. */
export interface RowStatusOption<TStatus extends string> {
  value: TStatus;
  label: string;
}

export interface RowStatusSelectProps<TStatus extends string> {
  value: TStatus;
  onValueChange: (value: TStatus) => void;
  /** The full option set for this status family, in display order. */
  options: readonly RowStatusOption<TStatus>[];
  /**
   * The one option that only makes sense for a row the server already has
   * — `entered_in_error` in every current consumer. Hidden unless
   * {@link isExistingRecord}, so a brand-new row that never reached the
   * server can never be filed as already-retracted before it exists.
   */
  hiddenForNewRow: TStatus;
  /** `origin === "baseline"` (a server row) — NOT `!!row.id`, which
   *  happens to coincide for current consumers but is the wrong thing to
   *  generalize from; see `ProjectedRow.origin`. */
  isExistingRecord: boolean;
  disabled?: boolean;
  placeholder?: string;
  triggerClassName?: string;
  /**
   * These five match `StructuredControlProps` (`./StructuredList`) key for
   * key on purpose — a caller inside a `StructuredColumn.render` spreads
   * `{...ctx.controlProps}` directly onto this component, and it reaches
   * the underlying `SelectTrigger` (a real Radix/DOM element, not another
   * custom component with its own chance to drop it silently).
   */
  id?: string;
  "aria-label"?: string;
  "aria-required"?: true;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

/**
 * The status/verification select whose one "already retracted" option is
 * gated on the row already existing server-side — shared by the allergy,
 * symptom, diagnosis and medication_statement editors.
 *
 * The gating and the pre-translated options are what separate this from
 * `structured/shared/editorPrimitives`' `EnumSelect`, which offers every
 * option and translates them itself; an ungated column wants that one.
 */
export function RowStatusSelect<TStatus extends string>({
  value,
  onValueChange,
  options,
  hiddenForNewRow,
  isExistingRecord,
  disabled,
  placeholder,
  triggerClassName,
  id,
  "aria-label": ariaLabel,
  "aria-required": ariaRequired,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: RowStatusSelectProps<TStatus>) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onValueChange(next as TStatus)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-required={ariaRequired}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={triggerClassName}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options
          .filter(
            (option) => isExistingRecord || option.value !== hiddenForNewRow,
          )
          .map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
