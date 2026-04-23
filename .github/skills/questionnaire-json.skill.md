---
name: questionnaire-json
description: >
  Generate valid CARE Questionnaire JSON (importable via care_fe) from a
  short spec or via a guided step-by-step interview. Handles schema,
  enable_when, structured questions, and SNOMED/LOINC/UCUM coding via
  Snowstorm.
when_to_use: >
  User asks to "generate a questionnaire", "build a form", "create
  questionnaire JSON", or wants help authoring/importing a CARE
  questionnaire.
---

# CARE Questionnaire JSON Generation

---
applyTo:
  - "src/components/Questionnaire/**"
  - "src/types/questionnaire/**"
  - "**/*.questionnaire.json"
description: >
  Generate valid CARE Questionnaire JSON that can be imported into care_fe via
  the questionnaire import flow. Covers schema, question types, enable_when,
  structured questions, choice/quantity coding (SNOMED CT, LOINC, UCUM via
  Snowstorm / FHIR R4 valuesets), and two authoring flows (one-shot + guided).
---

# CARE Questionnaire JSON Generation

You are an authoring assistant for **CARE questionnaires**. Your job is to
produce JSON that the CARE backend (`care`) accepts via `QuestionnaireSpec` /
`QuestionnaireWriteSpec` and that the CARE frontend (`care_fe`) can import
through its questionnaire import UI.

You MUST follow the schema, validation rules, and coding conventions in this
document. When in doubt, ask — never invent codes, valueset slugs, or
structured types.

---

## 1. Top‑level schema (must match `QuestionnaireWriteSpec`)

```jsonc
{
  "version": "1.0",                 // string, defaults to "1.0", frozen
  "slug": "questionnaire",          // optional; kebab-case; 5–25 characters; must be unique on the server
  "title": "Human readable title",  // required, non‑empty after trim
  "description": "",                // optional
  "type": "custom",                 // keep as "custom" unless told otherwise
  "status": "draft",                // "active" | "retired" | "draft"
  "subject_type": "encounter",      // "patient" | "encounter"
  "styling_metadata": {},           // free dict, see §6
  "questions": [ /* Question[] */ ],
  "tags": [],                       // optional list of tag UUIDs
  "organizations": []               // required on create via API; OMIT for
                                    // import-only JSON unless the user gives
                                    // explicit organization UUIDs
}
```

Rules enforced by the backend (`care/emr/resources/questionnaire/spec.py`):

- **All `link_id` values across the whole tree must be unique.**
- **All `id` (UUID) values across the whole tree must be unique.**
- `title` cannot be empty.
- `slug` must be unique and cannot shadow internal questionnaire slugs.
- `slug` must be at least **5 characters** and at most **25 characters**.
- `status` must be one of `active`, `retired`, `draft`.
- `subject_type` must be `patient` or `encounter`.

Generate UUID v4 for every `id`. Always emit a deterministic, human‑friendly
`link_id` (e.g. `"1"`, `"1.1"`, `"1.1.2"` for nested groups; or
`"vitals.bp.systolic"` for semantic ids). Never reuse a `link_id`.

---

## 2. Question schema

```jsonc
{
  "id": "uuid-v4",                  // required, unique
  "link_id": "1.1",                 // required, unique, human-readable
  "text": "Question text",          // required
  "description": "Helper text",     // optional
  "type": "<QuestionType>",         // see §3
  "code": { /* Coding */ },         // optional, observation code (SNOMED/LOINC)
  "structured_type": null,          // required iff type == "structured", §5
  "enable_when": [ /* ... */ ],     // optional, see §4
  "enable_behavior": "all",         // "all" | "any"
  "disabled_display": "hidden",     // "hidden" | "protected"
  "required": false,
  "repeats": false,
  "read_only": false,
  "max_length": null,               // integer, only meaningful for text/string
  "answer_constraint": null,        // "required" | "optional"
  "answer_option": [ /* ... */ ],   // REQUIRED for choice (display strings) AND
                                    // quantity (UCUM unit code strings, e.g. ["/min"])
                                    // unless answer_value_set is used
  "answer_value_set": null,         // valueset slug; mutually exclusive-ish
                                    // with answer_option
  "answer_unit": { /* Coding */ },  // optional default unit (UCUM)
  "unit": { /* Coding */ },         // for quantity (UCUM); decorative display hint
  "is_observation": false,
  "is_component": false,            // groups only — see §6
  "collect_time": false,
  "collect_performer": false,
  "collect_body_site": false,
  "collect_method": false,
  "formula": null,
  "styling_metadata": {},
  "templates": [],
  "questions": []                   // for type == "group"
}
```

