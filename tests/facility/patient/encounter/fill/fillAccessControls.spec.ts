import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

async function api<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: body ? "POST" : "GET",
    headers: adminApiHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  expect(
    response.ok,
    `${path}: ${response.status} ${await response.clone().text()}`,
  ).toBe(true);
  return response.json() as Promise<T>;
}

async function createForm(
  title: string,
  questions: object[],
  facility?: string,
) {
  return api<{ id: string; title: string }>("/api/v1/questionnaire/", {
    title,
    slug: `fill-access-${faker.string.alphanumeric(12).toLowerCase()}`,
    status: "active",
    version: "1.0",
    subject_type: "encounter",
    auth_context: facility ? "facility" : "instance",
    ...(facility ? { facility } : {}),
    questions,
    actions: [],
  });
}

function fillPath() {
  return `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire`;
}

test("read-only structured questions disable every history-import button", async ({
  page,
}) => {
  const historyTypes = [
    {
      type: "medication_request",
      title: "Locked prescriptions",
      button: "Medication history",
    },
    {
      type: "medication_statement",
      title: "Locked medications",
      button: "Medication history",
    },
    {
      type: "diagnosis",
      title: "Locked diagnoses",
      button: "Diagnosis history",
    },
    { type: "symptom", title: "Locked symptoms", button: "Symptom history" },
  ];
  const form = await createForm(
    `Read-only histories ${faker.string.alphanumeric(8)}`,
    historyTypes.map(({ type, title }) => ({
      id: faker.string.uuid(),
      link_id: type,
      text: title,
      type: "structured",
      structured_type: type,
      read_only: true,
    })),
  );
  await page.goto(`${fillPath()}/${form.id}`);
  await test.step("all history entry points remain disabled in read-only sections", async () => {
    for (const { title, button } of historyTypes) {
      await expect(
        questionBlock(page, title).getByRole("button", {
          name: new RegExp(`^${button}$`, "i"),
        }),
      ).toBeDisabled();
    }
  });
});

test("initial and additional encounter pickers exclude another facility's forms", async ({
  page,
}) => {
  const facilityId = getFacilityId();
  const suffix = faker.string.alphanumeric(8).toLowerCase();
  const currentFacility = await api<{
    geo_organization: { id: string };
    facility_type: string;
    pincode: number;
  }>(`/api/v1/facility/${facilityId}/`);
  const otherFacility = await api<{ id: string }>("/api/v1/facility/", {
    name: `Picker scope ${suffix}`,
    description: "Questionnaire picker regression fixture",
    address: "Test address",
    phone_number: "+919876543210",
    facility_type: currentFacility.facility_type,
    pincode: currentFacility.pincode,
    is_public: false,
    geo_organization: currentFacility.geo_organization.id,
    features: [],
  });
  const prefix = `Picker scope ${suffix}`;
  const question = {
    id: faker.string.uuid(),
    link_id: "note",
    text: "Scope note",
    type: "string",
  };
  const local = await createForm(`${prefix} local`, [question], facilityId);
  const instance = await createForm(`${prefix} shared`, [
    { ...question, id: faker.string.uuid() },
  ]);
  const foreign = await createForm(
    `${prefix} other`,
    [{ ...question, id: faker.string.uuid() }],
    otherFacility.id,
  );

  await page.goto(fillPath());
  await page
    .getByRole("combobox", {
      name: "Select a questionnaire to fill",
      exact: true,
    })
    .click();
  const picker = page.getByRole("dialog", { name: "Forms", exact: true });
  const search = picker.getByPlaceholder("Search Forms");
  await test.step("the initial popover offers the current facility and shared forms only", async () => {
    const request = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/v1/questionnaire/" &&
        url.searchParams.get("title") === prefix
      );
    });
    await search.fill(prefix);
    expect(
      new URL((await request).url()).searchParams.get("facility_or_instance"),
    ).toBe(facilityId);
    await expect(
      picker.getByRole("option", { name: local.title, exact: true }),
    ).toBeVisible();
    await expect(
      picker.getByRole("option", { name: instance.title, exact: true }),
    ).toBeVisible();
    await expect(
      picker.getByRole("option", { name: foreign.title, exact: true }),
    ).toHaveCount(0);
    await picker
      .getByRole("option", { name: local.title, exact: true })
      .click();
    await expect(questionBlock(page, "Scope note")).toBeVisible();
  });
  await test.step("adding another form uses the same facility scope", async () => {
    await page
      .getByRole("button", { name: "Add Questionnaire", exact: true })
      .click();
    await search.fill(prefix);
    await expect(
      picker.getByRole("option", { name: instance.title, exact: true }),
    ).toBeVisible();
    await expect(
      picker.getByRole("option", { name: foreign.title, exact: true }),
    ).toHaveCount(0);
  });
});
