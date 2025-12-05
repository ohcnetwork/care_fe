import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { expectedSlug } from "tests/helper/utils";

test.use({ storageState: "tests/.auth/user.json" });

let name: string;
let slug: string;
let description: string;

async function createBasicValueSet(page: Page, status?: string) {
  await page.getByRole("link", { name: "Create ValueSet" }).click();
  await page.getByRole("textbox", { name: "Name *" }).fill(name);
  await page.getByRole("textbox", { name: "Slug *" }).fill(slug);
  await page.getByRole("textbox", { name: "Description" }).fill(description);
  if (status) {
    await page.getByRole("combobox", { name: "Status *" }).click();
    await page.getByRole("option", { name: status }).click();
  }
  await page.getByRole("button", { name: "Save ValueSet" }).click();
}

test.describe("ValueSet List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/valuesets");
    name = faker.company.name();
    slug = expectedSlug(name);
    description = faker.lorem.sentence();
  });

  test("should create valueset with active status and verify it appears in list", async ({
    page,
  }) => {
    await createBasicValueSet(page);
    await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
    await expect(page.getByRole("cell", { name: `${name}` })).toBeVisible();
    await expect(page.getByRole("cell", { name: description })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Active" })).toBeVisible();
  });

  test("should create valueset with draft status and verify it appears in list", async ({
    page,
  }) => {
    await createBasicValueSet(page, "Draft");
    await page.getByRole("tab", { name: "Draft" }).click();
    await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
    await expect(page.getByRole("cell", { name: `${name}` })).toBeVisible();
    await expect(page.getByRole("cell", { name: description })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Draft" })).toBeVisible();
  });

  test("should create valueset with retired status and verify it appears in list", async ({
    page,
  }) => {
    await createBasicValueSet(page, "Retired");
    await page.getByRole("tab", { name: "Retired" }).click();
    await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
    await expect(page.getByRole("cell", { name: `${name}` })).toBeVisible();
    await expect(page.getByRole("cell", { name: description })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Retired" })).toBeVisible();
  });

  test("should create valueset with unknown status and verify it appears in list", async ({
    page,
  }) => {
    await createBasicValueSet(page, "Unknown");
    await page.getByRole("tab", { name: "Unknown" }).click();
    await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
    await expect(page.getByRole("cell", { name: `${name}` })).toBeVisible();
    await expect(page.getByRole("cell", { name: description })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Unknown" })).toBeVisible();
  });
});
