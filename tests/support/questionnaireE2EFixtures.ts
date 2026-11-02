import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

/**
 * Seeds the deterministic questionnaire fixtures the questionnaire specs
 * look up by slug: the `e2e-*` set plus the `respiratory_status-v3` and
 * `patient_feedback` defaults. The CI backend does not load them, so the
 * setup project creates them through the API as the admin superuser.
 *
 * Mirrors the care backend's questionnaire E2E fixture script: same slugs,
 * titles, question ids (uuid5 of `care:e2e:{slug}:{link_id}`), scopes and
 * facility-organization tags. Idempotent: fixtures that already exist (by
 * slug) are reused, so a retried or repeated setup run only fills the gaps.
 */

const TAGGED_FACILITY_ORGANIZATIONS = ["Administration", "General Medicine"];
const PAGINATION_QUESTIONNAIRE_COUNT = 18;
const VERSIONED_SLUG = "e2e-versioned";
const VERSIONED_TARGET_REVISION = 3;
const UNITS_VALUESET_SLUG = "e2e-dose-units";
const UNITS_QUESTIONNAIRE_SLUG = "e2e-units";
const DEFAULT_FIXTURE_FILES = [
  "tests/fixtures/questionnaires/respiratoryStatusV3.json",
  "tests/fixtures/questionnaires/patientFeedback.json",
];

const UCUM_SYSTEM = "http://unitsofmeasure.org";
const UCUM_MG = { system: UCUM_SYSTEM, code: "mg", display: "milligram" };
const UCUM_G = { system: UCUM_SYSTEM, code: "g", display: "gram" };
const UCUM_KG = { system: UCUM_SYSTEM, code: "kg", display: "kilogram" };
const UCUM_PER_MIN = {
  system: UCUM_SYSTEM,
  code: "/min",
  display: "per minute",
};
const UCUM_CEL = {
  system: UCUM_SYSTEM,
  code: "Cel",
  display: "degree Celsius",
};
const LOINC_HEART_RATE = {
  system: "http://loinc.org",
  code: "8867-4",
  display: "Heart rate",
};

// RFC 4122 URL namespace (Python's uuid.NAMESPACE_URL).
const NAMESPACE_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

type Json = Record<string, unknown>;

interface QuestionnaireEntry {
  id: string;
  slug: string;
  internal_revision?: number;
}

interface ListEntry {
  id: string;
  name: string;
  slug?: string;
}

