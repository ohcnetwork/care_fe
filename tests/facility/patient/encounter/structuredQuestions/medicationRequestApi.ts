import { getApiHeaders, getApiUrl } from "tests/helper/utils";

/**
 * API helpers that seed and read medication requests and response templates.
 *
 * The UI cannot set `dispense_status`. Only the pharmacy dispense flow sets it.
 * These helpers seed that state directly, so a test can show that a new
 * medication request does not copy the `dispense_status` of its source record.
 */

export interface MedicationCode {
  system: string;
  code: string;
  display: string;
}

export interface MedicationRequestRecord {
  id: string;
  medication: MedicationCode | null;
  dispense_status: string | null;
  authored_on: string;
}

async function callApi<T>(
  path: string,
  init: { method: string; body?: unknown } = { method: "GET" },
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: init.method,
    headers: getApiHeaders(),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (!response.ok) {
    throw new Error(
      `${init.method} ${path} failed with ${response.status}: ${await response.text()}`,
    );
  }

  return response.status === 204 ? (undefined as T) : await response.json();
}

/** Returns the medication code that the given display name refers to. */
export async function findMedicationCode(
  display: string,
): Promise<MedicationCode> {
  const { results } = await callApi<{ results: MedicationCode[] }>(
    "/api/v1/valueset/system-medication/expand/",
    { method: "POST", body: { search: `${display} clinical drug`, count: 20 } },
  );

  const match = results.find((result) => result.display === display);
  if (!match) {
    throw new Error(`Medication "${display}" is not in the valueset`);
  }

  return { system: match.system, code: match.code, display: match.display };
}

/** Returns the id of the logged in user. */
export async function getCurrentUserId(): Promise<string> {
  const user = await callApi<{ id: string }>("/api/v1/users/getcurrentuser/");
  return user.id;
}

/** Builds a valid medication request body for the given code. */
export function buildMedicationRequestBody(
  medication: MedicationCode,
  encounterId: string,
  requesterId: string,
  dispenseStatus?: string,
) {
  return {
    status: "active",
    intent: "order",
    category: "inpatient",
    priority: "routine",
    do_not_perform: false,
    medication,
    dosage_instruction: [
      {
        as_needed_boolean: false,
        dose_and_rate: {
          type: "ordered",
          dose_quantity: {
            value: 1,
            unit: {
              system: "http://unitsofmeasure.org",
              code: "{tbl}",
              display: "tablets",
            },
          },
        },
        timing: {
          repeat: {
            frequency: 2,
            period: 1,
            period_unit: "d",
            bounds_duration: { value: 3, unit: "d" },
          },
          code: {
            system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
            code: "BID",
            display: "BID",
          },
        },
      },
    ],
    authored_on: new Date().toISOString(),
    encounter: encounterId,
    requester: requesterId,
    ...(dispenseStatus ? { dispense_status: dispenseStatus } : {}),
  };
}

/**
 * Creates a medication request that the pharmacy has already dispensed.
 * Returns the id of the new record.
 */
export async function seedDispensedMedicationRequest(
  patientId: string,
  encounterId: string,
  medication: MedicationCode,
): Promise<string> {
  const requesterId = await getCurrentUserId();
  const created = await callApi<MedicationRequestRecord>(
    `/api/v1/patient/${patientId}/medication/request/`,
    {
      method: "POST",
      body: buildMedicationRequestBody(
        medication,
        encounterId,
        requesterId,
        "complete",
      ),
    },
  );

  if (created.dispense_status !== "complete") {
    throw new Error("The seeded medication request is not dispensed");
  }

  return created.id;
}

/** Returns every medication request of the encounter that uses the code. */
export async function listMedicationRequests(
  patientId: string,
  encounterId: string,
  medicationCode: string,
): Promise<MedicationRequestRecord[]> {
  const { results } = await callApi<{ results: MedicationRequestRecord[] }>(
    `/api/v1/patient/${patientId}/medication/request/?encounter=${encounterId}&limit=100`,
  );

  return results.filter((result) => result.medication?.code === medicationCode);
}

/**
 * Creates a response template that holds one dispensed medication.
 * Returns the id of the new template.
 */
export async function seedTemplateWithDispensedMedication(
  facilityId: string,
  name: string,
  medication: MedicationCode,
  encounterId: string,
): Promise<string> {
  const requesterId = await getCurrentUserId();
  const {
    encounter: _encounter,
    requester: _requester,
    ...medicationRequest
  } = buildMedicationRequestBody(
    medication,
    encounterId,
    requesterId,
    "complete",
  );

  const template = await callApi<{ id: string }>(
    "/api/v1/questionnaire_response_template/",
    {
      method: "POST",
      body: {
        name,
        description: "",
        facility: facilityId,
        template_data: {
          medication_request: [medicationRequest],
          service_request: [],
        },
        users: ["admin"],
        facility_organizations: [],
      },
    },
  );

  return template.id;
}

/** Returns the medications that the template holds. */
export async function getTemplateMedications(
  templateId: string,
): Promise<Record<string, unknown>[]> {
  const template = await callApi<{
    template_data?: { medication_request?: Record<string, unknown>[] };
  }>(`/api/v1/questionnaire_response_template/${templateId}/`);

  return template.template_data?.medication_request ?? [];
}

/** Returns the id of the template with the given name, or null. */
export async function findTemplateIdByName(
  facilityId: string,
  name: string,
): Promise<string | null> {
  const { results } = await callApi<{ results: { id: string }[] }>(
    `/api/v1/questionnaire_response_template/?facility=${facilityId}&name=${encodeURIComponent(name)}&limit=20`,
  );

  return results[0]?.id ?? null;
}
