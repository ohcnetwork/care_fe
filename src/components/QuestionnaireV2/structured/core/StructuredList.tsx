import {
  ChevronsDownUp,
  ChevronsUpDown,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { QuestionValidationError } from "@/types/questionnaire/batch";

import { StructuredFieldError } from "./StructuredFieldError";
import { selectStructuredFieldErrors } from "./structuredFieldErrors";
import {
  resolveRowExpanded,
  rowHasBoundError,
  unmatchedRowErrorFieldKeys,
} from "./structuredListRowState";
import { gridTemplateColumns } from "./structuredListTracks";
import type { ProjectedRow, RowId } from "./types";

/**
 * The naming bundle every control inside a cell must carry, spread as a
 * single unit (`{...ctx.controlProps}`) rather than four hand-copied
 * attributes.
 *
 * TypeScript alone cannot make an omission loud: excess-property checking
 * does not flag a hyphenated attribute — named or spread — on a component
 * that doesn't declare it; the value compiles cleanly and is silently
 * dropped at runtime. The loud half is `auditCellAccessibleName` below.
 * This bundle just makes it ONE thing to remember per control instead of
 * four independently wireable attributes.
 */
export interface StructuredControlProps {
  id: string;
  "aria-label": string;
  "aria-required"?: true;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

/**
 * Everything `render` needs. Built ONCE per (row, column) by the shell —
 * see `StructuredListRow` below — and handed to `column.render`.
 */
export interface StructuredColumnContext<TRow extends object> {
  row: ProjectedRow<TRow>;
  /** Record an `update` edit for this row. Built via `useCallback` on
   *  `[onUpdateRow, row.rowId]`, but NOT stable across edits: the caller's
   *  `onUpdateRow` (normally `useStructuredRows`'s `updateRow`, whose deps
   *  include `rows`/`edits`) changes identity on every keystroke, so
   *  `update` does too. Never key a column's own `useCallback`/`useEffect`
   *  on it — that is the render-loop mechanic; call it only from plain
   *  event handlers. */
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
  /** `{ id: fieldId, "aria-label": ariaLabel, "aria-required"?,
   *  "aria-invalid"?, "aria-describedby"? }` — exactly the four fields
   *  above, bundled. Spread this directly onto the cell's control
   *  (`<Input {...ctx.controlProps} .../>`, `<RowStatusSelect
   *  {...ctx.controlProps} .../>`) instead of copying `ariaLabel`/`fieldId`/
   *  `describedBy`/`invalid` out one at a time — see
   *  {@link StructuredControlProps}'s doc comment for why this exists and
   *  what it does and does not guarantee. */
  controlProps: StructuredControlProps;
}

/** ONE definition per field. Drives the desktop `columnheader` + `cell`
 *  AND the mobile caption + stacked field. There is no second definition.
 *
 *  Restricted to the prop surface current consumers genuinely need —
 *  `group`/`placement` (advanced fields, full-span notes rows) are
 *  deliberately absent; do not add them here without a real consumer. */
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

/**
 * One entry of a row's overflow menu, alongside the shell's own synthesized
 * Remove item. Remove itself is never listed here — it is always
 * shell-owned (`canRemoveRow`/`removeLabel` below), so a type cannot
 * accidentally duplicate or shadow it.
 *
 * Kept independent of `TRow` on purpose — unlike `StructuredColumn.render`,
 * an action has no per-cell context to receive (no `update`, no
 * `controlProps`); the `rowActions` callback below DOES receive the row and
 * hands back plain, already-bound callbacks here.
 */
export interface StructuredRowAction {
  /** Stable id — React key only, never rendered. */
  key: string;
  /** Already-translated label, e.g. `t("add_to_template")`. */
  label: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  onSelect: () => void;
  disabled?: boolean;
  /** Red text, matching the shell's own Remove styling — for an action
   *  that is itself destructive/irreversible (not merely "not Remove"). */
  destructive?: boolean;
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
  /** Per-row disable beyond the section-level flag. Freezes the ENTIRE
   *  row, including the actions cell (`pointer-events-none` on the row
   *  div) — there is no way to distinguish "freeze the fields" from
   *  "freeze the fields but still let the clinician act on the row," so a
   *  type wanting a restore affordance on a disabled row cannot reach it
   *  through this prop as written. */
  rowDisabled?: (row: ProjectedRow<TRow>) => boolean;
  /** Domain state classes — e.g. `line-through` when resolved. */
  rowClassName?: (row: ProjectedRow<TRow>) => string | undefined;
  /** Already-translated remove label. Defaults to `t("remove")`. */
  removeLabel?: (row: ProjectedRow<TRow>) => string;
  /** `false` disables the remove affordance. Defaults to
   *  `(row) => !row.softDeleted`. */
  canRemoveRow?: (row: ProjectedRow<TRow>) => boolean;
  /** Extra per-row overflow-menu items, ABOVE the shell's own Remove item
   *  (a `DropdownMenuSeparator` is inserted between the two groups
   *  automatically, only when both are non-empty). Generic on purpose —
   *  any type may contribute actions here (e.g. `medication_request`/
   *  `service_request`'s per-row "Add to template"); see
   *  {@link StructuredRowAction}'s own doc comment. `undefined`/`[]`
   *  renders exactly the Remove-only menu. */
  rowActions?: (row: ProjectedRow<TRow>) => readonly StructuredRowAction[];

  /** Rendered below the grid — the add-entity control. Kept a slot so the
   *  list never depends on the add flow. */
  addControl?: ReactNode;
}

/**
 * ONE column/field definition per structured type, rendered as BOTH a
 * desktop grid row and a mobile collapsible card from the SAME React tree.
 *
 * The one breakpoint rule: layout differences are CSS, behaviour
 * differences are JavaScript. This component contains **zero**
 * `useBreakpoints` calls — `lg:`-prefixed Tailwind classes are the only
 * thing that ever switches a cell between "stacked card field" and "grid
 * row cell."
 *
 * `lg:grid-cols-[var(--structured-cols)]` MUST appear as a literal class
 * string (both here and in `StructuredListRow` below) so Tailwind v4's
 * scanner emits it — never templated.
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
  rowActions,
  addControl,
}: StructuredListProps<TRow>) {
  // Every column always occupies a track — actions is a fixed 48px track,
  // always last, always present: this is the row-actions MENU's track, not
  // a per-action column, so an arbitrary number of `rowActions` entries
  // never grows `--structured-cols` or requires a second header cell.
  const trackList = useMemo(
    () => gridTemplateColumns(columns, { actions: true }),
    [columns],
  );

  return (
    <div data-structured-list={questionId} className="space-y-2">
      {rows.length > 0 && (
        // The ONLY horizontal scroller. Fixed px tracks must never reach an
        // element that participates in the canvas width.
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
                  {/* This loop's cell count (columns.length + 1 spacer)
                      MUST always match every body row's (columns.length +
                      1 actions, below) — header and body share one
                      `--structured-cols` track list, so a skipped cell
                      misaligns the desktop grid. Never conditionally OMIT
                      a header/body cell for a column; suppress its CONTENT
                      only (`headerHidden`/`mobileHidden` hide via CSS,
                      never by skipping the `.map()` entry). */}
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      id={`${questionId}--${column.key}--header`}
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
                    rowActions={rowActions}
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
  rowActions?: (row: ProjectedRow<TRow>) => readonly StructuredRowAction[];
}