Conditional rules:

- `type: "group"` **must** have a non‑empty `questions` array.
- `type: "choice"` **must** have either `answer_option` (list of `{"value": "<string>"}` objects)
  **or** `answer_value_set` (valueset slug).
- `type: "quantity"` **must** have either `answer_option` (list of `{"value": "<ucum-code>"}` objects,
  one per valid unit, e.g. `[{"value": "/min"}]`) **or** `answer_value_set`.
  The `unit` field is still required as the display/default coding, but `answer_option` is
  **separately required by the backend validator** (`spec.py` line 176).
- `type: "structured"` **must** have a valid `structured_type` (see §5).
  Structured questions ignore most other properties (no `code`, no
  `answer_*`, no children).
- `type: "display"` is render‑only — no answer captured.
- `max_length` only applies to `string` / `text` / `url`.
- `repeats: true` on a group turns it into a repeating sub‑form
  (`sub_results` at submission time).

### Allowed `type` values

`group`, `display`, `boolean`, `decimal`, `integer`, `date`, `dateTime`,
`time`, `string`, `text`, `url`, `choice`, `quantity`, `structured`.

> ⚠️ Note: it is `dateTime` (camelCase), matching `QuestionType.datetime = "dateTime"` in the backend.

---

## 3. Choosing a question type

| User intent | Use |
|---|---|
| Yes/No | `boolean` |
| Whole number (count, score) | `integer` |
| Number with decimals (no unit) | `decimal` |
| Measured value with a fixed unit (vitals, lab values…) | `decimal` or `integer` + `code` (LOINC) — **preferred, see §3a** |
| Measured value where user must pick from multiple units | `quantity` + `unit` + `answer_option` — **only when explicitly requested** |
| Single/multi‑select from a fixed list | `choice` + `answer_option` |
| Single/multi‑select from a clinical valueset | `choice` + `answer_value_set` |
| Calendar date only | `date` |
| Date and time with timezone | `dateTime` |
| Time of day | `time` |
| Short free text | `string` (set `max_length`) |
| Long narrative | `text` |
| Hyperlink | `url` |
| Section header / instruction | `display` |
| Container with sub‑questions | `group` |
| Domain workflow (allergies, meds, …) | `structured` (see §5) |

Set `is_observation: true` and provide a `code` (**LOINC preferred**, SNOMED CT as fallback) for any
question whose answer should be persisted as an FHIR Observation. Without a
`code`, the answer is stored only on the QuestionnaireResponse, not as an
Observation.

---

## 3a. `decimal`/`integer` + LOINC `code` — the preferred pattern for vitals

**Always use this pattern by default for any measured clinical value (HR, BP, temperature, SpO2,
weight, height, etc.) unless the user explicitly asks for `quantity`.**

### Why not `quantity` by default?

The `QuantityQuestion` component in `care_fe` (src/components/Questionnaire/QuestionTypes/QuantityQuestion.tsx)
renders an open **Unit search dropdown** (`system-ucum-units`) regardless of `answer_option` —
because `answer_option` is read only by the backend validator, not by the frontend component.
This produces confusing UX: a clinician entering heart rate must first search for `/min` in a
UCUM searchbox before they can submit.

`decimal`/`integer` renders a plain number input with no unit picker — clean and fast for
clinicians. The LOINC `code` still ensures the answer is stored as a typed FHIR Observation
with the correct semantic, and the `unit` field on the question is stored as metadata on the
Observation definition. The `value_type` is `"decimal"`/`"integer"` rather than `"quantity"`,
which is an acceptable tradeoff for most clinical workflows in CARE and is the established
pattern used across existing CARE questionnaire fixtures.

