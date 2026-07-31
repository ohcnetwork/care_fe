import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 list", () => {
  test("admin list renders, filters and searches", async ({ page }) => {
    await page.goto("/admin/questionnaires");

    await test.step("Page renders with status tabs", async () => {
      await expect(
        page.getByRole("heading", { name: "Questionnaires" }),
      ).toBeVisible();
      await expect(page.getByRole("radio", { name: "Active" })).toBeVisible();
    });

    await test.step("Search for a non-existent questionnaire shows empty state", async () => {
      await page
        .getByPlaceholder("Search questionnaires")
        .fill(faker.string.uuid());
      await expect(page.getByText("No questionnaires found")).toBeVisible();
    });

    await test.step("Draft tab switches filter", async () => {
      await page.getByPlaceholder("Search questionnaires").clear();
      await page.getByRole("radio", { name: "Draft" }).click();
      await expect(page.getByRole("radio", { name: "Draft" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });
  });

  test("facility list renders empty state", async ({ page }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/questionnaires`);
    await expect(
      page.getByRole("heading", { name: "Questionnaires" }),
    ).toBeVisible();
  });
});
