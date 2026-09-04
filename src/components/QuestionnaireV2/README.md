# Questionnaire v2

Management, authoring, rendering and filling for questionnaires. Authoring
mounts at `/admin/questionnaires` and
`/facility/{id}/settings/questionnaires`; the fill experience mounts on the
encounter/patient questionnaire routes (`ConsultationRoutes.tsx`). It
replaced the legacy questionnaire UI in `src/components/Questionnaire`:
the legacy fill stack (`QuestionnaireForm`, `EncounterQuestionnaire`,
`QuestionRenderer`, `QuestionInput` and the simple input components) is
deleted. What survives there is the allowlist below — chiefly the
structured `QuestionTypes/*` components, adapted behind `structured/`.

There is exactly ONE renderer (`form/`) and one engine
(`form/engine/`). If you find yourself writing a second display path for
questions, that is the bug.

## Directory map

- `manage/` — list, create, detail, versions, clone; shared form schema
  (`questionnaireFormSchema.ts`) and the save mutation
  (`useUpdateQuestionnaire.ts`).
- `builder/` — the edit model the studio runs on: `builderReducer.ts` is
  the single source of edit state (a `Question[]` tree + selection + dirty
  flag); every edit flows through `dispatch`. Save-time rules live in
  `saveValidation.ts`. The editor cards (type picker, options, behaviour,
  visibility, coding, sub-questions) are the studio's inspector internals;
  the old page shell is gone (the routes mount `studio/`).
- `studio/` — the WYSIWYG builder mounted at `{basePath}/:id/edit`:
  left outline, live canvas (rendered by `form/`), right inspector. May
  import from `builder/` (model + cards), `manage/` (metadata form
  pieces), `shared/` and `form/`.
- `form/` — the renderer (`QuestionnaireFormRenderer`): the whole
  questionnaire on one scroll, live-synced per-instance store (edits merge
  into responses instead of wiping them), a chrome/decoration seam for the
  studio canvas and the fill page's width policy, and the fill seams
  (`validation.ts`, mode union, creation-time `initialResponses`).
  - `form/engine/` — the headless half every host shares: the jotai store
    and enable_when resolution (`store.ts`), the type→component map
    (`questionTypeRegistry.tsx`), the inputs (`inputs/`, host-layout-free
    — each control carries its own full border), the class sanitizer
    (`sanitizeStylingClasses.ts`) and `RendererSubject` (`types.ts`).
    Nothing here renders layout; `form/` and `fill/` are its consumers.
