# Plugin Loading Note For AI Agents

`PluginEngine` resolves enabled plugins in two stages:

1. It fetches plugin configs from `GET /api/v1/plug_config/`.
2. It merges that API response with build-time plugins from `careConfig.careApps` (derived from `REACT_ENABLED_APPS`).

The merged list is the effective plugin set used by the frontend. Build-time plugins act as the base enabled plugins, so they load even when the backend does not return a matching `plug_config` row.

Build-time plugin identity:

- `REACT_ENABLED_APPS` is parsed by `care.config.ts` into `careConfig.careApps`.
- Each build-time plugin is normalized into the same `PlugConfig` shape as the API response by `src/Utils/plugConfig.ts`.
- The resolved `slug` for a build-time plugin is the parsed plugin `name` field, which is typically the repository name.

`REACT_ENABLED_APPS` format:

- Each entry is expected in the form `org/repo` or `org/repo@host/path/to/remoteEntry.js`.
- If `@host/path` is omitted, CARE defaults to GitHub Pages: `https://{org}.github.io/{repo}`.
- If the host contains `localhost`, CARE prefixes it with `http://`; otherwise it prefixes it with `https://`.
- In host dev mode, CARE auto-discovers valid local plugin apps from `apps/*/src/manifest.*` (any TS/JS extension) and loads them directly through the host Vite graph.
- Example remote entry for non-hosted local testing or preview flows: `ohcnetwork/care_hello_fe@localhost:4173/assets/remoteEntry.js`.

Merge behavior:

- API-only plugins remain editable and keep `source: "api"`.
- Build-time plugins are always marked `source: "build"` and `isReadOnly: true`.
- If both sources provide the same slug, the frontend keeps one merged entry for that slug.
- For overlapping metadata keys, build-time metadata wins.
- API-only metadata keys that do not conflict are preserved.

For each resolved plugin config, `PluginEngine`:

1. Validates `config.meta.url`.
2. Registers the remote with Vite federation using the plugin `slug`.
3. Loads `./manifest` from the remote.
4. Combines the manifest with `config.meta` and exposes the frozen metadata on `window.__CARE_PLUGIN_RUNTIME__.meta`.
5. Registers plugin overrides through `addOverride(...)`.
6. Makes the loaded manifests available through `CareAppsContext`.

Failure behavior:

- If `config.meta.url` is missing or invalid, the plugin is logged and skipped.
- If the remote manifest cannot be loaded, the plugin is logged and skipped.
- These failures do not prevent the rest of the app or other plugins from loading.

`PLUGIN_Component` renders plugin-provided React components by looking them up in each loaded manifest's `components` map.

`initI18n()` also uses the same merged plugin-config list to discover plugin namespaces and translation origins. If the `plug_config` API call fails, the app still falls back to build-time plugins for i18n namespace discovery.

Admin UI behavior:

- API-backed plugin configs remain editable.
- Build-time plugins are shown in the PlugConfig admin page as built-in, read-only entries.
- Direct navigation to a build-time plugin's edit route opens a read-only detail view backed by the build-time config and skips the backend `GET /api/v1/plug_config/{slug}/` request.
- Those built-in entries are still loaded by runtime code even without editable backend state.

Testing guidance:

- If a plugin should always be present during tests, add it to `REACT_ENABLED_APPS` so it becomes a build-time base plugin.
- If a test needs backend-managed plugin metadata only, seed the `plug_config` API response.
- If both sources define the same plugin slug, the frontend keeps the plugin enabled as a build-time plugin and merges API-only metadata keys with the build-time metadata.
- For local host development with the sample hello-world plugin in `apps/care_hello_fe`, start the main app with `npm run dev`. CARE auto-enables local plugins discovered under `apps/` and serves their `public/` assets from the host dev server.
- For remote-style testing or preview flows, a working entry remains `ohcnetwork/care_hello_fe@localhost:4173/assets/remoteEntry.js`, and the sample plugin can still be run from `apps/care_hello_fe` with `npm run dev`.

Host-to-plugin data sharing via `window` globals (set in `src/index.tsx`):