/** RFC 4122 name-based (SHA-1) UUID, equal to Python's uuid.uuid5. */
function uuid5(name: string): string {
  const namespace = Buffer.from(NAMESPACE_URL.replace(/-/g, ""), "hex");
  const bytes = createHash("sha1")
    .update(Buffer.concat([namespace, Buffer.from(name, "utf8")]))
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function question(
  slug: string,
  linkId: string,
  type: string,
  text: string,
  extra: Json = {},
): Json {
  return {
    id: uuid5(`care:e2e:${slug}:${linkId}`),
    link_id: linkId,
    type,
    text,
    ...extra,
  };
}

function kitchenSinkQuestions(slug: string): Json[] {
  const q = (linkId: string, type: string, text: string, extra?: Json) =>
    question(slug, linkId, type, text, extra);
  return [
    q("q-string", "string", "Primary symptom"),
    q("q-text", "text", "Detailed history"),
    q("q-url", "url", "Reference document URL"),
    q("q-decimal", "decimal", "Body temperature (C)"),
    q("q-integer", "integer", "Pain score (0-10)"),
    q("q-date", "date", "Symptom onset date"),
    q("q-datetime", "dateTime", "Admission timestamp"),
    q("q-time", "time", "Last medication time"),
    q("q-boolean", "boolean", "Is the patient stable?"),
    q("q-choice", "choice", "Severity assessment", {
      answer_option: [
        { value: "Mild" },
        { value: "Moderate", initial_selected: true },
        { value: "Severe" },
      ],
    }),
    q("q-quantity", "quantity", "Dose administered", {
      answer_option: [{ value: "250" }, { value: "500" }, { value: "1000" }],
      unit: UCUM_MG,
    }),
    q("grp-main", "group", "Examination findings", {
      styling_metadata: { containerClasses: "grid grid-cols-2" },
      questions: [
        q("q-grp-string", "string", "General appearance"),
        q("grp-nested", "group", "Cardiovascular", {
          styling_metadata: { containerClasses: "grid grid-cols-1" },
          questions: [q("q-nested-string", "string", "Heart sounds")],
        }),
      ],
    }),
    q("q-ew-yes", "string", "Stability notes", {
      enable_when: [
        { question: "q-boolean", operator: "equals", answer: "Yes" },
      ],
    }),
    q("q-ew-no", "text", "Escalation plan", {
      enable_when: [
        { question: "q-boolean", operator: "equals", answer: "No" },
      ],
    }),
    q("q-ew-greater", "string", "Severe pain follow-up", {
      enable_when: [{ question: "q-integer", operator: "greater", answer: 7 }],
    }),
    q("q-ew-less", "string", "Low pain follow-up", {
      enable_when: [{ question: "q-integer", operator: "less", answer: 3 }],
    }),
    q("q-ew-equals", "string", "Fever details", {
      enable_when: [
        { question: "q-string", operator: "equals", answer: "fever" },
      ],
    }),
    q("q-ew-any", "string", "Any-behavior follow-up", {
      enable_behavior: "any",
      enable_when: [
        { question: "q-boolean", operator: "equals", answer: "Yes" },
        { question: "q-integer", operator: "greater", answer: 5 },
      ],
    }),
    q(
      "q-ew-protected",
      "string",
      "Protected note (visible but locked when disabled)",
      {
        disabled_display: "protected",
        enable_when: [
          { question: "q-boolean", operator: "equals", answer: "Yes" },
        ],
      },
    ),
    q("q-repeat-choice", "choice", "Symptoms observed (repeats)", {
      repeats: true,
      answer_option: [
        { value: "Cough" },
        { value: "Fever" },
        { value: "Fatigue" },
      ],
    }),
    q("q-repeat-string", "string", "Medications taken (repeats)", {
      repeats: true,
    }),
    q("q-obs-heart-rate", "integer", "Heart rate (bpm)", {
      code: LOINC_HEART_RATE,
      is_observation: true,
    }),
  ];
}

function unitsQuestions(slug: string): Json[] {
  return [
    question(slug, "q-int-unit", "integer", "Resting heart rate", {
      unit: UCUM_PER_MIN,
    }),
    question(slug, "q-dec-unit", "decimal", "Body temperature", {
      unit: UCUM_CEL,
    }),
    question(slug, "q-qty-vs", "quantity", "Dose given", {
      answer_value_set: { slug: UNITS_VALUESET_SLUG },
      unit: UCUM_MG,
    }),
  ];
}

function definition(
  slug: string,
  title: string,
  questions: Json[],
  subjectType = "encounter",
): Json {
  return {
    slug,
    version: "1.0",
    title,
    description: `E2E fixture questionnaire (${slug})`,
    status: "active",
    subject_type: subjectType,
    styling_metadata: {},
    questions,
    actions: [],
  };
}

async function api<T>(
  method: string,
  apiPath: string,
  body?: Json,
): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${apiPath}`, {
    method,
    headers: adminApiHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(
      `${method} ${apiPath} failed: ${res.status} — ${await res.text()}`,
    );
  }
  return (await res.json()) as T;
}

async function listAll<T>(
  apiPath: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;
  while (true) {
    const search = new URLSearchParams({
      ...params,
      limit: "100",
      offset: String(offset),
    });
    const page = await api<{ count: number; results: T[] }>(
      "GET",
      `${apiPath}?${search}`,
    );
    results.push(...page.results);
    offset += page.results.length;
    if (!page.results.length || offset >= page.count) return results;
  }
}

async function ensureUnitsValueSet(): Promise<void> {
  const instanceValueSets = await listAll<ListEntry>("/api/v1/valueset/", {
    auth_context: "instance",
  });
  if (instanceValueSets.some(({ slug }) => slug === UNITS_VALUESET_SLUG)) {
    console.log(`✅ Valueset exists: ${UNITS_VALUESET_SLUG}`);
    return;
  }
  await api("POST", "/api/v1/valueset/", {
    slug: UNITS_VALUESET_SLUG,
    name: "E2E Dose Units",
    description: "E2E fixture: bounded UCUM dose units (mg/g/kg)",
    status: "active",
    auth_context: "instance",
    inherited: false,
    disable_composition: false,
    compose: {
      include: [
        {
          system: UCUM_SYSTEM,
          concept: [UCUM_MG, UCUM_G, UCUM_KG].map(({ code, display }) => ({
            code,
            display,
          })),
        },
      ],
      exclude: [],
    },
  });
  console.log(`✅ Valueset created: ${UNITS_VALUESET_SLUG}`);
}

export async function ensureQuestionnaireE2EFixtures(): Promise<void> {
  const facilityId = getFacilityId();
  const existing = new Map(
    (await listAll<QuestionnaireEntry>("/api/v1/questionnaire/")).map(
      (entry) => [entry.slug, entry],
    ),
  );
  const facilityOrganizations = await listAll<ListEntry>(
    `/api/v1/facility/${facilityId}/organizations/`,
  );
  const taggedOrganizationIds = TAGGED_FACILITY_ORGANIZATIONS.map((name) => {
    const organization = facilityOrganizations.find((org) => org.name === name);
    if (!organization) {
      throw new Error(`Facility organization "${name}" not found`);
    }
    return organization.id;
  });

  const create = async (
    questionnaire: Json,
    scope: "instance" | "facility",
    { tagOrganizations = false } = {},
  ): Promise<QuestionnaireEntry> => {
    const slug = questionnaire.slug as string;
    let entry = existing.get(slug);
    if (entry) {
      console.log(`✅ Questionnaire exists: ${slug}`);
    } else {
      entry = await api<QuestionnaireEntry>("POST", "/api/v1/questionnaire/", {
        ...questionnaire,
        auth_context: scope,
        ...(scope === "facility" ? { facility: facilityId } : {}),
      });
      console.log(`✅ Questionnaire created: ${slug}`);
    }
    // Replaces the tag set, so re-applying it also repairs a run that
    // failed between the create and the tagging.
    if (tagOrganizations) {
      await api(
        "POST",
        `/api/v1/questionnaire/${entry.id}/set_facility_organizations/`,
        { facility_organizations: taggedOrganizationIds },
      );
    }
    return entry;
  };

  // Attempt every fixture before failing so one CI run reports all errors;
  // CI retries the setup project, which then only fills the gaps.
  const failures: string[] = [];
  const attempt = async (label: string, seed: () => Promise<unknown>) => {
    try {
      await seed();
    } catch (error) {
      failures.push(
        `${label}: ${error instanceof Error ? error.message : error}`,
      );
    }
  };

  for (const file of DEFAULT_FIXTURE_FILES) {
    const fixture = JSON.parse(
      fs.readFileSync(path.resolve(file), "utf-8"),
    ) as Json;
    await attempt(file, () => create({ actions: [], ...fixture }, "instance"));
  }

  for (const [slug, title, scope] of [
    ["e2e-kitchen-sink-instance", "E2E Kitchen Sink (Instance)", "instance"],
    ["e2e-kitchen-sink-facility", "E2E Kitchen Sink (Facility)", "facility"],
  ] as const) {
    await attempt(slug, () =>
      create(definition(slug, title, kitchenSinkQuestions(slug)), scope, {
        tagOrganizations: scope === "facility",
      }),
    );
  }

  // The units questionnaire references this instance valueset by slug.
  await attempt(UNITS_QUESTIONNAIRE_SLUG, async () => {
    await ensureUnitsValueSet();
    await create(
      definition(
        UNITS_QUESTIONNAIRE_SLUG,
        "E2E Units Questionnaire",
        unitsQuestions(UNITS_QUESTIONNAIRE_SLUG),
      ),
      "facility",
      { tagOrganizations: true },
    );
  });

  for (const subjectType of ["location", "device", "facility"]) {
    const slug = `e2e-subject-${subjectType}`;
    const label = subjectType[0].toUpperCase() + subjectType.slice(1);
    await attempt(slug, () =>
      create(
        definition(
          slug,
          `E2E ${label} Questionnaire`,
          [question(slug, "q-note", "string", "Notes")],
          subjectType,
        ),
        "facility",
        { tagOrganizations: true },
      ),
    );
  }

  for (let index = 1; index <= PAGINATION_QUESTIONNAIRE_COUNT; index++) {
    const suffix = String(index).padStart(3, "0");
    const slug = `e2e-pagination-${suffix}`;
    await attempt(slug, () =>
      create(
        definition(slug, `E2E Pagination ${suffix}`, [
          question(slug, "q-note", "string", "Note"),
        ]),
        "facility",
      ),
    );
  }

  // Instance questionnaire with two archived revisions: every PUT that
  // changes the questions archives the current one and bumps the revision.
  await attempt(VERSIONED_SLUG, async () => {
    const versioned = (revision: number) =>
      definition(VERSIONED_SLUG, "E2E Versioned Questionnaire", [
        question(
          VERSIONED_SLUG,
          "q-note",
          "string",
          `Observation note (v${revision})`,
        ),
      ]);
    let current = await create(versioned(1), "instance");
    for (
      let revision = (current.internal_revision ?? 1) + 1;
      revision <= VERSIONED_TARGET_REVISION;
      revision++
    ) {
      current = await api<QuestionnaireEntry>(
        "PUT",
        `/api/v1/questionnaire/${current.id}/`,
        versioned(revision),
      );
      console.log(
        `✅ Questionnaire ${VERSIONED_SLUG} at revision ${current.internal_revision}`,
      );
    }
  });

  if (failures.length) {
    throw new Error(
      `Failed to seed questionnaire fixtures:\n${failures.join("\n")}`,
    );
  }
}