/**
 * One row, as its own component — NOT inlined into a `.map()` closure in
 * `StructuredList` — so `update`/`handleRemove` can be genuine per-row
 * `useCallback`s (stable while `onUpdateRow`/`onRemoveRow`/`row.rowId` are
 * unchanged) instead of fresh arrows built every render inside a loop,
 * which feeds unstable identities into children's hook dependencies.
 * Mobile expand/collapse is local, per-row state; every row starts
 * collapsed EXCEPT when it carries a bound error (below).
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
  rowActions,
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
  // Built fresh every render (not memoized) — deliberately: a type's
  // `rowActions` closure typically closes over its own per-row state (e.g.
  // `openAddToTemplate(row.row)`), and this shell has no way to know that
  // closure's real dependencies. Cheap: a handful of plain objects, not a
  // hook, so there is no rules-of-hooks concern with it running
  // conditionally-shaped output on every render.
  const extraActions = rowActions?.(row) ?? [];
  const bodyId = `${questionId}--${row.rowId}--body`;

  // Below `lg` the body wrapper — the ONLY place a cell's
  // `StructuredFieldError` renders — is `display:none` while collapsed. A
  // row a blocking `validate()` error binds to must never be hideable that
  // way: `useSubmitFillSession` aborts the whole submit on any
  // `QuestionValidationError`, so a collapsed row would leave only a bare
  // toast and the error's `role="alert"` would never be announced from a
  // hidden subtree. `hasError` forces the row open and yields back to the
  // toggle the moment the error clears.
  const hasError = rowHasBoundError(columns, errors, {
    questionId,
    rowId: row.rowId,
    rowIndex,
  });
  const isExpanded = resolveRowExpanded(expanded, hasError);
  // A `field_key` no column declares (e.g. a shared row-level `note` with
  // no column of its own) renders in no cell, and not at the block level
  // either — `QuestionBlock`'s allow-list suppresses it there for these
  // types. `rowHasBoundError` already counts these (so the row
  // force-expands); this is where they actually get PRINTED.
  const unmatchedFieldKeys = unmatchedRowErrorFieldKeys(columns, errors, {
    questionId,
    rowId: row.rowId,
    rowIndex,
  });

  // DEV-ONLY accessible-name audit — the enforcement
  // `StructuredControlProps` itself cannot provide (see its doc comment).
  // Audits the ACTUAL RENDERED DOM — true regardless of which mechanism,
  // or none, a column's `render` used. `[data-column="<key>"]` is markup
  // every cell already carries, so this adds no new DOM. Runs once per
  // render (no dependency array — a broken cell should log on every render
  // until it's fixed), body-scoped so it only inspects THIS row's cells,
  // and a complete no-op outside development builds.
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const body = bodyRef.current;
    if (!body) return;
    for (const column of columns) {
      auditCellAccessibleName(body, {
        questionId,
        rowId: row.rowId,
        columnKey: column.key,
      });
    }
  });

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
          so getByRole("cell").nth(n) maps to the declared column order. */}
      <div role="none" className="lg:hidden">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={bodyId}
          onClick={toggleExpanded}
          // While `hasError` pins the row open there is no collapse action
          // to perform — disabling the toggle is the honest signal, instead
          // of a live control that visibly does nothing with
          // `aria-expanded` stuck at "true".
          disabled={hasError}
          className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 text-left active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="min-w-0 break-words text-base text-gray-950">
            {rowTitle(row)}
          </span>
          {isExpanded ? (
            <ChevronsDownUp className="size-5 shrink-0" />
          ) : (
            <ChevronsUpDown className="size-5 shrink-0" />
          )}
        </button>
        {!isExpanded && rowSummary && (
          <p className="mt-1 px-2 text-sm text-gray-600">{rowSummary(row)}</p>
        )}
      </div>

      <div
        id={bodyId}
        ref={bodyRef}
        role="none"
        className={cn(
          "space-y-3 p-2 lg:contents",
          !isExpanded && "hidden lg:contents",
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
          const ariaLabel = column.ariaLabel ?? column.header;
          const fieldId = `${questionId}--${row.rowId}--${column.key}`;
          const describedBy = cellErrors.length > 0 ? errorId : undefined;
          const invalid = cellErrors.length > 0;
          const context: StructuredColumnContext<TRow> = {
            row,
            update,
            disabled: isDisabled,
            removed: row.softDeleted,
            ariaLabel,
            fieldId,
            describedBy,
            invalid,
            errors: cellErrors,
            controlProps: {
              id: fieldId,
              "aria-label": ariaLabel,
              ...(column.required ? { "aria-required": true as const } : {}),
              ...(invalid ? { "aria-invalid": true as const } : {}),
              ...(describedBy ? { "aria-describedby": describedBy } : {}),
            },
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

        {/* Actions cell — never desktop-only: Remove must stay reachable
            at every width. Below `lg` a normal full-width flex row
            (reachable once the card is expanded, same as every other
            field); at `lg`+ the sticky right-aligned 48px track. */}
        <div
          role="cell"
          className={cn(
            "flex items-center justify-end gap-2 px-2 py-2",
            "lg:sticky lg:right-0 lg:w-12 lg:justify-center lg:bg-white lg:py-1 lg:shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)]",
          )}
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
              {extraActions.map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.key}
                    onSelect={action.onSelect}
                    disabled={action.disabled}
                    className={cn(action.destructive && "text-red-600")}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                );
              })}
              {extraActions.length > 0 && canRemove && (
                <DropdownMenuSeparator />
              )}
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

        {/* Unmatched-error fallback. role="none" — like the mobile chrome
            above, this must never inject a phantom `role="cell"`, and
            `lg:col-span-full` spans every desktop track instead of
            claiming one (it isn't a column, so it never entered
            `gridTemplateColumns`'s count). One `StructuredFieldError` per
            distinct unmatched key — unlike a cell's "first error wins"
            slot, two undeclared keys can coexist and neither may be lost
            silently. */}
        {unmatchedFieldKeys.length > 0 && (
          <div
            role="none"
            className="space-y-1 px-1 pb-2 lg:col-span-full lg:px-2"
          >
            {unmatchedFieldKeys.map((fieldKey) => (
              <StructuredFieldError
                key={fieldKey}
                id={`${questionId}--${row.rowId}--${fieldKey}--error`}
                questionId={questionId}
                rowId={row.rowId}
                rowIndex={rowIndex}
                fieldKeys={[fieldKey]}
                errors={errors}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Interactive elements a cell's control could plausibly be — anything a
 *  screen reader would announce as a distinct, actionable widget. A cell
 *  with none of these (a pure display value, e.g. `charge_item`'s "item"
 *  column) has nothing to name and is silently skipped below. */
const INTERACTIVE_SELECTOR =
  'input, textarea, select, button, [role="combobox"], [role="button"], [contenteditable="true"]';

/**
 * DEV-ONLY. Warns loudly, via `console.error`, when a structured cell's
 * control has no accessible name — the enforcement `StructuredControlProps`
 * itself cannot provide (see that interface's doc comment). Checked against
 * the real, committed DOM rather than against however the column's `render`
 * happened to wire its props, so this catches every failure mode: a
 * forgotten `aria-label`, one spread onto a custom component that doesn't
 * declare it, a `<label>` with no matching `id`, all the same to a screen
 * reader and all the same here.
 *
 * A cell with no interactive control at all (a pure display column) is not
 * an error and is not reported — there is nothing in it to name.
 */
function auditCellAccessibleName(
  body: HTMLElement,
  context: { questionId: string; rowId: RowId; columnKey: string },
): void {
  const cell = body.querySelector<HTMLElement>(
    `[data-column="${context.columnKey}"]`,
  );
  if (!cell) return;
  const control = cell.querySelector<HTMLElement>(INTERACTIVE_SELECTOR);
  if (!control) return; // pure-display column — nothing to name

  const hasLabelFor =
    !!control.id &&
    !!control.ownerDocument.querySelector(`label[for="${control.id}"]`);
  const named =
    !!control.getAttribute("aria-label")?.trim() ||
    !!control.getAttribute("aria-labelledby") ||
    hasLabelFor;

  if (!named) {
    console.error(
      `StructuredList: column "${context.columnKey}" in question "${context.questionId}" (row ${context.rowId}) rendered a control with no accessible name. Spread ctx.controlProps (or set aria-label from ctx.ariaLabel) onto it — the visible caption is lg:hidden, so this is the only name a screen reader gets.`,
    );
  }
}
