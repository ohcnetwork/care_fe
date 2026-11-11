import { faker } from "@faker-js/faker";
import { expect, Locator, Page, Request, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

import {
  ImmunizationPolicyRead,
  ImmunizationPolicyTemplate,
} from "../../../src/types/emr/immunizationPolicy/immunizationPolicy";

test.use({ storageState: "tests/.auth/user.json" });

const POLICY_PATH = "/api/v1/immunization/policy/";
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

function recommendation(): ImmunizationPolicyTemplate {
  return {
    codes: [vaccine],
    is_group: false,
    children: [],
  };
}

function policy(facility: string | null): ImmunizationPolicyRead {
  return {
    id: faker.string.uuid(),
    name: `Immunization policy ${faker.string.alphanumeric(8)}`,
    description: "Routine immunization recommendations",
    facility,
    policy_template: recommendation(),
  };
}

/** Exercise the browser/API boundary while the new backend endpoint rolls out.
 * Responses are fixed fixtures, not a mock store; assertions concern outgoing
 * requests and rendered controls, never persistence or server authorization.
 */
async function routePolicies(page: Page, record: ImmunizationPolicyRead) {
  const writes: Request[] = [];
  // The current API omits ownership from reads. Supply the distinct instance
  // and facility catalogues the UI must inspect before offering editing.
  const ownership = record.facility;
  const responseRecord = { ...record };
  delete responseRecord.facility;
  await page.route(
    (url) => url.pathname.startsWith(POLICY_PATH),
    async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (request.method() !== "GET") {
        writes.push(request);
        await route.fulfill({ json: responseRecord });
      } else if (path === `${POLICY_PATH}${record.id}/`) {
        await route.fulfill({ json: responseRecord });
      } else if (path === POLICY_PATH) {
        const facility = new URL(request.url()).searchParams.get("facility");
        const results =
          ownership === null || (facility !== null && ownership === facility)
            ? [responseRecord]
            : [];
        await route.fulfill({ json: { count: results.length, results } });
      } else {
        await route.abort();
      }
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
        const concept = slug === "system-medication" ? vaccine : disease;
        await route.fulfill({
          json: {
            valueset: { id: faker.string.uuid(), slug },
            results: [{ ...concept, designation: [] }],
          },
        });
      } else if (request.method() === "GET") {
        await route.fulfill({ json: [] });
      } else if (path.endsWith("/add_recent_view/")) {
        await route.fulfill({ json: { message: "Recorded" } });
      } else {
        await route.abort();
      }
    },
  );
}

async function selectCode(
  page: Page,
  group: Locator,
  kind: "vaccine" | "disease" = "vaccine",
) {
  await group
    .getByRole("combobox", {
      name: kind === "vaccine" ? "Add vaccine code" : "Add target disease",
      exact: true,
    })
    .first()
    .click();
  await page
    .getByTestId("valueset-search-results")
    .getByRole("option")
    .filter({ hasText: kind === "vaccine" ? vaccine.display : disease.display })
    .click();
}

function isPolicyWrite(request: Request, method: string, id = "") {
  return (
    request.method() === method &&
    new URL(request.url()).pathname === `${POLICY_PATH}${id ? `${id}/` : ""}`
  );
}

