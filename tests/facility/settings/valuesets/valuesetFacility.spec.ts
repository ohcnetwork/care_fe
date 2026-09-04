import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { deleteFacilityValueSetsBySlug } from "tests/helper/valueSet";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility value sets", () => {
  let facilityId: string;
  let basePath: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    basePath = `/facility/${facilityId}/settings/valuesets`;
    await page.goto(basePath);
  });

  test("create a facility value set and land on its edit page with departments", async ({
    page,
  }) => {
    const name = `Facility VS ${faker.word.words(2)} ${Date.now()}`;
    const description = faker.lorem.sentence();

    await test.step("List shows both sources and a create action", async () => {
      await expect(
        page.getByRole("heading", { name: "ValueSets", level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "This facility" }),
      ).toBeVisible();
      await expect(page.getByRole("tab", { name: "Instance" })).toBeVisible();
      await page.getByRole("link", { name: "Create ValueSet" }).click();
      await page.waitForURL(/\/settings\/valuesets\/create$/);
    });

    await test.step("Fill the form; lineage is offered but stays off", async () => {
      await page.getByRole("textbox", { name: "Name *" }).fill(name);
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(description);
      await expect(page.getByText("Based on", { exact: true })).toBeVisible();
      await expect(
        page.getByRole("switch", {
          name: "Replace the parent in this facility",
        }),
      ).toBeDisabled();

      await page.getByRole("button", { name: "Add Rule" }).first().click();
      await page.getByRole("combobox", { name: "System" }).click();
      await page.getByRole("option", { name: "SNOMED" }).click();
      await page.getByRole("button", { name: "Add Concept" }).click();
      await page.getByRole("textbox", { name: "Code" }).fill("386661006");
      await page.getByLabel("Verify code").click();
      await expect(
        page
          .getByRole("listitem")
          .filter({ hasText: "Code verified successfully" }),
      ).toBeVisible();
    });

    await test.step("Save lands on the edit page, where departments are set", async () => {
      await page.getByRole("button", { name: "Save ValueSet" }).click();
      await expectToast(page, /valueset created successfully/i);
      await page.waitForURL(/\/settings\/valuesets\/[0-9a-f-]+\/edit$/);
      await expect(page.getByText("Departments with access")).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Name *" })).toHaveValue(
        name,
      );
    });

    await test.step("It is listed under This facility", async () => {
      await page.goto(basePath);
      await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
      await expect(page.getByRole("cell", { name })).toBeVisible();
      await expect(page.getByRole("cell", { name: description })).toBeVisible();
    });
  });

  test("customize an instance value set into a facility override", async ({
    page,
  }) => {
    const parentSlug = "system-nutrients";
    const parentName = "Nutrients";
    const name = `${parentName} for facility ${Date.now()}`;
    await deleteFacilityValueSetsBySlug(facilityId, parentSlug);

    try {
      await test.step("Instance tab offers Preview and Customize per row", async () => {
        await page.getByRole("tab", { name: "Instance" }).click();
        await page
          .getByRole("textbox", { name: "Search ValueSets" })
          .fill(parentName);
        const row = page.getByRole("row").filter({
          has: page.getByRole("cell", { name: parentName, exact: true }),
        });
        await expect(row).toHaveCount(1);
        await expect(
          row.getByRole("button", { name: "Preview" }),
        ).toBeVisible();
        await row.getByRole("button", { name: "Customize" }).click();
        await page.waitForURL(
          /\/settings\/valuesets\/create\?parent=[0-9a-f-]+$/,
        );
      });

      await test.step("The create form is seeded as an override of the parent", async () => {
        await expect(
          page.getByRole("switch", {
            name: "Replace the parent in this facility",
          }),
        ).toBeChecked();
        const slug = page.getByRole("textbox", { name: "Slug *" });
        await expect(slug).toBeDisabled();
        await expect(slug).toHaveValue(parentSlug);
        await expect(
          page.getByRole("combobox").filter({ hasText: parentName }),
        ).toBeVisible();
      });

      await test.step("Naming it does not touch the inherited slug; save", async () => {
        await page.getByRole("textbox", { name: "Name *" }).fill(name);
        await expect(page.getByRole("textbox", { name: "Slug *" })).toHaveValue(
          parentSlug,
        );
        await page.getByRole("button", { name: "Save ValueSet" }).click();
        await expectToast(page, /valueset created successfully/i);
        await page.waitForURL(/\/settings\/valuesets\/[0-9a-f-]+\/edit$/);
      });

      await test.step("The override is listed for this facility under the parent's slug", async () => {
        await page.goto(basePath);
        await page
          .getByRole("textbox", { name: "Search ValueSets" })
          .fill(name);
        const row = page.getByRole("row").filter({
          has: page.getByRole("cell", { name, exact: true }),
        });
        await expect(row).toHaveCount(1);
        await expect(row.getByRole("cell", { name: parentSlug })).toBeVisible();
      });
    } finally {
      await deleteFacilityValueSetsBySlug(facilityId, parentSlug);
    }
  });
});