- `fill/` — the fill experience mounted on the encounter/patient/resource
  questionnaire routes (fullscreen shell, two tabs: form canvas + embedded
  clinical history). The outline is an OVERLAY, not a column
  (`FillOutlineOverlay`): a slim tick rail on the canvas' left edge opens
  the panel over the full-width canvas on hover/focus/click; scroll-spy
  (`useFillOutlineNav`) tracks the block topping the viewport. Each form
  portals its rows (`FillOutline`) and ticks (`FillOutlineRail`) into the
  overlay's hosts — they must render inside that form's provider. What it
  is filling FOR is `subject.ts`'s `FillSubject`
  union (encounter/patient/location/device…); `rendererSubjectOf` flattens
  it into the engine's `RendererSubject` and `subjectKeyOf` scopes drafts.
  A session may hold SEVERAL questionnaires: the route-mounted one plus any
  added to the same submission. Each is a `FillFormEntry`
  (`formSession.ts`) rendered by `FillFormSection` with its own
  provider/store, handed up to the host by `StoreRegistrar` — the
  host↔engine surface is that one callback. `submit/` is the errorsAtom
  writer: pure `composeBatch` (structured requests from the registry + the
  questionnaire submit POST + server-draft completion) run per form into
  ONE batch behind `useSubmitFillSession`, with reference_id-keyed error
  mapping routed back to the owning form's store. `draft/` is the local
  autosave layer: one localStorage entry per user/subject/entry
  questionnaire covering every form of the session (`fillDraftCore` holds
  the registry-free decision logic — load/save gates, the merge and the
  dirty signature — behind `fillDraftStore`, which wires
  `resolveStructuredType` in; keep it that way so the gates stay testable
  under `node --test`; schema v2), debounced writes with pagehide/unmount flush
  (`useFillSessionAutosave`), and the dependency-free sweep module
  (`fillDraftCache`) that the auth provider and the app-update path
  import — an OTHER user's login clears every OTHER-user draft
  (`clearOtherUsersFillDrafts`, keyed off the just-authenticated user's id;
  the same user's own draft survives re-login on purpose), signOut and an
  app update clear everything (`clearQuestionnaireFillDrafts`), and expired
  drafts are swept at boot regardless of auth outcome
  (`sweepExpiredFillDrafts`) — a new session boundary must join this list.
  Two kinds of draft coexist
  and must not be confused: that local one is the crash safety net, while
  `useSaveServerDraft` is the deliberate "Save as draft" — a
  `form_submission` record (feature flag `enableQuestionnaireDraft`,
  ENCOUNTER-subject + single-form + structured-free) that ends the
  session, survives the device, and is what the encounter overview's
  drafts card lists and `?continue_draft=` resumes. Encounter-only is a
  deliberate narrowing, not a straight port: that card is the sole listing
  of server drafts and it filters `form_submission` by `encounter`, so a
  patient-mount draft — which legacy did allow — POSTs without one and
  becomes an unreachable orphan.
- `structured/` — the one registration point for structured question
  types. `StructuredTypeDefinition` colocates component (typed adapter
  over the legacy QuestionTypes UI), context `requires`, submit-time
  `validate`, `buildRequests` and `draftPolicy`; `registry.ts` is total
  and key-correlated over `StructuredQuestionType`, so a new union member
  refuses to compile until its definition exists.
- `shared/` — presentation primitives and the pure tree utilities
  (`questionTree.ts`), plus `buildUpdateBody.ts` and
  `downloadQuestionnaireJson.ts`. `manage/` and `builder/` depend on
  `shared/`, never on each other.
- `queryKeys.ts` — the only place TanStack Query keys are built; keys
  constructed elsewhere silently opt out of invalidation.

## Actions (submit-time automations)

A questionnaire carries `actions` — rules the backend evaluates when a
patient/encounter questionnaire is submitted (`POST …/submit/`): each is a
`condition` (a Python-subset expression run by `evalidate`) over the cleaned
answers (`q_<link_id>`) and registry context values (`patient["age"]`),
plus `instructions` (`{slug, params, context}`) executed when it holds.
Resource-subject questionnaires (location/device/facility) never run them.

- Types and routes: `src/types/questionnaire/actions.ts`,
  `actionApi.ts` (`action_configuration/instructions|fields`), keys in
  `queryKeys.ts` (`actionRegistryKeys`). `normalizeQuestionnaireActions`
  is the wire-shape guard every read goes through.
- `shared/actionExpression.ts` — the one bridge between the editor and the
  stored strings: `compileCondition`/`parseCondition` for the canonical
  rule subset (`ref OP literal` joined by one connective; anything else is
  a "custom expression" edited as text), message templates
  (`{answer}` tokens ↔ `{{ f"…" }}`), `lintExpression`, reference
  extraction and the clone remap. Node-tested; keep it free of component
  imports.
- `builder/actionVariables.ts` — what a rule may reference and how each
  answer compares (see the value-shape notes in the file: quantities are
  `{value,…}` records, valueset choices compare by `coding.code`,
  repeating-group children are not top-level names).
  `builder/actionValidation.ts` — the save rules; `builder/actions/` — the
  editors: `ActionListEditor` (the cards, shared with the admin action
  configurations under `src/pages/Admin/actions/`), the condition and
  instruction editors, `useActionRegistry`, and the plain-words summary.
- `studio/ActionsPanel.tsx` — the inspector target the outline's Actions
  row selects: `ActionListEditor` over the builder reducer.
- Fill side: `fill/submit/validateActionReferences.ts` blocks a submission
  whose action references a visible unanswered question (the backend would
  500 and roll the batch back). What the actions reported (`_actions` on
  the submit results) is toasted by the mutation cache like every other
  write — `src/Utils/actions/` holds the collector, the presenter and the
  instruction labels; nothing in `fill/` handles outcomes.

Instruction params may carry backend hints (`json_schema_extra`):
`x-care-picker: tag_config` with `x-care-resource` renders a tag picker
(`builder/actions/TagConfigParamPicker.tsx`) scoped to the studio mount's
facility; pydantic Enum params (`$ref` into `$defs`) render as a select.
The catalog the studio labels (`src/Utils/actions/instructionLabels.ts`) —
`show_message`, `set_encounter_priority`, `tag_encounter`, `tag_patient`,
plus the Patient/Encounter context fields — lives on the care branch
`bodhi/ENG-737-actions-catalog` (stacked on ENG-737); anything the
registry serves beyond that still works, labelled by its humanized slug.

Backend gaps the UI works around (ENG-737 as of 2026-09-03): an unanswered
`q_` reference raises at submit (500, whole batch rolled back); condition
syntax and instruction params are not validated at save time; the registry
lists fields twice; the questionnaire create/update hooks require `actions`
to be present (the FE always sends it, `[]` at minimum). Without the
catalog branch the only instruction is the `logging` smoke test and
`PatientQuestionnaire` registers no context fields.

## Mounting and scope

Pages never read route params. The router injects a `QuestionnaireScope`
(`src/types/questionnaire/questionnaire.ts`) — a discriminated union on
`authContext` carrying `basePath` and the ids that context requires — from
`src/Routers/routes/adminRoutes.tsx` and
`src/pages/Facility/settings/layout.tsx`. Mutation surfaces gate on
`useCanWriteQuestionnaire(scope)`.

## Renderer

Public surface: `form/FormCanvas` (`QuestionnaireFormRenderer` /
`QuestionnaireFormCanvas`), `form/FormContext` (the provider plus the
live-store hooks it re-exports), `form/chrome` (the decoration seam the
studio canvas implements) and `form/types`. `form/engine/` is internal:
hosts outside `form/` and `fill/` must not reach into the store or the
registries — if you need something from them, re-export it through
`form/FormContext` so the surface stays one module wide.

`QuestionnaireFormProvider` creates one jotai store per instance, seeded
at creation (never observed empty, `initialResponses` applied there) and
live-merged — not re-seeded — when the questionnaire identity changes, so
in-progress answers survive an edit in the studio. React context carries
the immutable mount config (mode/subject/questionnaire); the atoms are the
reactive copy selectors read. `errorsAtom`'s only writer is
`fill/submit/` (see the header of `form/engine/store.ts`).

Updates are full-body PUTs composed by `shared/buildUpdateBody.ts` from the
cached detail entry — `useUpdateQuestionnaire` writes `setQueryData` before
invalidating so the next save never composes from a stale cache. JSON
export (`downloadQuestionnaireJson`) serializes only definition fields;
audit/user fields (`created_by`, `updated_by`, …) must never appear in an
export file.

## Frozen contracts — do not "fix"

- `evaluateEnableWhen` (`form/engine/store.ts`) is a behavior-exact port
  of the legacy `QuestionGroup.isQuestionEnabled`: unanswered dependency → false
  for every operator EXCEPT `exists`, which — to match the backend — evaluates
  before that short-circuit and honors `answer: false` (an `exists:false`
  dependent must enable precisely when the controller has no value; this is
  a deliberate divergence from the legacy port, not a bug); comparison runs
  over ALL of the dependent question's values; `normalizeValue` (booleans →
  "Yes"/"No", numbers → strings) is applied unconditionally before any
  operator other than `exists`, which reads raw values directly. The only
  other deliberate addition: literal-boolean condition _answers_
  (legacy-corrupt data that could never match) pass through the same
  normalization in equals/not_equals; string answers compare byte-identically
  to the legacy port.
