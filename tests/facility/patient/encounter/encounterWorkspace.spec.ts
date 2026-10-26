import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import type { PlugConfig } from "../../../../src/types/plugConfig";
import type { UserReadMinimal } from "../../../../src/types/user/user";
import type {
  WorkspaceRead,
  WorkspaceTemplate,
  WorkspaceUpdate,
  WorkspaceUserDefaultAttributes,
} from "../../../../src/types/workspace/workspace";
import { installEncounterWidgetRemote } from "../../../support/encounterWidgetRemote";

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1440, height: 1000 },
});

function roundsTemplate(
  includeOverview = false,
  additionalWidgets: Record<string, unknown>[] = [],
): WorkspaceTemplate {
  return {
    schema_version: 1,
    pages: [
      {
        key: "rounds",
        kind: "custom",
        title: "Ward rounds",
        icon: "stethoscope",
        columns: [
          {
            span: 1,
            widgets: [{ type: "allergies", title: "Allergy review" }],
          },
          { span: 1, widgets: [{ type: "symptoms", title: "Symptoms today" }] },
          {
            span: 2,
            widgets: [{ type: "diagnosis", title: "Diagnoses" }],
          },
          {
            span: 1,
            widgets: [
              {
                type: "markdown",
                title: "Ward phone list",
                config: { content: "Nursing 214" },
              },
              {
                type: "encounter_checklist",
                title: "Active encounter tools",
                visible_when: { "encounter.status": ["in_progress"] },
              },
              ...additionalWidgets,
            ],
          },
        ],
      },
      { key: "medicines", kind: "system" },
      { key: "devices", kind: "system", hidden: true },
      ...(includeOverview ? [{ key: "updates", kind: "system" }] : []),
    ],
  };
}

