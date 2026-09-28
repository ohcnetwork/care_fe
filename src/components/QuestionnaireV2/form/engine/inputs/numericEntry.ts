import { Code } from "@/types/base/code/code";
import { ResponseValue } from "@/types/questionnaire/form";

/**
 * The number an `integer`/`decimal` input commits. `integer` questions
 * truncate: `step={1}` only constrains the spinner arrows, so a typed "2.5"
 * reaches the change handler intact and would submit a fractional value the
 * backend rejects for the whole atomic batch.
 */
export function coerceNumberValue(
  raw: string,
  valueAsNumber: number,
  integer: boolean,
): number | undefined {
  if (raw === "" || Number.isNaN(valueAsNumber)) return undefined;
  return integer ? Math.trunc(valueAsNumber) : valueAsNumber;
}

/** The unit state a quantity entry writes against. */
export interface QuantityUnitState {
  /** The unit the control currently shows: the entry's own unit when it has
   *  one, else the question's authored pre-selection. */
  unit?: Code;
  /** The entry's own coding, when it carries one of its own. */
  coding?: Code;
}

/**
 * The entry a quantity input writes when its numeric value changes.
 *
 * The displayed unit rides along with every write, the clearing one
 * included, so editing the number can never change the unit. It has to: the
 * entry outlives the mount that recorded it, so which unit was picked
 * cannot be tracked anywhere but on the entry itself, and a stored unit is
 * indistinguishable from the authored default. A valueless quantity is kept
 * out of answers by `entryIsAnswered` instead, so a cleared required field
 * stays incomplete and never reaches the submit payload.
 */
export function nextQuantityEntry(
  raw: string,
  units: QuantityUnitState,
): ResponseValue {
  const parsed = raw === "" ? Number.NaN : parseFloat(raw);
  const value = Number.isNaN(parsed) ? undefined : parsed;

  // Invariant: the submitted `coding` always mirrors the unit shown to the
  // user unless the entry already carries its own explicit coding — the
  // backend validates `value.coding` against the question's
  // `answer_value_set` and a missing `coding` fails server-side.
  return {
    type: "quantity",
    value,
    unit: units.unit,
    coding: units.coding ?? units.unit,
  };
}

/** Whether a written entry carries nothing at all — no number and no unit
 *  to remember — so the single-entry write path empties the array instead of
 *  keeping a hollow slot. A cleared value under a unit is NOT nothing: the
 *  unit is what the picker must still show. */
export function isEmptyQuantityEntry(entry: ResponseValue): boolean {
  return (
    entry.value === undefined && entry.unit == null && entry.coding == null
  );
}