- A boolean question's enable_when answer persists in one of two shapes,
  chosen by the OPERATOR. Every write goes through `buildCondition`
  (`builderReducer.ts`), and builder load repairs legacy data in both
  directions (`migrateLegacyBooleanEnableWhen`) keyed off the target
  question's type, so a string question that legitimately compares to
  `"true"` is left alone.
  - `equals`/`not_equals` persist the strings `"Yes"`/`"No"`, never JSON
    booleans (`normalizeBooleanConditionAnswer`) — the renderer normalizes
    recorded boolean values to those same strings before comparing, so a
    stored `true` could never match anything.
  - `exists` persists a literal JSON boolean, never `"Yes"`/`"No"`
    (`normalizeExistsConditionAnswer`) — only `answer === false` inverts the
    has-a-value test in `evaluateEnableWhen`, and the backend agrees, so a
    `"No"` string would read as `exists: true`, the exact opposite of what
    the author picked.
- enable_when resolution goes through `isQuestionEnabledInState`
  (`form/engine/store.ts`) — never re-derive it from `evaluateEnableWhen`;
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
`QuestionTypes/*` structured components — exclusively via
`structured/definitions/*`, whose typed adapters replaced the renderer's
old "one permitted `any`" — and `OrgSelector`. Everything else in that
directory (`FieldError`, `EntitySelectionDrawer`,
`ValueSetSearchContent`, the response-template sheets) exists only because
those structured components use it; nothing in v2 may import it directly.
A new legacy dependency needs an allowlist entry here, not an ad-hoc
reach-in.

