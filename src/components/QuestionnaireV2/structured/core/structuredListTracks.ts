/**
 * Joins each column's desktop track into one `grid-template-columns`
 * value, delivered to the grid as an inline `--structured-cols` custom
 * property (`StructuredList.tsx`) — one definition, one value, no
 * hand-synced width literals or summed max-width arithmetic.
 *
 * Takes every column regardless of `mobileHidden` — that flag only ever
 * hides a column's CELL below `lg`; at `lg` and above the column still
 * occupies its own track, so it must still contribute one here.
 */
export function gridTemplateColumns(
  columns: readonly { width: string }[],
  extras: { actions?: boolean } = {},
): string {
  const tracks = columns.map((column) => column.width);
  if (extras.actions) tracks.push("48px");
  return tracks.join(" ");
}
