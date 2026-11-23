import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createValueSetViaUi } from "tests/helper/valueSet";

test.use({ storageState: "tests/.auth/user.json" });

let name: string;
let slug: string;
let description: string;

test.describe("ValueSet List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/valuesets");
    name = faker.company.name();
    slug = `vs-${faker.string.alphanumeric(12).toLowerCase()}`;
    description = faker.lorem.sentence();
  });

  test(
    "should create valueset with active status and verify it appears in list",
    { tag: ["@atomic", "@cap:valueset.list"] },
    async ({ page }) => {
      await createValueSetViaUi(page, { name, slug, description });
      await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
      await expect(page.getByRole("cell", { name: `${name}` })).toBeVisible();
      await expect(page.getByRole("cell", { name: description })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Active" })).toBeVisible();
    },
  );

  test(
    "should create valueset with draft status and verify it appears in list",
    { tag: ["@atomic", "@cap:valueset.list"] },
    async ({ page }) => {
      await createValueSetViaUi(page, {
        name,
        slug,
        description,
        status: "Draft",
      });
      const draftTab = page.getByRole("tab", { name: "Draft" });
      await expect(draftTab).toBeVisible();
      await draftTab.click();
      await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
      await expect(page.getByRole("cell", { name: `${name}` })).toBeVisible();
      await expect(page.getByRole("cell", { name: description })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Draft" })).toBeVisible();
    },
  );

  test(
    "should create valueset with retired status and verify it appears in list",
    { tag: ["@atomic", "@cap:valueset.list"] },
    async ({ page }) => {
      await createValueSetViaUi(page, {
        name,
        slug,
        description,
        status: "Retired",
      });
      const retiredTab = page.getByRole("tab", { name: "Retired" });
      await expect(retiredTab).toBeVisible();
      await retiredTab.click();
      await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
      await expect(page.getByRole("cell", { name: `${name}` })).toBeVisible();
      await expect(page.getByRole("cell", { name: description })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Retired" })).toBeVisible();
    },
  );

  test(
    "should create valueset with unknown status and verify it appears in list",
    { tag: ["@atomic", "@cap:valueset.list"] },
    async ({ page }) => {
      await createValueSetViaUi(page, {
        name,
        slug,
        description,
        status: "Unknown",
      });
      const unknownTab = page.getByRole("tab", { name: "Unknown" });
      await expect(unknownTab).toBeVisible();
      await unknownTab.click();
      await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
      await expect(page.getByRole("cell", { name: `${name}` })).toBeVisible();
      await expect(page.getByRole("cell", { name: description })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Unknown" })).toBeVisible();
    },
  );
});