### Pattern example (heart rate)

```json
{
  "id": "…uuid…",
  "link_id": "1.1",
  "text": "Heart Rate (/min)",
  "type": "decimal",
  "is_observation": true,
  "code": { "system": "http://loinc.org", "code": "8867-4", "display": "Heart rate" }
}
```

Note: include the unit in the question `text` as a parenthetical (e.g. `"Heart Rate (/min)"`) so
the clinician always knows the expected unit without a dropdown.

### When to use `quantity` instead

Only use `quantity` when the user **explicitly requests it**, or when the measurement genuinely
needs the user to choose between multiple units at entry time (e.g. weight in kg vs lb).

---

## 4. `enable_when` (conditional logic)

```jsonc
"enable_when": [
  { "question": "<link_id_of_other_question>",
    "operator": "equals",       // exists | equals | not_equals
                                // greater | less | greater_or_equals | less_or_equals
    "answer": "yes" }           // type must match the referenced question
],
"enable_behavior": "all"        // "all" (AND) | "any" (OR)
```

Operator/type matrix:

- **boolean**: `exists`, `equals`, `not_equals` — `answer` is `true|false`.
- **string / choice**: `equals`, `not_equals` — `answer` is string.
- **integer / decimal / quantity**: `greater`, `less`,
  `greater_or_equals`, `less_or_equals`, `equals`, `not_equals` —
  `answer` is numeric.

Important: `question` references another question's **`link_id`**, not its
UUID. Backend will reject answers to a question whose `enable_when` evaluates
to false ("`enable_when_failed`"). Use `disabled_display: "hidden"` to hide,
or `"protected"` to show as read‑only.

---

## 5. Structured questions

Set `type: "structured"` and `structured_type` to one of:

`allergy_intolerance`, `medication_request`, `medication_statement`,
`symptom`, `diagnosis`, `encounter`, `appointment`, `time_of_death`,
`files`, `charge_item`.

Structured questions render a dedicated UI in `care_fe` and submit a
domain‑specific payload — do **not** add `code`, `answer_option`, `unit`,
or child `questions`. Example:

```json
{
  "id": "…uuid…",
  "link_id": "diagnosis",
  "text": "Diagnosis",
  "type": "structured",
  "structured_type": "diagnosis"
}
```

---

## 6. Styling, components, repeats

- `styling_metadata.containerClasses` is rendered as Tailwind classes on a
  group container. Common patterns from existing fixtures:
  - `"grid grid-cols-2"` — two‑column layout
  - `"grid grid-cols-1"` — stacked
  - `"grid-2-col"` — legacy alias also seen in fixtures
- `is_component: true` on a `group` turns its leaf questions into Observation
  **components** of a single parent Observation (used for vitals like BP
  systolic/diastolic). Only valid on groups whose children all have `code`.
- `repeats: true` on a `group` lets the user add multiple instances at submit
  time (responses come back as `sub_results`).

---

## 7. Coding: SNOMED CT, LOINC, and UCUM

CARE binds codes through **valuesets resolved by Snowstorm / FHIR R4**.

- **Observation codes** (`Question.code`) must come from
  `CARE_OBSERVATION_VALUSET` — typically SNOMED CT (`http://snomed.info/sct`)
  or LOINC (`http://loinc.org`).
- **Units** (`Question.unit`, `Question.answer_unit`) must come from
  `CARE_UCUM_UNITS` — system `http://unitsofmeasure.org`.
- **`answer_value_set`** must be a slug of a valueset that exists on the
  CARE server (the backend validates this with
  `ValueSet.objects.filter(slug=slug).exists()`). **Never invent slugs.**
  Common ones to ask the user about: `system-allergy-code`, `system-condition-code`,
  `system-symptom-code`, `system-body-site`, etc. If unsure, ask.

### Coding shape

```jsonc
"code": {
  "system": "http://loinc.org",        // PREFERRED for observations/vitals
  "code":   "8867-4",
  "display": "Heart rate"
}
// SNOMED CT (http://snomed.info/sct) only as fallback when no LOINC code exists
```

### Looking up codes

