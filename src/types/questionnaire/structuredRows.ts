/**
 * Row shapes for contract-v2 structured questions.
 *
 * These live in the types layer, not beside their `model.ts`, because
 * `ResponseValue` (`./form.ts:27-45`) names them and `src/types/*` must
 * never import from the components tree — the same inversion
 * `./structured.ts:1-12` was written to undo. A type module re-exports
 * from here; nothing here imports from a module that imports React.
 */

/**
 * One recorded time of death. Rows are objects because they must be keyed,
 * projected and soft-deleted by structured row state.
 */
export interface TimeOfDeathRow {
  /** ISO-8601 UTC — `Date.toISOString()`'s own format, always a trailing
   *  `Z`, never a numeric offset — exactly what `DateTimeInput` emits
   *  (`components/Common/DateTimeInput.tsx:6-11`, `toISOWithTimezone`,
   *  despite that helper's name). An offset string (e.g. `+05:30`) is a
   *  perfectly valid ISO-8601 `deceased_datetime` value too — the field
   *  itself doesn't require UTC — this doc comment is only pinning what
   *  THIS INPUT specifically produces. */
  deceased_datetime: string;
}
