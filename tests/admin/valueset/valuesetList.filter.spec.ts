import { expect, test } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { expectedSlug } from "tests/helper/utils";
import { STATUS_OPTIONS } from "./valuesetConstants";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("ValueSet List - filter and search edge cases", () => {
  test("should show empty state when searching for non-existent valueset", async ({ page }) => {
    await page.goto("/admin/valuesets");
    await page.getByRole("textbox", { name: "Search ValueSets" }).fill("nonexistent-" + faker.string.alphanumeric(10));
    await expect(page.getByText(/no valuesets found/i)).toBeVisible();
  });

  for (const status of STATUS_OPTIONS) {
    test(`should show empty state for status tab '${status}' with no matching valuesets`, async ({ page }) => {
      await page.goto("/admin/valuesets");
      await page.getByRole("tab", { name: status }).click();
      await page.getByRole("textbox", { name: "Search ValueSets" }).fill("nonexistent-" + faker.string.alphanumeric(10));
      await expect(page.getByText(/no valuesets found/i)).toBeVisible();
    });
  }

  test("should persist search query after navigation", async ({ page }) => {
    await page.goto("/admin/valuesets");
    const name = faker.company.name();
    await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
    await page.getByRole("link", { name: "Create ValueSet" }).click();
    await expect(page).toHaveURL(/\/admin\/valuesets\/new/);
    await page.goBack();
    await expect(page.getByRole("textbox", { name: "Search ValueSets" })).toHaveValue(name);
  });
});
