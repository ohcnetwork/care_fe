/**
 * Joins each column's desktop track into one `grid-template-columns`
 * value, delivered to the grid as an inline `--structured-cols` custom
 * property (`StructuredList.tsx`).
 *
 * This is what retires the hand-synced literals: today
 * `MedicationRequestQuestion.tsx` repeats a 14-track
 * `grid-cols-[280px_220px_…]` string at `:1163`, `:1164`, `:1687` and
 * `:1688`, and `:1152`'s `max-w-[2718px]` has to equal their SUM by hand
 * (the comment at `:1149-1151` says so out loud). One definition, one
 * value, no arithmetic.
 *
 * Takes every column regardless of `mobileHidden` — that flag only ever
 * hides a column's CELL below `lg`; at `lg` and above it still occupies its
 * own track, so it must still contribute one here.
 */
export function gridTemplateColumns(
  columns: readonly { width: string }[],
  extras: { actions?: boolean } = {},
): string {
  const tracks = columns.map((column) => column.width);
  if (extras.actions) tracks.push("48px");
  return tracks.join(" ");
}