- `window.CARE_API_URL` — The backend API base URL (`careConfig.apiUrl`). Plugins use this to make API calls without importing host modules.
- `window.AuthUserContext` — The React context object for auth state (`AuthUserContext`). Since `react` is a shared dependency, plugins can call `React.useContext(window.AuthUserContext)` to access `signIn`, `signOut`, `user`, etc., because the plugin component tree renders inside the host's `AuthUserProvider`.
- `window.__CORE_ENV__` — The full `careConfig` object (API URLs, feature flags, locale settings, plugin config).
- `window.__CARE_PLUGIN_RUNTIME__` — Plugin-specific runtime metadata (`{ meta: PlugConfigMeta }`) set by `PluginEngine` after the plugin manifest loads.

## Encounter workspace widgets

Core widgets reuse the same components as the standard encounter Overview. A
change to a clinical list, form action, or details card applies to both layouts.
System pages use their encounter route keys, such as `medicines`. All keys below
are exact: the editor and renderer do not translate aliases.

| Widget type               | Content                                                                                                                                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allergies`               | Patient allergies, filtered by encounter for completed encounters; all allergies on history pages                                                                                                                          |
| `symptoms`                | Selected encounter's symptoms, or the patient's symptom history on history pages                                                                                                                                           |
| `diagnosis`               | Selected encounter's diagnoses, or the patient's diagnosis history on history pages                                                                                                                                        |
| `vitals`                  | Observations using the configured primary vital groups, or the latest reading per configured `codes` entry with its change from the previous reading; patient-wide on history pages                                        |
| `questionnaire_responses` | Selected encounter's submitted forms, or every visit's forms on history pages; `authored_by: "me"` keeps only the viewer's                                                                                                 |
| `service_requests`        | Selected encounter's service requests, optionally filtered by status                                                                                                                                                       |
| `referrals`               | Selected encounter's referrals, optionally filtered by `status` and `assigned_to_me`, with `limit`; granted by referral access rather than clinical data                                                                   |
| `outstanding_orders`      | Selected encounter's orders with report-received state, category, report and status links; `category`, `include_completed`, `include_on_hold`, `limit`                                                                     |
| `current_medications`     | Patient-wide active prescriptions and outside medication statements with dosage, duration, and prescriber; `sources` picks either; renders without an encounter                                                            |
| `recent_encounters`       | Patient's latest encounters with care team, location, and status; `care_team: "mine"` or `care_team_user` limit by care team membership, plus `encounter_class`, `status`, `exclude_current`; renders without an encounter |
| `quick_actions`           | Allergy, order, medication, form, symptom, and diagnosis entry shortcuts                                                                                                                                                   |
| `favorite_forms`          | The user's favorite form shortcuts                                                                                                                                                                                         |
| `draft_forms`             | Local and server drafts for the current encounter                                                                                                                                                                          |
| `encounter_tags`          | Encounter tags                                                                                                                                                                                                             |
| `locations`               | Current location and location history                                                                                                                                                                                      |
| `care_team`               | Assigned care team                                                                                                                                                                                                         |
| `departments`             | Departments and teams                                                                                                                                                                                                      |
| `hospitalization`         | Admission details                                                                                                                                                                                                          |
| `discharge`               | Discharge details                                                                                                                                                                                                          |
| `audit_logs`              | Encounter creation and update details                                                                                                                                                                                      |
| `encounter_actions`       | Encounter management and completion actions                                                                                                                                                                                |
| `reports`                 | Available discharge summary report templates                                                                                                                                                                               |
| `observation_chart`       | One chart set, or selected `groups` from it, without chart-set tabs; `height` and `columns`; patient-wide on history pages                                                                                                 |
| `account`                 | Encounter billing account                                                                                                                                                                                                  |
| `encounter_summary`       | Standard details, actions, and discharge-template tabs; `tabs` and `default_tab` pick a subset                                                                                                                             |
| `encounter_extensions`    | The existing `EncounterOverviewTop` app contribution slot; hidden when no app contributes                                                                                                                                  |

Every widget accepts an optional `title`. `questionnaire_responses` also accepts
`config.questionnaire_slug` (an exact, nonempty slug), `config.only_unstructured`
(a boolean), `config.authored_by` (`"anyone"` or `"me"`), and `config.limit` (an
integer from 1 to 100). `authored_by: "me"` sends the signed-in user's ID as
`created_by`, so one layout shows each clinician only the forms they submitted. A limit of `1` shows
the latest matching response; `5` shows the latest five. Responses are ordered
newest first by the backend. With no limit, the list keeps its usual pagination.
Omit the slug to include all forms. `only_unstructured: true` excludes structured
clinical entries; omit it or set it to `false` to include both.

`service_requests` accepts `config.status` and `config.limit` (1–100). The exact
supported statuses are `draft`, `active`, `on_hold`, `entered_in_error`, `ended`,
`completed`, and `revoked`. Use `active` for pending requests; omit the status to
include all requests. A limit shows that many newest matching requests; omitting
it enables independent Load More pagination. Each widget keeps its own filters
and pagination, without changing the page URL or other widgets.

[The four-page example](examples/encounter-workspace.json) includes ward rounds,
side-by-side latest-one/latest-five form views, request queues, and encounter
details. Replace its `daily-progress-note` slug with a questionnaire available in
your installation. A smaller example:

```json
{
  "schema_version": 1,
  "pages": [
    {
      "key": "rounds",
      "kind": "custom",
      "title": "Ward rounds",
      "columns": [
        {
          "span": 2,
          "widgets": [
            { "type": "vitals" },
            { "type": "diagnosis" },
            {
              "type": "questionnaire_responses",
              "title": "Progress notes",
              "config": {
                "questionnaire_slug": "daily-progress-note",
                "limit": 5
              }
            }
          ]
        },
        {
          "span": 1,
          "widgets": [
            { "type": "quick_actions" },
            { "type": "favorite_forms" },
            { "type": "draft_forms" },
            { "type": "care_team" },
            { "type": "encounter_actions" }
          ]
        }
      ]
    },
    { "key": "medicines", "kind": "system" }
  ]
}
```

Clinical widgets require clinical read access. The seven encounter details cards
also allow encounter metadata read access and retain their existing edit controls.
Quick actions, favorite forms, drafts, and encounter actions only mount in an
editable encounter with facility and clinical access. Form links return to the
custom page they were opened from. Reports retain template permissions and only
load in a matching facility context. Selecting a historical encounter updates
widget data and removes write actions. Each widget has an isolated
query-parameter scope, so its filters and pagination cannot overwrite another
widget's state, the selected encounter, or a questionnaire's URL. Responses and
Location history preserve the selected encounter's read-only state through their
cards and dialogs.

Widgets are compact, configured summaries. Full-page views with their own
filters, panes, and navigation (medicines, observations, plots, service requests,
diagnostic reports, consents, responses, notes, devices, immunizations, and
files) stay built-in system pages, which layouts can show, hide, and reorder.

### The workspace studio

The studio (`src/components/Workspace/WorkspaceStudio.tsx`) is the authoring
UI for these templates. It deliberately uses everyday words instead of the JSON
vocabulary:

| Studio term                | Template field                                                          |
| -------------------------- | ----------------------------------------------------------------------- |
| Tab                        | a `pages[]` entry; built-in tabs are `kind: "system"`                   |
| Section                    | a `widgets[]` entry                                                     |
| Layout preset              | the column `span` values (`[12]`, `[8,4]`, `[4,8]`, `[6,6]`, `[4,4,4]`) |
| "Show this section"        | `visible_when["encounter.status"]`                                      |
| Encounter / history screen | `surface`                                                               |

Creating a workspace starts from a **starting point** (`workspacePresets.ts`:
standard encounter, ward rounds, outpatient visit, standard history, my forms,
or blank)
rather than an empty grid. The surface is fixed by that choice. The single design
canvas renders every section as a sample card using the runtime column grid, so
there is no separate preview mode: **Preview as Active / Closed encounter** dims
sections that would auto-hide and explains why, and a column whose sections are
all hidden is labelled rather than silently collapsed. Section options open in a
drawer with a title, the section's few settings, a plain-language visibility
choice (always / only while active / only after closed / specific statuses), and
an advanced JSON view. JSON editing of the whole template lives under **More
options → Edit as JSON**; unrecognised templates open there automatically.

Widths that match no preset are shown as a custom layout; picking a preset
reflows the sections and merges any surplus columns into the last one. Built-in
tabs can be shown, hidden, and reordered. The encounter **Updates** tab offers
**Customise this tab**, which converts it to an editable tab with the same key;
every other built-in tab stays built in.

### Surfaces and clinical history

Existing version-1 templates remain supported. Version 2 adds an optional
`surface`, either `encounter` (the default) or `patient_history`, and allows custom
pages to use built-in page keys so presets can rebuild the supported pages without
changing their URLs.

The standard history layout keeps every built-in history tab. History layouts
add custom pages built from the same widgets as encounter pages: `allergies`,
`symptoms`, `diagnosis`, `vitals`, `observation_chart`, and
`questionnaire_responses` read the selected encounter on encounter pages and the
patient's whole record on history pages, while `current_medications` and
`recent_encounters` are always patient-wide. The **My forms** starter, for
example, puts the forms the viewer submitted beside current medication and recent
encounters, then keeps the standard history tabs. Widgets that need an encounter
cannot be published on a history layout; the section picker disables them with
an explanation. Without an encounter, these widgets require the patient's
clinical-data permission (or its response permission for forms), rather than an
encounter-only clinical read grant.

The standalone clinical-history page and the questionnaire's embedded history
tab use the same workspace renderer. With no chosen layout they retain the
standard history tabs. History layout selection is **browser-local and scoped
to the signed-in user**, with cross-tab synchronization and visible storage/load
errors. Workspace content still uses the existing server APIs. This deliberately
does not introduce a new backend default-attribute contract; encounter-class
preferences continue to use their existing server-side contract.

```json
{
  "schema_version": 2,
  "surface": "patient_history",
  "pages": [
    {
      "kind": "custom",
      "key": "my_forms",
      "title": "My forms",
      "columns": [
        {
          "span": 8,
          "widgets": [
            {
              "type": "questionnaire_responses",
              "config": { "authored_by": "me" }
            }
          ]
        },
        {
          "span": 4,
          "widgets": [
            { "type": "current_medications" },
            { "type": "diagnosis" }
          ]
        }
      ]
    },
    { "kind": "system", "key": "responses" },
    { "kind": "system", "key": "medications" }
  ]
}
```

### Availability and validation

`widgetAvailability.ts` is the shared source of encounter and access requirements.
The studio labels only the rules an author might not expect: sections that
require an _active_ encounter (auto-hidden once closed) and patient-level
sections that work without one. Active-only widgets automatically hide on closed
encounters, and editing tools also hide in read-only or non-facility contexts.
These rules run before widgets mount and before grid tracks are allocated, so
hidden-only columns collapse and an all-hidden page shows its empty state.

`visible_when` adds an optional status filter; it cannot override a widget's
intrinsic requirements or grant permissions. Patient-wide read-only history does
not inherently require an active encounter. An author can explicitly add a
status filter when a particular encounter layout should hide that history.

The studio canvas never loads patient data: clinical and plugin components are
not mounted, no clinical requests are sent, and sample controls are disabled.
**More options → Preview with access level** simulates clinical editing,
read-only access, encounter-only access without patient history, and
details-only access.

Saving validates every known widget configuration, including JSON edits and
sections whose drawer was never opened. Unknown widget options remain
preserved rather than being erased. Safe system-page references also remain
saveable while a plugin is loading or disabled if they were already saved on the
same surface. The editor warns about their unavailability instead of requiring
their removal to rename or archive a layout. Newly introduced system references
must belong to that surface or an available plugin.

The workspace contract tests run with `npm run test:unit`. Browser regressions
are in `tests/admin/workspaces/workspaceEditor.spec.ts` and
`tests/facility/patient/encounter/encounterWorkspace.spec.ts`.

Plugins can provide their own UI inside a custom encounter workspace page through
the manifest's `encounterWidgets` map. Each key is a local widget name; CARE prefixes
it with the enabled app's authoritative `PlugConfig.slug`. For an app registered
as `care_dental`, this manifest exposes `care_dental.odontogram`:

```tsx
import { lazy } from "react";
import type { PluginManifest } from "@/pluginTypes";

