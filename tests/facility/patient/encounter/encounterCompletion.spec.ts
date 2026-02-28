import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Completion", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
  });

  test("should mark an encounter as completed via encounter actions", async ({
    page,
  }) => {
    // Click on the first encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );

    // Click the "Encounter Actions" button to open the command dialog
    await page
      .getByRole("button", { name: /encounter actions/i })
      .first()
      .click();

    // Wait for the command dialog to appear
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Search for "mark as complete" in the command dialog
    const commandInput = dialog.locator(
      'input[data-slot="command-input"], input[cmdk-input]',
    );
    await commandInput.fill("mark as complete");

    // Click the "Mark as Completed" option
    const markAsCompletedOption = dialog.getByRole("option", {
      name: /mark as completed/i,
    });
    await markAsCompletedOption.click();

    // A confirmation dialog should appear (AlertDialog)
    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await expect(
      confirmDialog.getByText(/mark as complete/i).first(),
    ).toBeVisible();

    // Confirm the completion
    await confirmDialog
      .getByRole("button", { name: /mark as complete/i })
      .click();

    // Verify the encounter shows "Completed" status
    await expect(page.getByText(/completed/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("should open encounter actions via keyboard shortcut", async ({
    page,
  }) => {
    // Click on the first encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );

    // Wait for the encounter to load
    await expect(
      page.getByRole("button", { name: /encounter actions/i }).first(),
    ).toBeVisible();

    // Press Ctrl+K or Cmd+K to open command dialog
    await page.keyboard.press("Control+k");

    // Verify the command dialog opens
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});