You may query the project's Snowstorm server to validate or discover codes:

- Base: `http://165.22.211.144/fhir`
- List code systems: `GET /CodeSystem`
- Lookup: `GET /CodeSystem/$lookup?system=<system>&code=<code>`
- Search SNOMED: `GET /ValueSet/$expand?url=<valueset-url>&filter=<term>&count=20`
- Search LOINC: `GET /ValueSet/$expand?url=http://loinc.org/vs&filter=<term>`
- Search UCUM units: `GET /CodeSystem/$lookup?system=http://unitsofmeasure.org&code=<ucum>`

**Rules:**

1. If the user gives you the code → use it verbatim, but verify it via
   `$lookup` and copy the canonical `display` from the response.
2. If the user gives you a term (e.g. "heart rate") → query Snowstorm,
   show the top 3–5 candidates with system+code+display, and let them
   pick before writing JSON.
3. If you cannot reach Snowstorm, **do not fabricate a code**. Emit the
   question without `code`/`unit`, mark it with a TODO comment in the
   surrounding chat message, and ask the user to fill it in.
4. For UCUM, common safe values: `mm[Hg]`, `/min`, `kg`, `cm`, `Cel`,
   `%`, `mg/dL`, `mmol/L`, `L/min`. Always confirm with `$lookup`.

---

## 8. Two authoring flows

You MUST detect which flow the user wants. If unclear, ask once:
> "Do you want a **one‑shot** generation (give me the spec, I produce the JSON)
> or a **guided step‑by‑step** session (I'll ask field by field)?"

### Flow A — One‑shot generation

Trigger phrases: *"generate a questionnaire with…"*, *"give me JSON for…"*,
*"I want N questions of types …"*.

Procedure:

1. Parse the user's spec (title, subject type, list of questions/types, any
   nesting, any required codes/units).
2. For every `choice`/coded question, resolve codes per §7.
   If you must skip code resolution, list the skipped items at the end.
3. Emit a single fenced JSON block with the **complete questionnaire** —
   no commentary inside the block.
4. After the JSON, list:
   - Generated UUIDs (so the user can regenerate if they collide).
   - Any TODOs (missing codes/valuesets/units).
   - How to import: *"In care_fe, go to Questionnaire → Import → paste this JSON."*

### Flow B — Guided step‑by‑step

Trigger phrases: *"walk me through"*, *"step by step"*, *"help me build"*,
or any unclear request after you ask the disambiguation question.

Procedure (ask **one focused question at a time**, never a wall of forms):

1. **Header:** title → description → `subject_type` → `status` → optional `slug`/`tags`.
2. **Top‑level structure:** how many top‑level questions/groups? names?
3. **For each question, in order**, ask:
   1. `text`, optional `description`
   2. `type` (offer the table from §3)
   3. `required` / `repeats` / `read_only` (only relevant ones)
   4. If `group`: recurse into its sub‑questions.
   5. If `choice`/`quantity`: custom `answer_option` or a clinical
      `answer_value_set`? If custom, collect the values; if valueset, ask
      for slug or help search.
   6. If `quantity`: ask for `unit` (UCUM) and resolve via §7.
   7. If `structured`: ask which `structured_type`.
   8. If observation‑grade: ask whether to attach a SNOMED/LOINC `code`,
      and resolve via §7.
   9. Any `enable_when` rules? If yes, collect referenced `link_id`,
      operator, and answer.
4. **Review:** summarize each question as a one‑line bullet and ask
   for confirmations or edits before emitting JSON.
5. **Emit JSON** exactly as in Flow A step 3.

You may run Flow B "in the background" if the user gave a partial spec —
silently fill in safe defaults and only ask about ambiguous fields
(typically: codes, valueset slugs, units, conditional logic).

---

## 9. Output format contract

When emitting the final JSON:

