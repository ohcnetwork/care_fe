import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Standalone action triggers", () => {
  test("offers only supported triggers when creating an action", async ({
    page,
  }) => {
    await page.goto("/admin/actions/new");
    await page.getByRole("combobox", { name: "Runs for" }).click();
    await expect(
      page.getByRole("option", { name: "Appointments", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Patients", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("option")).toHaveCount(1);
  });

  test("lists supported actions from every API page with an accurate page count", async ({
    page,
  }) => {
    const prefix = faker.string.alphanumeric(8);
    const base = {
      description: "",
      actions: [],
      performable: false,
      facility: null,
    };
    const records = [
      ...Array.from({ length: 210 }, (_, index) => ({
        ...base,
        id: faker.string.uuid(),
        name: `${prefix} patient ${index}`,
        action_context: "PATIENT",
      })),
      ...Array.from({ length: 16 }, (_, index) => ({
        ...base,
        id: faker.string.uuid(),
        name: `${prefix} appointment ${index}`,
        action_context: "APPOINTMENT",
      })),
    ];
    let listRequests = 0;
    await page.route("**/api/v1/action_configuration/?*", async (route) => {
      listRequests += 1;
      const params = new URL(route.request().url()).searchParams;
      const offset = Number(params.get("offset") ?? 0);
      const limit = Number(params.get("limit") ?? 100);
      await route.fulfill({
        json: {
          count: records.length,
          results: records.slice(offset, offset + limit),
        },
      });
    });
    await page.goto("/admin/actions");
    await expect(
      page.getByRole("row").filter({ hasText: `${prefix} appointment` }),
    ).toHaveCount(15);
    await expect(
      page.getByRole("row").filter({ hasText: `${prefix} patient` }),
    ).toHaveCount(0);
    await expect(page.locator("#page-3")).toHaveCount(0);
    expect(listRequests).toBeGreaterThan(1);
    await page.locator("#next-pages").click();
    await expect(
      page.getByRole("row").filter({ hasText: `${prefix} appointment` }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("row").filter({ hasText: `${prefix} appointment 15` }),
    ).toBeVisible();
    await expect(page.locator("#next-pages")).toBeDisabled();
  });

  test("preserves legacy unsupported configurations without offering edits", async ({
    page,
  }) => {
    const id = faker.string.uuid();
    const name = `Legacy patient action ${faker.string.alphanumeric(8)}`;
    const writes: string[] = [];
    await page.route(`**/api/v1/action_configuration/${id}/`, async (route) => {
      if (route.request().method() !== "GET")
        writes.push(route.request().method());
      await route.fulfill({
        json: {
          id,
          name,
          description: "Existing patient configuration",
          action_context: "PATIENT",
          performable: false,
          facility: null,
          actions: [
            {
              condition: "age == 19",
              instructions: [
                {
                  slug: "tag_patient",
                  params: { tag: faker.string.uuid() },
                  context: "self",
                },
              ],
            },
          ],
          created_date: "2026-01-01T12:00:00Z",
          modified_date: "2026-01-01T12:00:00Z",
          created_by: null,
          updated_by: null,
        },
      });
    });
    await page.goto(`/admin/actions/${id}`);
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(
      "trigger that is not supported in this release",
    );
    await expect(page.getByRole("alert")).toContainText(
      "saved configuration has been preserved",
    );
    await expect(
      page.getByRole("button", { name: "Save", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Delete", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Name", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Back", exact: true }),
    ).toBeVisible();
    expect(writes).toEqual([]);
  });
});

test.describe("Action editor regression checks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/actions/new");
    await page.getByRole("button", { name: "Add action", exact: true }).click();
  });

  test("searches compatible instructions and keeps tag groups", async ({
    page,
  }) => {
    await page.route("**/api/v1/tag_config/?**", async (route) => {
      const category = {
        id: "group",
        display: "Clinical group",
        category: "clinical",
        description: "",
        level_cache: 0,
        cache_expiry: "",
      };
      const base = {
        category: "clinical",
        description: "",
        level_cache: 0,
        cache_expiry: "",
        priority: 0,
        status: "active",
        system_generated: false,
        resource: "patient",
        metadata: {},
      };
      await route.fulfill({
        json: {
          count: 3,
          results: [
            { ...base, ...category, has_children: true },
            {
              ...base,
              id: "grouped-tag",
              display: "Grouped patient tag",
              parent: category,
              has_children: false,
            },
            {
              ...base,
              id: "standalone-tag",
              display: "Standalone patient tag",
              has_children: false,
            },
          ],
        },
      });
    });

    await test.step("Only reachable instructions are offered and searchable", async () => {
      await page.getByRole("button", { name: "Add instruction" }).click();
      await page
        .getByRole("combobox", { name: "Instruction", exact: true })
        .click();
      await expect(
        page.getByRole("option", { name: /Tag the encounter/ }),
      ).toHaveCount(0);
      await page
        .getByRole("combobox", { name: "Search", exact: true })
        .fill("patient");
      await expect(
        page.getByRole("option", { name: /Show a message/ }),
      ).toHaveCount(0);
      await page.getByRole("option", { name: /Tag the patient/ }).click();
    });

    await test.step("A group remains a heading, while leaf and standalone tags remain selectable", async () => {
      await page.getByRole("combobox", { name: "Tag", exact: true }).click();
      await expect(
        page.getByText("Clinical group", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Clinical group", exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("option", {
          name: "Standalone patient tag",
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("option", { name: "Grouped patient tag", exact: true })
        .click();
      await expect(
        page.getByRole("combobox", { name: "Tag", exact: true }),
      ).toContainText("Grouped patient tag");
    });
  });

  test("restores the last valid conditions and shows syntax errors below the expression", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add a condition" }).click();
    await page.getByRole("combobox", { name: "Condition 1 Field" }).click();
    await page
      .getByRole("option", { name: "Patient › Age", exact: true })
      .click();
    await page
      .getByRole("spinbutton", { name: "Condition 1 Value" })
      .fill("19");
    await page.getByRole("button", { name: "Edit as expression" }).click();
    const expression = page.getByRole("textbox", {
      name: "Expression",
      exact: true,
    });
    await expect(expression).toHaveValue('patient["age"] == 19');
    await expression.fill('patient["age"] == (');
    await expect(expression).toHaveAttribute("aria-invalid", "true");
    const error = page.locator("#action-0-expression-error");
    await expect(error).toContainText("syntax error");
    const expressionBounds = await expression.boundingBox();
    const errorBounds = await error.boundingBox();
    expect(errorBounds!.y).toBeGreaterThan(
      expressionBounds!.y + expressionBounds!.height,
    );
    await page.getByRole("button", { name: "Back to conditions" }).click();
    await page.getByRole("button", { name: "Replace with conditions" }).click();
    await expect(
      page.getByRole("combobox", { name: "Condition 1 Field" }),
    ).toContainText("Patient › Age");
    await expect(
      page.getByRole("spinbutton", { name: "Condition 1 Value" }),
    ).toHaveValue("19");
  });

  test("uses patient date, blood group and boolean controls with correctly typed expressions", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add a condition" }).click();
    const field = page.getByRole("combobox", { name: "Condition 1 Field" });
    await field.click();
    await page
      .getByRole("option", { name: "Patient › Blood group", exact: true })
      .click();
    await page.getByRole("combobox", { name: "Condition 1 Value" }).click();
    await page.getByRole("option", { name: "AB-", exact: true }).click();
    await page.getByRole("button", { name: "Edit as expression" }).click();
    await expect(
      page.getByRole("textbox", { name: "Expression", exact: true }),
    ).toHaveValue('patient["blood_group"] == "AB_negative"');
    await page.getByRole("button", { name: "Back to conditions" }).click();
    await field.click();
    await page
      .getByRole("option", { name: "Patient › Date of birth", exact: true })
      .click();
    await page.getByPlaceholder("DD", { exact: true }).fill("16");
    await page.getByPlaceholder("MM", { exact: true }).fill("06");
    await page.getByPlaceholder("YYYY", { exact: true }).fill("2007");
    await page.getByRole("button", { name: "Edit as expression" }).click();
    await expect(
      page.getByRole("textbox", { name: "Expression", exact: true }),
    ).toHaveValue('patient["date_of_birth"] == "2007-06-16"');
    await page.getByRole("button", { name: "Back to conditions" }).click();
    await field.click();
    await page
      .getByRole("option", { name: "Patient › Deceased", exact: true })
      .click();
    await page.getByRole("combobox", { name: "Condition 1 Value" }).click();
    await page.getByRole("option", { name: "No", exact: true }).click();
    await page.getByRole("button", { name: "Edit as expression" }).click();
    await expect(
      page.getByRole("textbox", { name: "Expression", exact: true }),
    ).toHaveValue('patient["deceased"] == False');
  });
});
