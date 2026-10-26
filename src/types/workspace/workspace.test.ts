import i18next from "i18next";
import assert from "node:assert/strict";
import { before, test } from "node:test";

import { visibleWorkspaceColumns } from "@/components/Workspace/WorkspacePageLayout";
import { CORE_WIDGET_CATALOG } from "@/components/Workspace/workspaceEditorCatalog";
import { standardWorkspaceTemplate } from "@/components/Workspace/workspacePresets";
import { workspaceWidgetIssues } from "@/components/Workspace/workspaceValidation";
import { parseEncounterWorkspace } from "@/pages/Encounters/workspace/parseEncounterWorkspace";
import { EncounterStatus } from "@/types/emr/encounter/encounter";

import {
  createEncounterWorkspaceSchema,
  SYSTEM_PAGE_KEYS,
} from "./encounterWorkspace";
import {
  getWidgetAvailability,
  type WorkspaceAvailabilityContext,
} from "./widgetAvailability";
import { ENCOUNTER_WIDGET_TYPES } from "./widgetConfigSchemas";

before(async () => {
  await i18next.init({ lng: "en", resources: { en: { translation: {} } } });
});

const active: WorkspaceAvailabilityContext = {
  facilityId: "test-facility",
  selectedEncounter: { status: EncounterStatus.IN_PROGRESS },
  canReadClinicalData: true,
  canReadPatientHistory: true,
  canReadSelectedEncounter: true,
  canWriteClinicalData: true,
};
const closed: WorkspaceAvailabilityContext = {
  ...active,
  selectedEncounter: { status: EncounterStatus.COMPLETED },
  canWriteClinicalData: false,
};

test("every core widget has a library entry without expanding deferred features", () => {
  assert.deepEqual(
    CORE_WIDGET_CATALOG.map(({ type }) => type).sort(),
    [...ENCOUNTER_WIDGET_TYPES].sort(),
  );
  for (const type of ["notes", "devices", "immunizations", "files"]) {
    assert.equal(ENCOUNTER_WIDGET_TYPES.includes(type), false);
  }
});

test("version 2 presets are valid and preserve deferred system pages", () => {
  for (const surface of ["encounter", "patient_history"] as const) {
    const template = standardWorkspaceTemplate(surface, i18next.t);
    assert.equal(
      createEncounterWorkspaceSchema().safeParse(template).success,
      true,
    );
    assert.equal(
      workspaceWidgetIssues(template, new Map(), i18next.t).length,
      0,
    );
  }
  const template = standardWorkspaceTemplate("encounter", i18next.t);
  for (const key of ["notes", "devices", "immunizations", "files"]) {
    assert.equal(
      template.pages.find((page) => page.key === key)?.kind,
      "system",
    );
  }
  assert.equal(
    template.pages.find((page) => page.key === "updates")?.kind,
    "custom",
  );
  const rendered = parseEncounterWorkspace(template, SYSTEM_PAGE_KEYS);
  assert.equal(rendered.invalid, false);
  assert.equal(rendered.unsupportedVersion, false);
  assert.equal(rendered.pages.length, template.pages.length);
});

test("legacy reserved custom page rules remain unchanged", () => {
  const template = standardWorkspaceTemplate("encounter", i18next.t);
  const { surface: _surface, ...legacy } = template;
  assert.equal(
    createEncounterWorkspaceSchema().safeParse({ ...legacy, schema_version: 1 })
      .success,
    false,
  );
  assert.equal(
    createEncounterWorkspaceSchema().safeParse({
      schema_version: 1,
      pages: [{ key: "updates", kind: "system" }],
    }).success,
    true,
  );
});

test("unavailable plugin pages remain saveable without losing references", () => {
  for (const key of ["lab.results", "legacy_plugin_page"]) {
    const template = { schema_version: 1, pages: [{ key, kind: "system" }] };
    assert.equal(
      createEncounterWorkspaceSchema([], template).safeParse(template).success,
      true,
    );
    assert.equal(
      createEncounterWorkspaceSchema().safeParse(template).success,
      false,
    );
    assert.equal(parseEncounterWorkspace(template, []).pages[0]?.key, key);
  }
  assert.equal(
    createEncounterWorkspaceSchema().safeParse({
      schema_version: 2,
      pages: [{ key: "questionnaire", kind: "system" }],
    }).success,
    false,
  );
});

