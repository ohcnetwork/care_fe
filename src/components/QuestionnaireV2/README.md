# Questionnaire v2

Management, authoring and rendering for questionnaires, mounted at
`/admin/questionnaires` and `/facility/{id}/settings/questionnaires`. It is
the successor to the legacy questionnaire management UI that used to live in
`src/components/Questionnaire` (removed). That directory still provides the
fill-flow renderer (`QuestionnaireForm`, `QuestionTypes/*`, etc.), which v2
reuses (see Legacy imports below); the renderer here currently ships
`preview` and `readonly` modes only.

## Directory map

- `manage/` — list, create, detail, versions, clone; shared form schema
  (`questionnaireFormSchema.ts`) and the save mutation
  (`useUpdateQuestionnaire.ts`).
- `builder/` — the previous question-editor shell plus the model layer the
  studio still runs on: `builderReducer.ts` is the single source of edit
  state (a `Question[]` tree + selection + dirty flag); every edit flows
  through `dispatch`. Save-time rules live in `saveValidation.ts`. The old
  page shell (`QuestionnaireBuilderPage`) is unmounted — the routes now
  mount `studio/` — and is scheduled for removal after review; the editor
  cards (type picker, options, behaviour, visibility, coding,
  sub-questions) live on as the studio's inspector internals.
- `studio/` — the WYSIWYG builder mounted at `{basePath}/:id/edit`:
  left outline, live canvas (rendered by `form/`), right inspector. May
  import from `builder/` (model + cards), `manage/` (metadata form
  pieces), `shared/` and `form/`.
- `form/` — the full renderer (`QuestionnaireFormRenderer`): the whole
  questionnaire on one scroll, live-synced per-instance store (edits merge
  into responses instead of wiping them), a chrome/decoration seam for the
  studio canvas, and the fill-mode seams (`validation.ts`, mode union).
  Reuses the engine pieces of `renderer/` (store atoms, inputs,
  registries, sanitizer) without touching them.
- `renderer/` — the previous paginated display shell. Its engine files
  (`store.ts`, `inputs/`, `questionTypeRegistry.tsx`,
  `sanitizeStylingClasses.ts`, `structured/registry.tsx`) are shared with
  `form/`; its shell files (`QuestionnaireRenderer`, `QuestionField`,
  `QuestionGroupCard`, `TopLevelCard`, `RendererFooter`,
  `RendererContext`, `NoteAffordance`, `StructuredQuestionSlot`) still
  power the detail/revision pages and are scheduled for replacement by
  `form/` after review, at which point the engine files relocate.
- `shared/` — presentation primitives and the pure tree utilities
  (`questionTree.ts`), plus `buildUpdateBody.ts` and
  `downloadQuestionnaireJson.ts`. `manage/` and `builder/` depend on
  `shared/`, never on each other.
- `queryKeys.ts` — the only place TanStack Query keys are built; keys
  constructed elsewhere silently opt out of invalidation.

## Mounting and scope

Pages never read route params. The router injects a `QuestionnaireScope`
(`src/types/questionnaire/questionnaire.ts`) — a discriminated union on
`authContext` carrying `basePath` and the ids that context requires — from
`src/Routers/routes/adminRoutes.tsx` and
`src/pages/Facility/settings/layout.tsx`. Mutation surfaces gate on
`useCanWriteQuestionnaire(scope)`.

## Renderer

Public surface: import `QuestionnaireRenderer` and `renderer/types` only
(legacy shell), or `form/FormCanvas` (`QuestionnaireFormRenderer` /
`QuestionnaireFormCanvas`), `form/FormContext` and `form/types` for the
full renderer. The store, context and registries are internal — `form/` is
the one sanctioned second consumer of `renderer/`'s engine files, pending
their relocation when the old shell is removed.