function user(): UserReadMinimal {
  return {
    id: faker.string.uuid(),
    username: faker.internet.username(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    phone_number: "+919999999999",
    user_type: "doctor",
    gender: "non_binary",
    last_login: "2026-01-01T00:00:00Z",
    profile_picture_url: "",
    mfa_enabled: false,
    deleted: false,
    is_service_account: false,
  };
}

async function mockEncounterWorkspaceApi(
  page: Page,
  options: {
    clinicalRead?: boolean;
    defaultLoadFailures?: number;
    includeOverview?: boolean;
    symptomCount?: number;
    allowWorkspaceUpdate?: boolean;
    includeSectionData?: boolean;
    includeConfigData?: boolean;
    includeWidgetData?: boolean;
  } = {},
) {
  let defaultLoadFailures = options.defaultLoadFailures ?? 0;
  const actor = user();
  const currentCareTeamMember = user();
  const pastCareTeamMember = user();
  const facility = {
    id: faker.string.uuid(),
    name: `Facility ${faker.word.words(2)}`,
    permissions: [
      "can_read_workspace",
      "can_list_patients",
      "can_list_encounter",
      ...(options.includeSectionData ? ["can_read_template"] : []),
    ],
    root_org_permissions: [],
    features: [],
  };
  const facilities = [facility];
  const patient = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    gender: "female",
    phone_number: "+919999999999",
    year_of_birth: 1980,
    date_of_birth: "1980-01-01",
    blood_group: "O+",
    deceased_datetime: null,
    created_date: "2026-01-01T00:00:00Z",
    modified_date: "2026-01-01T00:00:00Z",
    instance_tags: [],
    facility_tags: [],
    instance_identifiers: [],
    facility_identifiers: [],
    permissions:
      options.clinicalRead === false ? [] : ["can_view_clinical_data"],
  };
  const currentEncounter = {
    id: faker.string.uuid(),
    patient,
    facility,
    encounter_class: "amb",
    status: "in_progress",
    period: { start: "2026-10-01T08:00:00Z" },
    priority: "routine",
    status_history: { history: [] },
    created_date: "2026-10-01T08:00:00Z",
    modified_date: "2026-10-01T08:00:00Z",
    appointment: {},
    organizations: [],
    current_location: null,
    location_history: [],
    care_team: options.includeSectionData
      ? [
          {
            role: { system: "test", code: "doctor", display: "Ward doctor" },
            member: currentCareTeamMember,
          },
        ]
      : [],
    tags: [],
    created_by: actor,
    updated_by: actor,
    permissions: ["can_read_encounter"],
  };
  const pastEncounter = {
    ...currentEncounter,
    id: faker.string.uuid(),
    status: "completed",
    period: { start: "2026-09-01T08:00:00Z", end: "2026-09-02T08:00:00Z" },
    care_team: options.includeSectionData
      ? [
          {
            role: { system: "test", code: "doctor", display: "Ward doctor" },
            member: pastCareTeamMember,
          },
          // The signed-in user cared for the previous admission only.
          ...(options.includeWidgetData
            ? [
                {
                  role: {
                    system: "test",
                    code: "nurse",
                    display: "Ward nurse",
                  },
                  member: actor,
                },
              ]
            : []),
        ]
      : [],
  };
  const accountIds = new Map(
    [currentEncounter, pastEncounter].map(({ id }) => [
      id,
      faker.string.uuid(),
    ]),
  );
  const workspace: WorkspaceRead = {
    id: faker.string.uuid(),
    name: `Rounds ${faker.word.words(2)}`,
    description: "Encounter layout fixture",
    created_by: actor,
    updated_by: actor,
    template: roundsTemplate(options.includeOverview),
    status: "active",
  };
  // The original read API does not expose workspace scope metadata. Its list
  // already contains every workspace this user can access, including instance
  // workspaces and workspaces from other facilities.
  const workspaces: WorkspaceRead[] = [workspace];
  const defaults: WorkspaceUserDefaultAttributes[] = [
    { attribute: "encounter_class", value: "amb", workspace },
  ];
  const plugConfigs: PlugConfig[] = [];
  const workspaceUpdates: WorkspaceUpdate[] = [];
  const failures: {
    defaultSave: number;
    defaultSaveWorkspaceId?: string;
    defaultSaveValue?: string;
    symptoms: boolean;
    serviceOnHold: boolean;
  } = { defaultSave: 0, symptoms: false, serviceOnHold: false };
  const defaultWrites: {
    workspaceId: string;
    body: { attribute: string; value: string };
  }[] = [];
  const workspaceReads: URL[] = [];
  const clinicalReads: URL[] = [];
  const sectionReads: URL[] = [];
  const writes: string[] = [];
  const questionId = faker.string.uuid();
  const questionnaire = {
    id: faker.string.uuid(),
    slug: "daily-progress-note",
    title: `Ward assessment ${faker.string.alphanumeric(6)}`,
    version: 1,
    status: "active",
    subject_type: "encounter",
    auth_context: "instance",
    description: "Daily ward review",
    questions: [
      {
        id: questionId,
        link_id: "assessment",
        text: "Assessment",
        type: "string",
        required: false,
      },
    ],
  };
  const observations = [
    ...[currentEncounter, pastEncounter].map((encounter, index) => ({
      id: faker.string.uuid(),
      encounter: encounter.id,
      status: "final",
      subject_type: "encounter",
      main_code: {
        system: "http://loinc.org",
        code: "8867-4",
        display: "Pulse",
      },
      effective_datetime: encounter.period.start,
      value_type: "quantity",
      value: {
        value: index === 0 ? "82" : "64",
        unit: { system: "http://unitsofmeasure.org", code: "/min" },
      },
      created_by: actor,
      updated_by: actor,
    })),
    // An earlier pulse and a saturation reading give the latest-vitals tiles
    // a change to report and a second code to render.
    ...(options.includeWidgetData
      ? [
          {
            id: faker.string.uuid(),
            encounter: currentEncounter.id,
            status: "final",
            subject_type: "encounter",
            main_code: {
              system: "http://loinc.org",
              code: "8867-4",
              display: "Pulse",
            },
            effective_datetime: "2026-10-01T06:00:00Z",
            value_type: "quantity",
            value: {
              value: "76",
              unit: { system: "http://unitsofmeasure.org", code: "/min" },
            },
            created_by: pastCareTeamMember,
            updated_by: pastCareTeamMember,
          },
          {
            id: faker.string.uuid(),
            encounter: currentEncounter.id,
            status: "final",
            subject_type: "encounter",
            main_code: {
              system: "http://loinc.org",
              code: "2708-6",
              display: "Oxygen saturation",
            },
            effective_datetime: "2026-10-01T07:30:00Z",
            value_type: "quantity",
            value: {
              value: "97",
              unit: { system: "http://unitsofmeasure.org", code: "%" },
            },
            created_by: pastCareTeamMember,
            updated_by: pastCareTeamMember,
          },
        ]
      : []),
  ];
  const questionnaireResponses = [currentEncounter, pastEncounter]
    .map((encounter, index) => ({
      id: faker.string.uuid(),
      encounter: encounter.id,
      subject_id: encounter.id,
      status: "completed",
      questionnaire,
      responses: [
        {
          question_id: questionId,
          link_id: "assessment",
          values: [
            {
              type: "string",
              value: index === 0 ? "Current ward note" : "Prior admission note",
            },
          ],
        },
      ],
      created_by: actor,
      updated_by: actor,
      created_date: encounter.period.start,
      modified_date: encounter.period.start,
    }))
    .flatMap((response, index) => {
      if (!options.includeConfigData) return [response];
      const prefix = index === 0 ? "Current" : "Past";
      const rows = [2, 6, 1, 4, 3, 5].map((sequence) => ({
        ...response,
        id: faker.string.uuid(),
        created_date: new Date(
          Date.parse(response.created_date) + sequence * 60_000,
        ).toISOString(),
        responses: [
          {
            question_id: questionId,
            link_id: "assessment",
            values: [{ type: "string", value: `${prefix} note ${sequence}` }],
          },
        ],
      }));
      return [
        ...rows,
        {
          ...response,
          id: faker.string.uuid(),
          created_date: new Date(
            Date.parse(response.created_date) + 10 * 60_000,
          ).toISOString(),
          questionnaire: {
            ...questionnaire,
            id: faker.string.uuid(),
            slug: "nursing-assessment",
            title: "Nursing assessment",
          },
          responses: [
            {
              question_id: questionId,
              link_id: "assessment",
              values: [{ type: "string", value: "Unrelated nursing note" }],
            },
          ],
        },
      ];
    });
  const serviceRequests = options.includeConfigData
    ? [currentEncounter, pastEncounter].flatMap((encounter, index) =>
        [
          ...Array.from({ length: 11 }, (_, n) => ({
            status: "active",
            sequence: n + 1,
          })),
          { status: "on_hold", sequence: 1 },
          { status: "on_hold", sequence: 2 },
          { status: "completed", sequence: 1 },
        ].map(({ status, sequence }) => ({
          id: faker.string.uuid(),
          encounter,
          title: `${index === 0 ? "Current" : "Past"} ${status === "on_hold" ? "held" : status} order ${sequence}`,
          status,
          intent: "order",
          priority: "routine",
          category: "laboratory",
          do_not_perform: false,
          code: {
            system: "http://loinc.org",
            code: "2160-0",
            display: "Creatinine",
          },
          tags: [],
          locations: [],
          specimens: [],
          diagnostic_reports: [],
          created_date: new Date(
            Date.parse(encounter.period.start) + sequence * 60_000,
          ).toISOString(),
          created_by: actor,
          updated_by: actor,
        })),
      )
    : [];
  const draft = {
    id: faker.string.uuid(),
    status: "draft",
    created_date: "2026-10-01T10:00:00Z",
    modified_date: "2026-10-01T10:00:00Z",
    created_by: actor,
    updated_by: actor,
    response_dump: {
      questionnaireResponses: { questionnaire, responses: [] },
    },
  };
  const reportTemplate = {
    id: faker.string.uuid(),
    slug: `ward-summary-${faker.string.alphanumeric(6).toLowerCase()}`,
    name: "Ward summary report",
    status: "active",
    template_type: "discharge_summary",
    default_format: "html",
  };
  const clinicalNames = {
    current: {
      allergy_intolerance: "Penicillin allergy",
      symptom: "Fever today",
      diagnosis: "Current pneumonia",
    },
    past: {
      allergy_intolerance: "Latex allergy",
      symptom: "Cough last admission",
      diagnosis: "Previous asthma",
    },
  };
  const imagingReport = {
    id: faker.string.uuid(),
    status: "final",
    category: { system: "test", code: "imaging", display: "Imaging" },
    encounter: currentEncounter,
    observations: [],
    conclusion: "No acute findings",
    created_by: actor,
    updated_by: actor,
    requester: actor,
    created_date: "2026-10-01T12:00:00Z",
    modified_date: "2026-10-01T12:30:00Z",
  };
  const widgetOrders = options.includeWidgetData
    ? [
        {
          title: "Chest X-ray",
          status: "active",
          category: "imaging",
          code: {
            system: "http://loinc.org",
            code: "36643-5",
            display: "XR Chest",
          },
          diagnostic_reports: [imagingReport],
          created_date: "2026-10-01T09:00:00Z",
        },
        {
          title: "Creatinine",
          status: "active",
          category: "laboratory",
          code: {
            system: "http://loinc.org",
            code: "2160-0",
            display: "Creatinine",
          },
          diagnostic_reports: [],
          created_date: "2026-10-01T10:00:00Z",
        },
        {
          title: "Unsent draft order",
          status: "draft",
          category: "laboratory",
          code: {
            system: "http://loinc.org",
            code: "718-7",
            display: "Hemoglobin",
          },
          diagnostic_reports: [],
          created_date: "2026-10-01T11:00:00Z",
        },
      ].map((order) => ({
        id: faker.string.uuid(),
        encounter: currentEncounter,
        intent: "order",
        priority: "routine",
        do_not_perform: false,
        tags: [],
        locations: [],
        specimens: [],
        created_by: actor,
        updated_by: actor,
        ...order,
      }))
    : [];
  const otherPrescriber = user();
  const medicationRequests = options.includeWidgetData
    ? [
        {
          id: faker.string.uuid(),
          status: "active",
          intent: "order",
          category: "inpatient",
          priority: "routine",
          medication: {
            system: "http://snomed.info/sct",
            code: "322236009",
            display: "Paracetamol 500 mg tablet",
          },
          encounter: currentEncounter.id,
          dosage_instruction: [
            {
              text: "1-0-1",
              dose_and_rate: {
                dose_quantity: {
                  value: 500,
                  unit: {
                    system: "http://unitsofmeasure.org",
                    code: "mg",
                    display: "mg",
                  },
                },
              },
            },
          ],
          authored_on: "2026-10-01T09:30:00Z",
          created_date: "2026-10-01T09:30:00Z",
          modified_date: "2026-10-01T09:30:00Z",
          created_by: actor,
          updated_by: actor,
          requester: actor,
        },
        {
          id: faker.string.uuid(),
          status: "active",
          intent: "order",
          category: "inpatient",
          priority: "routine",
          medication: {
            system: "http://snomed.info/sct",
            code: "387458008",
            display: "Aspirin 75 mg tablet",
          },
          encounter: pastEncounter.id,
          dosage_instruction: [{ text: "0-0-1" }],
          authored_on: "2026-09-01T09:30:00Z",
          created_date: "2026-09-01T09:30:00Z",
          modified_date: "2026-09-01T09:30:00Z",
          created_by: otherPrescriber,
          updated_by: otherPrescriber,
          requester: otherPrescriber,
        },
        {
          id: faker.string.uuid(),
          status: "completed",
          intent: "order",
          category: "inpatient",
          priority: "routine",
          medication: {
            system: "http://snomed.info/sct",
            code: "372756006",
            display: "Warfarin 5 mg tablet",
          },
          encounter: pastEncounter.id,
          dosage_instruction: [{ text: "1-0-0" }],
          authored_on: "2026-09-01T10:00:00Z",
          created_date: "2026-09-01T10:00:00Z",
          modified_date: "2026-09-02T10:00:00Z",
          created_by: otherPrescriber,
          updated_by: otherPrescriber,
          requester: otherPrescriber,
        },
      ]
    : [];
  const medicationStatements = options.includeWidgetData
    ? [
        {
          id: faker.string.uuid(),
          status: "active",
          medication: {
            system: "http://snomed.info/sct",
            code: "109081006",
            display: "Metformin 500 mg tablet",
          },
          dosage_text: "1-0-1 after food",
          effective_period: { start: "2026-08-15T00:00:00Z" },
          encounter: currentEncounter.id,
          information_source: "patient",
          created_date: "2026-10-01T09:45:00Z",
          modified_date: "2026-10-01T09:45:00Z",
          created_by: actor,
          updated_by: actor,
        },
        {
          id: faker.string.uuid(),
          status: "stopped",
          medication: {
            system: "http://snomed.info/sct",
            code: "387517004",
            display: "Stopped statin",
          },
          dosage_text: "0-0-1",
          encounter: currentEncounter.id,
          information_source: "patient",
          created_date: "2026-10-01T09:50:00Z",
          modified_date: "2026-10-01T09:50:00Z",
          created_by: actor,
          updated_by: actor,
        },
      ]
    : [];

  await page.addInitScript(() => {
    localStorage.setItem("care_access_token", "encounter-workspace-test");
  });
  if (options.includeSectionData) {
    await page.route("**/config/plots.json", async (route) => {
      await route.fulfill({
        json: [
          {
            id: "primary-parameters",
            name: "Primary Parameters",
            groups: [
              { title: "Pulse", codes: [observations[0].main_code] },
              {
                title: "SpO2",
                codes: [
                  {
                    system: "http://loinc.org",
                    code: "2708-6",
                    display: "Oxygen saturation",
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  }
  // Every API request is isolated, including unexpected writes, so these
  // rendering tests cannot mutate the configured backend or clinical data.
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      if (request.method() !== "GET") {
        // Analysis is a read in disguise: the chart groups readings per code.
        if (
          options.includeSectionData &&
          request.method() === "POST" &&
          path === `/api/v1/patient/${patient.id}/observation/analyse/`
        ) {
          clinicalReads.push(url);
          sectionReads.push(url);
          const body = request.postDataJSON() as {
            codes: { code: string }[];
            page_size?: number;
          };
          await route.fulfill({
            json: {
              results: body.codes.map((code) => ({
                code,
                results: observations
                  .filter(
                    (item) =>
                      item.main_code.code === code.code &&
                      item.encounter === url.searchParams.get("encounter"),
                  )
                  .sort(
                    (a, b) =>
                      Date.parse(b.effective_datetime) -
                      Date.parse(a.effective_datetime),
                  )
                  .slice(0, body.page_size ?? 10),
              })),
            },
          });
          return;
        }
        writes.push(`${request.method()} ${path}`);
        if (
          options.allowWorkspaceUpdate &&
          request.method() === "PUT" &&
          path === `/api/v1/workspace/${workspace.id}/`
        ) {
          const body = request.postDataJSON() as WorkspaceUpdate;
          workspaceUpdates.push(body);
          Object.assign(workspace, body);
          await route.fulfill({ json: workspace });
          return;
        }
        if (
          request.method() === "POST" &&
          facilities.some(
            ({ id }) =>
              path === `/api/v1/facility/${id}/account/default_account/`,
          )
        ) {
          const body = request.postDataJSON() as {
            patient: string;
            facility: string;
            encounter: string;
          };
          const accountEncounter = [currentEncounter, pastEncounter].find(
            (encounter) =>
              encounter.id === body.encounter &&
              encounter.facility.id === body.facility &&
              body.patient === patient.id,
          );
          if (accountEncounter) {
            await route.fulfill({
              json: {
                id: accountIds.get(accountEncounter.id),
                name: "Encounter account",
                status: "active",
                billing_status: "open",
                description: "",
                service_period: accountEncounter.period,
                extensions: {},
                patient,
                primary_encounter: accountEncounter,
                total_net: "0",
                total_gross: "0",
                total_paid: "0",
                total_balance: "0",
                total_billable_charge_items: "0",
                created_date: accountEncounter.created_date,
                tags: [],
              },
            });
            return;
          }
        }
        const choice = workspaces.find(
          ({ id }) =>
            path === `/api/v1/workspace/${id}/set_default_attributes/`,
        );
        if (request.method() === "POST" && choice) {
          const body = request.postDataJSON() as {
            attribute: string;
            value: string;
          };
          defaultWrites.push({ workspaceId: choice.id, body });
          if (
            failures.defaultSave > 0 &&
            (!failures.defaultSaveWorkspaceId ||
              failures.defaultSaveWorkspaceId === choice.id) &&
            (failures.defaultSaveValue === undefined ||
              failures.defaultSaveValue === body.value)
          ) {
            failures.defaultSave -= 1;
            await route.fulfill({
              status: 503,
              json: { detail: "Temporarily unavailable" },
            });
            return;
          }
          // The original setter replaces this workspace's attribute value;
          // it leaves defaults belonging to other workspaces unchanged.
          const remaining = defaults.filter(
            ({ attribute, workspace }) =>
              workspace.id !== choice.id || attribute !== body.attribute,
          );
          defaults.splice(0, defaults.length, ...remaining, {
            ...body,
            workspace: choice,
          });
          await route.fulfill({ json: {} });
          return;
        }
        await route.abort();
        return;
      }
      if (path === "/api/v1/users/getcurrentuser/") {
        await route.fulfill({
          json: {
            ...actor,
            is_superuser: false,
            permissions: [],
            facilities: [],
            organizations: [],
            preferences: {},
            flags: [],
          },
        });
        return;
      }
      if (path === "/api/v1/plug_config/") {
        await route.fulfill({ json: { configs: plugConfigs } });
        return;
      }
      const requestedFacility = facilities.find(
        ({ id }) => path === `/api/v1/facility/${id}/`,
      );
      if (requestedFacility) {
        await route.fulfill({ json: requestedFacility });
        return;
      }
      if (path === `/api/v1/patient/${patient.id}/`) {
        await route.fulfill({ json: patient });
        return;
      }
      if (path === "/api/v1/encounter/") {
        const careTeamUser = url.searchParams.get("care_team_user");
        const results = [currentEncounter, pastEncounter].filter(
          (encounter) =>
            !careTeamUser ||
            encounter.care_team.some(
              ({ member }) => member.username === careTeamUser,
            ),
        );
        const limit = Number(url.searchParams.get("limit") ?? results.length);
        await route.fulfill({
          json: { count: results.length, results: results.slice(0, limit) },
        });
        return;
      }
      const encounter = [currentEncounter, pastEncounter].find(
        (item) => path === `/api/v1/encounter/${item.id}/`,
      );
      if (encounter) {
        await route.fulfill({ json: encounter });
        return;
      }
      if (path === "/api/v1/workspace/get_user_default_attributes/") {
        if (defaultLoadFailures > 0) {
          defaultLoadFailures -= 1;
          await route.fulfill({
            status: 503,
            json: { detail: "Temporarily unavailable" },
          });
          return;
        }
        // Preserve the backend's minimal embedded workspace response.
        await route.fulfill({
          json: {
            count: defaults.length,
            results: defaults.map(({ attribute, value, workspace }) => ({
              attribute,
              value,
              workspace: {
                id: workspace.id,
                name: workspace.name,
                description: workspace.description,
                template: workspace.template,
                status: workspace.status,
              },
            })),
          },
        });
        return;
      }
      if (path === "/api/v1/workspace/") {
        workspaceReads.push(url);
        // As in the backend, status filters the list but not detail reads.
        const status = url.searchParams.get("status");
        const results = status
          ? workspaces.filter((item) => item.status === status)
          : workspaces;
        await route.fulfill({
          json: { count: results.length, results },
        });
        return;
      }
      if (path === `/api/v1/workspace/${workspace.id}/`) {
        await route.fulfill({ json: workspace });
        return;
      }
      if (options.includeSectionData) {
        if (
          [currentEncounter, pastEncounter].some(
            (encounter) =>
              path ===
              `/api/v1/facility/${encounter.facility.id}/service_request/`,
          )
        ) {
          clinicalReads.push(url);
          sectionReads.push(url);
          if (
            failures.serviceOnHold &&
            url.searchParams.get("status") === "on_hold"
          ) {
            await route.fulfill({
              status: 503,
              json: { detail: "Service requests temporarily unavailable" },
            });
            return;
          }
          const results = [...serviceRequests, ...widgetOrders]
            .filter(
              (request) =>
                path ===
                  `/api/v1/facility/${request.encounter.facility.id}/service_request/` &&
                request.encounter.id === url.searchParams.get("encounter") &&
                (!url.searchParams.has("status") ||
                  request.status === url.searchParams.get("status")) &&
                (!url.searchParams.has("category") ||
                  request.category === url.searchParams.get("category")),
            )
            .sort(
              (a, b) => Date.parse(b.created_date) - Date.parse(a.created_date),
            );
          const offset = Number(url.searchParams.get("offset") ?? 0);
          const limit = Number(url.searchParams.get("limit") ?? 20);
          await route.fulfill({
            json: {
              count: results.length,
              results: results.slice(offset, offset + limit),
            },
          });
          return;
        }
        if (path === "/api/v1/template/") {
          sectionReads.push(url);
          const results =
            url.searchParams.get("facility") === facility.id
              ? [reportTemplate]
              : [];
          await route.fulfill({ json: { count: results.length, results } });
          return;
        }
        if (path === `/api/v1/patient/${patient.id}/observation/`) {
          clinicalReads.push(url);
          sectionReads.push(url);
          const codes = url.searchParams.get("codes")?.split(",");
          const results = observations.filter(
            (item) =>
              item.encounter === url.searchParams.get("encounter") &&
              (!codes || codes.includes(item.main_code.code)),
          );
          await route.fulfill({ json: { count: results.length, results } });
          return;
        }
        if (path === `/api/v1/patient/${patient.id}/medication/request/`) {
          clinicalReads.push(url);
          sectionReads.push(url);
          const statuses = url.searchParams.get("status")?.split(",");
          const results = medicationRequests.filter(
            (item) =>
              (!statuses || statuses.includes(item.status)) &&
              (!url.searchParams.has("encounter") ||
                item.encounter === url.searchParams.get("encounter")),
          );
          await route.fulfill({ json: { count: results.length, results } });
          return;
        }
        if (path === `/api/v1/patient/${patient.id}/medication/statement/`) {
          clinicalReads.push(url);
          sectionReads.push(url);
          const statuses = url.searchParams.get("status")?.split(",");
          const results = medicationStatements.filter(
            (item) => !statuses || statuses.includes(item.status),
          );
          await route.fulfill({ json: { count: results.length, results } });
          return;
        }
        if (path === `/api/v1/patient/${patient.id}/questionnaire_response/`) {
          clinicalReads.push(url);
          sectionReads.push(url);
          const results = questionnaireResponses
            .filter(
              (item) =>
                item.encounter === url.searchParams.get("encounter") &&
                (!url.searchParams.has("questionnaire_slug") ||
                  item.questionnaire.slug ===
                    url.searchParams.get("questionnaire_slug")),
            )
            .sort(
              (a, b) => Date.parse(b.created_date) - Date.parse(a.created_date),
            );
          const offset = Number(url.searchParams.get("offset") ?? 0);
          const limit = Math.min(
            Number(url.searchParams.get("limit") ?? 10),
            options.includeConfigData ? 2 : 100,
          );
          await route.fulfill({
            json: {
              count: results.length,
              results: results.slice(offset, offset + limit),
            },
          });
          return;
        }
        if (path === "/api/v1/form_submission/") {
          sectionReads.push(url);
          const results =
            url.searchParams.get("encounter") === currentEncounter.id &&
            url.searchParams.get("status") === "draft"
              ? [draft]
              : [];
          await route.fulfill({ json: { count: results.length, results } });
          return;
        }
        if (path === `/api/v1/form_submission/${draft.id}/`) {
          await route.fulfill({ json: draft });
          return;
        }
        if (path === "/api/v1/questionnaire/") {
          sectionReads.push(url);
          await route.fulfill({ json: { count: 1, results: [questionnaire] } });
          return;
        }
        if (path === `/api/v1/questionnaire/${questionnaire.id}/`) {
          await route.fulfill({ json: questionnaire });
          return;
        }
      }
      const clinicalType = (
        ["allergy_intolerance", "symptom", "diagnosis"] as const
      ).find((type) => path === `/api/v1/patient/${patient.id}/${type}/`);
      if (clinicalType) {
        clinicalReads.push(url);
        if (clinicalType === "symptom" && failures.symptoms) {
          await route.fulfill({
            status: 503,
            json: { detail: "Clinical information temporarily unavailable" },
          });
          return;
        }
        const past = url.searchParams.get("encounter") === pastEncounter.id;
        const count =
          clinicalType === "symptom" && !past ? (options.symptomCount ?? 1) : 1;
        const offset = Number(url.searchParams.get("offset") ?? 0);
        const limit = Number(url.searchParams.get("limit") ?? count);
        await route.fulfill({
          json: {
            count,
            results: Array.from(
              { length: Math.max(0, Math.min(limit, count - offset)) },
              (_, index) => ({
                id: faker.string.uuid(),
                code: {
                  system: "http://snomed.info/sct",
                  code: `${123 + offset + index}`,
                  display: `${clinicalNames[past ? "past" : "current"][clinicalType]}${offset + index ? ` ${offset + index + 1}` : ""}`,
                },
                encounter: past ? pastEncounter.id : currentEncounter.id,
                clinical_status: "active",
                verification_status: "confirmed",
                category:
                  clinicalType === "allergy_intolerance"
                    ? "medication"
                    : "encounter_diagnosis",
                criticality: "high",
                severity: "moderate",
                onset: { onset_datetime: "2026-10-01T08:00:00Z" },
                note: "",
                created_by: actor,
                updated_by: actor,
                created_date: "2026-10-01T08:00:00Z",
              }),
            ),
          },
        });
        return;
      }
      await route.fulfill({ json: { count: 0, results: [] } });
    },
  );

  return {
    actor,
    facility,
    facilities,
    patient,
    currentEncounter,
    pastEncounter,
    workspace,
    workspaces,
    defaults,
    plugConfigs,
    workspaceUpdates,
    failures,
    defaultWrites,
    workspaceReads,
    clinicalNames,
    clinicalReads,
    sectionReads,
    questionnaire,
    questionnaireResponses,
    draft,
    reportTemplate,
    currentCareTeamMember,
    pastCareTeamMember,
    otherPrescriber,
    imagingReport,
    widgetOrders,
    writes,
    basePath: `/facility/${facility.id}/patient/${patient.id}/encounter/${currentEncounter.id}`,
  };
}

test.describe("Encounter workspace rendering", () => {
  test("renders configured clinical data while retaining system pages and encounter navigation", async ({
    page,
  }, testInfo) => {
    const fixture = await mockEncounterWorkspaceApi(page, {
      includeOverview: true,
      symptomCount: 15,
    });
    await page.goto(`${fixture.basePath}/files`);
    await expect(
      page.getByRole("combobox", { name: "Workspace", exact: true }),
    ).toHaveCount(0);
    await expect(page).toHaveURL(
      (url) =>
        url.pathname.endsWith("/rounds") && !url.searchParams.has("workspace"),
    );
    await expect(
      page.getByRole("heading", { name: "Ward rounds", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: fixture.patient.name, exact: true }),
    ).toBeVisible();
    for (const [panel, clinicalType] of [
      ["Allergy review", "allergy_intolerance"],
      ["Symptoms today", "symptom"],
      ["Diagnoses", "diagnosis"],
    ] as const) {
      const region = page.getByRole("region", { name: panel, exact: true });
      await expect(
        region
          .getByText(fixture.clinicalNames.current[clinicalType], {
            exact: true,
          })
          .first(),
      ).toBeVisible();
      await expect(
        region.getByRole("link", { name: "Edit", exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByText("Active encounter tools", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Ward phone list", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByText(
          "This widget is unavailable. Its plugin may not be enabled, or the widget type may not be supported.",
          { exact: true },
        )
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Devices", exact: true }),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("tablist", { name: "Encounter navigation", exact: true })
        .getByRole("tab"),
    ).toHaveText(["Ward rounds", "Medications", "Overview"]);

    await test.step("Load the next clinical page without losing earlier records", async () => {
      const symptoms = page.getByRole("region", {
        name: "Symptoms today",
        exact: true,
      });
      await expect(
        symptoms.getByText("Fever today 15", { exact: true }),
      ).toHaveCount(0);
      await symptoms
        .getByRole("button", { name: "Load More", exact: true })
        .click();
      await expect(
        symptoms.getByText("Fever today 15", { exact: true }).first(),
      ).toBeVisible();
      await expect(
        symptoms.getByText("Fever today", { exact: true }).first(),
      ).toBeVisible();
      await expect(
        symptoms.getByRole("button", { name: "Load More", exact: true }),
      ).toHaveCount(0);
      expect(
        fixture.clinicalReads.some(
          (url) =>
            url.pathname.endsWith("/symptom/") &&
            url.searchParams.get("encounter") === fixture.currentEncounter.id &&
            url.searchParams.get("offset") === "14" &&
            url.searchParams.get("limit") === "14",
        ),
      ).toBe(true);
    });

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: testInfo.outputPath("encounter-workspace-desktop.png"),
      fullPage: true,
    });

    await test.step("Return to the configured page after opening a clinical form", async () => {
      await page
        .getByRole("region", { name: "Symptoms today", exact: true })
        .getByRole("link", { name: "Edit", exact: true })
        .click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname.endsWith("/questionnaire/symptom") &&
          url.searchParams.get("return_page") === "rounds" &&
          !url.searchParams.has("workspace"),
      );
      await expect(
        page.getByRole("region", { name: "Form canvas", exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname.endsWith("/rounds") &&
          !url.searchParams.has("workspace"),
      );
      await expect(
        page.getByRole("heading", { name: "Ward rounds", exact: true }),
      ).toBeVisible();
    });

    await test.step("Keep clinical cards usable at a narrow width", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(
        page
          .getByRole("region", { name: "Symptoms today", exact: true })
          .getByText("Fever today", { exact: true })
          .first(),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          ),
        )
        .toBeLessThanOrEqual(0);
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await page.screenshot({
        path: testInfo.outputPath("encounter-workspace-mobile.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
    });

    await test.step("Overview renders the same clinical data and links to its own return page", async () => {
      await page.getByRole("tab", { name: "Overview", exact: true }).click();
      await expect(page).toHaveURL((url) => url.pathname.endsWith("/updates"));
      for (const [panel, clinicalType, questionnaire] of [
        ["Allergies", "allergy_intolerance", "allergy_intolerance"],
        ["Symptoms", "symptom", "symptom"],
        ["Diagnoses", "diagnosis", "diagnosis"],
      ] as const) {
        const region = page.getByRole("region", { name: panel, exact: true });
        await expect(
          region
            .getByText(fixture.clinicalNames.current[clinicalType], {
              exact: true,
            })
            .filter({ visible: true }),
        ).toBeVisible();
        await expect(
          region.getByRole("link", { name: "Edit", exact: true }),
        ).toHaveAttribute(
          "href",
          `${fixture.basePath}/questionnaire/${questionnaire}?return_page=updates`,
        );
      }
      await expect(
        page
          .getByRole("region", { name: "Symptoms", exact: true })
          .getByText("Fever today 15", { exact: true })
          .filter({ visible: true }),
      ).toBeVisible();
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await page.screenshot({
        path: testInfo.outputPath("encounter-overview-desktop.png"),
        fullPage: true,
      });
      await page.getByRole("tab", { name: "Ward rounds", exact: true }).click();
    });

    await page.getByRole("button", { name: /Encounter History/i }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Completed/ })
      .click();
    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("selectedEncounter") ===
          fixture.pastEncounter.id && !url.searchParams.has("workspace"),
    );
    await page.getByRole("tab", { name: "Overview", exact: true }).click();
    for (const [panel, clinicalType] of [
      ["Allergies", "allergy_intolerance"],
      ["Symptoms", "symptom"],
      ["Diagnoses", "diagnosis"],
    ] as const) {
      const region = page.getByRole("region", { name: panel, exact: true });
      await expect(
        region
          .getByText(fixture.clinicalNames.past[clinicalType], { exact: true })
          .filter({ visible: true }),
      ).toBeVisible();
      await expect(
        region.getByRole("link", { name: "Edit", exact: true }),
      ).toHaveCount(0);
    }
    await expect(
      page
        .getByRole("region", { name: "Symptoms", exact: true })
        .getByRole("link", { name: "View History", exact: true }),
    ).toHaveAttribute(
      "href",
      `/facility/${fixture.facility.id}/patient/${fixture.patient.id}/history/symptoms?sourceUrl=${encodeURIComponent(`${fixture.basePath}/updates?selectedEncounter=${fixture.pastEncounter.id}`)}`,
    );
    await page.getByRole("tab", { name: "Ward rounds", exact: true }).click();
    const symptoms = page.getByRole("region", {
      name: "Symptoms today",
      exact: true,
    });
    await expect(
      symptoms.getByText("Cough last admission", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      symptoms.getByText("Fever today", { exact: true }),
    ).toHaveCount(0);
    await expect(
      symptoms.getByRole("link", { name: "Edit", exact: true }),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("region", { name: "Diagnoses", exact: true })
        .getByText("Previous asthma", { exact: true })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByText("Active encounter tools", { exact: true }),
    ).toHaveCount(0);

    await page
      .getByRole("button", { name: "Encounter Actions", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("option", { name: /^Medicines/ })
      .click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname.endsWith("/medicines") &&
        !url.searchParams.has("workspace") &&
        url.searchParams.get("selectedEncounter") === fixture.pastEncounter.id,
    );
    await page.getByRole("tab", { name: "Ward rounds", exact: true }).click();
    await page.getByRole("tab", { name: "Medications", exact: true }).click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname.endsWith("/medicines") &&
        !url.searchParams.has("workspace") &&
        url.searchParams.get("selectedEncounter") === fixture.pastEncounter.id,
    );
    await expect(
      page.getByRole("heading", { name: "Medications", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("No Active Medication Recorded", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Back to current encounter", exact: true })
      .click();
    await expect(page).toHaveURL(
      (url) =>
        !url.searchParams.has("selectedEncounter") &&
        !url.searchParams.has("workspace"),
    );
    await page.reload();
    await expect(
      page.getByRole("tab", { name: "Devices", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("tab", { name: "Ward rounds", exact: true }),
    ).toBeVisible();
    // Overview also queries the default account through a POST endpoint.
    expect(
      fixture.writes.filter(
        (request) => !request.endsWith("/account/default_account/"),
      ),
    ).toEqual([]);
  });

  test("selects workspace defaults from the header for the current encounter class across facilities", async ({
    page,
  }) => {
    const fixture = await mockEncounterWorkspaceApi(page);
    fixture.defaults.splice(0);
    fixture.currentEncounter.encounter_class = "imp";
    const otherFacility = {
      ...fixture.facility,
      id: faker.string.uuid(),
      name: `Facility ${faker.word.words(2)}`,
    };
    fixture.facilities.push(otherFacility);
    fixture.pastEncounter.facility = otherFacility;
    const outpatientPath = `/facility/${otherFacility.id}/patient/${fixture.patient.id}/encounter/${fixture.pastEncounter.id}`;
    const alternateWorkspace: WorkspaceRead = {
      ...fixture.workspace,
      id: faker.string.uuid(),
      name: `Review ${faker.word.words(2)}`,
      template: {
        schema_version: 1,
        pages: [
          {
            kind: "custom",
            key: "review",
            title: "Clinical review",
            columns: [{ span: 1, widgets: [{ type: "symptoms" }] }],
          },
        ],
      },
    };
    fixture.workspaces.push(alternateWorkspace);

    const openPicker = async () => {
      await page
        .getByRole("button", { name: "Workspace", exact: true })
        .click();
      const picker = page.getByRole("dialog", {
        name: "Workspace",
        exact: true,
      });
      await expect(picker).toBeVisible();
      return picker;
    };

    await test.step("Keep the standard page until the doctor chooses a workspace", async () => {
      await page.goto(`${fixture.basePath}/updates`);
      await expect(
        page.getByRole("tab", { name: "Overview", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        page.getByRole("tab", { name: "Ward rounds", exact: true }),
      ).toHaveCount(0);
      const picker = await openPicker();
      await expect(
        picker.getByText("Workspace: Standard encounter", { exact: true }),
      ).toBeVisible();
      await expect(
        picker.getByText("Use this workspace for your Inpatient encounters.", {
          exact: true,
        }),
      ).toBeVisible();
      await picker
        .getByRole("combobox", {
          name: "Search workspaces by name",
          exact: true,
        })
        .fill(fixture.workspace.name);
      await expect(
        picker.getByRole("option").filter({ hasText: alternateWorkspace.name }),
      ).toHaveCount(0);
      await picker
        .getByRole("option")
        .filter({ hasText: fixture.workspace.name })
        .click();
      await expect(page).toHaveURL((url) => url.pathname.endsWith("/rounds"));
      await expect(
        page.getByRole("heading", { name: "Ward rounds", exact: true }),
      ).toBeVisible();
      await expect(picker).not.toBeVisible();
      expect(fixture.defaultWrites).toEqual([
        {
          workspaceId: fixture.workspace.id,
          body: { attribute: "encounter_class", value: "imp" },
        },
      ]);
      expect(fixture.workspaceReads.length).toBeGreaterThan(0);
      for (const request of fixture.workspaceReads) {
        expect(request.searchParams.has("facility")).toBe(false);
        expect(request.searchParams.has("auth_context")).toBe(false);
      }
    });

    await test.step("Apply the saved layout on entry and retain configured system-page navigation", async () => {
      await page.goto(`${fixture.basePath}/updates`);
      await expect(page).toHaveURL((url) => url.pathname.endsWith("/rounds"));
      await page.getByRole("tab", { name: "Medications", exact: true }).click();
      await expect(page).toHaveURL((url) =>
        url.pathname.endsWith("/medicines"),
      );
      await expect(
        page.getByRole("tab", { name: "Medications", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Medications", exact: true }),
      ).toBeVisible();
      await expect(page).toHaveURL((url) =>
        url.pathname.endsWith("/medicines"),
      );
      await page.goto(`${fixture.basePath}/updates`);
      await expect(page).toHaveURL((url) => url.pathname.endsWith("/rounds"));
    });

    await test.step("Retain inpatient and outpatient defaults on the same workspace across facilities", async () => {
      await page.goto(`${outpatientPath}/updates`);
      await expect(
        page.getByRole("tab", { name: "Ward rounds", exact: true }),
      ).toHaveCount(0);
      const picker = await openPicker();
      await expect(
        picker.getByText("Workspace: Standard encounter", { exact: true }),
      ).toBeVisible();
      await expect(
        picker.getByText("Use this workspace for your Ambulatory encounters.", {
          exact: true,
        }),
      ).toBeVisible();
      await picker
        .getByRole("option")
        .filter({ hasText: fixture.workspace.name })
        .click();
      await expect(page).toHaveURL((url) => url.pathname.endsWith("/rounds"));
      await expect(
        page.getByRole("heading", { name: "Ward rounds", exact: true }),
      ).toBeVisible();
      expect(fixture.defaultWrites[1]).toMatchObject({
        workspaceId: fixture.workspace.id,
        body: { attribute: "encounter_class" },
      });
      expect(fixture.defaultWrites[1].body.value.split(",").sort()).toEqual([
        "amb",
        "imp",
      ]);
      await page.goto(`${outpatientPath}/updates`);
      await expect(page).toHaveURL((url) => url.pathname.endsWith("/rounds"));
      await page.goto(`${fixture.basePath}/updates`);
      await expect(
        page.getByRole("heading", { name: "Ward rounds", exact: true }),
      ).toBeVisible();
      await expect(page).toHaveURL((url) => url.pathname.endsWith("/rounds"));
      await page.goto(`${outpatientPath}/updates`);
      await expect(page).toHaveURL((url) => url.pathname.endsWith("/rounds"));
    });

    const unrelatedWorkspace: WorkspaceRead = {
      ...fixture.workspace,
      id: faker.string.uuid(),
      name: `Unrelated ${faker.word.words(2)}`,
    };
    const inaccessibleWorkspace: WorkspaceRead = {
      ...fixture.workspace,
      id: faker.string.uuid(),
      name: `Inaccessible ${faker.word.words(2)}`,
    };
    fixture.workspaces.push(unrelatedWorkspace);
    const protectedDefaults: WorkspaceUserDefaultAttributes[] = [
      {
        attribute: "encounter_class",
        value: "obsenc",
        workspace: unrelatedWorkspace,
      },
      { attribute: "status", value: "amb", workspace: fixture.workspace },
      {
        attribute: "encounter_class",
        value: "amb",
        workspace: inaccessibleWorkspace,
      },
    ];
    fixture.defaults.push(...protectedDefaults);

    await test.step("Persist a replacement workspace without changing other class or attribute defaults", async () => {
      const picker = await openPicker();
      await picker
        .getByRole("option")
        .filter({ hasText: alternateWorkspace.name })
        .click();
      await expect(picker).not.toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Clinical review", exact: true }),
      ).toBeVisible();
      await expect(page).toHaveURL((url) => url.pathname.endsWith("/review"));
      expect(fixture.defaultWrites.slice(2)).toEqual([
        {
          workspaceId: fixture.workspace.id,
          body: { attribute: "encounter_class", value: "imp" },
        },
        {
          workspaceId: alternateWorkspace.id,
          body: { attribute: "encounter_class", value: "amb" },
        },
      ]);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Clinical review", exact: true }),
      ).toBeVisible();
    });

    await test.step("Retry cleanup when a partial clear makes the chosen workspace active", async () => {
      const competingWorkspace: WorkspaceRead = {
        ...alternateWorkspace,
        id: faker.string.uuid(),
        name: `Competing ${faker.word.words(2)}`,
      };
      fixture.workspaces.push(competingWorkspace);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Clinical review", exact: true }),
      ).toBeVisible();
      // These legacy rules arrive after page load: clearing one competitor can
      // make the chosen workspace active before another cleanup request fails.
      for (const rule of fixture.defaults) {
        if (
          rule.workspace.id === fixture.workspace.id &&
          rule.attribute === "encounter_class"
        ) {
          rule.value = "imp,amb";
        }
      }
      fixture.defaults.push({
        attribute: "encounter_class",
        value: "amb",
        workspace: competingWorkspace,
      });
      fixture.failures.defaultSave = 1;
      fixture.failures.defaultSaveWorkspaceId = competingWorkspace.id;
      fixture.failures.defaultSaveValue = "";
      const writesBefore = fixture.defaultWrites.length;
      const picker = await openPicker();
      const choice = picker
        .getByRole("option")
        .filter({ hasText: fixture.workspace.name });
      await choice.click();
      await expect(picker.getByRole("alert")).toHaveText(
        "Could not select this workspace. Please try again.",
      );
      await expect(
        picker.getByText(`Workspace: ${fixture.workspace.name}`, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Ward rounds", exact: true }),
      ).toBeVisible();
      expect(fixture.defaultWrites.slice(writesBefore)).toEqual([
        {
          workspaceId: alternateWorkspace.id,
          body: { attribute: "encounter_class", value: "" },
        },
        {
          workspaceId: competingWorkspace.id,
          body: { attribute: "encounter_class", value: "" },
        },
      ]);
      await choice.click();
      await expect(picker).not.toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Ward rounds", exact: true }),
      ).toBeVisible();
      const retryWrites = fixture.defaultWrites.slice(writesBefore + 2);
      expect(retryWrites).toHaveLength(2);
      expect(retryWrites[0]).toEqual({
        workspaceId: competingWorkspace.id,
        body: { attribute: "encounter_class", value: "" },
      });
      expect(retryWrites[1].workspaceId).toBe(fixture.workspace.id);
      expect(retryWrites[1].body.value.split(",").sort()).toEqual([
        "amb",
        "imp",
      ]);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Ward rounds", exact: true }),
      ).toBeVisible();
    });

    await test.step("Show the saved server state when the chosen workspace fails and allow retry", async () => {
      fixture.failures.defaultSave = 1;
      fixture.failures.defaultSaveWorkspaceId = alternateWorkspace.id;
      fixture.failures.defaultSaveValue = "amb";
      const writesBefore = fixture.defaultWrites.length;
      const picker = await openPicker();
      const choice = picker
        .getByRole("option")
        .filter({ hasText: alternateWorkspace.name });
      await choice.click();
      await expect(picker.getByRole("alert")).toHaveText(
        "Could not select this workspace. Please try again.",
      );
      await expect(
        picker.getByText("Workspace: Standard encounter", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Overview", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Clinical review", exact: true }),
      ).toHaveCount(0);
      await choice.click();
      await expect(picker).not.toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Clinical review", exact: true }),
      ).toBeVisible();
      expect(fixture.defaultWrites.slice(writesBefore)).toEqual([
        {
          workspaceId: fixture.workspace.id,
          body: { attribute: "encounter_class", value: "imp" },
        },
        {
          workspaceId: alternateWorkspace.id,
          body: { attribute: "encounter_class", value: "amb" },
        },
        {
          workspaceId: alternateWorkspace.id,
          body: { attribute: "encounter_class", value: "amb" },
        },
      ]);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Clinical review", exact: true }),
      ).toBeVisible();
      await page.goto(`${fixture.basePath}/updates`);
      await expect(
        page.getByRole("heading", { name: "Ward rounds", exact: true }),
      ).toBeVisible();
      expect(fixture.defaults).toEqual(
        expect.arrayContaining(protectedDefaults),
      );
      for (const workspace of [unrelatedWorkspace, inaccessibleWorkspace]) {
        expect(fixture.writes).not.toContain(
          `POST /api/v1/workspace/${workspace.id}/set_default_attributes/`,
        );
      }
      expect(
        fixture.defaultWrites.every(
          ({ body }) => body.attribute === "encounter_class",
        ),
      ).toBe(true);
    });
  });

  test("offers only active workspaces and ignores saved choices for archived ones", async ({
    page,
  }) => {
    const fixture = await mockEncounterWorkspaceApi(page);
    // The saved ambulatory choice points at a workspace that is now archived.
    fixture.workspace.status = "archived";
    const draftWorkspace: WorkspaceRead = {
      ...fixture.workspace,
      id: faker.string.uuid(),
      name: `Draft ${faker.word.words(2)}`,
      status: "draft",
    };
    const activeWorkspace: WorkspaceRead = {
      ...fixture.workspace,
      id: faker.string.uuid(),
      name: `Active ${faker.word.words(2)}`,
      status: "active",
    };
    fixture.workspaces.push(draftWorkspace, activeWorkspace);

    await page.goto(`${fixture.basePath}/updates`);
    await expect(
      page.getByRole("tab", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("tab", { name: "Ward rounds", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Workspace", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Workspace", exact: true });
    await expect(
      picker.getByText("Workspace: Standard encounter", { exact: true }),
    ).toBeVisible();
    await expect(
      picker.getByRole("option").filter({ hasText: activeWorkspace.name }),
    ).toHaveCount(1);
    for (const unavailable of [fixture.workspace, draftWorkspace]) {
      await expect(
        picker.getByRole("option").filter({ hasText: unavailable.name }),
      ).toHaveCount(0);
    }
    expect(fixture.workspaceReads.length).toBeGreaterThan(0);
    for (const request of fixture.workspaceReads) {
      expect(request.searchParams.get("status")).toBe("active");
    }
  });

  test("reuses encounter sections on configured pages with historical context and responsive columns", async ({
    page,
  }, testInfo) => {
    const fixture = await mockEncounterWorkspaceApi(page, {
      includeSectionData: true,
    });
    fixture.workspace.template = {
      schema_version: 1,
      pages: [
        {
          key: "rounds",
          kind: "custom",
          title: "Ward rounds",
          columns: [
            {
              span: 2,
              widgets: [
                { type: "vitals", title: "Ward vitals" },
                {
                  type: "questionnaire_responses",
                  title: "Progress notes",
                  config: {
                    questionnaire_slug: "daily-progress-note",
                    only_unstructured: true,
                  },
                },
              ],
            },
            {
              span: 1,
              widgets: [
                { type: "quick_actions", title: "Ward shortcuts" },
                { type: "favorite_forms", title: "Favorite ward forms" },
                { type: "draft_forms", title: "Pending ward forms" },
                { type: "care_team", title: "Ward care team" },
                { type: "encounter_actions", title: "Visit actions" },
                { type: "reports", title: "Ward reports" },
              ],
            },
          ],
        },
        { kind: "system", key: "updates" },
      ],
    };
    const vitals = page.getByRole("region", {
      name: "Ward vitals",
      exact: true,
    });
    const responses = page.getByRole("region", {
      name: "Progress notes",
      exact: true,
    });
    const shortcuts = page.getByRole("region", {
      name: "Ward shortcuts",
      exact: true,
    });
    const careTeam = page.getByRole("region", {
      name: "Ward care team",
      exact: true,
    });
    const currentDoctor = `${fixture.currentCareTeamMember.first_name} ${fixture.currentCareTeamMember.last_name}`;
    const pastDoctor = `${fixture.pastCareTeamMember.first_name} ${fixture.pastCareTeamMember.last_name}`;

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${fixture.basePath}/rounds`);
    await expect(
      vitals.getByRole("cell", { name: "82 /min", exact: true }),
    ).toBeVisible();
    await expect(
      responses.getByText("Current ward note", { exact: true }),
    ).toBeVisible();
    await expect(
      careTeam.getByText(currentDoctor, { exact: true }),
    ).toBeVisible();
    await expect(
      careTeam.getByRole("button", { name: "Manage Care Team", exact: true }),
    ).toBeVisible();
    expect(
      fixture.sectionReads.some(
        (url) =>
          url.pathname.endsWith("/questionnaire_response/") &&
          url.searchParams.get("encounter") === fixture.currentEncounter.id &&
          url.searchParams.get("questionnaire_slug") ===
            "daily-progress-note" &&
          url.searchParams.get("only_unstructured") === "true",
      ),
    ).toBe(true);
    const reportLink = page
      .getByRole("region", { name: "Ward reports", exact: true })
      .getByRole("link", { name: fixture.reportTemplate.name, exact: true });
    await expect(reportLink).toHaveAttribute(
      "href",
      `${fixture.basePath}/report/template/${fixture.reportTemplate.slug}`,
    );

    await test.step("Sections respect weighted columns and fit a mobile viewport", async () => {
      const wideVitals = await vitals.boundingBox();
      const wideShortcuts = await shortcuts.boundingBox();
      expect(wideVitals).not.toBeNull();
      expect(wideShortcuts).not.toBeNull();
      expect(wideVitals!.width).toBeGreaterThan(wideShortcuts!.width * 1.5);
      expect(wideShortcuts!.x).toBeGreaterThan(
        wideVitals!.x + wideVitals!.width,
      );
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await page.screenshot({
        path: testInfo.outputPath("encounter-sections-desktop.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(390);
      const narrowVitals = await vitals.boundingBox();
      const narrowShortcuts = await shortcuts.boundingBox();
      expect(narrowVitals).not.toBeNull();
      expect(narrowShortcuts).not.toBeNull();
      expect(Math.abs(narrowVitals!.x - narrowShortcuts!.x)).toBeLessThan(2);
      expect(narrowShortcuts!.y).toBeGreaterThan(
        narrowVitals!.y + narrowVitals!.height,
      );
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await page.screenshot({
        path: testInfo.outputPath("encounter-sections-mobile.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    await test.step("Existing actions retain the configured return page and draft target", async () => {
      await expect(
        page
          .getByRole("region", { name: "Favorite ward forms", exact: true })
          .getByRole("link", {
            name: fixture.questionnaire.title,
            exact: true,
          }),
      ).toHaveAttribute(
        "href",
        `${fixture.basePath}/questionnaire/${fixture.questionnaire.id}?return_page=rounds`,
      );
      await shortcuts
        .getByRole("link", { name: "Add Allergy", exact: true })
        .click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname ===
            `${fixture.basePath}/questionnaire/allergy_intolerance` &&
          url.searchParams.get("return_page") === "rounds",
      );
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page).toHaveURL(
        (url) => url.pathname === `${fixture.basePath}/rounds`,
      );
      await page
        .getByRole("region", { name: "Visit actions", exact: true })
        .getByRole("button", { name: "Mark as Completed", exact: true })
        .click();
      const confirmation = page.getByRole("alertdialog", {
        name: "Mark as Complete",
        exact: true,
      });
      await expect(confirmation).toBeVisible();
      await confirmation
        .getByRole("button", { name: "Cancel", exact: true })
        .click();
      await page
        .getByRole("region", { name: "Pending ward forms", exact: true })
        .getByRole("button", {
          name: `Continue ${fixture.questionnaire.title}`,
          exact: true,
        })
        .click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname ===
            `${fixture.basePath}/questionnaire/${fixture.questionnaire.id}` &&
          url.searchParams.get("continue_draft") === fixture.draft.id &&
          url.searchParams.get("return_page") === "rounds",
      );
      await page.goto(`${fixture.basePath}/rounds`);
    });

    await test.step("Overview displays the same records and historical selection removes write actions", async () => {
      await page.getByRole("tab", { name: "Overview", exact: true }).click();
      await expect(
        page.getByRole("cell", { name: "82 /min", exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByText("Current ward note", { exact: true })
          .filter({ visible: true }),
      ).toBeVisible();
      await expect(
        page
          .getByText(currentDoctor, { exact: true })
          .filter({ visible: true }),
      ).toBeVisible();
      await expect(
        page
          .getByRole("region", { name: "Draft Forms", exact: true })
          .getByRole("button", {
            name: `Continue ${fixture.questionnaire.title}`,
            exact: true,
          }),
      ).toBeVisible();
      await page.getByRole("tab", { name: "Ward rounds", exact: true }).click();
      await page.getByRole("button", { name: /Encounter History/i }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /Completed/ })
        .click();
      await expect(
        vitals.getByRole("cell", { name: "64 /min", exact: true }),
      ).toBeVisible();
      await expect(
        vitals.getByRole("cell", { name: "82 /min", exact: true }),
      ).toHaveCount(0);
      await expect(
        responses.getByText("Prior admission note", { exact: true }),
      ).toBeVisible();
      await expect(
        careTeam.getByText(pastDoctor, { exact: true }),
      ).toBeVisible();
      await expect(
        careTeam.getByText(currentDoctor, { exact: true }),
      ).toHaveCount(0);
      await expect(
        careTeam.getByRole("button", { name: "Manage Care Team", exact: true }),
      ).toHaveCount(0);
      for (const name of [
        "Ward shortcuts",
        "Favorite ward forms",
        "Pending ward forms",
        "Visit actions",
      ]) {
        await expect(
          page.getByRole("region", { name, exact: true }),
        ).toHaveCount(0);
      }
      await responses
        .getByRole("button", { name: "More Actions", exact: true })
        .click();
      await expect(
        page.getByRole("menuitem", {
          name: "Print this response",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", {
          name: "Mark as entered in error",
          exact: true,
        }),
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(reportLink).toHaveAttribute(
        "href",
        `/facility/${fixture.facility.id}/patient/${fixture.patient.id}/encounter/${fixture.pastEncounter.id}/report/template/${fixture.reportTemplate.slug}`,
      );
      await page.getByRole("tab", { name: "Overview", exact: true }).click();
      await expect(
        page.getByRole("cell", { name: "64 /min", exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByText("Prior admission note", { exact: true })
          .filter({ visible: true }),
      ).toBeVisible();
      await expect(
        page.getByText(pastDoctor, { exact: true }).filter({ visible: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Draft Forms", exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("link", { name: "Add Allergy", exact: true }),
      ).toHaveCount(0);
    });

    await test.step("Reports never reuse templates from another selected facility", async () => {
      fixture.pastEncounter.facility = {
        ...fixture.facility,
        id: faker.string.uuid(),
      };
      fixture.sectionReads.length = 0;
      await page.goto(
        `${fixture.basePath}/rounds?selectedEncounter=${fixture.pastEncounter.id}`,
      );
      await expect(
        vitals.getByRole("cell", { name: "64 /min", exact: true }),
      ).toBeVisible();
      await expect(reportLink).toHaveCount(0);
      expect(
        fixture.sectionReads.filter(
          (url) => url.pathname === "/api/v1/template/",
        ),
      ).toEqual([]);
    });
    expect(
      fixture.writes.filter(
        (request) => !request.endsWith("/account/default_account/"),
      ),
    ).toEqual([]);
  });

  test("keeps latest response limits and service filters independent on the same page", async ({
    page,
  }, testInfo) => {
    const fixture = await mockEncounterWorkspaceApi(page, {
      includeSectionData: true,
      includeConfigData: true,
    });
    fixture.failures.serviceOnHold = true;
    fixture.pastEncounter.facility = {
      ...fixture.facility,
      id: faker.string.uuid(),
      name: `Previous facility ${faker.word.words(2)}`,
    };
    fixture.workspace.template = {
      schema_version: 1,
      pages: [
        {
          key: "rounds",
          kind: "custom",
          title: "Ward rounds",
          columns: [
            {
              span: 1,
              widgets: [
                {
                  type: "questionnaire_responses",
                  title: "Latest progress note",
                  config: {
                    questionnaire_slug: "daily-progress-note",
                    limit: 1,
                  },
                },
                {
                  type: "questionnaire_responses",
                  title: "Last five progress notes",
                  config: {
                    questionnaire_slug: "daily-progress-note",
                    limit: 5,
                  },
                },
                {
                  type: "questionnaire_responses",
                  title: "Invalid response limit",
                  config: { limit: 0 },
                },
              ],
            },
            {
              span: 1,
              widgets: [
                {
                  type: "service_requests",
                  title: "Pending orders",
                  config: { status: "active" },
                },
                {
                  type: "service_requests",
                  title: "Latest held order",
                  config: { status: "on_hold", limit: 1 },
                },
                {
                  type: "service_requests",
                  title: "Invalid order filter",
                  config: { status: "pending" },
                },
              ],
            },
          ],
        },
      ],
    };
    const latest = page.getByRole("region", {
      name: "Latest progress note",
      exact: true,
    });
    const lastFive = page.getByRole("region", {
      name: "Last five progress notes",
      exact: true,
    });
    const pending = page.getByRole("region", {
      name: "Pending orders",
      exact: true,
    });
    const held = page.getByRole("region", {
      name: "Latest held order",
      exact: true,
    });
    await page.goto(
      `${fixture.basePath}/rounds?status=completed&page=8&limit=1`,
    );

    await test.step("Each response widget shows its own newest cap across short API pages", async () => {
      await expect(latest.getByText(/^Current note \d$/)).toHaveText([
        "Current note 6",
      ]);
      await expect(lastFive.getByText(/^Current note \d$/)).toHaveText([
        "Current note 6",
        "Current note 5",
        "Current note 4",
        "Current note 3",
        "Current note 2",
      ]);
      await expect(
        lastFive.getByText("Current note 1", { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText("Unrelated nursing note", { exact: true }),
      ).toHaveCount(0);
      for (const name of ["Invalid response limit", "Invalid order filter"]) {
        await expect(
          page.getByRole("region", { name, exact: true }).getByRole("alert"),
        ).toContainText("This widget’s configuration is invalid.");
      }
      const requests = fixture.sectionReads.filter((url) =>
        url.pathname.endsWith("/questionnaire_response/"),
      );
      expect(
        requests.every(
          (url) =>
            url.searchParams.get("questionnaire_slug") ===
            "daily-progress-note",
        ),
      ).toBe(true);
      expect(
        requests.some(
          (url) =>
            url.searchParams.get("offset") === "0" &&
            url.searchParams.get("limit") === "1",
        ),
      ).toBe(true);
      expect(
        requests.some(
          (url) =>
            url.searchParams.get("offset") === "0" &&
            url.searchParams.get("limit") === "5",
        ),
      ).toBe(true);
      expect(
        requests.some(
          (url) =>
            url.searchParams.get("offset") === "4" &&
            url.searchParams.get("limit") === "1",
        ),
      ).toBe(true);
      expect(
        requests.every((url) => Number(url.searchParams.get("offset")) < 5),
      ).toBe(true);
    });

    await test.step("Service errors, statuses, and Load More remain local to their widgets", async () => {
      await expect(pending.getByText(/^Current active order \d+$/)).toHaveCount(
        10,
      );
      await expect(
        pending.getByText("Current active order 11", { exact: true }),
      ).toBeVisible();
      await expect(
        pending.getByText("Current active order 1", { exact: true }),
      ).toHaveCount(0);
      await expect(held.getByRole("alert")).toContainText(
        "Could not load this clinical information. Try again.",
      );
      fixture.failures.serviceOnHold = false;
      await held
        .getByRole("button", { name: "Try Again", exact: true })
        .click();
      await expect(held.getByText(/^Current held order \d$/)).toHaveText([
        "Current held order 2",
      ]);
      await expect(
        held.getByRole("button", { name: "Load More", exact: true }),
      ).toHaveCount(0);
      await pending
        .getByRole("button", { name: "Load More", exact: true })
        .click();
      await expect(pending.getByText(/^Current active order \d+$/)).toHaveCount(
        11,
      );
      await expect(
        pending.getByText("Current active order 1", { exact: true }),
      ).toBeVisible();
      await expect(
        pending.getByRole("button", { name: "Load More", exact: true }),
      ).toHaveCount(0);
      await expect(held.getByText(/^Current held order \d$/)).toHaveText([
        "Current held order 2",
      ]);
      await expect(
        pending.getByRole("button", { name: "See Details", exact: true }),
      ).toHaveCount(11);
      await expect(
        page.getByText("Current completed order 1", { exact: true }),
      ).toHaveCount(0);
      const requests = fixture.sectionReads.filter((url) =>
        url.pathname.endsWith("/service_request/"),
      );
      expect(
        requests.every(
          (url) =>
            ["active", "on_hold"].includes(
              url.searchParams.get("status") ?? "",
            ) &&
            url.searchParams.get("encounter") === fixture.currentEncounter.id &&
            url.pathname ===
              `/api/v1/facility/${fixture.facility.id}/service_request/`,
        ),
      ).toBe(true);
      expect(
        requests.some(
          (url) =>
            url.searchParams.get("status") === "active" &&
            url.searchParams.get("offset") === "10",
        ),
      ).toBe(true);
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.get("status") === "completed" &&
          url.searchParams.get("page") === "8" &&
          url.searchParams.get("limit") === "1",
      );
    });

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: testInfo.outputPath("encounter-widget-filters-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
    await expect(
      pending.getByText("Current active order 11", { exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: testInfo.outputPath("encounter-widget-filters-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });

    await test.step("Historical widgets select their own encounter and facility without edit controls", async () => {
      fixture.sectionReads.length = 0;
      await page.getByRole("button", { name: /Encounter History/i }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /Completed/ })
        .click();
      await expect(latest.getByText(/^Past note \d$/)).toHaveText([
        "Past note 6",
      ]);
      await expect(lastFive.getByText(/^Past note \d$/)).toHaveText([
        "Past note 6",
        "Past note 5",
        "Past note 4",
        "Past note 3",
        "Past note 2",
      ]);
      await expect(pending.getByText(/^Past active order \d+$/)).toHaveCount(
        10,
      );
      await expect(held.getByText(/^Past held order \d$/)).toHaveText([
        "Past held order 2",
      ]);
      await expect(
        page.getByText(/^Current (note|active order|held order) \d+$/),
      ).toHaveCount(0);
      await expect(
        pending.getByRole("button", { name: "See Details", exact: true }),
      ).toHaveCount(0);
      await expect(
        held.getByRole("button", { name: "See Details", exact: true }),
      ).toHaveCount(0);
      const requests = fixture.sectionReads.filter((url) =>
        url.pathname.endsWith("/service_request/"),
      );
      expect(
        new Set(requests.map((url) => url.searchParams.get("status"))),
      ).toEqual(new Set(["active", "on_hold"]));
      expect(
        requests.every(
          (url) =>
            url.searchParams.get("encounter") === fixture.pastEncounter.id &&
            url.pathname ===
              `/api/v1/facility/${fixture.pastEncounter.facility.id}/service_request/` &&
            url.searchParams.get("offset") === "0",
        ),
      ).toBe(true);
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.get("selectedEncounter") ===
          fixture.pastEncounter.id,
      );
      const pastLatest = fixture.questionnaireResponses.find(
        (response) => response.responses[0].values[0].value === "Past note 6",
      );
      expect(pastLatest).toBeTruthy();
      await latest
        .getByRole("button", { name: "More Actions", exact: true })
        .click();
      await expect(
        page.getByRole("link", { name: "Print this response", exact: true }),
      ).toHaveAttribute(
        "href",
        `/facility/${fixture.pastEncounter.facility.id}/patient/${fixture.patient.id}/encounter/${fixture.pastEncounter.id}/questionnaire_response/${pastLatest!.id}/print`,
      );
      await expect(
        page.getByRole("menuitem", {
          name: "Mark as entered in error",
          exact: true,
        }),
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
    });
    expect(fixture.writes).toEqual([]);
  });

  test("keeps system-page filters local when changing tabs or workspaces", async ({
    page,
  }) => {
    const fixture = await mockEncounterWorkspaceApi(page);
    fixture.workspace.template = {
      schema_version: 1,
      pages: [
        { kind: "system", key: "service_requests" },
        { kind: "system", key: "consents" },
      ],
    };
    const consentWorkspace: WorkspaceRead = {
      ...fixture.workspace,
      id: faker.string.uuid(),
      name: `Consents ${faker.word.words(2)}`,
      template: {
        schema_version: 1,
        pages: [{ kind: "system", key: "consents" }],
      },
    };
    fixture.workspaces.push(consentWorkspace);
    const consentName = `Treatment consent ${faker.string.alphanumeric(6)}`;
    await page.route(
      `**/api/v1/patient/${fixture.patient.id}/consent/**`,
      async (route) => {
        const url = new URL(route.request().url());
        const consent = {
          id: faker.string.uuid(),
          encounter: fixture.pastEncounter.id,
          status: "active",
          category: "treatment",
          decision: "permit",
          date: "2026-01-01T00:00:00Z",
          period: { start: null, end: null },
          source_attachments: [{ name: consentName }],
          verification_details: [],
        };
        await route.fulfill({
          json: {
            count: 1,
            results: Number(url.searchParams.get("offset") ?? 0)
              ? []
              : [consent],
          },
        });
      },
    );
    const filters = new URLSearchParams({
      selectedEncounter: fixture.pastEncounter.id,
      page: "3",
      limit: "20",
      status: "active",
      workspace: fixture.workspace.id,
    });
    await page.goto(`${fixture.basePath}/service_requests?${filters}`);
    await expect(page).toHaveURL(
      (url) =>
        !url.searchParams.has("workspace") &&
        url.searchParams.get("page") === "3" &&
        url.searchParams.get("limit") === "20" &&
        url.searchParams.get("status") === "active",
    );

    await test.step("Changing tabs starts the destination on its first page", async () => {
      await page.getByRole("tab", { name: "Consents", exact: true }).click();
      await expect(page.getByText(consentName, { exact: true })).toBeVisible();
      await expect(page).toHaveURL(
        `${fixture.basePath}/consents?selectedEncounter=${fixture.pastEncounter.id}`,
      );
    });

    await test.step("Selecting a workspace also clears the previous page's filters", async () => {
      await page.goto(`${fixture.basePath}/service_requests?${filters}`);
      await page
        .getByRole("button", { name: "Workspace", exact: true })
        .click();
      const picker = page.getByRole("dialog", {
        name: "Workspace",
        exact: true,
      });
      await picker
        .getByRole("option")
        .filter({ hasText: consentWorkspace.name })
        .click();
      await expect(picker).not.toBeVisible();
      await expect(page.getByText(consentName, { exact: true })).toBeVisible();
      await expect(page).toHaveURL(
        `${fixture.basePath}/consents?selectedEncounter=${fixture.pastEncounter.id}`,
      );
    });
  });

  test("preserves configured plugin-page deep links while the manifest loads", async ({
    page,
  }) => {
    const remote = await installEncounterWidgetRemote(page, {
      holdManifest: true,
    });
    const fixture = await mockEncounterWorkspaceApi(page);
    fixture.plugConfigs.push(remote.config);
    fixture.workspace.template = {
      schema_version: 1,
      pages: [
        {
          kind: "custom",
          key: "rounds",
          title: "Plugin rounds",
          columns: [{ span: 1, widgets: [] }],
        },
        { kind: "system", key: "lab.results" },
      ],
    };
    const path = `${fixture.basePath}/lab.results?selectedEncounter=${fixture.pastEncounter.id}`;
    try {
      await page.goto(path);
      // Wait for workspace rendering so this cannot pass before the redirect
      // decision has run, even when the remote manifest has not arrived.
      await expect(
        page.getByRole("tab", { name: "Plugin rounds", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: /lab\.results$/ }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(page).toHaveURL(path);
    } finally {
      remote.releaseManifest();
    }
    await expect(
      page.getByText("Registered plugin page", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(path);
    expect(fixture.writes).toEqual([]);
  });

  test("loads plugin widgets through federation and preserves their editor and encounter contracts", async ({
    page,
  }, testInfo) => {
    const remote = await installEncounterWidgetRemote(page, {
      holdLazyModule: true,
      holdManifest: true,
    });
    const fixture = await mockEncounterWorkspaceApi(page, {
      allowWorkspaceUpdate: true,
    });
    fixture.plugConfigs.push(remote.config);
    const makeTemplate = (
      reviewConfig: Record<string, unknown>,
      fallbackConfig?: Record<string, unknown>,
      includePluginPage = true,
    ): WorkspaceTemplate => ({
      schema_version: 1,
      pages: [
        {
          key: "rounds",
          kind: "custom",
          title: "Plugin rounds",
          columns: [
            {
              span: 1,
              widgets: [{ type: "symptoms", title: "Core symptoms" }],
            },
            {
              span: 1,
              widgets: [
                {
                  type: `${remote.config.slug}.review`,
                  title: "Consultant review",
                  config: reviewConfig,
                },
                {
                  type: `${remote.config.slug}.unstable`,
                  title: "Encounter-specific extension",
                },
                {
                  type: "care_missing.review",
                  title: "Missing extension",
                  ...(fallbackConfig && { config: fallbackConfig }),
                },
              ],
            },
          ],
        },
        ...(includePluginPage ? [{ kind: "system", key: "lab.results" }] : []),
      ],
    });
    const unknownConfig = { opaque_metadata: { nested: ["keep", 5] } };
    const reviewConfig = {
      ...unknownConfig,
      caption: "Review before discharge",
      render_mode: "full-review",
      priority: 7,
      settings: { highlight: true },
      labels: ["rounds", "discharge"],
    };
    const template = makeTemplate(reviewConfig, { display_code: "5" });
    const unavailableMessage =
      "This widget is unavailable. Its plugin may not be enabled, or the widget type may not be supported.";
    const failureMessage =
      "This widget could not be displayed. Other encounter information is still available.";

    await test.step("The studio authors plugin schema fields and preserves unknown options", async () => {
      await page.goto(
        `/facility/${fixture.facility.id}/settings/workspaces/${fixture.workspace.id}/edit`,
      );
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        fixture.workspace.name,
      );
      const templateField = page.getByRole("textbox", {
        name: "Template (JSON)",
        exact: true,
      });
      await page
        .getByRole("button", { name: "More options", exact: true })
        .click();
      await page
        .getByRole("menuitem", { name: "Edit as JSON (advanced)", exact: true })
        .click();
      await templateField.fill(
        JSON.stringify(
          makeTemplate(
            { ...unknownConfig, caption: "Draft review" },
            undefined,
            false,
          ),
        ),
      );
      await expect(
        page.getByText(
          "These widgets are unavailable and will show a notice: care_missing.review.",
          { exact: true },
        ),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Back to design", exact: true })
        .click();
      const drawer = page.getByRole("dialog", {
        name: "Section settings",
        exact: true,
      });
      const openSettings = async (name: string) => {
        await page
          .getByRole("button", { name: `Settings for ${name}`, exact: true })
          .first()
          .click();
        await expect(drawer).toBeVisible();
      };
      const done = drawer.getByRole("button", { name: "Done", exact: true });
      const closeDrawer = async () => {
        await done.click();
        await expect(drawer).not.toBeVisible();
      };
      const save = page.getByRole("button", {
        name: "Save Changes",
        exact: true,
      });
      const configJson = drawer.getByRole("textbox", {
        name: "Widget configuration (JSON)",
        exact: true,
      });
      const showAdvanced = async () => {
        if (!(await configJson.isVisible())) {
          await drawer
            .getByText("Advanced configuration", { exact: true })
            .click();
        }
      };
      await openSettings("Consultant review");
      const pendingConfig =
        '{"opaque_metadata":{"nested":["keep",5]},"caption":"Draft review","pending_schema":';
      try {
        await showAdvanced();
        await configJson.fill(pendingConfig);
        await expect(configJson).toHaveValue(pendingConfig);
        await expect(configJson).toHaveAttribute("aria-invalid", "true");
        await expect(done).toBeDisabled();
      } finally {
        remote.releaseManifest();
      }
      await expect(
        drawer.getByRole("textbox", { name: "Review caption", exact: true }),
      ).toBeVisible();
      await showAdvanced();
      await expect(configJson).toHaveValue(pendingConfig);
      await expect(configJson).toHaveAttribute("aria-invalid", "true");
      await expect(done).toBeDisabled();
      await configJson.fill(
        JSON.stringify({ ...unknownConfig, caption: "Draft review" }),
      );
      await expect(configJson).toHaveAttribute("aria-invalid", "false");
      await expect(done).toBeEnabled();
      await drawer
        .getByRole("textbox", { name: "Review caption", exact: true })
        .fill("Review before discharge");
      await drawer
        .getByRole("combobox", { name: "Mode de revue", exact: true })
        .click();
      await page
        .getByRole("option", { name: "Revue complète", exact: true })
        .click();
      await expect(
        drawer.getByText("Présentation pour cette consultation", {
          exact: true,
        }),
      ).toBeVisible();
      await drawer
        .getByRole("combobox", { name: "Priorité de revue", exact: true })
        .click();
      await page.getByRole("option", { name: "Urgente", exact: true }).click();
      await expect(
        drawer.getByText("Paramètres de revue", { exact: true }),
      ).toBeVisible();
      await drawer
        .getByRole("checkbox", { name: "Mettre en évidence", exact: true })
        .check();
      for (const [index, label] of [
        "rounds",
        "temporary",
        "discharge",
      ].entries()) {
        await drawer
          .getByText("Review labels", { exact: true })
          .locator("..")
          .getByRole("button", { name: "Add", exact: true })
          .click();
        await drawer
          .getByRole("textbox", { name: "Review label", exact: true })
          .nth(index)
          .fill(label);
      }
      await drawer
        .getByRole("button", {
          name: "Remove item Review labels 2",
          exact: true,
        })
        .click();
      const labels = drawer.getByRole("textbox", {
        name: "Review label",
        exact: true,
      });
      await expect(labels).toHaveCount(2);
      await expect(labels.nth(0)).toHaveValue("rounds");
      await expect(labels.nth(1)).toHaveValue("discharge");
      await closeDrawer();
      await expect(save).toBeEnabled();

      await openSettings("Missing extension");
      await showAdvanced();
      await configJson.fill(JSON.stringify({ display_code: "5" }));
      await closeDrawer();
      await page.getByRole("button", { name: "Add tab", exact: true }).click();
      await page
        .getByRole("menuitem", { name: "lab.results", exact: true })
        .click();
      await save.click();
      await expect(
        page.getByText("No changes to save", { exact: true }),
      ).toBeVisible();
      await expect(save).toBeDisabled();
      expect(fixture.workspaceUpdates).toEqual([
        {
          name: fixture.workspace.name,
          description: fixture.workspace.description,
          template,
          status: "active",
        },
      ]);
      await page.reload();
      await openSettings("Consultant review");
      await expect(
        drawer.getByRole("textbox", { name: "Review caption", exact: true }),
      ).toHaveValue("Review before discharge");
      await expect(
        drawer.getByRole("combobox", { name: "Mode de revue", exact: true }),
      ).toHaveText("Revue complète");
      await expect(
        drawer.getByRole("combobox", {
          name: "Priorité de revue",
          exact: true,
        }),
      ).toHaveText("Urgente");
      await expect(
        drawer.getByRole("checkbox", {
          name: "Mettre en évidence",
          exact: true,
        }),
      ).toBeChecked();
      await expect(labels).toHaveCount(2);
      await expect(labels.nth(0)).toHaveValue("rounds");
      await expect(labels.nth(1)).toHaveValue("discharge");
      await showAdvanced();
      expect(JSON.parse(await configJson.inputValue())).toEqual(reviewConfig);
      await closeDrawer();
      await expect(save).toBeDisabled();
    });

    await test.step("A lazy plugin loads independently of clinical cards and failed extensions", async () => {
      await page.goto(`${fixture.basePath}/rounds`);
      await remote.lazyModuleRequested;
      try {
        await expect(
          page
            .getByRole("region", { name: "Core symptoms", exact: true })
            .getByText("Fever today", { exact: true })
            .filter({ visible: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("status", { name: "Loading...", exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText(unavailableMessage, { exact: true }),
        ).toHaveCount(1);
        await expect(
          page.getByText(failureMessage, { exact: true }),
        ).toBeVisible();
      } finally {
        remote.releaseLazyModule();
      }
    });

    const review = page.getByRole("region", {
      name: "Consultant review",
      exact: true,
    });
    await expect(
      review.getByRole("heading", { name: "Consultant review", exact: true }),
    ).toBeVisible();
    for (const text of [
      "Review before discharge",
      `Patient: ${fixture.patient.id}`,
      `Facility: ${fixture.facility.id}`,
      `Encounter: ${fixture.currentEncounter.id}`,
      `Selected record: ${fixture.currentEncounter.id} / in_progress`,
      "Plugin record: Fever today",
      "Editable review",
    ]) {
      await expect(review.getByText(text, { exact: true })).toBeVisible();
    }
    await review
      .getByRole("button", { name: "Reviewed 0", exact: true })
      .click();
    await expect(
      review.getByRole("button", { name: "Reviewed 1", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByText("Missing extension", { exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: testInfo.outputPath("encounter-plugin-widgets.png"),
      fullPage: true,
    });

    await test.step("Historical selection reaches the plugin as read-only and resets its failed sibling", async () => {
      await page.getByRole("button", { name: /Encounter History/i }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /Completed/ })
        .click();
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.get("selectedEncounter") ===
          fixture.pastEncounter.id,
      );
      for (const text of [
        `Encounter: ${fixture.pastEncounter.id}`,
        `Selected record: ${fixture.pastEncounter.id} / completed`,
        "Plugin record: Cough last admission",
        "Read only review",
      ]) {
        await expect(review.getByText(text, { exact: true })).toBeVisible();
      }
      await expect(
        review.getByRole("button", { name: /^Reviewed / }),
      ).toBeDisabled();
      await expect(
        page.getByText("Historical plugin recovered", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText(failureMessage, { exact: true })).toHaveCount(
        0,
      );
      await expect(
        page.getByText(unavailableMessage, { exact: true }),
      ).toHaveCount(1);
    });
    await test.step("Registered plugin pages retain their declared dotted route keys", async () => {
      await page.getByRole("tab", { name: /lab\.results$/ }).click();
      await expect(page).toHaveURL((url) =>
        url.pathname.endsWith("/lab.results"),
      );
      await expect(
        page.getByText("Registered plugin page", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("tab", { name: "Plugin rounds", exact: true })
        .click();
      await expect(
        review.getByText("Read only review", { exact: true }),
      ).toBeVisible();
    });
    await test.step("An encounter from another patient never reaches a core or plugin widget", async () => {
      fixture.pastEncounter.patient = {
        ...fixture.patient,
        id: faker.string.uuid(),
      };
      fixture.clinicalReads.length = 0;
      await page.goto(
        `${fixture.basePath}/rounds?selectedEncounter=${fixture.pastEncounter.id}`,
      );
      await expect(
        page.getByText(
          "This encounter belongs to a different patient. Check the link and try again.",
          { exact: true },
        ),
      ).toHaveCount(3);
      await expect(review).toHaveCount(0);
      await expect(
        page.getByRole("region", { name: "Core symptoms", exact: true }),
      ).toHaveCount(0);
      expect(fixture.clinicalReads).toEqual([]);
    });
    expect(fixture.writes).toEqual([
      `PUT /api/v1/workspace/${fixture.workspace.id}/`,
    ]);
  });

  test("does not request or render clinical records without clinical read permission", async ({
    page,
  }) => {
    const remote = await installEncounterWidgetRemote(page);
    const fixture = await mockEncounterWorkspaceApi(page, {
      clinicalRead: false,
      includeOverview: true,
      includeSectionData: true,
    });
    // The encounter header loads the form catalogue independently of widgets.
    const widgetRecordReads = () =>
      fixture.sectionReads.filter(
        (url) =>
          url.searchParams.has("encounter") ||
          url.pathname === "/api/v1/form_submission/" ||
          url.searchParams.get("favorite_list") === "favorites_form",
      );
    fixture.plugConfigs.push(remote.config);
    fixture.workspace.template = roundsTemplate(true, [
      { type: `${remote.config.slug}.review`, title: "Denied plugin review" },
      { type: "vitals", title: "Denied vitals" },
      { type: "questionnaire_responses", title: "Denied responses" },
      {
        type: "service_requests",
        title: "Denied service requests",
        config: { status: "active" },
      },
      { type: "quick_actions", title: "Denied shortcuts" },
      { type: "favorite_forms", title: "Denied favorite forms" },
      { type: "draft_forms", title: "Denied drafts" },
      { type: "encounter_actions", title: "Denied encounter actions" },
    ]);
    await page.goto(`${fixture.basePath}/rounds`);
    await expect(
      page.getByRole("heading", { name: "Ward rounds", exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByText(
          "You do not have permission to view clinical data for this encounter",
          { exact: true },
        )
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Denied plugin review", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText("Fever today", { exact: true })).toHaveCount(0);
    await expect(
      page
        .getByRole("tabpanel")
        .getByRole("link", { name: "Edit", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Add Allergy", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: `Continue ${fixture.questionnaire.title}`,
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Current ward note", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("cell", { name: "82 /min", exact: true }),
    ).toHaveCount(0);
    expect(fixture.clinicalReads).toEqual([]);
    expect(widgetRecordReads()).toEqual([]);
    await page.getByRole("tab", { name: "Overview", exact: true }).click();
    await expect(
      page.getByText(
        "You do not have permission to view clinical data for this encounter",
        { exact: true },
      ),
    ).toHaveCount(1);
    await expect(
      page.getByRole("region", { name: "Symptoms", exact: true }),
    ).toHaveCount(0);
    expect(fixture.clinicalReads).toEqual([]);
    expect(widgetRecordReads()).toEqual([]);
  });

  test("retries workspace and clinical reads without losing the requested page", async ({
    page,
  }) => {
    const fixture = await mockEncounterWorkspaceApi(page, {
      defaultLoadFailures: 1,
    });
    fixture.failures.symptoms = true;
    await page.goto(`${fixture.basePath}/rounds`);
    await expect(
      page.getByRole("alert").filter({
        hasText: "Unable to load your default workspace.",
      }),
    ).toBeVisible();
    await expect(page).toHaveURL((url) => url.pathname.endsWith("/rounds"));
    const overviewSymptoms = page.getByRole("region", {
      name: "Symptoms",
      exact: true,
    });
    await expect(overviewSymptoms.getByRole("alert")).toContainText(
      "Could not load this clinical information. Try again.",
    );
    await expect(
      overviewSymptoms.getByText("No symptoms have been recorded", {
        exact: true,
      }),
    ).toHaveCount(0);
    await page
      .getByRole("alert")
      .filter({
        hasText: "Unable to load your default workspace.",
      })
      .getByRole("button", { name: "Try Again", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Ward rounds", exact: true }),
    ).toBeVisible();
    const symptoms = page.getByRole("region", {
      name: "Symptoms today",
      exact: true,
    });
    await expect(symptoms.getByRole("alert")).toContainText(
      "Could not load this clinical information. Try again.",
    );
    await expect(
      symptoms.getByText("No symptoms have been recorded", { exact: true }),
    ).toHaveCount(0);
    await expect(
      symptoms.getByText("Fever today", { exact: true }),
    ).toHaveCount(0);
    fixture.failures.symptoms = false;
    await symptoms
      .getByRole("button", { name: "Try Again", exact: true })
      .click();
    await expect(
      page
        .getByRole("region", { name: "Symptoms today", exact: true })
        .getByText("Fever today", { exact: true })
        .first(),
    ).toBeVisible();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname.endsWith("/rounds") && !url.searchParams.has("workspace"),
    );
  });

  test("isolates invalid workspace configuration while rendering valid pages and widgets", async ({
    page,
  }) => {
    const fixture = await mockEncounterWorkspaceApi(page);
    const invalidMessage =
      "Some parts of this workspace configuration are invalid. Valid pages and widgets are still shown.";
    const unsupportedMessage =
      "This workspace uses an unsupported schema version. Compatible pages and widgets are still shown.";

    await test.step("Render valid neighbors while isolating malformed widgets, columns, and pages", async () => {
      fixture.workspace.template = {
        schema_version: 1,
        pages: [
          {
            kind: "custom",
            key: "rounds",
            title: "Ward rounds",
            columns: [
              {
                span: 0,
                widgets: [
                  { type: "allergies", title: "Salvaged allergies" },
                  {
                    type: "diagnosis",
                    title: "Invalid visibility",
                    visible_when: { "encounter.status": "in_progress" },
                  },
                  {
                    type: "diagnosis",
                    title: "Invalid widget config",
                    config: [],
                  },
                ],
              },
              null,
              {
                span: 1,
                widgets: [
                  { type: "symptoms", title: "Salvaged symptoms" },
                  null,
                ],
              },
              { span: 1, widgets: "invalid" },
            ],
          },
          {
            kind: "system",
            key: "medicines",
            title: "Overridden medications",
            columns: [],
          },
          { kind: "system", key: "medications" },
          { kind: "system", key: "removed_plugin", hidden: true },
          { kind: "custom", key: "broken", title: 42, columns: "invalid" },
          {
            kind: "custom",
            key: "questionnaire",
            title: "Reserved route",
            columns: [],
          },
          {
            kind: "custom",
            key: "../files",
            title: "Unsafe route",
            columns: [],
          },
          {
            kind: "custom",
            key: "rounds",
            title: "Duplicate rounds",
            columns: [],
          },
        ],
      };
      fixture.clinicalReads.length = 0;
      await page.goto(`${fixture.basePath}/rounds`);
      await expect(
        page.getByRole("heading", { name: "Ward rounds", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("alert").filter({ hasText: invalidMessage }),
      ).toBeVisible();
      for (const [title, value] of [
        ["Salvaged allergies", "Penicillin allergy"],
        ["Salvaged symptoms", "Fever today"],
      ]) {
        await expect(
          page
            .getByRole("region", { name: title, exact: true })
            .getByText(value, { exact: true })
            .filter({ visible: true }),
        ).toBeVisible();
      }
      for (const title of ["Invalid visibility", "Invalid widget config"]) {
        await expect(
          page.getByRole("alert").filter({ hasText: title }),
        ).toContainText("This widget’s configuration is invalid.");
      }
      await expect(
        page
          .getByRole("alert")
          .filter({
            hasText:
              "This column configuration is invalid. Valid widgets are still shown.",
          })
          .first(),
      ).toBeVisible();
      expect(
        fixture.clinicalReads.some((url) =>
          url.pathname.endsWith("/diagnosis/"),
        ),
      ).toBe(false);
      for (const title of [
        "Overview",
        "Devices",
        "Reserved route",
        "Unsafe route",
        "Duplicate rounds",
        "removed_plugin",
      ]) {
        await expect(
          page.getByRole("tab", { name: title, exact: true }),
        ).toHaveCount(0);
      }

      await page.getByRole("tab", { name: "Medications", exact: true }).click();
      await expect(page).toHaveURL((url) =>
        url.pathname.endsWith("/medicines"),
      );
      await expect(
        page.getByRole("heading", { name: "Medications", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Overridden medications", { exact: true }),
      ).toHaveCount(0);

      await page.getByRole("tab", { name: "medications", exact: true }).click();
      await expect(page).toHaveURL((url) =>
        url.pathname.endsWith("/medications"),
      );
      await expect(
        page.getByRole("alert").filter({
          hasText:
            "This page is unavailable. Check its workspace configuration.",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Medications", exact: true }),
      ).toHaveCount(0);

      await page.getByRole("tab", { name: "broken", exact: true }).click();
      await expect(
        page.getByRole("alert").filter({
          hasText:
            "Some parts of this page configuration are invalid. Valid widgets are still shown.",
        }),
      ).toBeVisible();
    });

    await test.step("Render compatible configured pages when the schema version is missing or newer", async () => {
      const pages = [
        {
          kind: "custom",
          key: "rounds",
          title: "Compatible rounds",
          columns: [
            {
              span: 1,
              widgets: [{ type: "symptoms", title: "Compatible symptoms" }],
            },
          ],
        },
        { kind: "system", key: "medicines" },
      ];
      for (const template of [{ pages }, { schema_version: 999, pages }]) {
        fixture.workspace.template = template;
        await page.goto(`${fixture.basePath}/rounds`);
        await expect(
          page.getByRole("heading", { name: "Compatible rounds", exact: true }),
        ).toBeVisible();
        await expect(
          page
            .getByRole("region", { name: "Compatible symptoms", exact: true })
            .getByText("Fever today", { exact: true })
            .filter({ visible: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("alert").filter({
            hasText:
              "schema_version" in template
                ? unsupportedMessage
                : invalidMessage,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole("tab", { name: "Medications", exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("tab", { name: "Devices", exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("tab", { name: "Overview", exact: true }),
        ).toHaveCount(0);
      }
    });

    await test.step("Keep an empty selected configuration empty instead of inserting standard pages", async () => {
      fixture.workspace.template = {};
      fixture.defaults.splice(0);
      await page.goto(`${fixture.basePath}/updates`);
      await page
        .getByRole("button", { name: "Workspace", exact: true })
        .click();
      const picker = page.getByRole("dialog", {
        name: "Workspace",
        exact: true,
      });
      await picker
        .getByRole("combobox", { name: "Search workspaces by name" })
        .fill(fixture.workspace.name);
      await picker
        .getByRole("option")
        .filter({ hasText: fixture.workspace.name })
        .click();
      await expect(picker).not.toBeVisible();
      await expect(
        page.getByRole("alert").filter({ hasText: invalidMessage }),
      ).toBeVisible();
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: "This workspace has no visible pages." }),
      ).toBeVisible();
      await expect(
        page.getByRole("alert").filter({ hasText: unsupportedMessage }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("tablist", {
          name: "Encounter navigation",
          exact: true,
        }),
      ).toHaveCount(0);
      expect(fixture.defaultWrites).toEqual([
        {
          workspaceId: fixture.workspace.id,
          body: { attribute: "encounter_class", value: "amb" },
        },
      ]);
    });
    await test.step("Widget aliases stay unavailable while canonical widgets render", async () => {
      const aliases = ["allergy", "symptom", "diagnoses", "active_problems"];
      fixture.workspace.template = {
        schema_version: 1,
        pages: [
          {
            kind: "custom",
            key: "rounds",
            title: "Ward rounds",
            columns: [
              {
                span: 1,
                widgets: [
                  ...aliases.map((type) => ({ type, title: `${type} alias` })),
                  { type: "symptoms", title: "Canonical symptoms" },
                ],
              },
            ],
          },
        ],
      };
      fixture.clinicalReads.length = 0;
      await page.goto(`${fixture.basePath}/rounds`);
      for (const type of aliases) {
        await expect(
          page.getByRole("alert").filter({ hasText: `${type} alias` }),
        ).toContainText(
          "This widget is unavailable. Its plugin may not be enabled, or the widget type may not be supported.",
        );
      }
      await expect(
        page
          .getByRole("region", { name: "Canonical symptoms", exact: true })
          .getByText("Fever today", { exact: true })
          .filter({ visible: true }),
      ).toBeVisible();
      expect(
        fixture.clinicalReads.every((url) =>
          url.pathname.endsWith("/symptom/"),
        ),
      ).toBe(true);
    });

    fixture.workspace.template = {
      schema_version: 1,
      pages: [
        { kind: "system", key: "medicines", hidden: true },
        { kind: "system", key: "devices", hidden: true },
        {
          kind: "custom",
          key: "hidden-rounds",
          title: "Hidden rounds",
          hidden: true,
          columns: [
            {
              span: 1,
              widgets: [{ type: "diagnosis", title: "Hidden diagnoses" }],
            },
          ],
        },
      ],
    };
    fixture.clinicalReads.length = 0;
    await page.goto(`${fixture.basePath}/hidden-rounds`);
    await expect(
      page.getByRole("alert").filter({
        hasText: "This workspace has no visible pages.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("tablist", { name: "Encounter navigation", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Medications", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: "Hidden diagnoses", exact: true }),
    ).toHaveCount(0);
    expect(fixture.clinicalReads).toEqual([]);
    await expect(
      page.getByRole("button", { name: "Workspace", exact: true }),
    ).toBeVisible();
  });

  test("matches accessible saved rules to the selected class without URL overrides", async ({
    page,
  }) => {
    const fixture = await mockEncounterWorkspaceApi(page);
    const inaccessibleWorkspace = {
      ...fixture.workspace,
      id: faker.string.uuid(),
    };
    fixture.defaults.splice(
      0,
      fixture.defaults.length,
      {
        attribute: "encounter_class",
        value: "imp",
        workspace: inaccessibleWorkspace,
      },
      {
        attribute: "encounter_class",
        value: "imp",
        workspace: fixture.workspace,
      },
      {
        attribute: "encounter_class",
        value: "amb",
        workspace: inaccessibleWorkspace,
      },
      { attribute: "status", value: "amb", workspace: fixture.workspace },
      { attribute: null, value: "amb", workspace: fixture.workspace },
    );
    // A legacy link must not select a workspace or override saved class rules.
    await page.goto(
      `${fixture.basePath}/medicines?workspace=${fixture.workspace.id}`,
    );
    await expect(
      page.getByRole("heading", { name: "Medications", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Devices", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Ward rounds", exact: true }),
    ).toHaveCount(0);
    await expect(page).toHaveURL((url) => !url.searchParams.has("workspace"));
    await expect(
      page.getByRole("combobox", { name: "Workspace", exact: true }),
    ).toHaveCount(0);

    fixture.currentEncounter.encounter_class = "imp";
    await page.reload();
    await expect(
      page.getByRole("tab", { name: "Ward rounds", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Devices", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("tab", { name: "Ward rounds", exact: true }).click();
    await page.getByRole("button", { name: /Encounter History/i }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Completed/ })
      .click();
    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("selectedEncounter") === fixture.pastEncounter.id,
    );
    await expect(
      page.getByRole("tab", { name: "Devices", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Ward rounds", exact: true }),
    ).toHaveCount(0);

    // Defaults response order wins, even when an inaccessible rule comes first
    // and the accessible workspace list places the later match first.
    const laterWorkspace: WorkspaceRead = {
      ...fixture.workspace,
      id: faker.string.uuid(),
      name: `Later ${faker.word.words(2)}`,
      template: {
        schema_version: 1,
        pages: [
          {
            kind: "custom",
            key: "review",
            title: "Later workspace review",
            columns: [{ span: 1, widgets: [{ type: "symptoms" }] }],
          },
        ],
      },
    };
    fixture.workspaces.unshift(laterWorkspace);
    fixture.defaults.push({
      attribute: "encounter_class",
      value: "imp",
      workspace: laterWorkspace,
    });
    await page.goto(`${fixture.basePath}/updates`);
    await expect(
      page.getByRole("heading", { name: "Ward rounds", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL((url) => url.pathname.endsWith("/rounds"));
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /more than one|multiple|conflict/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("tab", { name: "Devices", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("tab", { name: "Later workspace review", exact: true }),
    ).toHaveCount(0);
  });
});

test("studio full response browsers and location history stay read-only on closed encounters", async ({
  page,
}) => {
  const fixture = await mockEncounterWorkspaceApi(page, {
    includeSectionData: true,
  });
  fixture.workspace.template = {
    schema_version: 2,
    surface: "encounter",
    pages: [
      {
        kind: "custom",
        key: "rounds",
        title: "Clinical studio",
        columns: [
          {
            span: 8,
            widgets: [{ type: "responses", title: "Encounter forms" }],
          },
          {
            span: 3,
            widgets: [
              { type: "locations", title: "Visit locations" },
              { type: "history_diagnoses", title: "Patient diagnoses" },
            ],
          },
          {
            span: 1,
            widgets: [{ type: "quick_actions", title: "Active tools" }],
          },
        ],
      },
      { kind: "system", key: "responses" },
    ],
  };
  await page.goto(
    `${fixture.basePath}/rounds?selectedEncounter=${fixture.pastEncounter.id}`,
  );
  const forms = page.getByRole("region", {
    name: "Encounter forms",
    exact: true,
  });
  await expect(
    forms.getByText("Prior admission note", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Active tools", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator('div[style*="--workspace-columns"] > div'),
  ).toHaveCount(2);
  await forms
    .getByRole("button", { name: "More Actions", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", {
      name: "Mark as entered in error",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page
    .getByRole("region", { name: "Visit locations", exact: true })
    .getByRole("button", { name: /view history/i })
    .click();
  const sheet = page.getByRole("dialog");
  await expect(
    sheet.getByRole("tab", { name: /location history/i }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    sheet.getByRole("tab", { name: /assign location/i }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect
    .poll(() =>
      fixture.clinicalReads.some(
        (url) =>
          url.pathname.endsWith("/diagnosis/") &&
          !url.searchParams.has("encounter"),
      ),
    )
    .toBe(true);

  await page.getByRole("tab", { name: "Responses", exact: true }).click();
  await expect(
    page.getByText("Prior admission note", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "More Actions", exact: true }).click();
  await expect(
    page.getByRole("menuitem", {
      name: "Mark as entered in error",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  expect(
    fixture.writes.filter(
      (request) => !request.endsWith("/account/default_account/"),
    ),
  ).toEqual([]);
});

test("studio history layouts work without an active encounter and remain separate from encounter layouts", async ({
  page,
}, testInfo) => {
  const fixture = await mockEncounterWorkspaceApi(page);
  const history: WorkspaceRead = {
    ...fixture.workspace,
    id: faker.string.uuid(),
    name: `History workspace ${faker.string.alphanumeric(8)}`,
    template: {
      schema_version: 2,
      surface: "patient_history",
      pages: [
        {
          kind: "custom",
          key: "background",
          title: "Medical background",
          columns: [
            {
              span: 12,
              widgets: [{ type: "history_diagnoses", title: "All diagnoses" }],
            },
          ],
        },
      ],
    },
  };
  fixture.workspaces.push(history);
  await page.goto(
    `/facility/${fixture.facility.id}/patient/${fixture.patient.id}/history/diagnoses`,
  );
  await page
    .getByRole("button", { name: "Clinical history workspace", exact: true })
    .click();
  await expect(
    page.getByRole("option").filter({ hasText: fixture.workspace.name }),
  ).toHaveCount(0);
  await page.getByRole("option").filter({ hasText: history.name }).click();
  await expect(page).toHaveURL((url) =>
    url.pathname.endsWith("/history/background"),
  );
  await expect(
    page.getByRole("region", { name: "All diagnoses", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      fixture.clinicalReads.some(
        (url) =>
          url.pathname.endsWith("/diagnosis/") &&
          !url.searchParams.has("encounter"),
      ),
    )
    .toBe(true);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "All diagnoses", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("clinical-history-workspace.png"),
    fullPage: true,
  });
  expect(fixture.defaultWrites).toEqual([]);

  await page.goto(`${fixture.basePath}/rounds`);
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await expect(
    page.getByRole("option").filter({ hasText: history.name }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("option").filter({ hasText: fixture.workspace.name }),
  ).toBeVisible();
});

test("studio full service-request browsers keep filters local to each widget", async ({
  page,
}) => {
  const fixture = await mockEncounterWorkspaceApi(page, {
    includeSectionData: true,
    includeConfigData: true,
  });
  fixture.workspace.template = {
    schema_version: 2,
    surface: "encounter",
    pages: [
      {
        kind: "custom",
        key: "rounds",
        title: "Request boards",
        columns: [
          {
            span: 6,
            widgets: [
              { type: "service_request_management", title: "First board" },
            ],
          },
          {
            span: 6,
            widgets: [
              { type: "service_request_management", title: "Second board" },
            ],
          },
        ],
      },
    ],
  };
  await page.goto(
    `${fixture.basePath}/rounds?selectedEncounter=${fixture.pastEncounter.id}`,
  );
  const first = page.getByRole("region", { name: "First board", exact: true });
  const second = page.getByRole("region", {
    name: "Second board",
    exact: true,
  });
  await first.getByRole("textbox").fill("potassium");
  await second.getByRole("textbox").fill("hemoglobin");
  await expect(first.getByRole("textbox")).toHaveValue("potassium");
  await expect(second.getByRole("textbox")).toHaveValue("hemoglobin");
  for (const title of ["potassium", "hemoglobin"]) {
    await expect
      .poll(() =>
        fixture.sectionReads.some(
          (url) =>
            url.pathname.endsWith("/service_request/") &&
            url.searchParams.get("title") === title &&
            url.searchParams.get("encounter") === fixture.pastEncounter.id,
        ),
      )
      .toBe(true);
  }
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("selectedEncounter") === fixture.pastEncounter.id &&
      !url.searchParams.has("search") &&
      !url.searchParams.has("page"),
  );
  await expect(
    first.getByRole("link", { name: /create service request/i }),
  ).toHaveCount(0);
});

test("studio medication entry returns to its custom workspace page", async ({
  page,
}) => {
  const fixture = await mockEncounterWorkspaceApi(page);
  fixture.workspace.template = {
    schema_version: 2,
    surface: "encounter",
    pages: [
      {
        kind: "custom",
        key: "rounds",
        title: "Medication rounds",
        columns: [
          {
            span: 12,
            widgets: [{ type: "medications", title: "Current medicines" }],
          },
        ],
      },
    ],
  };
  await page.goto(`${fixture.basePath}/rounds`);
  const medicines = page.getByRole("region", {
    name: "Current medicines",
    exact: true,
  });
  const create = medicines.getByRole("link", { name: "Create", exact: true });
  await expect(create).toHaveAttribute(
    "href",
    /questionnaire\/medication_request\?return_page=rounds$/,
  );
  await create.click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname.endsWith("/questionnaire/medication_request") &&
      url.searchParams.get("return_page") === "rounds",
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname.endsWith("/rounds"));
});

test("studio summary widgets show latest vitals, outstanding orders, current medication, and care-team encounters", async ({
  page,
}) => {
  const fixture = await mockEncounterWorkspaceApi(page, {
    includeSectionData: true,
    includeWidgetData: true,
  });
  const loinc = (code: string, display: string) => ({
    system: "http://loinc.org",
    code,
    display,
  });
  fixture.workspace.template = {
    schema_version: 2,
    surface: "encounter",
    pages: [
      {
        kind: "custom",
        key: "summary",
        title: "Clinical summary",
        columns: [
          {
            span: 7,
            widgets: [
              {
                type: "vitals",
                title: "Latest vitals",
                config: {
                  codes: [
                    loinc("8867-4", "Pulse"),
                    loinc("2708-6", "Oxygen saturation"),
                    loinc("8310-5", "Body temperature"),
                  ],
                },
              },
              { type: "outstanding_orders", title: "Results & orders" },
              {
                type: "observation_chart",
                title: "Pulse trend",
                config: {
                  plot: "primary-parameters",
                  groups: ["Pulse"],
                  height: 160,
                },
              },
              {
                type: "medications",
                title: "Administration only",
                config: { tabs: ["administration"] },
              },
              {
                type: "encounter_summary",
                title: "Reports only",
                config: { tabs: ["reports"] },
              },
            ],
          },
          {
            span: 5,
            widgets: [
              { type: "current_medications", title: "Current medication" },
              {
                type: "recent_encounters",
                title: "My encounters",
                config: { care_team: "mine", limit: 3 },
              },
              { type: "recent_encounters", title: "All encounters" },
              {
                type: "recent_encounters",
                title: "Other visits",
                config: { exclude_current: true, status: "completed" },
              },
              {
                type: "current_medications",
                title: "Outside medications",
                config: { sources: "statements" },
              },
              { type: "encounter_extensions", title: "App extensions" },
            ],
          },
        ],
      },
    ],
  };
  const actorName = `${fixture.actor.first_name} ${fixture.actor.last_name}`;
  const vitals = page.getByRole("region", {
    name: "Latest vitals",
    exact: true,
  });
  const orders = page.getByRole("region", {
    name: "Results & orders",
    exact: true,
  });
  const medication = page.getByRole("region", {
    name: "Current medication",
    exact: true,
  });
  const mine = page.getByRole("region", { name: "My encounters", exact: true });
  const all = page.getByRole("region", { name: "All encounters", exact: true });

  await page.goto(`${fixture.basePath}/summary`);

  // Latest vitals: one tile per configured code with its change.
  const pulse = vitals.getByRole("listitem", { name: "Pulse", exact: true });
  await expect(pulse).toContainText("82");
  await expect(pulse).toContainText("/min");
  await expect(pulse).toContainText("+6");
  await expect(
    vitals.getByRole("listitem", { name: "Oxygen saturation", exact: true }),
  ).toContainText("97");
  await expect(
    vitals.getByRole("listitem", { name: "Body temperature", exact: true }),
  ).toContainText("No reading");
  await expect(vitals).toContainText(`by ${actorName}`);
  expect(
    fixture.sectionReads.some(
      (url) =>
        url.pathname.endsWith("/observation/") &&
        url.searchParams.get("encounter") === fixture.currentEncounter.id &&
        url.searchParams.get("codes") === "8867-4,2708-6,8310-5",
    ),
  ).toBe(true);

  // Outstanding orders: drafts are excluded, reports link out, open orders
  // link to their status page.
  await expect(orders).toContainText("1 with reports · 1 awaiting results");
  await expect(orders.getByText("Unsent draft order")).toHaveCount(0);
  const xray = orders.getByRole("listitem").filter({ hasText: "Chest X-ray" });
  await expect(xray).toContainText("Imaging");
  await expect(xray).toContainText("Report received");
  await expect(
    xray.getByRole("link", { name: "View Report", exact: true }),
  ).toHaveAttribute(
    "href",
    `/facility/${fixture.facility.id}/patient/${fixture.patient.id}/diagnostic_reports/${fixture.imagingReport.id}`,
  );
  const creatinine = orders
    .getByRole("listitem")
    .filter({ hasText: "Creatinine" });
  await expect(creatinine).toContainText("Laboratory");
  await expect(creatinine).toContainText("No result yet");
  await expect(
    creatinine.getByRole("link", { name: "Check Status", exact: true }),
  ).toHaveAttribute(
    "href",
    `/facility/${fixture.facility.id}/service_requests/${fixture.widgetOrders[1].id}`,
  );

  // Current medication: active prescriptions and outside statements only.
  const paracetamol = medication
    .getByRole("row")
    .filter({ hasText: "Paracetamol 500 mg tablet" });
  await expect(paracetamol).toContainText("500 mg · 1-0-1");
  await expect(paracetamol).toContainText("since 01 Oct 2026");
  await expect(paracetamol.getByText("You", { exact: true })).toBeVisible();
  await expect(
    medication.getByRole("row").filter({ hasText: "Aspirin 75 mg tablet" }),
  ).toContainText(
    `${fixture.otherPrescriber.first_name} ${fixture.otherPrescriber.last_name}`,
  );
  const metformin = medication
    .getByRole("row")
    .filter({ hasText: "Metformin 500 mg tablet" });
  await expect(metformin).toContainText("1-0-1 after food");
  await expect(metformin).toContainText("Outside Rx");
  await expect(medication.getByText("Warfarin 5 mg tablet")).toHaveCount(0);
  await expect(medication.getByText("Stopped statin")).toHaveCount(0);
  await expect(
    medication.getByRole("link", { name: "Medication History", exact: true }),
  ).toHaveAttribute(
    "href",
    new RegExp(
      `^/facility/${fixture.facility.id}/patient/${fixture.patient.id}/history/medications\\?sourceUrl=.*summary`,
    ),
  );
  expect(
    fixture.sectionReads.some(
      (url) =>
        url.pathname.endsWith("/medication/request/") &&
        url.searchParams.get("status") === "active" &&
        url.searchParams.get("medications_only") === "true",
    ),
  ).toBe(true);
  expect(
    fixture.sectionReads.some(
      (url) =>
        url.pathname.endsWith("/medication/statement/") &&
        url.searchParams.get("status") === "active",
    ),
  ).toBe(true);

  // Recent encounters: the care-team filter follows the signed-in user.
  const mineRows = mine.getByRole("listitem");
  await expect(mineRows).toHaveCount(1);
  await expect(mineRows.first()).toContainText("Completed");
  await expect(mineRows.first()).toContainText(
    `${fixture.pastCareTeamMember.first_name} ${fixture.pastCareTeamMember.last_name} (Ward doctor) +1`,
  );
  await expect(
    mineRows.first().getByRole("link", { name: "See encounter", exact: true }),
  ).toHaveAttribute(
    "href",
    `/facility/${fixture.facility.id}/patient/${fixture.patient.id}/encounter/${fixture.pastEncounter.id}/updates`,
  );
  await expect(
    mine.getByRole("link", { name: "See all encounters", exact: true }),
  ).toHaveAttribute(
    "href",
    `/facility/${fixture.facility.id}/patient/${fixture.patient.id}/encounters`,
  );
  await expect(all.getByRole("listitem")).toHaveCount(2);
  const current = all.getByRole("listitem").filter({ hasText: "In Progress" });
  await expect(current).toContainText("Current Encounter");
  await expect(
    current.getByRole("link", { name: "See encounter", exact: true }),
  ).toHaveCount(0);
  const encounterReads = fixture.sectionReads.filter((url) =>
    url.pathname.endsWith("/encounter/"),
  );
  expect(encounterReads).toHaveLength(0);

  // Filters: other visits hides the current encounter; sources limits rows.
  const otherVisits = page.getByRole("region", {
    name: "Other visits",
    exact: true,
  });
  await expect(otherVisits.getByRole("listitem")).toHaveCount(1);
  await expect(otherVisits).not.toContainText("Current Encounter");
  const outside = page.getByRole("region", {
    name: "Outside medications",
    exact: true,
  });
  await expect(outside.getByRole("row")).toHaveCount(2);
  await expect(outside).toContainText("Metformin 500 mg tablet");
  await expect(outside).not.toContainText("Paracetamol");

  // Chart: only the selected group renders, with its analysis request.
  const chart = page.getByRole("region", { name: "Pulse trend", exact: true });
  await expect(
    chart.getByRole("heading", { name: "Pulse", exact: true }),
  ).toBeVisible();
  await expect(
    chart.getByRole("heading", { name: "SpO2", exact: true }),
  ).toHaveCount(0);
  await expect(chart.locator(".recharts-wrapper")).toHaveCount(1);
  expect(
    fixture.sectionReads.some(
      (url) =>
        url.pathname.endsWith("/observation/analyse/") &&
        url.searchParams.get("encounter") === fixture.currentEncounter.id,
    ),
  ).toBe(true);

  // Tab subsets render without a tab bar.
  const administration = page.getByRole("region", {
    name: "Administration only",
    exact: true,
  });
  // The medication tab bar is gone; only the MAR's own product tabs remain.
  await expect(
    administration.getByRole("tab", { name: "Prescriptions", exact: true }),
  ).toHaveCount(0);
  await expect(
    administration.getByRole("tab", { name: "Dispense History", exact: true }),
  ).toHaveCount(0);
  await expect(administration).toContainText("Paracetamol 500 mg tablet");
  const reportsOnly = page.getByRole("region", {
    name: "Reports only",
    exact: true,
  });
  await expect(reportsOnly.getByRole("tab")).toHaveCount(0);
  // The section title replaces the panel's own header instead of stacking.
  await expect(reportsOnly.getByText(/^Reports$/)).toHaveCount(0);
  await expect(
    reportsOnly.getByRole("link", { name: "Ward summary report", exact: true }),
  ).toBeVisible();

  // Nothing contributes to the extension slot, so it takes no space.
  await expect(
    page.getByRole("region", { name: "App extensions", exact: true }),
  ).toHaveCount(0);
  expect(fixture.writes).toEqual([]);

  // The same layout scopes vitals and orders to a completed encounter.
  await page.goto(
    `/facility/${fixture.facility.id}/patient/${fixture.patient.id}/encounter/${fixture.pastEncounter.id}/summary`,
  );
  await expect(
    vitals.getByRole("listitem", { name: "Pulse", exact: true }),
  ).toContainText("64");
  await expect(
    vitals.getByRole("listitem", { name: "Pulse", exact: true }),
  ).not.toContainText("+");
  await expect(medication).toBeVisible();
  await expect(orders).toContainText("No service requests found");
  await expect(orders.getByRole("listitem")).toHaveCount(0);
});