test("every known widget config is validated independently of selection or editing mode", () => {
  const template = standardWorkspaceTemplate("encounter", i18next.t);
  template.pages.push({
    kind: "custom",
    key: "invalid",
    title: "Invalid configuration",
    columns: [
      {
        span: 1,
        widgets: [
          { type: "questionnaire_responses", config: { limit: 0 } },
          { type: "service_requests", config: { limit: 101 } },
        ],
      },
    ],
  });
  assert.equal(workspaceWidgetIssues(template, new Map(), i18next.t).length, 2);
});

test("active-only widgets hide for closed encounters without an explicit status filter", () => {
  for (const type of [
    "quick_actions",
    "favorite_forms",
    "draft_forms",
    "encounter_actions",
  ]) {
    assert.equal(getWidgetAvailability({ type }, active).state, "visible");
    assert.deepEqual(getWidgetAvailability({ type }, closed), {
      state: "hidden",
      reason: "workspace_auto_hides_closed",
    });
  }
  assert.equal(
    getWidgetAvailability({ type: "symptoms" }, closed).state,
    "visible",
  );
  assert.equal(
    getWidgetAvailability({ type: "lab.widget" }, closed, true).state,
    "hidden",
  );
});

test("read-only views and patient history have distinct requirements", () => {
  assert.equal(
    getWidgetAvailability(
      { type: "quick_actions" },
      { ...active, canWriteClinicalData: false },
    ).state,
    "hidden",
  );
  const patientOnly = {
    ...active,
    selectedEncounter: undefined,
    facilityId: undefined,
  };
  assert.equal(
    getWidgetAvailability({ type: "history_diagnoses" }, patientOnly).state,
    "visible",
  );
  assert.equal(
    getWidgetAvailability({ type: "diagnosis" }, patientOnly).state,
    "hidden",
  );
  assert.equal(
    getWidgetAvailability(
      { type: "history_diagnoses" },
      { ...patientOnly, canReadPatientHistory: false },
    ).state,
    "denied",
  );
  assert.equal(
    getWidgetAvailability(
      {
        type: "history_diagnoses",
        visible_when: { "encounter.status": [EncounterStatus.IN_PROGRESS] },
      },
      patientOnly,
    ).state,
    "hidden",
  );
});

test("patient-level widgets render without an encounter while order widgets need one", () => {
  const patientOnly = {
    ...active,
    selectedEncounter: undefined,
    facilityId: undefined,
  };
  for (const type of ["current_medications", "recent_encounters"]) {
    assert.equal(getWidgetAvailability({ type }, patientOnly).state, "visible");
    assert.equal(getWidgetAvailability({ type }, closed).state, "visible");
  }
  assert.deepEqual(
    getWidgetAvailability({ type: "outstanding_orders" }, patientOnly),
    {
      state: "hidden",
      reason: "workspace_requires_encounter",
    },
  );
  assert.equal(
    getWidgetAvailability({ type: "outstanding_orders" }, closed).state,
    "visible",
  );
  // Encounter access alone opens recent encounters but not medication details.
  const encounterOnly = {
    ...active,
    canReadClinicalData: false,
    canReadPatientHistory: false,
  };
  assert.equal(
    getWidgetAvailability({ type: "recent_encounters" }, encounterOnly).state,
    "visible",
  );
  assert.equal(
    getWidgetAvailability({ type: "current_medications" }, encounterOnly).state,
    "denied",
  );
});