test.describe("Immunization policy editor API contracts", () => {
  test("retries failed facility lists and searches from the first page with ownership visible", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const own = policy(facilityId);
    const shared = policy(null);
    const records = [
      own,
      shared,
      ...Array.from({ length: 14 }, () => policy(facilityId)),
    ];
    let failRequests = true;
    await page.route(
      (url) => url.pathname === POLICY_PATH,
      async (route) => {
        const params = new URL(route.request().url()).searchParams;
        if (!params.has("facility")) {
          const responseRecord = { ...shared };
          delete responseRecord.facility;
          await route.fulfill({
            json: { count: 1, results: [responseRecord] },
          });
          return;
        }
        if (failRequests) {
          await route.fulfill({
            status: 503,
            json: { detail: "Service unavailable" },
          });
          return;
        }
        const matching = params.get("name") ? [own] : records;
        const offset = Number(params.get("offset"));
        const limit = Number(params.get("limit"));
        await route.fulfill({
          json: {
            count: matching.length,
            results: matching.slice(offset, offset + limit).map((record) => {
              const responseRecord = { ...record };
              delete responseRecord.facility;
              return responseRecord;
            }),
          },
        });
      },
    );
    await page.goto(`/facility/${facilityId}/settings/immunization-policies`);
    await expect(page.getByRole("alert")).toContainText(
      "Unable to load immunization policies",
    );
    failRequests = false;
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    const ownRow = page.getByRole("row").filter({ hasText: own.name });
    const sharedRow = page.getByRole("row").filter({ hasText: shared.name });
    await expect(ownRow).toContainText("Facility");
    await expect(sharedRow).toContainText("Instance");
    await page.locator("#next-pages").click();
    await expect(
      page.getByRole("row").filter({ hasText: records[15].name }),
    ).toBeVisible();
    const [request] = await Promise.all([
      page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === POLICY_PATH &&
          url.searchParams.get("name") === own.name
        );
      }),
      page
        .getByRole("textbox", { name: "Search policies by name", exact: true })
        .fill(own.name),
    ]);
    const params = new URL(request.url()).searchParams;
    expect(params.get("facility")).toBe(facilityId);
    expect(params.get("offset")).toBe("0");
    await expect(ownRow).toBeVisible();
    await expect(sharedRow).toHaveCount(0);
  });

  test("submits a facility policy with nested groups and recommendation details", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const record = policy(facilityId);
    await routePolicies(page, record);
    await routeTerminology(page);
    await page.goto(
      `/facility/${facilityId}/settings/immunization-policies/new`,
    );
    const root = page.getByRole("group", {
      name: "Recommendation template",
      exact: true,
    });

    await test.step("Build a group containing a recommendation and a nested group", async () => {
      await page
        .getByRole("textbox", { name: "Policy name" })
        .fill(record.name);
      await page
        .getByRole("textbox", { name: "Description", exact: true })
        .fill(record.description!);
      await root.getByRole("combobox", { name: "Type", exact: true }).click();
      await page.getByRole("option", { name: "Group", exact: true }).click();
      await selectCode(page, root);
      await root.getByRole("button", { name: "Add recommendation" }).click();
      const first = page.getByRole("group", {
        name: "Recommendation 1",
        exact: true,
      });
      await selectCode(page, first);
      await selectCode(page, first, "disease");
      await first
        .getByRole("textbox", { name: "Series", exact: true })
        .fill("Primary");
      await first
        .getByRole("textbox", { name: "Dose number", exact: true })
        .fill("1");
      await first
        .getByRole("textbox", { name: "Doses in series", exact: true })
        .fill("3");
      await first
        .locator("summary")
        .filter({ hasText: "Additional details" })
        .click();
      await first
        .getByRole("textbox", { name: "Recommendation description" })
        .fill("First dose");
      await first
        .getByRole("spinbutton", { name: "Earliest offset (days)" })
        .fill("0");
      await first
        .getByRole("spinbutton", { name: "Due offset (days)", exact: true })
        .fill("7");
      await first
        .getByRole("spinbutton", { name: "Overdue offset (days)" })
        .fill("14");

      await page
        .getByRole("button", {
          name: "Select Recommendation template",
          exact: true,
        })
        .click();
      await root
        .getByRole("button", { name: "Add group", exact: true })
        .click();
      const nested = page.getByRole("group", { name: "Group 2", exact: true });
      await selectCode(page, nested);
      await nested.getByRole("button", { name: "Add recommendation" }).click();
      const second = page.getByRole("group", {
        name: "Recommendation 1",
        exact: true,
      });
      await selectCode(page, second);
    });

    await test.step("Submit the complete tree with facility ownership", async () => {
      const [request] = await Promise.all([
        page.waitForRequest((request) => isPolicyWrite(request, "POST")),
        page.getByRole("button", { name: "Save policy" }).click(),
      ]);
      expect(request.postDataJSON()).toMatchObject({
        name: record.name,
        description: record.description,
        facility: facilityId,
        policy_template: {
          codes: [vaccine],
          is_group: true,
          children: [
            {
              codes: [vaccine],
              diseases: [disease],
              is_group: false,
              series: "Primary",
              dose_number: "1",
              series_number: "3",
              description: "First dose",
              earliest_date: 0,
              due_date: 7,
              overdue_date: 14,
              children: [],
            },
            {
              codes: [vaccine],
              is_group: true,
              children: [
                {
                  codes: [vaccine],
                  is_group: false,
                  children: [],
                },
              ],
            },
          ],
        },
      });
      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/settings/immunization-policies$`),
      );
    });
  });

  test("requires vaccine codes and strictly increasing integer day offsets before submitting an instance policy", async ({
    page,
  }) => {
    const record = policy(null);
    const writes = await routePolicies(page, record);
    await routeTerminology(page);
    await page.goto("/admin/immunization-policies/new");
    await page.getByRole("textbox", { name: "Policy name" }).fill(record.name);
    const root = page.getByRole("group", {
      name: "Recommendation template",
      exact: true,
    });
    const save = page.getByRole("button", { name: "Save policy" });
    const earliest = root.getByRole("spinbutton", {
      name: "Earliest offset (days)",
    });
    const due = root.getByRole("spinbutton", {
      name: "Due offset (days)",
      exact: true,
    });
    const overdue = root.getByRole("spinbutton", {
      name: "Overdue offset (days)",
    });

    await test.step("Reject missing codes, fractional days, and equal offsets", async () => {
      await save.click();
      await expect(root.getByRole("alert")).toContainText(
        "Select at least one vaccine code.",
      );
      expect(writes).toHaveLength(0);
      await selectCode(page, root);
      await earliest.fill("1.5");
      await save.click();
      await expect(root.getByRole("alert")).toContainText(
        "Enter a whole number of days.",
      );
      expect(writes).toHaveLength(0);
      await earliest.fill("14");
      // Omitted due_date must not exempt the other two dates from ordering.
      await overdue.fill("14");
      await save.click();
      await expect(root.getByRole("alert")).toContainText(
        "Values cannot be equal.",
      );
      expect(writes).toHaveLength(0);
    });

    await test.step("Correct the offsets and submit explicit instance ownership", async () => {
      await earliest.fill("-7");
      await due.fill("0");
      await overdue.fill("14");
      const [request] = await Promise.all([
        page.waitForRequest((request) => isPolicyWrite(request, "POST")),
        save.click(),
      ]);
      expect(request.postDataJSON()).toMatchObject({
        facility: null,
        name: record.name,
        policy_template: {
          codes: [vaccine],
          earliest_date: -7,
          due_date: 0,
          overdue_date: 14,
          is_group: false,
          children: [],
        },
      });
      expect(request.postDataJSON().policy_template).not.toHaveProperty(
        "forecast_status",
      );
      expect(writes).toHaveLength(1);
      await expect(page).toHaveURL(/\/admin\/immunization-policies$/);
    });
  });

  test("lets groups omit vaccine codes while recommendations inside them still require one", async ({
    page,
  }) => {
    const record = policy(null);
    const writes = await routePolicies(page, record);
    await routeTerminology(page);
    await page.goto("/admin/immunization-policies/new");
    await page.getByRole("textbox", { name: "Policy name" }).fill(record.name);
    const root = page.getByRole("group", {
      name: "Recommendation template",
      exact: true,
    });
    await root.getByRole("combobox", { name: "Type", exact: true }).click();
    await page.getByRole("option", { name: "Group", exact: true }).click();
    await root.getByRole("button", { name: "Add recommendation" }).click();
    const child = page.getByRole("group", {
      name: "Recommendation 1",
      exact: true,
    });
    const save = page.getByRole("button", { name: "Save policy" });

    await save.click();
    await expect(child.getByRole("alert")).toContainText(
      "Select at least one vaccine code.",
    );
    expect(writes).toHaveLength(0);

    await selectCode(page, child);
    const [request] = await Promise.all([
      page.waitForRequest((request) => isPolicyWrite(request, "POST")),
      save.click(),
    ]);
    expect(request.postDataJSON().policy_template).toMatchObject({
      codes: [],
      is_group: true,
      children: [{ codes: [vaccine], is_group: false, children: [] }],
    });
  });

  test("editing preserves coding versions and nested ids without sending facility ownership", async ({
    page,
  }) => {
    const record = policy(null);
    const childId = faker.string.uuid();
    const versionedVaccine = { ...vaccine, display: null, version: "20260901" };
    record.policy_template = {
      ...recommendation(),
      id: faker.string.uuid(),
      is_group: true,
      children: [
        {
          ...recommendation(),
          id: childId,
          codes: [versionedVaccine],
          due_date: 28,
          series: "A".repeat(256),
        },
        {
          ...recommendation(),
          id: faker.string.uuid(),
          is_group: true,
          children: [{ ...recommendation(), id: faker.string.uuid() }],
        },
      ],
    };
    await routePolicies(page, record);
    await page.goto(`/admin/immunization-policies/${record.id}`);

    await test.step("Load existing values and edit the policy name", async () => {
      await expect(
        page.getByRole("button", { name: "Save policy" }),
      ).toBeDisabled();
      await page
        .getByRole("button", { name: "Select Recommendation 1", exact: true })
        .first()
        .click();
      const child = page
        .getByRole("group", { name: "Recommendation 1", exact: true })
        .first();
      await expect(
        child.getByText(vaccine.code, { exact: true }),
      ).toBeVisible();
      await expect(
        child.getByRole("spinbutton", {
          name: "Due offset (days)",
          exact: true,
        }),
      ).toHaveValue("28");
      await page
        .getByRole("textbox", { name: "Policy name" })
        .fill(`${record.name} revised`);
    });

    await test.step("Removing a nested group requires confirmation and removes its descendants", async () => {
      await page
        .getByRole("button", { name: "Select Group 2", exact: true })
        .click();
      const group = page.getByRole("group", { name: "Group 2", exact: true });
      await group
        .locator("summary")
        .filter({ hasText: "Additional details" })
        .click();
      const description = group.getByRole("textbox", {
        name: "Recommendation description",
      });
      await description.fill("Temporary note");
      await description.clear();
      await expect(description).toBeVisible();
      const remove = page.getByRole("button", {
        name: "Remove Group 2",
        exact: true,
      });
      await remove.click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Cancel", exact: true })
        .click();
      await expect(
        page.getByRole("group", { name: "Group 2", exact: true }),
      ).toBeVisible();
      await remove.click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Remove", exact: true })
        .click();
      await expect(
        page.getByRole("group", { name: "Group 2", exact: true }),
      ).toHaveCount(0);
    });

    await test.step("PUT preserves untouched clinical data and omits immutable ownership", async () => {
      const [request] = await Promise.all([
        page.waitForRequest((request) =>
          isPolicyWrite(request, "PUT", record.id),
        ),
        page.getByRole("button", { name: "Save policy" }).click(),
      ]);
      const body = request.postDataJSON();
      expect(body).not.toHaveProperty("facility");
      expect(body).toMatchObject({
        name: `${record.name} revised`,
        policy_template: {
          id: record.policy_template.id,
          is_group: true,
          children: [
            {
              id: childId,
              codes: [versionedVaccine],
              due_date: 28,
              series: "A".repeat(256),
            },
          ],
        },
      });
      expect(body.policy_template.children[0]).not.toHaveProperty(
        "earliest_date",
      );
      expect(body.policy_template.children[0]).not.toHaveProperty(
        "overdue_date",
      );
    });
  });

  test("duplicates recommendations and nested groups beside the original with independent values and new identities", async ({
    page,
  }) => {
    const record = policy(null);
    const originalLeaf: ImmunizationPolicyTemplate = {
      ...recommendation(),
      id: faker.string.uuid(),
      diseases: [disease],
      series: "Primary",
      dose_number: "1",
      series_number: "3",
      description: "First dose",
      earliest_date: 0,
      due_date: 7,
      overdue_date: 14,
    };
    const originalGroup: ImmunizationPolicyTemplate = {
      ...recommendation(),
      id: faker.string.uuid(),
      is_group: true,
      diseases: [disease],
      series: "Catch-up",
      dose_number: "1",
      series_number: "2",
      description: "Catch-up schedule",
      earliest_date: 7,
      due_date: 14,
      overdue_date: 35,
      children: [
        {
          ...originalLeaf,
          id: faker.string.uuid(),
          earliest_date: 14,
          due_date: 21,
          overdue_date: 28,
        },
        {
          ...recommendation(),
          id: faker.string.uuid(),
          is_group: true,
          children: [{ ...originalLeaf, id: faker.string.uuid() }],
        },
      ],
    };
    const trailingLeaf = { ...recommendation(), id: faker.string.uuid() };
    record.policy_template = {
      ...recommendation(),
      id: faker.string.uuid(),
      is_group: true,
      children: [originalLeaf, originalGroup, trailingLeaf],
    };
    await routePolicies(page, record);
    await page.goto(`/admin/immunization-policies/${record.id}`);
    await expect(
      page.getByRole("textbox", { name: "Policy name" }),
    ).toBeEnabled();
    const outline = page.getByRole("navigation", {
      name: "Recommendations",
      exact: true,
    });
    await expect(page.getByRole("button", { name: /^Duplicate / })).toHaveCount(
      0,
    );

    await test.step("Duplicate a group, select its copy, and edit a copied descendant", async () => {
      await outline
        .getByRole("button", { name: "Select Group 2", exact: true })
        .first()
        .click();
      await page
        .getByRole("button", { name: "Duplicate Group 2", exact: true })
        .click();
      const copy = page.getByRole("group", { name: "Group 3", exact: true });
      await expect(copy).toBeVisible();
      await expect(
        outline.getByRole("button", { name: "Select Group 3", exact: true }),
      ).toHaveAttribute("aria-current", "true");
      await copy
        .getByRole("textbox", { name: "Series", exact: true })
        .fill("Catch-up copy");
      const copiedBranch = outline
        .getByRole("listitem")
        .filter({
          has: page.getByRole("button", {
            name: "Select Group 3",
            exact: true,
          }),
        })
        .last();
      await copiedBranch
        .getByRole("button", { name: "Select Recommendation 1", exact: true })
        .first()
        .click();
      await page
        .getByRole("group", { name: "Recommendation 1", exact: true })
        .getByRole("spinbutton", { name: "Due offset (days)", exact: true })
        .fill("22");
    });

    await test.step("Duplicate the first recommendation and change only its copy", async () => {
      await outline
        .getByRole("button", { name: "Select Recommendation 1", exact: true })
        .first()
        .click();
      await page
        .getByRole("button", {
          name: "Duplicate Recommendation 1",
          exact: true,
        })
        .click();
      const copy = page.getByRole("group", {
        name: "Recommendation 2",
        exact: true,
      });
      await expect(copy).toBeVisible();
      await expect(
        outline.getByRole("button", {
          name: "Select Recommendation 2",
          exact: true,
        }),
      ).toHaveAttribute("aria-current", "true");
      await expect(
        copy.getByRole("textbox", { name: "Dose number", exact: true }),
      ).toHaveValue("1");
      await copy
        .getByRole("textbox", { name: "Dose number", exact: true })
        .fill("2");
      await copy
        .getByRole("spinbutton", { name: "Due offset (days)", exact: true })
        .fill("10");
      await copy
        .getByRole("button", { name: "Remove Hepatitis B", exact: true })
        .click();
    });

    await test.step("Save adjacent copies while retaining originals and stripping copied ids recursively", async () => {
      const [request] = await Promise.all([
        page.waitForRequest((request) =>
          isPolicyWrite(request, "PUT", record.id),
        ),
        page.getByRole("button", { name: "Save policy" }).click(),
      ]);
      const body = request.postDataJSON();
      const children = body.policy_template
        .children as ImmunizationPolicyTemplate[];
      expect(body.policy_template.id).toBe(record.policy_template.id);
      expect(children).toHaveLength(5);
      expect(children[0]).toMatchObject(originalLeaf);
      expect(children[2]).toMatchObject(originalGroup);
      expect(children[4]).toMatchObject(trailingLeaf);
      expect(children[1]).toMatchObject({
        codes: [vaccine],
        diseases: [],
        is_group: false,
        children: [],
        series: "Primary",
        dose_number: "2",
        series_number: "3",
        description: "First dose",
        earliest_date: 0,
        due_date: 10,
        overdue_date: 14,
      });
      expect(children[3]).toMatchObject({
        codes: [vaccine],
        diseases: [disease],
        is_group: true,
        series: "Catch-up copy",
        dose_number: "1",
        series_number: "2",
        description: "Catch-up schedule",
        earliest_date: 7,
        due_date: 14,
        overdue_date: 35,
        children: [
          {
            codes: [vaccine],
            diseases: [disease],
            is_group: false,
            children: [],
            series: "Primary",
            dose_number: "1",
            series_number: "3",
            description: "First dose",
            earliest_date: 14,
            due_date: 22,
            overdue_date: 28,
          },
          {
            codes: [vaccine],
            is_group: true,
            children: [
              {
                codes: [vaccine],
                diseases: [disease],
                is_group: false,
                children: [],
                series: "Primary",
                dose_number: "1",
                series_number: "3",
                description: "First dose",
                earliest_date: 0,
                due_date: 7,
                overdue_date: 14,
              },
            ],
          },
        ],
      });
      const copies = [children[1], children[3]];
      while (copies.length > 0) {
        const copy = copies.pop()!;
        expect(copy).not.toHaveProperty("id");
        copies.push(...copy.children);
      }
    });
  });

  for (const ownership of ["instance", "unknown"] as const) {
    test(`keeps ${ownership} ownership read-only when opened from a facility, even for an admin`, async ({
      page,
    }) => {
      const facilityId = getFacilityId();
      const record = policy(null);
      record.policy_template = {
        ...recommendation(),
        is_group: true,
        children: [recommendation()],
      };
      if (ownership === "unknown") delete record.facility;
      const writes = await routePolicies(page, record);
      if (ownership === "instance") {
        const records = [
          ...Array.from({ length: 100 }, () => ({
            ...record,
            id: faker.string.uuid(),
            facility: undefined,
          })),
          { ...record, facility: undefined },
        ];
        await page.route(
          (url) => url.pathname === POLICY_PATH,
          async (route) => {
            const params = new URL(route.request().url()).searchParams;
            const scoped = params.has("facility");
            const offset = Number(params.get("offset") ?? 0);
            const limit = Number(params.get("limit") ?? 100);
            await route.fulfill({
              json: {
                count: scoped ? 1 : records.length,
                results: scoped
                  ? [records.at(-1)]
                  : records.slice(offset, offset + limit),
              },
            });
          },
        );
      }
      await page.goto(
        `/facility/${facilityId}/settings/immunization-policies/${record.id}`,
      );

      await expect(
        page.getByRole("heading", { name: record.name, exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Select Recommendation 1", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: /^Duplicate / }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("textbox", { name: "Policy name" }),
      ).toBeDisabled();
      await expect(
        page.getByRole("spinbutton", {
          name: "Due offset (days)",
          exact: true,
        }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Save policy" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("combobox", { name: "Add vaccine code" }),
      ).toBeDisabled();
      await expect(page.getByRole("alert")).toContainText("Read only");
      expect(writes).toHaveLength(0);
    });
  }
});

test.describe("Immunization policy facility permission controls", () => {
  test.use({ storageState: "tests/.auth/nurse.json" });

  test("a child-organization writer can read but cannot edit a facility policy", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const record = policy(facilityId);
    record.policy_template = {
      ...recommendation(),
      is_group: true,
      children: [recommendation()],
    };
    const writes = await routePolicies(page, record);
    // Preserve the authenticated facility response, supplying only the new
    // permission contract. Backend authorization is not mocked or asserted.
    await page.route(`**/api/v1/facility/${facilityId}/`, async (route) => {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      const facility = await response.json();
      await route.fulfill({
        response,
        json: {
          ...facility,
          permissions: [
            ...facility.permissions,
            "can_read_immunization_policy",
            "can_write_immunization_policy",
          ],
          root_org_permissions: ["can_read_immunization_policy"],
          child_org_permissions: [
            "can_read_immunization_policy",
            "can_write_immunization_policy",
          ],
        },
      });
    });
    await page.goto(
      `/facility/${facilityId}/settings/immunization-policies/${record.id}`,
    );
    await expect(
      page.getByRole("heading", { name: record.name, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Select Recommendation 1", exact: true })
      .click();
    await expect(page.getByRole("button", { name: /^Duplicate / })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("textbox", { name: "Policy name" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("combobox", { name: "Add vaccine code" }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: "Save policy" })).toHaveCount(
      0,
    );
    expect(writes).toHaveLength(0);
  });
});