export default {
  plugin: "Dental",
  encounterWidgets: {
    odontogram: {
      component: lazy(() => import("./OdontogramWidget")),
      configSchema: {
        type: "object",
        properties: {
          dentition: {
            type: "string",
            title: "Dentition",
            enum: ["primary", "permanent"],
          },
        },
      },
    },
  },
} satisfies PluginManifest;
```

Each definition supplies an eager or lazy `component` and an object
`configSchema` using the existing JSON Schema Extensions format. CARE uses the
schema's titles, descriptions, constraints, and `x-ui` hints to render the widget
configuration editor. Component-only entries remain supported for older plugins
and use the JSON editor; new entries should provide a schema.

The visual editor supports object properties, nested objects, arrays, primitive
values, enums, and their validation constraints. For choices with display labels,
use `oneOf: [{ const: "on_hold", title: "dental:status_on_hold" }, ...]`.
Each choice must have a unique primitive `const` and a `title`; it may also have
a `description`. Other composition, references, conditionals, and date/time
controls fall back to JSON editing. Unknown
saved properties are retained; schemas with `additionalProperties: false` report
them as errors for the author to resolve. An empty object schema indicates a
widget with no configurable options. Opening a widget never writes schema
defaults into its config, and clearing an optional option removes its key. Keep
runtime defaults and validation in the widget, including when configuration is
supplied directly as workspace JSON.

Schema titles, descriptions, choice titles, and static autocomplete option labels
can be translation keys in the plugin's namespace (for example,
`dental:show_history`). Literal text remains supported as a fallback. Nested
fields and array items follow the same convention. Field keys, saved option
values, and labels returned by an autocomplete API are never translated.

Local names must start with a lowercase letter,
contain only lowercase letters, digits, and underscores, and be at most 64
characters. A plugin slug may also contain hyphens, must start with a lowercase
letter or digit, and must be at most 64 characters. Dots belong only between the
slug and local name. Invalid names are ignored. Plugins cannot claim another
plugin's namespace or implicitly replace built-in widgets such as `allergies`.

A workspace can place the widget in any custom page column:

```json
{
  "schema_version": 1,
  "pages": [
    {
      "key": "dental",
      "kind": "custom",
      "title": "Dental chart",
      "columns": [
        {
          "span": 1,
          "widgets": [
            {
              "type": "care_dental.odontogram",
              "title": "Odontogram",
              "config": { "dentition": "permanent" }
            }
          ]
        }
      ]
    }
  ]
}
```

The component receives `PluginEncounterWidgetProps` from `src/pluginTypes.ts`:

- `patientId`: the open patient's ID.
- `encounterId` and `encounter`: the selected encounter, including a historical
  encounter when the user changes the encounter history selection.
- `facilityId`: the current facility context, when available.
- `title`: the optional title from the workspace widget configuration.
- `config`: the workspace's JSON options, or an empty object when omitted.
- `readOnly`: whether the current context permits clinical editing. The widget
  must respect this flag for its controls; its APIs remain responsible for
  authorization.

The plugin owns its widget UI, data loading, translated default title, and config
validation. Treat `config` as unvalidated input: check supported fields and types,
apply suitable defaults, and show configuration errors within the widget. Use the
selected `encounterId` for encounter-specific data and actions. The host does not
fetch additional patient data for this contract.

CARE handles workspace layout, `visible_when`, and clinical read access before
mounting the plugin component. It isolates each widget with Suspense and a plugin
error boundary. A loading app shows a loading state; a missing app or widget shows
an unavailable state without removing the saved configuration. Namespaced types
remain valid in saved workspace JSON while an app is disabled or unavailable.

A widget definition may set `requiresActiveEncounter: true` alongside
`component` and `configSchema`. CARE then labels it as active-encounter-only in
the studio and hides it before mounting on closed encounters. This does not
replace `readOnly` or API authorization: plugins must still disable editing
whenever `readOnly` is true.

By default a plugin widget needs an encounter, so the studio blocks it on patient
history layouts. Set `supportsPatientHistory: true` to make it available there
too, so clinicians can add it to their own history pages. Its component then
receives `PluginPatientWidgetProps`: the same props, except `encounterId` and
`encounter` are absent on history pages. Load patient-wide data when they are
absent, and treat the widget as read-only (`readOnly` is always true there).
`supportsPatientHistory` and `requiresActiveEncounter` cannot be combined.

```tsx
encounterWidgets: {
  lab_trends: {
    component: lazy(() => import("./LabTrendsWidget")), // PluginPatientWidgetComponent
    configSchema: { type: "object", properties: {} },
    supportsPatientHistory: true,
  },
},
```

`useCareAppEncounterWidgets` derives available widgets directly from
`CareAppsContext`, following app loading and removal without a separate mutable
registry. `PluginEngine` does not need a registration or cleanup extension for
these widgets. The manifest's display name (`plugin`) never determines namespace
ownership.