test("vitals codes and encounter filters validate their limits", () => {
  const code = { system: "http://loinc.org", code: "8867-4", display: "Pulse" };
  const template = standardWorkspaceTemplate("encounter", i18next.t);
  template.pages.push({
    kind: "custom",
    key: "checks",
    title: "Configuration checks",
    columns: [
      {
        span: 1,
        widgets: [
          { type: "vitals", config: { codes: [code] } },
          { type: "vitals", config: { codes: [] } },
          { type: "vitals", config: { codes: Array(21).fill(code) } },
          { type: "vitals", config: { codes: [{ code: "8867-4" }] } },
          {
            type: "recent_encounters",
            config: { care_team: "mine", limit: 5 },
          },
          { type: "recent_encounters", config: { limit: 21 } },
          { type: "recent_encounters", config: { care_team: "team" } },
          { type: "outstanding_orders", config: { category: "imaging" } },
          { type: "outstanding_orders", config: { category: "radiology" } },
          { type: "current_medications", config: { limit: 100 } },
        ],
      },
    ],
  });
  assert.equal(workspaceWidgetIssues(template, new Map(), i18next.t).length, 6);
});

test("tab subsets, chart groups, and encounter filters validate their options", () => {
  const template = standardWorkspaceTemplate("encounter", i18next.t);
  template.pages.push({
    kind: "custom",
    key: "tabs",
    title: "Tab configuration",
    columns: [
      {
        span: 1,
        widgets: [
          { type: "medications", config: { tabs: ["administration"] } },
          {
            type: "medications",
            config: { tabs: ["prescriptions"], default_tab: "statements" },
          },
          { type: "medications", config: { tabs: [] } },
          { type: "medications", config: { tabs: ["ongoing"] } },
          { type: "encounter_summary", config: { default_tab: "reports" } },
          { type: "encounter_summary", config: { tabs: ["billing"] } },
          { type: "clinical_history", config: { tabs: ["immunizations"] } },
          {
            type: "observation_chart",
            config: {
              plot: "primary-parameters",
              groups: ["Pulse"],
              height: 240,
              columns: 2,
            },
          },
          { type: "observation_chart", config: { height: 100 } },
          { type: "observation_chart", config: { columns: 3 } },
          { type: "observations", config: { limit: 5 } },
          { type: "plots", config: { plot: " " } },
          {
            type: "recent_encounters",
            config: {
              encounter_class: "imp",
              status: "completed",
              exclude_current: true,
            },
          },
          { type: "recent_encounters", config: { encounter_class: "ward" } },
          { type: "outstanding_orders", config: { include_completed: false } },
          { type: "current_medications", config: { sources: "statements" } },
          { type: "current_medications", config: { sources: "all" } },
        ],
      },
    ],
  });
  // Mismatched default tabs are accepted by validation and fall back at runtime.
  assert.equal(workspaceWidgetIssues(template, new Map(), i18next.t).length, 9);
});

test("automatically hidden columns collapse and an all-hidden page has no tracks", () => {
  const actionColumn = {
    span: 3,
    invalid: false,
    widgets: [{ type: "quick_actions" }],
  };
  const clinicalColumn = {
    span: 1,
    invalid: false,
    widgets: [{ type: "vitals" }],
  };
  assert.deepEqual(
    visibleWorkspaceColumns([clinicalColumn, actionColumn], closed),
    [clinicalColumn],
  );
  assert.deepEqual(visibleWorkspaceColumns([actionColumn], closed), []);
});

test("encounter-only widgets cannot be published on the patient-history surface", () => {
  const template = standardWorkspaceTemplate("patient_history", i18next.t);
  template.pages.push({
    kind: "custom",
    key: "invalid",
    title: "Invalid context",
    columns: [
      {
        span: 1,
        widgets: [
          { type: "quick_actions" },
          { type: "unavailable.widget" },
          { type: "legacy.tool" },
        ],
      },
    ],
  });
  const plugins = new Map([
    ["legacy.tool", { component: () => null, pluginSlug: "legacy" }],
  ]);
  assert.equal(workspaceWidgetIssues(template, plugins, i18next.t).length, 3);
});

test("new system references and surface changes cannot bypass page compatibility", () => {
  const saved = {
    schema_version: 2,
    surface: "encounter",
    pages: [{ kind: "system", key: "medicines" }],
  };
  assert.equal(
    createEncounterWorkspaceSchema([], saved).safeParse({
      ...saved,
      surface: "patient_history",
    }).success,
    false,
  );
  assert.equal(
    createEncounterWorkspaceSchema([], saved).safeParse({
      ...saved,
      pages: [{ kind: "system", key: "medicnes" }],
    }).success,
    false,
  );
});
