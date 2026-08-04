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
   * — `entered_in_error` across every one of today's four copies
   * (`AllergyQuestion.tsx:179-212`, `SymptomQuestion.tsx:150-179`,
   * `DiagnosisQuestion.tsx:163-198`, `MedicationStatementQuestion.tsx:
   * 848-855`). Hidden from the list unless {@link isExistingRecord}, so a
   * brand-new row — one that never reached the server — can never be filed
   * as already-retracted before it exists.
   */
  hiddenForNewRow: TStatus;
  /** `origin === "baseline"` (a server row) — NOT `!!row.id` (legacy's own
   *  check, which happens to coincide for these four types but is the wrong
   *  thing to generalize from; see `core/types.ts`'s `ProjectedRow.origin`
   *  doc comment). */
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
 * gated on the row already existing server-side — today re-implemented,
 * nearly identically, once per clinical list type (allergy, symptom,
 * diagnosis, medication_statement). `allergy_intolerance` is the first
 * structured-v2 consumer; three more adopt this next.
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
