import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const openCareTeamDialog = async (page: Page) => {
  await page.getByRole("tab", { name: "Actions" }).click();
  await page.getByRole("button", { name: "Manage Care Team" }).click();
  await expect(
    page.getByRole("dialog", { name: "Manage Care Team" }),
  ).toBeVisible();
};

test.describe("Manage care team for an encounter", () => {
  let facilityId: string;
  let selectedRole: string;
  let selectedUsername: string;

  const TEST_USERNAMES = ["care-admin", "care-fac-admin", "administrator_2_0"];
  const TEST_ROLES = [
    "Primary healthcare service",
    "Acupuncturist",
    "Orthotist and prosthetist",
  ];

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    selectedUsername = faker.helpers.arrayElement(TEST_USERNAMES);
    selectedRole = faker.helpers.arrayElement(TEST_ROLES);
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
    await page.getByText("View Encounter").first().click();
  });

  test.describe("Adding members", () => {
    test.afterEach(async ({ page }) => {
      await test.step("Cleanup: Remove added member", async () => {
        try {
          const dialog = page.getByRole("dialog", { name: "Manage Care Team" });

          const isDialogVisible = await dialog.isVisible().catch(() => false);
          if (!isDialogVisible) {
            return;
          }

          const removableMembers = dialog
            .locator("button")
            .filter({ has: page.locator("svg.lucide-x") });
          const removableCount = await removableMembers.count();

          if (removableCount === 0) {
            return;
          }

          const removeButton = removableMembers.last();
          await removeButton.click();
          await page.getByRole("button", { name: "Remove" }).click();
          await expectToast(page, /removed successfully/i);
        } catch {
          // Member might already be removed or not added
        }
      });
    });

    test("Add a care team member with role", async ({ page }) => {
      await test.step("Open care team sheet", async () => {
        await openCareTeamDialog(page);
      });

      await test.step("Verify department selector", async () => {
        await expect(
          page.getByRole("combobox").filter({ hasText: "Select Department" }),
        ).toBeVisible();
        await expect(page.getByText("Administration")).toBeVisible();
      });

      await test.step("Select member", async () => {
        const memberSelector = page
          .getByRole("combobox")
          .filter({ hasText: "Select Member" });
        await expect(memberSelector).toBeEnabled();
        await memberSelector.click();
        await page.getByPlaceholder("Search").fill(selectedUsername);
        await page.getByText(selectedUsername).click();
      });

      await test.step("Select role", async () => {
        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Role" })
          .click();
        await page.getByPlaceholder("Select Role").fill(selectedRole);
        await page.getByRole("option", { name: selectedRole }).click();
      });

      await test.step("Add member", async () => {
        await page.getByRole("button", { name: "Add" }).click();
      });

      await test.step("Verify member added", async () => {
        await expectToast(page, /member added successfully/i);
        const dialog = page.getByRole("dialog", { name: "Manage Care Team" });
        await expect(dialog.getByText(selectedRole)).toBeVisible();
      });
    });

    test("Cannot add same member with same role twice", async ({ page }) => {
      await test.step("Open care team sheet", async () => {
        await openCareTeamDialog(page);
      });

      await test.step("Add member first time", async () => {
        const memberSelector = page
          .getByRole("combobox")
          .filter({ hasText: "Select Member" });
        await memberSelector.click();
        await page.getByPlaceholder("Search").fill(selectedUsername);
        await page.getByText(selectedUsername).click();

        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Role" })
          .click();
        await page.getByPlaceholder("Select Role").fill(selectedRole);
        await page.getByRole("option", { name: selectedRole }).click();

        await page.getByRole("button", { name: "Add" }).click();
        await expectToast(page, /member added successfully/i);
      });

      await test.step("Try to add same member with same role again", async () => {
        const memberSelector = page
          .getByRole("combobox")
          .filter({ hasText: "Select Member" });
        await memberSelector.click();
        await page.getByPlaceholder("Search").fill(selectedUsername);
        await page.getByText(selectedUsername).click();

        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Role" })
          .click();
        await page.getByPlaceholder("Select Role").fill(selectedRole);
        await page.getByRole("option", { name: selectedRole }).click();

        await page.getByRole("button", { name: "Add" }).click();
        await expectToast(page, /already added|already exists|duplicate/i);
      });
    });
  });

  test("Add button is disabled initially when opening care team sheet", async ({
    page,
  }) => {
    await test.step("Open care team sheet", async () => {
      await openCareTeamDialog(page);
      await expect(page.getByText("Administration")).toBeVisible();
    });

    await test.step("Verify Add button is disabled", async () => {
      await expect(page.getByRole("button", { name: "Add" })).toBeDisabled();
    });
  });

  test("Closing without clicking Add does not save care team member", async ({
    page,
  }) => {
    await test.step("Open care team sheet", async () => {
      await openCareTeamDialog(page);
      await expect(page.getByText("Administration")).toBeVisible();
    });

    await test.step("Select member and role without adding", async () => {
      const memberSelector = page
        .getByRole("combobox")
        .filter({ hasText: "Select Member" });
      await expect(memberSelector).toBeEnabled();
      await memberSelector.click();
      await page.getByPlaceholder("Search").fill(selectedUsername);
      await page.getByText(selectedUsername).click();

      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Role" })
        .click();
      await page.getByPlaceholder("Select Role").fill(selectedRole);
      await page.getByRole("option", { name: selectedRole }).click();
    });

    await test.step("Close sheet without clicking Add", async () => {
      await page.getByRole("button", { name: "Close" }).click();
      await expect(
        page.getByRole("dialog", { name: "Manage Care Team" }),
      ).not.toBeVisible();
    });

    await test.step("Verify member was not added", async () => {
      await openCareTeamDialog(page);

      const dialog = page.getByRole("dialog", { name: "Manage Care Team" });
      await expect(dialog.getByText(selectedUsername)).not.toBeVisible();
      await expect(dialog.getByText(selectedRole)).not.toBeVisible();
    });
  });

  test("Add button becomes enabled after selecting member and role", async ({
    page,
  }) => {
    await test.step("Open care team sheet", async () => {
      await openCareTeamDialog(page);
    });

    await test.step("Verify Add button is initially disabled", async () => {
      await expect(page.getByRole("button", { name: "Add" })).toBeDisabled();
    });

    await test.step("Select member", async () => {
      const memberSelector = page
        .getByRole("combobox")
        .filter({ hasText: "Select Member" });
      await expect(memberSelector).toBeEnabled();
      await memberSelector.click();
      await page.getByPlaceholder("Search").fill(selectedUsername);
      await page.getByText(selectedUsername).click();
    });

    await test.step("Verify Add button is still disabled", async () => {
      await expect(page.getByRole("button", { name: "Add" })).toBeDisabled();
    });

    await test.step("Select role", async () => {
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Role" })
        .click();
      await page.getByPlaceholder("Select Role").fill(selectedRole);
      await page.getByRole("option", { name: selectedRole }).click();
    });

    await test.step("Verify Add button is now enabled", async () => {
      await expect(page.getByRole("button", { name: "Add" })).toBeEnabled();
    });
  });
});
