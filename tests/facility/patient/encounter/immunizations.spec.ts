import { faker } from "@faker-js/faker";
import { expect, Page, Request, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import { ImmunizationRead } from "../../../../src/types/emr/immunization/immunization";
import { ImmunizationPolicyRead } from "../../../../src/types/emr/immunizationPolicy/immunizationPolicy";
import {
  ImmunizationRecommendationRead,
  ImmunizationRecommendationTree,
} from "../../../../src/types/emr/immunizationRecommendation/immunizationRecommendation";

test.use({ storageState: "tests/.auth/user.json" });

const vaccine = {
  system: "http://hl7.org/fhir/sid/cvx",
  code: "08",
  display: "Hepatitis B vaccine",
};
const disease = {
  system: "http://snomed.info/sct",
  code: "66071002",
  display: "Hepatitis B",
};

function recommendation(
  overrides: Partial<ImmunizationRecommendationRead> = {},
): ImmunizationRecommendationRead {
  return {
    id: faker.string.uuid(),
    forecast_status: "due",
    is_group: false,
    codes: [vaccine],
    diseases: [disease],
    series: "Hepatitis B primary series",
    dose_number: "1",
    series_number: "3",
    earliest_date: "2020-01-01",
    due_date: "2099-01-01",
    overdue_date: null,
    description: null,
    ...overrides,
  };
}

/** Exercise the browser/API boundary while the immunization endpoints roll
 * out. The handler echoes writes into the next list response so the page can
 * refresh; assertions concern outgoing requests and rendered controls.
 */
async function routeImmunizations(
  page: Page,
  patientId: string,
  initial: {
    recommendations?: ImmunizationRecommendationRead[];
    records?: ImmunizationRead[];
  } = {},
) {
  const recommendations = [...(initial.recommendations ?? [])];
  const records = [...(initial.records ?? [])];
  const writes: Request[] = [];
  const base = `/api/v1/patient/${patientId}/immunization/`;
  await page.route(
    (url) => url.pathname.startsWith(base),
    async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const resource = path.slice(base.length).split("/")[0];
      const store =
        resource === "recommendation"
          ? recommendations
          : resource === "record"
            ? records
            : undefined;
      if (!store) return route.abort();
      if (request.method() === "GET") {
        return route.fulfill({
          json: { count: store.length, results: store },
        });
      }
      writes.push(request);
      const body = request.postDataJSON();
      if (
        request.method() === "POST" &&
        path === `${base}recommendation/create_tree/`
      ) {
        // The endpoint returns the root and later list reads contain each node.
        // Atomic persistence is covered by the backend, not this browser mock.
        const addNode = ({
          children,
          ...fields
        }: ImmunizationRecommendationTree): ImmunizationRecommendationRead => {
          const created = {
            ...fields,
            id: faker.string.uuid(),
            forecast_status: "due" as const,
          };
          recommendations.push(created);
          children.forEach(addNode);
          return created;
        };
        return route.fulfill({ json: addNode(body.root) });
      }
      if (request.method() === "POST") {
        const created = { ...body, id: faker.string.uuid() };
        store.push(created);
        return route.fulfill({ json: created });
      }
      const id = path.split("/").at(-2);
      const index = store.findIndex((item) => item.id === id);
      store[index] = { ...store[index], ...body };
      return route.fulfill({ json: store[index] });
    },
  );
  return writes;
}

async function routeTerminology(page: Page) {
  await page.route(
    (url) => url.pathname.startsWith("/api/v1/valueset/"),
    async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === "/api/v1/valueset/expand_slug/") {
        const { slug } = request.postDataJSON() as { slug: string };
        await route.fulfill({
          json: {
            valueset: { id: faker.string.uuid(), slug },
            results: [{ ...vaccine, designation: [] }],
          },
        });
      } else if (request.method() === "GET") {
        await route.fulfill({ json: [] });
      } else {
        await route.fulfill({ json: { message: "Recorded" } });
      }
    },
  );
}

function isWrite(request: Request, method: string, resource: string) {
  return (
    request.method() === method &&
    new URL(request.url()).pathname.includes(`/immunization/${resource}/`)
  );
}

