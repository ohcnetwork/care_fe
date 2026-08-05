# structured/core

The row-list editing engine every structured question type builds on:
`allergy_intolerance`, `medication_request`, `medication_statement`,
`symptom`, `diagnosis`, `appointment`, `encounter`, `service_request`,
`charge_item`, `files`, `time_of_death`. 32 files under `structured/types/`
import from here (`grep -rl structured/core structured/types`).

`structured/` (`registry.ts`, `types.ts`, `pluginRegistry.ts`,
`definitions/`) is the registration layer one level up — see the parent
`QuestionnaireV2/README.md`'s "structured/" section. **This directory has
nothing to do with that registration.** `core` doesn't know
`StructuredQuestionType` exists, doesn't know about `registry.ts`, and
isn't imported by it. The dependency graph is strictly one-directional:

```
src/types/questionnaire/structured.ts   (StructuredQuestionType, StructuredEdit — the shipped vocabulary)
        │
        ▼
structured/core/*                       (this directory — generic over TRow, entity-agnostic)
        │
        ▼
structured/types/<entity>/{model.ts,Editor.tsx}   (instantiates core with a concrete TRow)
        │
        ▼
structured/definitions/<entity>.tsx     (glue: component + requires + validate + buildRequests)
        │
        ▼
structured/registry.ts                  (STRUCTURED_TYPE_REGISTRY, resolveStructuredType)
```

The one crack in that layering: `definitions/appointment.tsx` imports
`SINGLETON_ROW_ID` from `core/rowIds.ts` directly, because it builds a
translated, row-scoped `QuestionValidationError` at the i18n boundary and
needs core's reserved constant to attach a `row_id` to it. Nowhere else in
`structured/` or `structured/definitions/` reaches into `core`.

Every entity's `model.ts` stays React-free on purpose ("must stay
React-free for `node --test`" — a recurring comment across the type
modules) and only imports pure core exports (`resolveChanges`, the
`BaselineRow`/`ProjectValues`/`SoftDeleteDescriptor` types). Its
`Editor.tsx` is the one file that actually calls `useStructuredRows` and
renders `StructuredList`. If you're implementing a new structured type,
`model.ts` + `Editor.tsx` is the whole job — you should never need to edit
anything in this directory.

## The data model

**A row** is one clinical record (a symptom, a medication, a diagnosis)
shaped as a plain object (`TRow extends object` everywhere — nothing here
is a class or carries behavior). Its identity is a `RowId` (`type RowId =
string`, `types.ts`), minted one of two ways (`rowIds.ts`):

- `newRowId()` → `crypto.randomUUID()`, for a row created client-side this
  session (add flows on multi-row types).
- `SINGLETON_ROW_ID = "singleton"` — a fixed, non-random id for one-row
  types (`appointment`, `time_of_death`) that have no server row to key off
  until the first save. It's a constant rather than a uuid specifically so
  a drafted edit for a singleton still lands on the same identity after a
  reload.

`RowId` is opaque by design: "nothing parses a rowId; the `op` and the
baseline map are what tell add from update" (`rowIds.ts`). Never sniff a
rowId's shape to infer whether it's server- or client-issued.

**Three shapes, three moments** (`types.ts`):

- `BaselineRow<TRow> = { rowId, row }` — one server row, already converted
  and keyed by the type module. The hook never fetches and never guesses
  ids.
- `RowEdit<TRow>` — a `TRow`-parameterized _alias_ of the shipped
  `StructuredEdit<TRow>` (`src/types/questionnaire/structured.ts`), not a
  restatement: `{ rowId, op: "add"|"update"|"remove", patch: TRow }`.
  Aliasing (rather than redeclaring) is what keeps the two from drifting
  apart — enforced at compile time by a dedicated erasure-parity test suite
  in `deepEqual.test.ts` that pins `EditLog<TRow>` as assignable to
  `readonly StructuredEditRecord[]` and asserts a `@ts-expect-error` on an
  incomplete `patch`.
- `ProjectedRow<TRow> = { rowId, row, origin, edited, softDeleted }` — what
  the editor actually renders: baseline merged with any pending edit.
  `origin` is `"baseline" | "added"`, and — the one field worth
  memorizing — it is **deliberately not derived from `!!row.id`**: a
  historical row re-added via `HistoricalRecordSelector` has its id
  stripped and is genuinely `"added"` despite having existed before.
  `RowStatusSelect`'s `isExistingRecord` prop hinges on getting this
  right; its own comment flags `!!row.id` as "the wrong thing to
  generalize from."

**`EditLog<TRow> = readonly RowEdit<TRow>[]`** is the per-question,
at-most-one-entry-per-rowId user-intent log — not append-only, since
`applyEditToLog` coalesces a same-rowId edit in place and annihilation
splices the entry out entirely — and it's what gets persisted into the
response (`response.edits`) and what every `toRequests` reads to build the
submit batch.