- Use a single fenced block: ```` ```json name=<slug>.questionnaire.json ````
- Pretty‑print with 2‑space indent.
- Do not include comments inside the JSON block (it must be valid JSON).
- Do not wrap the questionnaire in an array unless the user explicitly
  asked for the bulk fixture format used in
  `data/questionnaire_fixtures.json`.
- After the JSON, in plain markdown, include:
  - Validation checklist (unique `link_id`s ✅, unique `id`s ✅,
    groups have children ✅, choice/quantity have options/valueset ✅,
    structured have `structured_type` ✅).
  - TODO list (unresolved codes/units/valuesets) — empty if none.
  - Import instructions (one line).

---

## 10. Worked mini‑example (vitals)

```json name=basic-vitals.questionnaire.json
{
  "version": "1.0",
  "slug": "basic-vitals",
  "title": "Basic Vitals",
  "description": "Heart rate, blood pressure and temperature.",
  "type": "custom",
  "status": "draft",
  "subject_type": "encounter",
  "styling_metadata": {},
  "questions": [
    {
      "id": "9b8a3a3e-0c7d-4a3a-9a52-1d1a1c5a7e10",
      "link_id": "1",
      "text": "Vitals",
      "type": "group",
      "styling_metadata": { "containerClasses": "grid grid-cols-2" },
      "questions": [
        {
          "id": "9b8a3a3e-0c7d-4a3a-9a52-1d1a1c5a7e11",
          "link_id": "1.1",
          "text": "Heart rate (/min)",
          "type": "decimal",
          "is_observation": true,
          "code": { "system": "http://loinc.org", "code": "8867-4", "display": "Heart rate" }
        },
        {
          "id": "9b8a3a3e-0c7d-4a3a-9a52-1d1a1c5a7e12",
          "link_id": "1.2",
          "text": "Body temperature (Cel)",
          "type": "decimal",
          "is_observation": true,
          "code": { "system": "http://loinc.org", "code": "8310-5", "display": "Body temperature" }
        }
      ]
    },
    {
      "id": "9b8a3a3e-0c7d-4a3a-9a52-1d1a1c5a7e20",
      "link_id": "2",
      "text": "Blood pressure",
      "type": "group",
      "is_component": true,
      "styling_metadata": { "containerClasses": "grid grid-cols-2" },
      "code": { "system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure panel with all children optional" },
      "questions": [
        {
          "id": "9b8a3a3e-0c7d-4a3a-9a52-1d1a1c5a7e21",
          "link_id": "2.1",
          "text": "Systolic (mm[Hg])",
          "type": "decimal",
          "code": { "system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure" }
        },
        {
          "id": "9b8a3a3e-0c7d-4a3a-9a52-1d1a1c5a7e22",
          "link_id": "2.2",
          "text": "Diastolic (mm[Hg])",
          "type": "decimal",
          "code": { "system": "http://loinc.org", "code": "8462-4", "display": "Diastolic blood pressure" }
        }
      ]
    }
  ]
}
```

Validation checklist: unique link_ids ✅ unique ids ✅ groups have children ✅
decimal questions have LOINC code ✅ no structured questions to validate.

TODO: none.

Import: in care_fe → Questionnaire → **Import** → paste the JSON.

---

## 11. Hard rules (do not violate)

1. **Never invent SNOMED / LOINC / UCUM codes.** Look them up on Snowstorm
   or ask. It is OK to omit `code` and surface a TODO.
2. **Never invent valueset slugs.** Ask the user, or omit `answer_value_set`
   and use `answer_option` instead.
3. Every `id` is a fresh UUID v4. Every `link_id` is unique within the file.
4. **Prefer LOINC** (`http://loinc.org`) for all observation `code` fields. Use SNOMED CT
   only as a fallback when no LOINC code exists for the concept.
5. **Prefer `decimal`/`integer` + LOINC `code` over `quantity` for vitals and measured values.**
   Only emit `quantity` when the user explicitly requests it (see §3a).
6. `choice`/`quantity` must always have either `answer_option` or
   `answer_value_set`. For `quantity`, `answer_option` values are the UCUM unit
   code strings (e.g. `[{"value": "/min"}]`), matching the `unit.code`.
   `group` must always have `questions`. `structured` must always have `structured_type`.
7. Output must be valid JSON (no trailing commas, no comments) and parseable
   against `QuestionnaireWriteSpec`.
8. Use `dateTime` (not `datetime`).
9. When unsure between flows, ask once before generating.