test.describe("Encounter immunizations", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let tabUrl: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
    tabUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/immunizations`;
  });

  test("applies a policy as nested recommendations dated from the start date", async ({
    page,
  }) => {
    const policy: ImmunizationPolicyRead = {
      id: faker.string.uuid(),
      name: `Hepatitis B schedule ${faker.string.alphanumeric(6)}`,
      policy_template: {
        is_group: true,
        codes: [],
        children: [
          {
            codes: [{ ...vaccine, version: "2024" }],
            diseases: [disease],
            is_group: false,
            children: [],
            series: "Hepatitis B primary series",
            dose_number: "1",
            series_number: "2",
            earliest_date: -1,
            due_date: 0,
            overdue_date: 14,
          },
          {
            codes: [vaccine],
            is_group: false,
            children: [],
            dose_number: "2",
            series_number: "2",
            due_date: 28,
          },
        ],
      },
    };
    await page.route(
      (url) => url.pathname === "/api/v1/immunization/policy/",
      (route) => route.fulfill({ json: { count: 1, results: [policy] } }),
    );
    const writes = await routeImmunizations(page, patientId);
    await page.goto(tabUrl);
    await expect(page.getByText("No recommendations scheduled")).toBeVisible();

    await page.getByRole("button", { name: "Apply policy" }).click();
    const dialog = page.getByRole("dialog", { name: "Apply policy" });
    await dialog.getByRole("combobox", { name: "Policy" }).click();
    await page.getByRole("option", { name: policy.name }).click();
    await dialog.getByLabel("Start date").fill("2026-01-01");

    const preview = dialog.getByRole("region", { name: "Schedule preview" });
    await expect(preview.getByRole("listitem")).toHaveCount(2);
    await expect(preview).toContainText("Due 01 Jan 2026");
    await expect(preview).toContainText("Due 29 Jan 2026");

    await dialog.getByRole("button", { name: "Add 2 recommendations" }).click();
    await expect(dialog).toBeHidden();
    const creates = writes.filter((request) =>
      isWrite(request, "POST", "recommendation"),
    );
    expect(creates).toHaveLength(1);
    expect(new URL(creates[0].url()).pathname).toBe(
      `/api/v1/patient/${patientId}/immunization/recommendation/create_tree/`,
    );
    const body = creates[0].postDataJSON();
    expect(body).toMatchObject({
      patient: patientId,
      encounter: encounterId,
    });
    const root = body.root;
    expect(root.is_group).toBe(true);
    expect(root).not.toHaveProperty("codes");
    expect(root.children).toHaveLength(2);
    const [first, second] = root.children;
    expect(first).toMatchObject({
      is_group: false,
      codes: [{ ...vaccine, version: "2024" }],
      diseases: [disease],
      earliest_date: "2025-12-31",
      due_date: "2026-01-01",
      overdue_date: "2026-01-15",
      dose_number: "1",
      series_number: "2",
      children: [],
    });
    expect(second).toMatchObject({
      is_group: false,
      codes: [vaccine],
      due_date: "2026-01-29",
      children: [],
    });
    expect(second).not.toHaveProperty("earliest_date");
    for (const node of [root, first, second]) {
      expect(node).not.toHaveProperty("parent");
      expect(node).not.toHaveProperty("forecast_status");
    }

    const schedule = page.getByRole("list", { name: "Schedule" });
    await expect(schedule.getByRole("listitem")).toHaveCount(2);
  });

  test("switches the linked recommendation, records its vaccine and completes it", async ({
    page,
  }) => {
    const due = recommendation();
    const nextVaccine = { ...vaccine, code: "03", display: "MMR vaccine" };
    const selected = recommendation({ codes: [nextVaccine], diseases: [] });
    const writes = await routeImmunizations(page, patientId, {
      recommendations: [due, selected],
    });
    await page.goto(tabUrl);

    const item = page
      .getByRole("list", { name: "Schedule" })
      .getByRole("listitem", { name: vaccine.display });
    await expect(item).toContainText("Dose 1 of 3");
    await item
      .getByRole("button", { name: `Record dose of ${vaccine.display}` })
      .click();

    const sheet = page.getByRole("dialog", { name: "Record immunization" });
    await expect(
      sheet.getByRole("combobox", { name: "Vaccine", exact: true }),
    ).toContainText(vaccine.display);
    await expect(
      sheet.getByRole("checkbox", {
        name: "Mark the recommendation as complete",
      }),
    ).toBeChecked();
    await sheet.getByRole("combobox", { name: "For recommendation" }).click();
    await page.getByRole("option", { name: /MMR vaccine/ }).click();
    await expect(
      sheet.getByRole("combobox", { name: "Vaccine", exact: true }),
    ).toContainText(nextVaccine.display);
    await sheet.getByRole("spinbutton", { name: "Dose" }).fill("0.5");

    const [record] = await Promise.all([
      page.waitForRequest((request) => isWrite(request, "POST", "record")),
      sheet.getByRole("button", { name: "Save immunization" }).click(),
    ]);
    expect(record.postDataJSON()).toMatchObject({
      encounter: encounterId,
      status: "completed",
      primary_source: true,
      recommendation: selected.id,
      code: nextVaccine,
      dose_quantity: {
        value: "0.5",
        unit: { code: "mL", system: "http://unitsofmeasure.org" },
      },
      is_subpotent: false,
    });
    expect(record.postDataJSON().administered_by).toEqual(expect.any(String));
    expect(record.postDataJSON()).not.toHaveProperty("reason");

    await expect(sheet).toBeHidden();
    const update = writes.find((request) =>
      isWrite(request, "PUT", "recommendation"),
    );
    expect(update?.postDataJSON()).toMatchObject({
      forecast_status: "complete",
      codes: [nextVaccine],
      due_date: selected.due_date,
    });
    expect(new URL(update!.url()).pathname).toBe(
      `/api/v1/patient/${patientId}/immunization/recommendation/${selected.id}/`,
    );
    await expect(
      page
        .getByRole("list", { name: "Administered" })
        .getByRole("listitem", { name: nextVaccine.display }),
    ).toContainText("Completed");
    await expect(
      item.getByRole("button", { name: `Record dose of ${vaccine.display}` }),
    ).toBeVisible();
  });

  test("shows load failures separately from empty clinical lists and policy catalogues, with retry", async ({
    page,
  }) => {
    await routeImmunizations(page, patientId);
    const unavailable = new Set(["recommendation", "record"]);
    await page.route(
      (url) =>
        ["recommendation", "record"].some(
          (resource) =>
            url.pathname ===
            `/api/v1/patient/${patientId}/immunization/${resource}/`,
        ),
      (route) => {
        const resource = new URL(route.request().url()).pathname
          .split("/")
          .at(-2)!;
        return unavailable.has(resource)
          ? route.fulfill({
              status: 503,
              json: { detail: "Temporarily unavailable" },
            })
          : route.fallback();
      },
    );
    let catalogueUnavailable = true;
    await page.route(
      (url) => url.pathname === "/api/v1/immunization/policy/",
      (route) =>
        catalogueUnavailable
          ? route.fulfill({
              status: 503,
              json: { detail: "Temporarily unavailable" },
            })
          : route.fulfill({ json: { count: 0, results: [] } }),
    );
    await page.goto(tabUrl);
    for (const [resource, name, empty] of [
      ["recommendation", "Schedule", "No recommendations scheduled"],
      ["record", "Administered", "No immunizations recorded"],
    ]) {
      const section = page.getByRole("region", { name, exact: true });
      await expect(section.getByRole("alert")).toContainText(
        "Could not load this clinical information.",
      );
      await expect(section.getByText(empty, { exact: true })).toBeHidden();
      unavailable.delete(resource);
      await section
        .getByRole("button", { name: "Try Again", exact: true })
        .click();
      await expect(section.getByText(empty, { exact: true })).toBeVisible();
      await expect(section.getByRole("alert")).toBeHidden();
    }

    await page.getByRole("button", { name: "Apply policy" }).click();
    const dialog = page.getByRole("dialog", { name: "Apply policy" });
    await expect(dialog.getByRole("alert")).toContainText(
      "Unable to load immunization policies.",
    );
    await expect(
      dialog.getByText("No immunization policies yet", { exact: true }),
    ).toBeHidden();
    await expect(
      dialog.getByRole("combobox", { name: "Policy" }),
    ).toBeDisabled();
    catalogueUnavailable = false;
    await dialog
      .getByRole("button", { name: "Try Again", exact: true })
      .click();
    await expect(
      dialog.getByText("No immunization policies yet", { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByRole("alert")).toBeHidden();
    await expect(
      dialog.getByRole("combobox", { name: "Policy" }),
    ).toBeEnabled();
  });

  test("requires a reason when an immunization was not given", async ({
    page,
  }) => {
    await routeTerminology(page);
    await routeImmunizations(page, patientId);
    await page.goto(tabUrl);

    await page.getByRole("button", { name: "Record immunization" }).click();
    const sheet = page.getByRole("dialog", { name: "Record immunization" });
    const save = sheet.getByRole("button", { name: "Save immunization" });

    await save.click();
    await expect(sheet.getByText("Select the vaccine.")).toBeVisible();

    await sheet.getByRole("combobox", { name: "Vaccine", exact: true }).click();
    await page
      .getByTestId("valueset-search-results")
      .getByRole("option")
      .filter({ hasText: vaccine.display })
      .click();
    await sheet.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Not given" }).click();
    await expect(
      sheet.getByRole("region", { name: "Administration details" }),
    ).toBeHidden();

    await save.click();
    await expect(
      sheet.getByText("Select why the immunization was not given."),
    ).toBeVisible();

    await sheet.getByRole("combobox", { name: "Reason not given" }).click();
    await page.getByRole("option", { name: "Patient objection" }).click();
    const [record] = await Promise.all([
      page.waitForRequest((request) => isWrite(request, "POST", "record")),
      save.click(),
    ]);
    const body = record.postDataJSON();
    expect(body).toMatchObject({
      encounter: encounterId,
      status: "not_done",
      reason: "PATOBJ",
      code: vaccine,
    });
    for (const field of [
      "dose_quantity",
      "administered_by",
      "location",
      "is_subpotent",
      "recommendation",
    ]) {
      expect(body).not.toHaveProperty(field);
    }
  });
});

test.describe("Patient immunization history", () => {
  test("shows the forecast and administered doses read only", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const overdue = recommendation({
      due_date: "2024-01-01",
      overdue_date: "2024-02-01",
    });
    const complete = recommendation({
      codes: [{ ...vaccine, display: "MMR vaccine", code: "03" }],
      forecast_status: "complete",
    });
    const group = recommendation({
      is_group: true,
      codes: [],
      series: "Childhood schedule",
    });
    const reported: ImmunizationRead = {
      id: faker.string.uuid(),
      status: "completed",
      code: vaccine,
      occurrence: "2024-01-10T09:30:00Z",
      primary_source: false,
      note: "Card shown by the parent",
    };
    await routeImmunizations(page, patientId, {
      recommendations: [complete, group, overdue],
      records: [reported],
    });
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/history/immunizations`,
    );

    const schedule = page.getByRole("list", { name: "Schedule" });
    await expect(schedule.getByRole("listitem")).toHaveCount(2);
    // Active recommendations sort before settled ones.
    await expect(schedule.getByRole("listitem").first()).toContainText(
      "Overdue",
    );
    await expect(schedule).not.toContainText("Childhood schedule");
    await expect(page.getByText("1 overdue")).toBeVisible();

    const administered = page
      .getByRole("list", { name: "Administered" })
      .getByRole("listitem", { name: vaccine.display });
    await expect(administered).toContainText("Reported");
    await expect(administered).toContainText("Card shown by the parent");

    for (const name of [
      "Apply policy",
      "Record immunization",
      `Record dose of ${vaccine.display}`,
      `Edit ${vaccine.display}`,
    ]) {
      await expect(page.getByRole("button", { name })).toHaveCount(0);
    }
  });
});
