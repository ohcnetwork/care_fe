# Questionnaire v2

Management, authoring, rendering and filling for questionnaires. Authoring
mounts at `/admin/questionnaires` and
`/facility/{id}/settings/questionnaires`; the fill experience mounts on the
encounter/patient questionnaire routes (`ConsultationRoutes.tsx`). It is
the successor to the legacy questionnaire UI in
`src/components/Questionnaire` — the legacy fill stack
(`QuestionnaireForm`, `EncounterQuestionnaire`, `QuestionInput`) is now
route-orphaned and scheduled for deletion after review; its structured
QuestionTypes components live on, adapted behind `structured/`.

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
  studio canvas and the fill page's width policy, and the fill seams
  (`validation.ts`, mode union, creation-time `initialResponses`).
  Shares the engine pieces of `renderer/` (store atoms, inputs,
  registries, sanitizer); the inputs are co-owned — they are
  host-layout-free (each control carries its own full border) and serve
  only `form/` in practice now.
- `fill/` — the fill experience mounted on the encounter/patient
  questionnaire routes (fullscreen shell, two tabs: form canvas + embedded
  clinical history). `submit/` is the errorsAtom writer: pure
  `composeBatch` (structured requests from the registry + the
  questionnaire submit POST + server-draft completion) behind
  `useSubmitQuestionnaire`, with reference_id-keyed error mapping.
  `draft/` is the local autosave layer: per-user/subject/questionnaire
  localStorage drafts (`fillDraftStore`), debounced writes with
  pagehide/unmount flush (`useFillAutosave`), and the dependency-free
  sweep module (`fillDraftCache`) that login/signOut/app-update import —
  patient data must never outlive the session, so any new session
  boundary must call `clearQuestionnaireFillDrafts()`.
- `structured/` — the one registration point for structured question
  types. `StructuredTypeDefinition` colocates component (typed adapter
  over the legacy QuestionTypes UI), context `requires`, submit-time
  `validate`, `buildRequests` and `draftPolicy`; `registry.ts` is total
  and key-correlated over `StructuredQuestionType`, so a new union member
  refuses to compile until its definition exists.
- `renderer/` — the previous paginated display shell. Its engine files
  (`store.ts`, `inputs/`, `questionTypeRegistry.tsx`,
  `sanitizeStylingClasses.ts`, `structured/registry.tsx`) are shared with
  `form/`; its shell files (`QuestionnaireRenderer`, `QuestionField`,
  `QuestionGroupCard`, `TopLevelCard`, `RendererFooter`,
  `RendererContext`, `NoteAffordance`, `StructuredQuestionSlot`) have no
  mounted consumer left — the revision page now renders through `form/` —
  and only the (equally unmounted) old builder page still imports them.
  Both go in the post-review deletion, at which point the engine files
  relocate out of `renderer/`.
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
(legacy shell), or — for the full renderer — `form/FormCanvas`
(`QuestionnaireFormRenderer` / `QuestionnaireFormCanvas`),
`form/FormContext`, `form/chrome` (the decoration seam the studio canvas
implements) and `form/types`. The store, context and registries are
internal — `form/` is the one sanctioned second consumer of `renderer/`'s
engine files, pending their relocation when the old shell is removed.

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
- enable_when resolution goes through `isQuestionEnabledInState`
  (`renderer/store.ts`) — never re-derive it from `evaluateEnableWhen`;
  the required-field pass in `form/validation.ts` consumes the same
  helper, so exactly one resolution exists.
- `styling_metadata.classes` decorates the question's outer container;
  `styling_metadata.containerClasses` lays out a group's sub-question
  container (the builder's layout presets write it). Both are applied only
  through `sanitizeStylingClasses` — never render author-supplied classes
  directly.

## Legacy imports (allowlist)

v2 may import from `src/components/Questionnaire` only: `ValueSetSelect`,
`SelectOrCreateValueset`, `data/StructuredFormData` (fixed
pseudo-questionnaires), `QuestionnaireSearch` (the fill picker state), the
`QuestionTypes/*` structured components (exclusively via
`structured/definitions/*`, whose typed adapters replaced the renderer's
old "one permitted `any`"), and `OrgSelector`. A new legacy dependency
needs a registry/allowlist entry here, not an ad-hoc reach-in.

## Adding a structured question type

1. Add the value to `STRUCTURED_QUESTION_TYPES`
   (`src/types/questionnaire/structured.ts`) — the union, the builder's
   picker and import validation derive from it.
2. Write `structured/definitions/<type>.tsx`: the input component
   (native, or a typed adapter over an existing widget), `requires`,
   optional `validate`, `buildRequests` (unique `reference_id` via
   `structuredReferenceId`), and an honest `draftPolicy` — `"serialize"`
   only when the values are pure user input that can safely round-trip
   through a local draft.
3. Register it in `structured/registry.ts` (the total record will not
   compile without it) and add the type's entry to `StructuredDataMap`
   (`structured/types.ts`) plus the `ResponseValue` variant
   (`src/types/questionnaire/form.ts`).
4. Add i18n (`structured_type__*`) and backend support.

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
