import { History } from "lucide-react";
import { useTranslation } from "react-i18next";

import { droppedRowLabels } from "./droppedRowsNotice";
import type { EditLog } from "./types";

/**
 * Names every row THIS structured question's `useStructuredRows` dropped
 * this mount because its baseline vanished server-side (spec amendment A1
 * — see `droppedRowsNotice.ts`'s own doc comment for why this is a
 * separate, per-question notice rather than a feed into the pre-Resume
 * `DraftRestoreBar`). Visually mirrors that bar's own amber convention
 * (`fill/DraftRestoreBar.tsx`) so the two read as one family of "here is
 * what could not be carried over" copy, even though they fire at different
 * times for different reasons.
 *
 * Renders nothing when there is nothing to report — mount this
 * unconditionally in every structured editor; it is a no-op the moment
 * `droppedEdits` is empty (the overwhelming common case).
 */
export function StructuredDroppedRowsNotice<TRow extends object>({
  droppedEdits,
  rowLabel,
}: {
  droppedEdits: EditLog<TRow>;
  rowLabel: (row: TRow) => string;
}) {
  const { t } = useTranslation();
  if (droppedEdits.length === 0) return null;

  const entries = droppedRowLabels(droppedEdits, rowLabel);

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      <History aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium">
          {t("structured_rows_dropped", { count: entries.length })}
        </p>
        <ul className="list-inside list-disc">
          {entries.map((entry) => (
            <li key={entry.rowId}>{entry.label}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
