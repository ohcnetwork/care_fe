import {
  ChevronsDownUp,
  ChevronsUpDown,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { QuestionValidationError } from "@/types/questionnaire/batch";

import { StructuredFieldError } from "./StructuredFieldError";
import { selectStructuredFieldErrors } from "./structuredFieldErrors";
import { gridTemplateColumns } from "./structuredListTracks";
import type { ProjectedRow, RowId } from "./types";

/**
 * Everything `render` needs. Built ONCE per (row, column) by the shell —
 * see `StructuredListRow` below — and handed to `column.render`.
 */
export interface StructuredColumnContext<TRow extends object> {
  row: ProjectedRow<TRow>;
  /** Record an `update` edit for this row. Stable per rowId (built by
   *  `useCallback` in `StructuredListRow`, never an inline arrow), because
   *  a child control's own `useCallback`/`useEffect` may key off this
   *  identity — an unstable identity here is exactly the mechanic that
   *  render-looped the appointment editor (see this file's header note). */
  update: (patch: Partial<TRow>) => void;
  /** Row-level disabled: the list's `disabled` OR `rowDisabled(row)`. */
  disabled: boolean;
  /** The row is soft-deleted — mirrors `row.softDeleted`, hoisted for
   *  convenience because most columns freeze on it. */
  removed: boolean;
  /** Accessible name every control in this cell MUST carry (`aria-label`),
   *  because the visible caption is `lg:hidden` and ARIA does not name a
   *  cell from its column header. Equals `column.header` unless the column
   *  overrides it with `ariaLabel`. */
  ariaLabel: string;
  /** `id` for a labelable control (`<input>`/`<textarea>`); the shell's
   *  caption uses no `htmlFor`, so this is only needed when the column
   *  wants a stable DOM id. */
  fieldId: string;
  /** `aria-describedby` target — the id of this cell's error element, or
   *  `undefined` when the cell has no error. */
  describedBy: string | undefined;
  /** At least one error binds to this cell. Drives the invalid ring so no
   *  type re-implements `useFieldError().hasError`. */
  invalid: boolean;
  /** The errors bound to this cell, already filtered by question + row +
   *  `errorFieldKeys`. Only read by columns that set `ownsErrorDisplay`. */
  errors: readonly QuestionValidationError[];
}

/** ONE definition per field. Drives the desktop `columnheader` + `cell`
 *  AND the mobile caption + stacked field. There is no second definition.
 *
 *  Restricted to the prop surface `charge_item` (this primitive's first
 *  consumer) genuinely needs — `group`/`placement` (advanced fields, full-
 *  span notes rows) are deferred to the phases that earn them
 *  (`p1-primitives.md` §2.1's deferral table); do not add them here without
 *  a real consumer. */
export interface StructuredColumn<TRow extends object> {
  /** Stable id. Used for the DOM anchor (`data-column`), the default
   *  `errorFieldKeys` entry, and React keys. */
  key: string;
  /** Already-translated header, e.g. `t("severity")`. Also the mobile
   *  caption and the default accessible name of every control in the cell. */
  header: string;
  /** Renders the `*` marker in the header and the mobile caption
   *  (`aria-hidden`; the programmatic signal is `aria-required` on the
   *  control). */
  required?: boolean;
  /** Desktop grid track. Ignored below `lg`. */
  width: string;
  /** Suppresses the desktop header text and the mobile caption. Use for an
   *  identity column whose value is already the row title
   *  (`rowTitle`/`rowSummary`). The column still renders and still
   *  occupies a track — only the label text is omitted. */
  headerHidden?: boolean;
  /** Column cell is not rendered at all below `lg` (its value already
   *  appears in `rowTitle`/`rowSummary`). Still occupies a desktop track. */
  mobileHidden?: boolean;
  /** Overrides the control's accessible name when the header is not a good
   *  one. */
  ariaLabel?: string;
  /** `field_key`s whose errors bind to this cell. Defaults to `[key]`. */
  errorFieldKeys?: readonly string[];
  /** The column renders its own `<StructuredFieldError>`. The shell then
   *  renders none for this cell but still computes `invalid`/`describedBy`. */
  ownsErrorDisplay?: boolean;
  /** Extra classes on the cell wrapper. */
  className?: string;
  render: (context: StructuredColumnContext<TRow>) => ReactNode;
}

export interface StructuredListProps<TRow extends object> {
  /** The owning question — namespaces every generated DOM id and scopes
   *  error matching. */
  questionId: string;
  /** Already-translated section label. Becomes the grid's `aria-label`. */
  label: string;
  rows: readonly ProjectedRow<TRow>[];
  columns: readonly StructuredColumn<TRow>[];
  errors: readonly QuestionValidationError[];
  /** Whole-section disabled (readonly mode, submit freeze). */
  disabled: boolean;

  onUpdateRow: (rowId: RowId, patch: Partial<TRow>) => void;
  onRemoveRow: (rowId: RowId) => void;

  /** The row's display name — desktop mobile-card title. */
  rowTitle: (row: ProjectedRow<TRow>) => ReactNode;
  /** One-line summary shown on a COLLAPSED mobile card. */
  rowSummary?: (row: ProjectedRow<TRow>) => ReactNode;
  /** Per-row disable beyond the section-level flag. */
  rowDisabled?: (row: ProjectedRow<TRow>) => boolean;
  /** Domain state classes — e.g. `line-through` when resolved. */
  rowClassName?: (row: ProjectedRow<TRow>) => string | undefined;
  /** Already-translated remove label. Defaults to `t("remove")`. */
  removeLabel?: (row: ProjectedRow<TRow>) => string;
  /** `false` disables the remove affordance. Defaults to
   *  `(row) => !row.softDeleted`. */
  canRemoveRow?: (row: ProjectedRow<TRow>) => boolean;

  /** Rendered below the grid — the add-entity control. Kept a slot so the
   *  list never depends on the add flow. */
  addControl?: ReactNode;
}

/**
 * ONE column/field definition per structured type, rendered as BOTH a
 * desktop grid row and a mobile collapsible card from the SAME React tree —
 * see `docs/superpowers/specs/annexes/p1-primitives.md` §2 for the full
 * design and the five hand-rolled dual renders this retires.
 *
 * The one breakpoint rule (`p1-primitives.md` §1.2): layout differences are
 * CSS, behaviour differences are JavaScript. This component contains
 * **zero** `useBreakpoints` calls — `lg:`-prefixed Tailwind classes are the
 * only thing that ever switches a cell between "stacked card field" and
 * "grid row cell." The five load-bearing mechanics (one tree per row, the
 * caption-is-the-header, `aria-label` naming, `display:contents` mobile
 * collapse, one horizontal scroller) are exactly Phase 1's design and are
 * NOT re-derived here — see the DOM contract this mirrors, `p1-primitives.md`
 * §2.3.
 *
 * `grid grid-cols-1 lg:grid-cols-[var(--structured-cols)]` MUST appear as a
 * literal class string (both here and in `StructuredListRow` below) so
 * Tailwind v4's scanner emits it — never templated.
 */
export function StructuredList<TRow extends object>({
  questionId,
  label,
  rows,
  columns,
  errors,
  disabled,
  onUpdateRow,
  onRemoveRow,
  rowTitle,
  rowSummary,
  rowDisabled,
  rowClassName,
  removeLabel,
  canRemoveRow,
  addControl,
}: StructuredListProps<TRow>) {
  // Every column always occupies a track — actions is a fixed 48px track,
  // always last, always present: Phase 2 has no consumer that opts out of
  // row removal (`rowActions` beyond remove is Phase 4).
  const trackList = useMemo(
    () => gridTemplateColumns(columns, { actions: true }),
    [columns],
  );

  return (
    <div data-structured-list={questionId} className="space-y-2">
      {rows.length > 0 && (
        // The ONLY horizontal scroller. Fixed px tracks must never reach an
        // element that participates in the canvas width, mirroring
        // MedicationStatementQuestion.tsx:498-499.
        <div className="w-auto overflow-x-auto">
          <div className="min-w-fit lg:rounded-md lg:border lg:border-gray-200">
            <div
              role="table"
              aria-label={label}
              data-structured-grid
              style={{ "--structured-cols": trackList } as React.CSSProperties}
            >
              <div role="rowgroup" className="hidden lg:block">
                <div
                  role="row"
                  className="grid border-b border-gray-200 bg-gray-50 lg:grid-cols-[var(--structured-cols)]"
                >
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      role="columnheader"
                      className="border-r border-gray-200 p-3 text-sm font-semibold text-gray-600"
                    >
                      {!column.headerHidden && (
                        <>
                          {column.header}
                          {column.required && (
                            <span
                              aria-hidden="true"
                              className="ml-0.5 text-red-500"
                            >
                              *
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  {/* role="none": layout-only spacer over the actions
                      track, never a phantom columnheader. */}
                  <div role="none" className="w-12" />
                </div>
              </div>
              <div role="rowgroup" className="bg-white">
                {rows.map((row, rowIndex) => (
                  <StructuredListRow
                    key={row.rowId}
                    questionId={questionId}
                    row={row}
                    rowIndex={rowIndex}
                    columns={columns}
                    errors={errors}
                    listDisabled={disabled}
                    onUpdateRow={onUpdateRow}
                    onRemoveRow={onRemoveRow}
                    rowTitle={rowTitle}
                    rowSummary={rowSummary}
                    rowDisabled={rowDisabled}
                    rowClassName={rowClassName}
                    removeLabel={removeLabel}
                    canRemoveRow={canRemoveRow}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {addControl}
    </div>
  );
}

interface StructuredListRowProps<TRow extends object> {
  questionId: string;
  row: ProjectedRow<TRow>;
  rowIndex: number;
  columns: readonly StructuredColumn<TRow>[];
  errors: readonly QuestionValidationError[];
  listDisabled: boolean;
  onUpdateRow: (rowId: RowId, patch: Partial<TRow>) => void;
  onRemoveRow: (rowId: RowId) => void;
  rowTitle: (row: ProjectedRow<TRow>) => ReactNode;
  rowSummary?: (row: ProjectedRow<TRow>) => ReactNode;
  rowDisabled?: (row: ProjectedRow<TRow>) => boolean;
  rowClassName?: (row: ProjectedRow<TRow>) => string | undefined;
  removeLabel?: (row: ProjectedRow<TRow>) => string;
  canRemoveRow?: (row: ProjectedRow<TRow>) => boolean;
}

/**
 * One row, as its own component — NOT inlined into a `.map()` closure in
 * `StructuredList`. This is what lets `update`/`handleRemove` be genuine,
 * per-row `useCallback`s (stable across re-renders as long as `onUpdateRow`/
 * `onRemoveRow`/`row.rowId` do not change) instead of a fresh arrow
 * function built every render inside a loop — the exact instability class
 * that render-looped the appointment editor (Task 4: an unstable callback
 * identity fed a child's own `useCallback`-gated effect, which combined
 * with a state setter that never bailed out on a no-op merge). Mobile
 * expand/collapse is local, per-row state — `defaultExpandedRowId` (the
 * newest-added-row rule) is deferred to Phase 3, so every row starts
 * collapsed here.
 */
function StructuredListRow<TRow extends object>({
  questionId,
  row,
  rowIndex,
  columns,
  errors,
  listDisabled,
  onUpdateRow,
  onRemoveRow,
  rowTitle,
  rowSummary,
  rowDisabled,
  rowClassName,
  removeLabel,
  canRemoveRow,
}: StructuredListRowProps<TRow>) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = useCallback(() => setExpanded((value) => !value), []);

  const update = useCallback(
    (patch: Partial<TRow>) => onUpdateRow(row.rowId, patch),
    [onUpdateRow, row.rowId],
  );
  const handleRemove = useCallback(
    () => onRemoveRow(row.rowId),
    [onRemoveRow, row.rowId],
  );

  const isDisabled = listDisabled || (rowDisabled?.(row) ?? false);
  const canRemove = canRemoveRow?.(row) ?? !row.softDeleted;
  const removeText = removeLabel?.(row) ?? t("remove");
  const bodyId = `${questionId}--${row.rowId}--body`;

  return (
    <div
      role="row"
      data-structured-row={row.rowId}
      className={cn(
        "grid grid-cols-1 border-b border-gray-200 last:border-b-0 lg:grid-cols-[var(--structured-cols)] lg:hover:bg-gray-50/50",
        isDisabled && "pointer-events-none opacity-40",
        rowClassName?.(row),
      )}
    >
      {/* Mobile card chrome. role="none" keeps it OUT of the cell index,
          so getByRole("cell").nth(n) still maps to the declared column
          order once later types port onto this primitive. */}
      <div role="none" className="lg:hidden">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={toggleExpanded}
          className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 text-left active:bg-gray-100"
        >
          <span className="min-w-0 break-words text-base text-gray-950">
            {rowTitle(row)}
          </span>
          {expanded ? (
            <ChevronsDownUp className="size-5 shrink-0" />
          ) : (
            <ChevronsUpDown className="size-5 shrink-0" />
          )}
        </button>
        {!expanded && rowSummary && (
          <p className="mt-1 px-2 text-sm text-gray-600">{rowSummary(row)}</p>
        )}
      </div>

      <div
        id={bodyId}
        role="none"
        className={cn(
          "space-y-3 p-2 lg:contents",
          !expanded && "hidden lg:contents",
        )}
      >
        {columns.map((column) => {
          const fieldKeys = column.errorFieldKeys ?? [column.key];
          const cellErrors = selectStructuredFieldErrors(errors, {
            questionId,
            rowId: row.rowId,
            rowIndex,
            fieldKeys,
          });
          const errorId = `${questionId}--${row.rowId}--${column.key}--error`;
          const context: StructuredColumnContext<TRow> = {
            row,
            update,
            disabled: isDisabled,
            removed: row.softDeleted,
            ariaLabel: column.ariaLabel ?? column.header,
            fieldId: `${questionId}--${row.rowId}--${column.key}`,
            describedBy: cellErrors.length > 0 ? errorId : undefined,
            invalid: cellErrors.length > 0,
            errors: cellErrors,
          };
          return (
            <div
              key={column.key}
              role="cell"
              data-column={column.key}
              className={cn(
                "min-w-0 overflow-hidden px-1 py-1 lg:border-r lg:border-gray-200 lg:px-2 lg:py-1",
                column.mobileHidden && "hidden lg:block",
                column.className,
              )}
            >
              {!column.headerHidden && (
                <span
                  aria-hidden="true"
                  className="mb-1.5 block text-sm lg:hidden"
                >
                  {column.header}
                  {column.required && (
                    <span className="ml-0.5 text-red-500">*</span>
                  )}
                </span>
              )}
              {column.render(context)}
              {!column.ownsErrorDisplay && (
                <StructuredFieldError
                  id={errorId}
                  questionId={questionId}
                  rowId={row.rowId}
                  rowIndex={rowIndex}
                  fieldKeys={fieldKeys}
                  errors={errors}
                />
              )}
            </div>
          );
        })}

        {/* Actions cell — sticky right, 48px track. Desktop-only (`lg:flex`),
            matching the annex's normative markup (`p1-primitives.md` §2.3);
            a per-row mobile remove affordance is not part of this DOM
            contract and is called out as a follow-up in this task's report. */}
        <div
          role="cell"
          className="sticky right-0 hidden w-12 items-center justify-center bg-white px-2 py-1 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] lg:flex"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("row_actions")}
                disabled={isDisabled}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canRemove && (
                <DropdownMenuItem
                  onSelect={handleRemove}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{removeText}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