**Invariant, stated three times in three files because it's load-bearing
everywhere**: `RowEdit.patch` is always the **complete row**, for every
op, including `remove` — never a partial diff, never absent. This is what
lets `toRequests` stay pure (no query-cache access needed to reconstruct a
row) and lets a draft restored after a failed baseline fetch still carry
everything needed to build a soft-delete body. Contrast this with
`SoftDeleteDescriptor.patch: Partial<TRow>`, which _is_ allowed to be
partial — because it's merged onto an already-known baseline row by
`resolveRemoveIntent` (`rowMutations.ts`) — a separate pure function, not
the `applyEditToLog` reducer itself — **before** it becomes a `RowEdit`.

## The write path: `editLog.ts`

`applyEditToLog(log, edit, { baseline?, isEmptyRow? })` is the reducer
every mutator funnels through — human clicks and the AI assistant alike
call this exact function, which is the actual mechanism (not a code-review
convention) that keeps human and assistant edits from diverging. It
maintains "at most one entry per rowId" by coalescing the incoming edit
against any existing entry for that rowId, per a 12-cell table (existing
op `none|add|update|remove` × incoming op `add|update|remove`) documented
in the file's header comment. The two facts worth internalizing:

- **An op label on an existing entry is not proof of server history.**
  Annihilation (`add` → `remove` on a client-only row) erases the rowId's
  history from the log entirely. A _later_, unrelated `remove` for that
  same rowId then appends fresh (`appendFresh`, unconditional) and can look
  baseline-shaped even though the row was never on the server. This is why
  resurrection (`remove`/`update` → `add`, or vice versa) is always
  resolved against the actual `baseline` map (`resolveOpAgainstBaseline`),
  never against what the existing entry's op claims.
- **No baseline supplied → conservative fallback to `"update"`.**
  `resolveOpAgainstBaseline(rowId, baseline)`: `undefined` baseline always
  resolves to `"update"`, because a wrong `update` fails loudly (404/400)
  while a wrong `add` would silently duplicate a clinical record — "data
  corruption, the worse failure" (comment in `editLog.ts`). This exact
  fallback is what the AI assistant's baseline-blind writes rely on (see
  below).

Collapse-to-pristine (`isRevertedToBaseline`) uses **structural** equality
(`deepEqualJson`, `deepEqual.ts`), not `===`, since patches are routinely
freshly-constructed objects — a mild→moderate→mild round-trip on an
existing baseline row drops the edit from the log entirely.
`deepEqualJson` matches `JSON.stringify` semantics (key-order independent,
`undefined`-valued keys equated with absent keys, `NaN === NaN`) with two
explicit exceptions: array elements compare positionally with **no**
undefined-as-absent normalization (arrays are meaningful sequences, not
optional-keyed structs), and non-plain objects (`Date`, `Map`, `Set`,
`File`, class instances) fall back to reference equality since they
aren't JSON-safe to begin with. It does not guard against cycles — every
row here is a plain API request object, so a cycle is meant to be a loud
caller bug.

`dedupeEditsFirstAppearance(log)` is the defensive read-time normalizer:
collapses a log to one entry per rowId (last-write-wins on content, first
appearance wins on position), for logs that `applyEditToLog` itself would
never produce but a restored draft (whose records are validated
independently, per-record) might.

## The read path: `projectRows.ts`

`projectRows(baseline, log, { softDelete?, displayOrder? })` turns
"baseline server rows + pending edit log" into what the clinician sees.
Order of operations:

1. Walk `baseline` in server order; an `op:"remove"` edit hides the row
   outright, any other edit replaces its content wholesale (never a field
   merge), no edit means the raw baseline row.