## Adding a structured question type

1. Add the value to `STRUCTURED_QUESTION_TYPES`
   (`src/types/questionnaire/structured.ts`) — the union, the builder's
   picker and import validation derive from it.
2. Write `structured/definitions/<type>.tsx`: the input component
   (native, or a typed adapter over an existing widget), `requires`,
   `subjects` (which questionnaire subject types may carry it), optional
   `validate`, `buildRequests` (unique `reference_id` via
   `structuredReferenceId`), and an honest `draftPolicy` — `"serialize"`
   only when the values are pure user input that can safely round-trip
   through a local draft.
3. Register it in `structured/registry.ts` (the total record will not
   compile without it) and add the type's entry to `StructuredDataMap`
   (`structured/types.ts`) plus the `ResponseValue` variant
   (`src/types/questionnaire/form.ts`).
4. Add i18n (`structured_type__*`) and backend support.

Plugins contribute types the same way but at runtime: a manifest's
`structuredQuestionTypes` (`PluginStructuredTypeDefinition`,
`structured/pluginRegistry.ts`) are registered by `PluginEngine`, and reach
the picker, preview, fill, validation and submit through the one resolver
— `resolveStructuredType`. Their ids MUST be namespaced
`{plugin_slug}.{type_name}` (bare names are core's), and the `{plugin_slug}`
half must be the registering plugin's OWN slug — both are enforced at
registration, a malformed id by throwing and a foreign namespace by
logging and skipping that one definition. Their labels are plain manifest
strings (plugins own their
i18n), and their entries are opaque to the host (`unknown[]`) — the
plugin's own component, `validate` and `buildRequests` are the only code
that reads them. A questionnaire referencing a type this deployment
doesn't have degrades instead of breaking: fill shows a "requires a
plugin" notice, compose skips it, validation blocks only when the question
is required, drafts exclude it (and say so), and the studio refuses to
save it.

## Adding a question type

1. Add the value to `QUESTION_TYPES` and `SUPPORTED_QUESTION_TYPES`
   (`src/types/questionnaire/question.ts`) — the type union, the builder's
   picker and import validation derive from them.
2. Give the type an icon in `shared/questionTypeIcons.ts`
   (`QUESTION_TYPE_ICONS` is a total record — it will not compile without
   one). The picker's tiles and the tree nav's row icons both render it.
3. Implement an engine input (`form/engine/inputs/`) implementing
   `RendererInputProps`; read the response via a discriminant check on
   `values[valueIndex ?? 0].type` (no casts), write positionally through
   `withEntryAt` when `valueIndex` is set (repeats renders one input per
   entry), and register it in `form/engine/questionTypeRegistry.tsx`.
   Structured sub-types register in `structured/registry.ts` instead.
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

Playwright — authoring: `tests/facility/settings/questionnaires/` and
`tests/admin/questionnaires/`. Fill:
`tests/facility/patient/encounter/fill/` (page, validation, autosave,
multi-form, server drafts, outline overlay),
`tests/facility/patient/encounter/structuredQuestions/`, and
`tests/facility/{location,device}Questionnaire.spec.ts` for the
resource-subject mounts. Shared helpers: `tests/helper/questionnaireV2.ts`.
