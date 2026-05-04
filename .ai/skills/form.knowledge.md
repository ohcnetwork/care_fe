# Form Skill — Knowledge Base

> **Auto-maintained by the `form.skill.md` workflow.**
> Append after every session. Do not delete history — strike through if obsolete.

This file is the long-term memory for the Care Form generator skill. It stores
mapping overrides, codes the user has confirmed, per-form templates already
produced, and explicit user preferences, so each new form takes less back-and-forth.

---

## User preferences

_Append a bullet whenever the user expresses a recurring preference._

- Refer to questionnaires as **"forms"** in conversation. Internal JSON field
  names stay `questionnaire`-prefixed.
- Prefer writing JSON output to files in `tmp/forms/<slug>.json` (gitignored)
  rather than pasting into chat.
- Use sensible defaults from `form.skill.md` without re-asking each time.
- **Do NOT add LOINC/SNOMED/UCUM `code` fields by default.** Omit `code`
  on every question (and the top-level form `code`) unless the user
  explicitly asks for codes. This applies to vitals, BP panels, scores,
  everything. The unit still goes inside the question `text`
  (e.g. `"Heart Rate (/min)"`), and `is_observation: true` is still set
  on measurement questions — only the `code` object is dropped.
  _(2026-04-27: user explicitly said "ignore the Code (LOINC) its not
  mandatory unless the user ask for it".)_
- Always confirm `enable_when` (conditional logic) with the user before
  emitting JSON.
- **Do not include a `curl` POST template** in the final summary. Just
  report the file path. _(2026-04-27 user preference.)_

---

## Mapping overrides

_Per-user adjustments to the default type-mapping table in `form.skill.md`._

### CRITICAL — Vital signs and measurements


- **Vitals are `decimal`, NOT `quantity`.** This includes HR, RR, SpO₂, temp,
  weight, height, BMI, lab values, scores, glucose.
- **Encode the unit inside the question `text`** in parentheses:
  - `"Heart Rate (/min)"`
  - `"Respiratory Rate (/min)"`
  - `"Oxygen Saturation (%)"`
  - `"Body Temperature (Cel)"`
  - `"Weight (kg)"`
  - `"Height (cm)"`
  - `"Systolic Blood Pressure (mm[Hg])"`
  - `"Diastolic Blood Pressure (mm[Hg])"`
- **Always set `is_observation: true`** on these measurement questions.
- **Do NOT set the `unit` or `answer_unit` fields** on the question. The
  schema has them but the production form builder never emits them, and the
  backend's choice-vs-quantity validator can misclassify the question if you do.
- **Blood Pressure** = `group` with `is_component: true`, containing systolic +
  diastolic decimal children. Add `styling_metadata.containerClasses: "grid grid-cols-2"`
  for layout. The panel's `code` (LOINC `85354-9`) should only be included when
  the user explicitly requests coded fields (see global policy above).

### Other production conventions

- `version` is a **number** (`0.1`), not a string.
- `organizations` field is **omitted** in the request body.
- `id` should be a **UUID v4**, not a kebab-case slug.
- `link_id` may be hierarchical (`"1"`, `"1.7.2"`) OR `Q-<unix-ms>` from the
  in-app builder. Pick one style per form.
- `answer_option` entries can be just `{ "value": "TEXT" }` — `display` is
  optional.
- Layout hints go in `styling_metadata.containerClasses` (Tailwind), commonly
  `"grid grid-cols-2"` on `group`s.

### Structured questions — minimal & standalone

Never wrap a structured question in a single-child group. Never add `code`,
`answer_option`, `unit`, `answer_unit`, or children. Only:

```json
{
  "id": "<uuid>",
  "link_id": "Q-... or hierarchical",
  "text": "Chief Complaints",
  "type": "structured",
  "structured_type": "symptom",
  "required": false,
  "repeats": false,
  "description": "optional"
}
```

Reference of `structured_type` values seen in production:

| Value                  | Production usage                                              |
| ---------------------- | ------------------------------------------------------------- |
| `symptom`              | Chief complaints, presenting/secondary symptoms, key findings |
| `diagnosis`            | Provisional/final dx, comorbidities, surgical history         |
| `medication_request`   | New prescriptions, discharge meds                             |
| `medication_statement` | Pre-existing meds the patient is already taking               |
| `allergy_intolerance`  | Allergy history                                               |
| `service_request`      | Procedure / lab / imaging requests                            |
| `appointment`          | Follow-up appointment booking                                 |
| `files`                | Document/image uploads (e.g. outside investigation reports)   |
| `encounter`            | Encounter metadata edit                                       |
| `time_of_death`        | Death recording                                               |
| `charge_item`          | Billing line item                                             |

---

## Confirmed codes

_LOINC / SNOMED / UCUM codes the user has explicitly approved.
Reuse these without re-asking._

### Vitals (LOINC)

| Concept                   | System              | Code     | Display                        |
| ------------------------- | ------------------- | -------- | ------------------------------ |
| Heart rate                | http://loinc.org    | 8867-4   | Heart rate                     |
| Blood pressure panel      | http://loinc.org    | 85354-9  | Blood pressure panel with all children optional |
| Systolic BP               | http://loinc.org    | 8480-6   | Systolic blood pressure        |
| Diastolic BP              | http://loinc.org    | 8462-4   | Diastolic blood pressure       |
| Body temperature          | http://loinc.org    | 8310-5   | Body temperature               |
| Respiratory rate          | http://loinc.org    | 9279-1   | Respiratory rate               |
| Oxygen saturation (SpO₂, pulse ox) | http://loinc.org    | 59408-5  | Oxygen saturation in Arterial blood by Pulse oximetry |
| Oxygen saturation (SpO₂, generic)  | http://loinc.org    | 2708-6   | Oxygen saturation in Arterial blood |
| Body weight               | http://loinc.org    | 29463-7  | Body weight                    |
| Body height               | http://loinc.org    | 8302-2   | Body height                    |
| BMI                       | http://loinc.org    | 39156-5  | Body mass index                |
| Pain score (0-10)         | http://loinc.org    | 72514-3  | Pain severity 0-10 verbal numeric |

> _These are commonly-used seeds. Mark them confirmed only after the user has
> approved them in an actual session._

### Units (UCUM, `http://unitsofmeasure.org`)

| Quantity      | UCUM code  | Display |
| ------------- | ---------- | ------- |
| Heart rate    | `/min`     | bpm     |
| BP            | `mm[Hg]`   | mmHg    |
| Temperature   | `Cel`      | °C      |
| Weight        | `kg`       | kg      |
| Height        | `cm`       | cm      |
| Percent       | `%`        | %       |
| Respiratory   | `/min`     | breaths/min |

---

## Per-form templates

_Every generated form gets a record here so we can reuse / version it later._

### Template entry format

```
### <Title>
- **slug**: `<slug>`
- **subject_type**: `patient` | `encounter`
- **status**: `draft` | `active`
- **created**: YYYY-MM-DD
- **last_used**: YYYY-MM-DD
- **source**: image | pdf | text | named-instrument
- **file**: `tmp/forms/<slug>.json`
- **summary**: One sentence.
- **notable decisions**:
  - …
```

_(no forms generated yet)_

### Clinical Vitals Assessment

- **slug**: `vitals-assessment`
- **subject_type**: `encounter`
- **status**: `draft`
- **created**: 2026-04-27
- **last_used**: 2026-04-27
- **source**: text ("form for taking vitals")
- **file**: `tmp/forms/vitals-assessment.json`
- **summary**: Basic vitals (HR, BP, RR, temp, SpO₂), anthropometrics (weight, height), pain score, clinical notes. **No LOINC/SNOMED codes** per user preference.
- **notable decisions**:
  - First draft used `type: "quantity"` with explicit `unit` fields → backend rejected with "choice type" validation error.
  - Second iteration: `decimal` + `is_observation: true`, units encoded in `text` (e.g. `"Weight (kg)"`), BP as `is_component` group, `version: 0.1`, no `organizations` field.
  - **2026-04-27 regen**: User instructed "ignore the Code (LOINC) it's not mandatory unless the user asks for it". Stripped **all** `code` objects, including the BP panel code `85354-9`. BP group keeps `is_component: true` and `grid grid-cols-2` styling but no panel code. Systolic/diastolic remain `decimal` + `is_observation: true` with units in text.

---

## Session log

_One line per use of the skill. Newest at top._

- **2026-04-27** — Regenerated `vitals-assessment` form per new user preference: **no LOINC/SNOMED codes by default**. Stripped all `code` objects (incl. BP panel code). Kept `is_component` + `grid grid-cols-2` on BP group. Added preference to `## User preferences`.
- **2026-04-27** — Reviewed 6 production form examples in `~/Desktop/examples/` (clinical-assessment-123, clinical-follow-up, discharge-advice-and-me, discharge-summary-report, ent_op_examination, mlsp-form-for-category). Rewrote `form.skill.md` and `form.knowledge.md` with corrected conventions: vitals = `decimal` + `is_observation` + unit-in-text (not `quantity`), `is_component` for BP-style panels, structured questions stand alone with no extras, `version` is a number, omit `organizations`, layout via `styling_metadata.containerClasses`.
- **2026-04-27** — First attempt at `vitals-assessment` form failed backend validation due to `unit` field on quantity questions.

## Common clinical instruments cheat-sheet

_Quick reference. When the user names one of these, use the canonical fields
below as the starting draft (still confirm with user)._

- **Glasgow Coma Scale (GCS)** — Eye (1-4), Verbal (1-5), Motor (1-6); total 3-15. LOINC 9269-2.
- **Apgar Score** — Appearance, Pulse, Grimace, Activity, Respiration; each 0-2. LOINC 9272-6 (1-min), 9274-2 (5-min).
- **MMSE (Folstein)** — 30-point cognitive screen across orientation, registration, attention, recall, language. LOINC 72106-8.
- **PHQ-9** — 9 items 0-3, total 0-27. LOINC 44249-1.
- **GAD-7** — 7 items 0-3, total 0-21. LOINC 70274-6.
- **NEWS2** — Resp rate, SpO₂, supplemental O₂, temp, systolic BP, HR, consciousness.
- **Edinburgh Postnatal Depression Scale (EPDS)** — 10 items, 0-3 each.
- **WHO Surgical Safety Checklist** — Sign In / Time Out / Sign Out checklists.