2. Append `op:"add"` entries from `log`, in log order, after every
   baseline row — except an `add` whose rowId step 1 already emitted,
   which is skipped: a restored draft can carry an `add` recorded before
   the server row existed, and if the fresh baseline now has that id, the
   baseline row wins (with the add's patch as its content) rather than one
   rowId rendering as two rows.
3. **Only when `baseline === undefined`** (loading/errored — not
   "confirmed empty"): render unresolved `op:"update"` entries
   speculatively as `origin: "baseline"`, so they don't visually flip once
   the real baseline resolves. The source is explicit that these are
   **unresolved, not orphaned** — "orphan" is reserved for the case where
   `baseline` is a known array and the rowId is genuinely missing from it.
4. If `displayOrder` is given, stable-sort the output only — never
   `baseline` or `log` itself.

**The distinction that recurs across this whole module**: `baseline:
undefined` means "not yet known"; `baseline: []` means "server confirmed
zero rows." Passing `[]` during a real fetch silently drops a restored
draft's pending `update` (it gets treated as an orphan) — a dedicated
"BASELINE COMPLETENESS CONTRACT" regression test in `projectRows.test.ts`
pins exactly this failure mode, and `StructuredRowsOptions.baseline`'s doc
comment in `useStructuredRows.ts` states the same rule for callers.

Three companion functions consumed only by the hook:

- `findOrphanRowIds(baseline, log)` — flags edits whose op isn't `add` and
  whose rowId the (confirmed, non-`undefined`) baseline lacks. Notably
  does **not** flag the clinician's own `remove` of a row baseline still
  has (that's an intentional hard removal, not the row vanishing
  server-side) — the subtlety a naive "not in rendered rows" check would
  get wrong.
- `pruneOrphanEdits(baseline, log)` — drops exactly those rowIds; returns
  the same array reference when nothing changed (a reference-equality
  escape hatch used by the hook's effect-loop guard, see below).
- `truncateToSingletonRow(baseline, log, options)` — enforces mode:
  `"single"`'s at-most-one-row invariant by keeping only the first
  projected row's rowId. Documented as "closed by construction" — no
  shipped singleton type currently exercises the truncating branch, but
  encounter's `?toDischarge` seed landing under `SINGLETON_ROW_ID` before
  the real (server-id-keyed) baseline resolves is exactly the shape this
  guards against.

## `changes.ts` — resolving a log into a request batch

`resolveChanges(log, { softDelete?, baseline? })` → `{ creates, updates,
removes }` is the last stop before each type's own `toRequests` builds
wire bodies. It runs the log through `dedupeEditsFirstAppearance`, then
for each resolved edit:

- Drops (`continue`s past) **orphans** — `op !== "add"` and a supplied
  `baseline` map lacks the rowId — silently, from every set. This mirrors
  `projectRows`' orphan rule and exists because a `remove` naming a rowId
  that never reached the server would, with `softDelete` configured, POST
  a soft-delete body to an upsert endpoint and silently **create a
  phantom entered-in-error row**.
- Reclassifies an `add` whose rowId the baseline already has into an
  `update` — the safety net for an edit recorded as `add` while the
  baseline query was still in flight (`editLog.ts`'s `coalesceOntoAdd`
  never consults baseline, so a later same-rowId edit can leave the entry
  looking like an `add` after the baseline resolves). Flagged as "safe for
  URL-keyed endpoints (`encounter`, the only reachable case today) but a
  `toRequests` for a non-URL-keyed type must re-verify" — the reclassified
  row may lack the server `id` a genuine update carries.
- Builds a `remove`'s output row, when `softDelete` is configured, as a
  **fresh merged object** (`{ ...patch, ...softDelete.patch }`) — never an
  alias of either source.

Total and pure: never mutates its inputs, always returns fresh arrays
(though `creates`/`updates` entries alias the original patch object by
reference). When `baseline` is omitted entirely (as opposed to supplied
and empty), every edit is trusted — "a documented, conservative fallback,
not a guarantee that no orphan reaches the wire."

## `rowMutations.ts` — deciding what edit a UI action produces

Sits between `StructuredList`'s callbacks and `applyEditToLog`, pulling the
branching logic out of the hook into pure, separately-tested functions:

- `mergePatch(current, patch, normalizePatch?)` — `{ ...current, ...patch,
...normalizePatch?.(current, patch) }`. Three sequential spreads, not a
  `??` fallback: `patch` is unconditionally applied in full, and
  `normalizePatch`'s result — meant to be derived fields only — lands on
  top, adding or overriding but never suppressing the clinician's patch.
  A `normalizePatch` that returned something unexpected at a plugin/
  `unknown` boundary can only add stray fields on top; it can't erase what
  the clinician typed.
- `resolveRemoveIntent(entry, softDelete)` — if `entry.origin ===
"baseline"` and a `softDelete` descriptor is configured, produces a
  soft-delete `update` (marker merged onto current content, row stays
  visible/greyed); otherwise a hard `remove`. Gotcha: a row `projectRows`
  synthesized speculatively during its step-3 loading window also carries
  `origin: "baseline"`, so removing an unconfirmed row records a
  soft-delete `update` rather than escalating to a hard delete once the
  real baseline lands — tested end-to-end by constructing that exact
  loading-window row via `projectRows(undefined, log)` and asserting the
  outcome.
- `resolveSetRow(input)` — mode:`"single"`'s mutator: `update` against the
  existing row if one exists, otherwise `add` under `singletonRowId` built
  from `createSeed()`; throws (naming the question id) if neither a
  current row nor `createSeed` is available.
- `decideInitialEditsSeed(edits, initialEdits)` → `"seed" | "wait" |
"skip"`: `edits.length > 0` always wins (`"skip"` — a restored draft
  always wins over a seed); no `initialEdits` yet → `"wait"` (**not**
  latched — a seed needing the baseline, e.g. encounter's `?toDischarge`,
  can legitimately still be `undefined` on first render); otherwise
  `"seed"`.

## `duplicates.ts` — the add-time dedup guard

`findDuplicateCandidates(rows, duplicateKey, candidates)` → one boolean per
candidate. No `duplicateKey` configured → always `false` (medication
request omits it entirely; clinicians can add the same medication twice on
purpose). Otherwise: builds a `seen` set from existing rows'
`duplicateKey(row)`, **excluding soft-deleted rows** (re-adding a code
previously marked entered-in-error is explicitly allowed), then checks each
candidate against `seen`, adding it to `seen` immediately — so two
identical candidates in the same batch resolve `[false, true]`, catching
same-batch duplicates, not just collisions with pre-existing rows.

## `droppedRowsNotice.ts` — labeling what got silently pruned

`droppedRowLabels(droppedEdits, rowLabel)` maps the hook's `droppedEdits`
(edits `pruneOrphanEdits` removed because their baseline row vanished
server-side) into `{ rowId, label }` pairs, falling back to the raw
`rowId` when `rowLabel(...)` trims to empty. `rowLabel` is always the
_caller's_ responsibility — reusing the same "what does this row mean"
logic the editor's `StructuredList` `rowTitle` prop already implements,
rather than inventing a second derivation that could drift.

## `useStructuredRows` — the hook every editor mounts

```ts
function useStructuredRows<
  TRow extends object,
  Mode extends "list" | "single" = "list",
>(
  options: StructuredRowsOptions<TRow> & { mode?: Mode },
): StructuredRowsController<TRow, Mode>;
```

`StructuredRowsOptions<TRow>`: `questionId`, `baseline?` (see the
completeness contract above), `projectValues` (module-scope-stable
projection → `ResponseValue[]`; empty projection **must** be `[]` so an
emptied section reads as unanswered), `mode?`, `softDelete?`,
`duplicateKey?`, `displayOrder?`, `normalizePatch?`, `isEmptyRow?`,
`createSeed?`, `singletonRowId?` (defaults `SINGLETON_ROW_ID`),
`initialEdits?`, `disabled?`.

Return shape is one of two, resolved by a runtime `mode === "single"`
check cast into the conditional type — "the one unavoidable seam" between
the two:

- **`ListRowsController<TRow>`** (default): `rows: ProjectedRow<TRow>[]`,
  `addRow`, `addRows`, `updateRow`, `removeRow`, `isDuplicate`.
- **`SingleRowController<TRow>`**: `row: ProjectedRow<TRow> | undefined`,
  `setRow`, `clearRow`.
- Shared base (`StructuredRowsBase<TRow>`): `edits`, `isDirty` (derived,
  `edits.length > 0`), `droppedEdits`, `applyEdit` (the raw seam — this is
  what the AI assistant would use if it _could_ reach a mounted instance),
  `resetEdits` (clears `droppedEdits` too).

### Data flow, in order (per render / per effect)

1. `[response, updateResponse] = useQuestionResponse(questionId)`, plus
   two narrower write paths: `setProjection` (`useSetQuestionProjection`)
   and `setRowsPassively` (`useSetQuestionRowsPassively`) — both skip the
   "clear this question's showing server errors" side effect that
   `updateResponse` always performs, because they're for effects
   (background baseline refresh, orphan pruning), not user intent.
2. `edits = sanitizeStructuredEditLog(response?.edits)` — the exact same
   gate the submit path (`composeStructured.ts`) applies, so display and
   submit always start from an identical, well-formed log.
3. `rows = projectRows(baseline, edits, {softDelete, displayOrder})`,
   computed **synchronously** in `useMemo` — a keystroke paints in the
   same render.
4. `values = projectValues(rows.map(r => r.row))`, mirrored into the
   response by a **separate effect** (`setProjection`, only when
   `deepEqualJson(response?.values, values)` is false) — one render behind
   `rows`, and deliberately structural rather than ref-based, since a
   ref-based guard would either fire a redundant write every commit or
   wipe errors on the very first mount.
5. **Orphan-prune effect**: early-returns when `orphanRowIds.length === 0`
   — explicitly documented as _not_ an optimization but a guard against an
   unbounded commit→re-render→commit loop under an unmemoized `baseline`
   prop (a fresh-but-still-empty array reference every render would
   otherwise retrigger the effect forever). When it does run, it records
   the about-to-be-pruned edits into `droppedEdits` **before** calling
   `pruneOrphanEdits` (order matters — the prune destroys the only record
   of what it removed), and commits via `commitPassively` so `errorsAtom`
   is untouched.
6. **One-shot `initialEdits` seed**: gated by `decideInitialEditsSeed`,
   applied inside `queueMicrotask` behind an `alive` ref armed by its own
   effect (not a cleanup flag, which would break under StrictMode's
   synchronous mount→cleanup→mount). The deferral exists because React
   runs child effects before parent effects on mount, and this hook always
   sits below the fill session's dirty-tracking subscription
   (`useFillAutosave`) — a synchronous commit would be invisible to that
   subscription (no Draft chip, no unsaved-changes prompt).
7. Mutators (`applyEdit`, `addRow`/`addRows`, `updateRow`, `removeRow`,
   and singleton's `setRow`/`clearRow`) all fold through `applyEditToLog`
   and commit via `updateResponse` (real intent, clears shown errors).
   `resetEdits` is the one exception: it bypasses `applyEditToLog`
   entirely and commits `[]` directly (and clears `droppedEdits`).
   `addRows` batches its duplicate check into one `findDuplicateCandidates`
   call and skips the commit entirely if every candidate was rejected.

**The one documented CAVEAT, worth repeating because it's easy to trip
on**: every mutator closes over this render's `edits`. Two mutator calls
inside one event handler overwrite each other — the second `commit` wins.
`addRows` exists specifically to cover the batch-add case; anything
heterogeneous (add one row, remove another, in the same handler) needs
manual log-folding through `applyEditToLog` plus one `applyEdit` call.

## The UI layer

### `StructuredList.tsx` — the shared table/card shell

One rendering surface for "a list of editable rows with mobile/desktop
parity and shared error semantics," configured (not subclassed) via three
exported types:

- **`StructuredColumn<TRow>`** — one field definition: `key`, `header`,
  `width`, `render(context: StructuredColumnContext<TRow>) => ReactNode`,
  plus `required?`, `headerHidden?`, `mobileHidden?`, `ariaLabel?`,
  `errorFieldKeys?` (defaults to `[key]` — set this when one column binds
  errors across multiple field keys, e.g. `dose_quantity`/`dose_unit`, or
  across a variable-length nested array as medication_request's dosage
  cells do), `ownsErrorDisplay?` (opt out of the shell's automatic
  per-cell `<StructuredFieldError>` when the column renders its own),
  `className?`.
- **`StructuredColumnContext<TRow>`** — what `render` receives: `row`
  (`ProjectedRow<TRow>`), `update: (patch: Partial<TRow>) => void`,
  `disabled`, `removed` (mirrors `row.softDeleted`), plus the ARIA/error
  bundle (`ariaLabel`, `fieldId`, `describedBy`, `invalid`, `errors`,
  `controlProps: StructuredControlProps`). **Gotcha**: `update` is stable
  within a render (keyed on `[onUpdateRow, row.rowId]`) but **not** stable
  across edits, because `onUpdateRow` (typically `useStructuredRows`'s
  `updateRow`) itself changes identity every keystroke — never key a
  column's own `useCallback`/`useEffect` on `update`, or you build a
  render loop.
- **`StructuredRowAction`** — `{ key, label, icon?, onSelect, disabled?,
destructive? }` for a row's overflow-menu entries beyond the shell's
  built-in Remove (e.g. medication_request/service_request's "Add to
  template").

Mechanics worth knowing:

- **Layout differences are CSS, behavior differences are JavaScript** —
  the component contains zero `useBreakpoints` calls; only `lg:`-prefixed
  Tailwind classes switch between the desktop `role="table"` grid and the
  mobile stacked-card list. The header and every row must render exactly
  `columns.length + 1` cells (one spacer for the fixed 48px actions
  track) — a column is never skipped from the `.map()`, only its
  _content_ is hidden via `headerHidden`/`mobileHidden`, or the shared
  `--structured-cols` grid template (from `gridTemplateColumns`,
  `structuredListTracks.ts`) misaligns between header and body. The
  literal string `lg:grid-cols-[var(--structured-cols)]` must appear
  un-templated in both places for Tailwind v4's scanner to emit it.
- **A row with a bound blocking error is force-expanded and cannot be
  collapsed.** `hasError`/`unmatchedFieldKeys`/`mobileHiddenErrorColumns`
  all come from `resolveRowErrorState` (`structuredListRowState.ts`),
  which routes every decision through the one shared matcher
  (`selectStructuredFieldErrors`, `structuredFieldErrors.ts`), so "has
  error," "which keys are unmatched," and "which erroring columns are
  mobile-hidden" can never disagree. The mobile card body is
  `hidden lg:contents` while collapsed, and that hidden subtree is the
  **only** place a cell's `<StructuredFieldError role="alert">` renders —
  a blocking error trapped there would never be announced to screen
  readers and would silently hard-block Save (`useSubmitFillSession`
  aborts on any `QuestionValidationError`). That's why `hasError` disables
  the mobile toggle instead of leaving it clickable-but-inert.
- **A row-scoped error whose `field_key` no column owns renders nowhere
  by default.** This is exactly allergy/symptom/diagnosis's shared `note`
  field (`placement: "row"`, no column of its own). `unmatchedFieldKeys`
  exists to catch this and render a `lg:col-span-full` fallback block, one
  `<StructuredFieldError>` per distinct unmatched key.
- A dev-only (`import.meta.env.DEV`) effect, `auditCellAccessibleName`,
  walks the committed DOM every render and `console.error`s any
  interactive element (matching `INTERACTIVE_SELECTOR`) lacking a real
  accessible name — the loud enforcement mechanism for
  `StructuredControlProps`, since TypeScript's excess-property checking
  does not catch a dropped/misnamed hyphenated ARIA prop.
- `rowDisabled` freezes the **entire row div** (`pointer-events-none
opacity-40`), including its actions menu — there is currently no way to
  freeze fields but still let the clinician act on a disabled row (e.g. a
  restore affordance). `canRemoveRow` defaults to `!row.softDeleted`.
  Remove is always shell-owned, never something `rowActions` can
  override; the separator between custom actions and Remove is inserted
  only when both are present.

### `AddEntityControl.tsx` and `RowStatusSelect.tsx` — shared leaf primitives

Both are used by allergy, symptom, diagnosis, and medication_statement
(per their own doc comments); neither imports anything else from `core/`.

- **`AddEntityControl<TRow>`** unifies two "add a row from a ValueSet
  lookup" flows behind one component: desktop renders `ValueSetSelect` and
  commits (`onAdd`) immediately on selection; mobile renders
  `EntitySelectionDrawer` and **stages** the created row in local state
  (`renderStagedRow` lets the clinician edit it before confirming) —
  `open` is _derived_ from `staged !== null`, never independent state, so
  "a drawer is open" and "something is staged" can't disagree.
- **`RowStatusSelect<TStatus>`** wraps shadcn `Select` for a row's
  status/verification dropdown, filtering out exactly one option:
  `hiddenForNewRow` is only offered when `isExistingRecord` is true. Its
  five ARIA/id props are named key-for-key to spread `{...ctx.controlProps}`
  from `StructuredColumnContext` directly onto the real Radix trigger.
  `isExistingRecord` must be `row.origin === "baseline"` — not `!!row.id`
  — even though they coincide in every current consumer (see the `origin`
  gotcha above).

### `StructuredDroppedRowsNotice.tsx`

Renders a per-question amber `role="alert"` box listing rows dropped this
mount (via `droppedRowLabels`), or `null` if `droppedEdits.length === 0` —
safe to mount unconditionally in every editor. Deliberately a _separate_
mechanism from the pre-Resume `DraftRestoreBar` (mirrors its visual
convention on purpose, "reads as one family"): a structured row's drop can
only be detected once the question's own baseline refetches, which is
always after mount, whereas `DraftRestoreBar` can only name plain answers
known at load time.

### `StructuredFieldError.tsx` / `structuredFieldErrors.ts`

`selectStructuredFieldErrors(errors, { questionId, rowId?, rowIndex?,
fieldKeys })` is "the ONE matcher" — every other error-aware piece in this
directory (`StructuredList`'s cell wiring, `structuredListRowState.ts`,
`StructuredFieldError`) calls it rather than reimplementing matching.
Precedence, in order: `question_id` must match; a falsy `field_key`
(including `""`, matching `QuestionBlock.tsx`'s own filter) never
matches; `fieldKeys.includes(error.field_key)`; then row identity —
`error.row_id`, if present, decides the match on its own (even against a
coincidentally-matching `index`); else `error.index === rowIndex` (the
v1/server index-keyed fallback); else the query itself must be
section-level (`rowId === undefined && rowIndex === undefined`). `row_id`
strictly outranks `index` — an error carrying both never falls through to
index matching, which prevents a stale-index false positive.
`StructuredFieldError` renders `<p role="alert">` for the _first_ match
only (`error.error || error.msg || t("field_required")`, `||` not `??` —
an empty-string message still falls through) and is required reading for
why `role="alert"` matters: `QuestionBlock.tsx` filters field-bound errors
out of its own block-level list for structured types, so this is the only
place those errors get announced.

## A simple consumer: `symptom`

`model.ts` imports exactly four things from core: `resolveChanges`
(`toRequests` builds `[...creates, ...updates,
...removes.flatMap(e => e.row ? [e.row] : [])]` from it, no `baseline`
passed — trusting every edit is fine here since symptom has no cross-row
consistency concerns), and the types `BaselineRow`, `ProjectValues`,
`SoftDeleteDescriptor`. `SYMPTOM_SOFT_DELETE` (`{ patch:
{verification_status: "entered_in_error"}, isDeleted: row =>
row.verification_status === "entered_in_error" }`) is the one constant
shared between `toRequests` and the Editor's `useStructuredRows` call.
`SymptomRow` **is** `SymptomRequest` — the wire request shape doubles as
the row shape; there's no separate editor-only type.

`SymptomEditor.tsx` calls `useStructuredRows({ questionId, baseline,
projectValues, softDelete: SYMPTOM_SOFT_DELETE, duplicateKey:
symptomDuplicateKey, disabled })` — `mode` omitted, so it gets
`ListRowsController`. From the return value: `list.rows` → `StructuredList`'s
`rows`; `list.updateRow`/`list.removeRow` → `onUpdateRow`/`onRemoveRow`
directly, no wrapper; `list.droppedEdits` → `StructuredDroppedRowsNotice`.
`addControl` is an `<AddEntityControl<SymptomRow>>` whose `createRow` is
`newSymptomRow(code, encounterId)` and whose `onAdd` wraps `list.addRow`
to toast on a `"duplicate"` rejection. `list.applyEdit`, `resetEdits`,
`edits`, and `isDirty` go entirely unused by this Editor — a good
indicator of how much of the hook's surface a "simple" consumer actually
touches.

## A complex consumer: `medication_request`

Contrast: `MedicationRequestEditor` calls `useStructuredRows` with a
**smaller** option set than symptom (`questionId`, `baseline`,
`projectValues`, `softDelete`, `disabled` — no `duplicateKey`, so
`findDuplicateCandidates` always returns `false` and identical medications
can be added twice on purpose). The complexity is entirely in
columns/render props and surrounding chrome, not hook configuration:

- **Per-dosage-instruction columns.** Dose/frequency/duration/instructions
  cells set `errorFieldKeys` to arrays from `dosageInstructionFieldKeys`
  (`model.ts`), sized by `maxDosageInstructionCount(list.rows)` — the
  largest instruction count across all _currently visible_ rows, so
  adding an instruction on any row grows every column's key space in the
  same render. These columns set `ownsErrorDisplay: true` and render
  `<StructuredFieldError>` manually once per instruction index. A shared
  `useUpdateInstruction(ctx)` hook wraps `ctx.update` as the single
  mutation primitive every instruction-scoped cell routes through, so
  "add/remove instruction" and "edit slot N" can't desync on how the
  array is rebuilt — and it memoizes on `[ctx.update, ctx.row]`, citing
  `StructuredList`'s documented caveat that `ctx.update` isn't stable
  across renders.
- **`onRemoveRow` is intercepted, not wired straight through** — it sets
  `pendingRemoveRowId` and gates the real `list.removeRow` call behind a
  confirmation dialog, because an existing row flips to
  `entered_in_error` rather than vanishing, and a stray menu click
  shouldn't do that silently.
- **`rowActions` adds "Add to template"** — exactly the extensibility
  point `StructuredRowAction`'s own doc comment names.
- **Response templates and historical-record reuse** are _shared_
  (`structured/shared/responseTemplates/`), not core — but worth knowing
  core doesn't preclude a type from layering substantial extra machinery
  on top of the same `useStructuredRows`/`StructuredList` pair.
- **`resolveChanges` usage is otherwise identical to symptom's** — same
  `{creates, updates, removes}` → flat array pattern in `toRequests`. The
  complexity genuinely does not touch the shared engine's contract at
  all; it's all in what one column's `render` does with `ctx.update`.

The pairing (simplest hook config + most complex UI, vs. richer hook
config + simple UI) is the intended shape of this abstraction: `core`
carries the row-identity/edit-log/projection bookkeeping uniformly, and
each type spends its complexity budget on domain-specific rendering, not
on re-deriving row bookkeeping.

## How the AI fill-assistant integrates

The assistant's `applyStructuredEdit`
(`fill/assistant/useFillAssistantSession.ts`) does **not** call
`useStructuredRows`. It calls the same two pure primitives the hook's
mutators call — `applyEditToLog` (`editLog.ts`) and `projectRows`
(`projectRows.ts`) — directly, and writes `responsesAtom` itself via the
form store (`store.set`), bypassing `useQuestionResponse`'s setter
entirely.

This is deliberate, not an oversight, and the reasoning is spelled out in
the assistant's own comments: `useStructuredRows` is a **per-question**
hook, instantiated only while that question's editor component is
mounted, holding that question's fetched `baseline` in its own closure.
The assistant's fill-assist handle is built once per fill **session** and
must be able to write to a structured question whether or not its editor
is currently mounted or scrolled into view — there is no live
`useStructuredRows` instance to call into, and no baseline to hand it.

Consequences of writing baseline-blind (`applyEditToLog(log, edit, {})`
and `projectRows(undefined, log, {})`, both with `baseline: undefined`):

- Resurrection ambiguity (`remove`/`update` → `add`) always resolves to
  the conservative `"update"` fallback in `resolveOpAgainstBaseline` — the
  same designed-in behavior described above, not a special case for the
  assistant.
- No `isEmptyRow` filtering — that predicate lives in each type's
  `model.ts`, "out of this generic handle's reach" — so the assistant's
  display mirror can show an all-empty row a mounted editor never would.
  Documented as display-only: submit derives from `edits`, not from this
  projection.
- The assistant replicates `useQuestionResponse`'s error-clearing side
  effect by hand (`clearQuestionErrorsInState`) after every write, since
  it isn't going through that setter to get it for free.

Every write is still gated by `validateStructuredPatch` against the
type's own zod `rowSchema` (via `resolveStructuredType` /
`rowSchemaOf`, one layer up in `structured/registry.ts` — not part of
`core`) — the assistant cannot write a shape core's write path wouldn't
otherwise accept.

## Invariants and gotchas — read this before touching anything here

- **`RowEdit.patch` is always the complete row, every op, including
  `remove`.** Never assume it's partial. Never write a `toRequests` or a
  UI mutator that constructs a `RowEdit` with anything less than the full
  row.
- **`baseline: undefined` vs `baseline: []` are never interchangeable.**
  `undefined` = not yet resolved; `[]` = server confirmed zero rows.
  Getting this backwards (passing `[]` mid-fetch) silently drops a
  restored draft's pending edit and is exactly what the "BASELINE
  COMPLETENESS CONTRACT" tests in `projectRows.test.ts` guard against.
- **`ProjectedRow.origin` is not `!!row.id`.** A stripped-id historical
  re-add is `"added"` despite having existed before. `RowStatusSelect` and
  `resolveRemoveIntent` both depend on getting this right.
- **An edit's op label is not proof of server history**, because
  annihilation (`add`→`remove`) erases a rowId's history from the log.
  Any code resolving add-vs-update ambiguity must consult the actual
  `baseline` map, never trust an existing entry's `op`.
- **Every `useStructuredRows` mutator closes over the render's `edits`.**
  Two mutator calls in one event handler drop all but the last commit.
  Use `addRows` for batch adds; fold manually + one `applyEdit` for
  anything heterogeneous.
- **`ctx.update` (from `StructuredColumnContext`) is stable within a
  render but not across edits.** Never key a `useCallback`/`useEffect` on
  it directly — route through something like medication_request's
  `useUpdateInstruction` pattern (memoize on `[ctx.update, ctx.row]`) if
  you need a stable wrapper.
- **The orphan-prune effect's `orphanRowIds.length === 0` guard is not an
  optimization — it's what prevents an infinite commit loop** under an
  unmemoized `baseline` prop. Do not remove it as "dead code" without
  re-reading `useStructuredRows.orphanPrune.test.ts`'s guard case.
- **The `initialEdits` seed defers through `queueMicrotask` + an `alive`
  ref, on purpose** — a synchronous commit on mount would be invisible to
  the fill session's dirty-tracking subscription (no Draft chip, no
  unsaved-changes prompt), because React runs child effects before parent
  effects and this hook sits below `useFillAutosave` in the tree.
- **`StructuredList`'s header and body must always render
  `columns.length + 1` cells**, never fewer — `headerHidden`/
  `mobileHidden` hide _content_, not the cell itself, or the shared
  `--structured-cols` grid template misaligns.
- **A blocking error bound to a `field_key` no column declares renders
  nowhere unless you route it through the unmatched-field-key fallback** —
  this is the shared `note` field on allergy/symptom/diagnosis rows. If
  you add a row-level field with no column, make sure
  `unmatchedRowErrorFieldKeys` actually surfaces it (it does, by design,
  but a new column added later could accidentally start "claiming" that
  `field_key` via a loose `errorFieldKeys` and swallow it silently).
  Currently drifted doc comment worth fixing while in the area:
  `structuredListRowState.ts` still references a `rowHasBoundError`
  function name in one comment that was folded into
  `resolveRowErrorState`'s `hasError` field and never renamed back.
- **`truncateToSingletonRow`'s multi-row branch has no current caller** —
  it's defensive, closed-by-construction code for a scenario (a singleton
  type accumulating a second rowId, as encounter's `?toDischarge` seed
  landing before the real baseline would produce) that every shipped
  singleton type currently avoids by other means. Don't delete it as
  unreachable; it's the fix for a bug class, not dead code.
- **`resolveChanges`'s add→update reclassification only re-verified as
  safe for URL-keyed endpoints** (encounter, today's only reachable case).
  A new non-URL-keyed singleton/upsert type must re-check that the
  reclassified row's missing server `id` doesn't break its `toRequests`.
