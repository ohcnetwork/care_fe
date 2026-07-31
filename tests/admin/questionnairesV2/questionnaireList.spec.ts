import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 list", () => {
  test("status tabs and search jointly scope the results to a real outcome", async ({
    page,
  }) => {
    const draftTitle = `QV2 List Draft ${Date.now()}`;

    await test.step("Create a draft questionnaire to filter for", async () => {
      await page.goto("/admin/questionnaires/new");
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(draftTitle);
      await page
        .getByRole("radiogroup", { name: "Status" })
        .getByRole("radio", { name: "Draft" })
        .click();
      await page.getByRole("button", { name: "Save Form" }).click();
      await expectToast(page, "Questionnaire created successfully");
      await page.waitForURL(/\/admin\/questionnaires\/[0-9a-f-]+$/);
    });

    await test.step("Page renders with status tabs", async () => {
      await page.goto("/admin/questionnaires");
      await expect(
        page.getByRole("heading", { name: "Questionnaires" }),
      ).toBeVisible();
      await expect(page.getByRole("radio", { name: "Active" })).toBeVisible();
    });

    await test.step("Search for a non-existent questionnaire shows the empty state", async () => {
      await page
        .getByPlaceholder("Search Questionnaires")
        .fill(faker.string.uuid());
      await expect(page.getByText("No questionnaires found")).toBeVisible();
    });

    await test.step("Searching the draft title under the default Active tab finds nothing", async () => {
      await page.getByPlaceholder("Search Questionnaires").fill(draftTitle);
      await expect(page.getByText("No questionnaires found")).toBeVisible();
    });

    await test.step("Switching to the Draft tab reveals it (search still applied)", async () => {
      await page.getByRole("radio", { name: "Draft" }).click();
      await expect(page.getByRole("radio", { name: "Draft" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await expect(page.locator('[data-slot="table-body"]')).toContainText(
        draftTitle,
      );
    });

    await test.step("Switching back to Active hides it again", async () => {
      await page.getByRole("radio", { name: "Active" }).click();
      await expect(page.getByText("No questionnaires found")).toBeVisible();
    });
  });

  test("facility questionnaires page loads with create action and status filter", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/questionnaires`);
    await expect(
      page.getByRole("heading", { name: "Questionnaires" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Questionnaire" }),
    ).toBeVisible();
    await expect(
      page.getByRole("radiogroup", { name: "Status" }),
    ).toBeVisible();
  });
});