`QuestionnaireRendererProvider` creates one jotai store per instance,
seeded at creation (never observed empty) and re-seeded only when the
questionnaire identity changes. React context carries the immutable mount
config (mode/subject/questionnaire identity); the atoms are the reactive
copy selectors read. `responsesAtom` is local-only and `errorsAtom` has no
writer until the fill/submit path lands (see the header of `store.ts`).

Updates are full-body PUTs composed by `shared/buildUpdateBody.ts` from the
cached detail entry — `useUpdateQuestionnaire` writes `setQueryData` before
invalidating so the next save never composes from a stale cache. JSON
export (`downloadQuestionnaireJson`) serializes only definition fields;
audit/user fields (`created_by`, `updated_by`, …) must never appear in an
export file.

## Frozen contracts — do not "fix"

- `evaluateEnableWhen` (`renderer/store.ts`) is a behavior-exact port of the
  legacy `QuestionGroup.isQuestionEnabled`: unanswered dependency → false
  for every operator; comparison runs over ALL of the dependent question's
  values; `normalizeValue` (booleans → "Yes"/"No", numbers → strings) is
  applied unconditionally before any operator. The only deliberate addition:
  literal-boolean condition _answers_ (legacy-corrupt data that could never
  match) pass through the same normalization in equals/not_equals; string
  answers compare byte-identically to the legacy port.
- Boolean enable_when conditions persist the strings `"Yes"`/`"No"`, never
  JSON booleans (`normalizeBooleanConditionAnswer` in `builderReducer.ts`;
  builder load migrates legacy true/false via
  `migrateLegacyBooleanEnableWhen`).
- `styling_metadata.classes` decorates the question's outer container;
  `styling_metadata.containerClasses` lays out a group's sub-question
  container (the builder's layout presets write it). Both are applied only
  through `sanitizeStylingClasses` — never render author-supplied classes
  directly.

## Legacy imports (allowlist)

v2 may import from `src/components/Questionnaire` only: `ValueSetSelect`,
`SelectOrCreateValueset`, `data/StructuredFormData`, the
`QuestionTypes/*` structured components (exclusively via
`renderer/structured/registry.tsx`, which also owns the one permitted `any`
in the renderer), and `OrgSelector`. A new legacy dependency needs a
registry/allowlist entry here, not an ad-hoc reach-in.

## Adding a question type

1. Add the value to `QUESTION_TYPES` and `SUPPORTED_QUESTION_TYPES`
   (`src/types/questionnaire/question.ts`) — the type union, the builder's
   picker and import validation derive from them.
2. Give the type an icon in `shared/questionTypeIcons.ts`
   (`QUESTION_TYPE_ICONS` is a total record — it will not compile without
   one). The picker's tiles and the tree nav's row icons both render it.
3. Implement a renderer input (`renderer/inputs/`) implementing
   `RendererInputProps`; read the response via a discriminant check on
   `values[valueIndex ?? 0].type` (no casts), write positionally through
   `withEntryAt` when `valueIndex` is set (repeats renders one input per
   entry), and register it in `questionTypeRegistry.tsx`. Structured
   sub-types register in `structured/registry.tsx` instead.
4. Add i18n keys (`question_type__*`, description) to
   `public/locale/en.json`.

## Backend gaps (tracked, not worked around silently)

- `AnswerOption` spec has no `display`/`coding` fields — the v2 builder
  therefore does not offer option display text (the column was dropped
  deliberately). The renderer keeps its `option.display ?? option.value`
  fallback for legacy data that still carries a display value.
- `QuestionnaireReadSpec` lacks `modified_date`/`created_date`; the
  Versions tab shows attribution without chronology until they land.
- Revision listing has no "all" page size; the Versions tab requests
  `limit: 100` and surfaces any overflow.
- The read endpoint can return `version` as a bare number; writers coerce
  through `String()` (type-required via `QuestionnaireRead.version`).

## Tests

Playwright: `tests/facility/settings/questionnaires/` and
`tests/admin/questionnaires/` (shared helpers in
`tests/helper/questionnaireV2.ts`).
