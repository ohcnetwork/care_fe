import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  departmentCards,
  departmentTrigger,
} from "tests/helper/departmentSelect";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
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

  const TEST_USERNAMES = ["care-doctor", "admin"];
  const TEST_ROLES = [
    "Primary healthcare service",
    "Acupuncturist",
    "Orthotist and prosthetist",
  ];

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    selectedUsername = faker.helpers.arrayElement(TEST_USERNAMES);
    selectedRole = faker.helpers.arrayElement(TEST_ROLES);
    // Each test gets its own encounter: on a shared one, a parallel test
    // adds or removes members while this test counts on them.
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );
  });

  test.describe("Adding members", () => {
    test("Add a care team member with role", async ({ page }) => {
      await test.step("Open care team sheet", async () => {
        await openCareTeamDialog(page);
      });

      await test.step("Verify department selector", async () => {
        await expect(departmentTrigger(page)).toBeVisible();
        await expect(
          departmentCards(page).filter({ hasText: "Administration" }),
        ).toBeVisible();
      });

      await test.step("Select member", async () => {
        const memberSelector = page
          .getByRole("combobox")
          .filter({ hasText: "Select Member" });
        await expect(memberSelector).toBeEnabled();
        await memberSelector.click();
        await page.getByPlaceholder("Search").fill(selectedUsername);
        await page
          .getByRole("option", { name: selectedUsername })
          .first()
          .click();
      });

      await test.step("Select role", async () => {
        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Role" })
          .click();
        await page.getByPlaceholder("Select Role").fill(selectedRole);
        await page
          .getByRole("option", { name: selectedRole, exact: true })
          .click();
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
        await page
          .getByRole("option", { name: selectedUsername })
          .first()
          .click();

        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Role" })
          .click();
        await page.getByPlaceholder("Select Role").fill(selectedRole);
        await page
          .getByRole("option", { name: selectedRole, exact: true })
          .click();

        await page.getByRole("button", { name: "Add" }).click();
        await expectToast(page, /member added successfully/i);
      });

      await test.step("Try to add same member with same role again", async () => {
        const memberSelector = page
          .getByRole("combobox")
          .filter({ hasText: "Select Member" });
        await memberSelector.click();
        await page.getByPlaceholder("Search").fill(selectedUsername);
        await page
          .getByRole("option", { name: selectedUsername })
          .first()
          .click();

        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Role" })
          .click();
        await page.getByPlaceholder("Select Role").fill(selectedRole);
        await page
          .getByRole("option", { name: selectedRole, exact: true })
          .click();

        await page.getByRole("button", { name: "Add" }).click();
        await expectToast(page, /already added|already exists|duplicate/i);
      });
    });
  });

  test("Closing without clicking Add does not save care team member", async ({
    page,
  }) => {
    await test.step("Open care team sheet", async () => {
      await openCareTeamDialog(page);
      await expect(
        departmentCards(page).filter({ hasText: "Administration" }),
      ).toBeVisible();
    });

    await test.step("Select member and role without adding", async () => {
      const memberSelector = page
        .getByRole("combobox")
        .filter({ hasText: "Select Member" });
      await expect(memberSelector).toBeEnabled();
      await memberSelector.click();
      await page.getByPlaceholder("Search").fill(selectedUsername);
      await page
        .getByRole("option", { name: selectedUsername })
        .first()
        .click();

      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Role" })
        .click();
      await page.getByPlaceholder("Select Role").fill(selectedRole);
      await page
        .getByRole("option", { name: selectedRole, exact: true })
        .click();
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
      await expect(
        dialog.getByText(selectedUsername, { exact: true }),
      ).not.toBeVisible();
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
      await page
        .getByRole("option", { name: selectedUsername })
        .first()
        .click();
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
      await page
        .getByRole("option", { name: selectedRole, exact: true })
        .click();
    });

    await test.step("Verify Add button is now enabled", async () => {
      await expect(page.getByRole("button", { name: "Add" })).toBeEnabled();
    });
  });
});
