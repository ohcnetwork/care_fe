import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Status Dropdown Behavior", () => {
  const facilityId = getFacilityId();
  const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const createdDateBefore = format(new Date(), "yyyy-MM-dd");

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    );
  });

  test("should never show 'Unknown' status in dropdown options", async ({
    page,
  }) => {
    // Navigate to an in-progress encounter
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Wait for page to load and navigate to encounter questionnaire
    await expect(page).toHaveURL(/\/encounter\/.*\/updates/, {
      timeout: 10000,
    });

    const currentUrl = page.url();
    const encounterId = currentUrl.match(/\/encounter\/([^/]+)\//)?.[1];
    expect(encounterId).toBeTruthy();

    // Navigate to encounter questionnaire
    const targetUrl = `/facility/${facilityId}/patient/${encounterId}/encounter/${encounterId}/questionnaire/encounter`;
    await page.goto(targetUrl);

    // Open the status dropdown
    await page.getByRole("combobox", { name: "Status" }).click();

    // Verify "Unknown" is NOT in the options
    await expect(
      page.getByRole("option", { name: "Unknown", exact: true }),
    ).not.toBeVisible();

    // Verify other statuses ARE visible
    await expect(
      page.getByRole("option", { name: "In Progress", exact: true }),
    ).toBeVisible();
  });

  test("should only show 'Discharged' status when encounter is already discharged", async ({
    page,
  }) => {
    // First, check a non-discharged encounter
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    await page.getByRole("link", { name: "View Encounter" }).first().click();

    await expect(page).toHaveURL(/\/encounter\/.*\/updates/, {
      timeout: 10000,
    });

    const currentUrl = page.url();
    const encounterId = currentUrl.match(/\/encounter\/([^/]+)\//)?.[1];
    expect(encounterId).toBeTruthy();

    // Navigate to encounter questionnaire
    const targetUrl = `/facility/${facilityId}/patient/${encounterId}/encounter/${encounterId}/questionnaire/encounter`;
    await page.goto(targetUrl);

    // Open the status dropdown
    await page.getByRole("combobox", { name: "Status" }).click();

    // Verify "Discharged" is NOT in the options for non-discharged encounter
    await expect(
      page.getByRole("option", { name: "Discharged", exact: true }),
    ).not.toBeVisible();

    // Close the dropdown
    await page.keyboard.press("Escape");

    // Now check a discharged encounter if available
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=discharged`,
    );

    // Check if there are any discharged encounters
    const dischargedEncounterLink = page
      .getByRole("link", { name: "View Encounter" })
      .first();

    if (await dischargedEncounterLink.isVisible()) {
      await dischargedEncounterLink.click();

      await expect(page).toHaveURL(/\/encounter\/.*\/updates/, {
        timeout: 10000,
      });

      const dischargedUrl = page.url();
      const dischargedEncounterId = dischargedUrl.match(
        /\/encounter\/([^/]+)\//,
      )?.[1];

      const dischargedTargetUrl = `/facility/${facilityId}/patient/${dischargedEncounterId}/encounter/${dischargedEncounterId}/questionnaire/encounter`;
      await page.goto(dischargedTargetUrl);

      // Open the status dropdown
      await page.getByRole("combobox", { name: "Status" }).click();

      // Verify "Discharged" IS in the options for discharged encounter
      await expect(
        page.getByRole("option", { name: "Discharged", exact: true }),
      ).toBeVisible();
    }
  });

  test("should disable status dropdown when encounter is discharged", async ({
    page,
  }) => {
    // Navigate to discharged encounters
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=discharged`,
    );

    // Check if there are discharged encounters
    const dischargedEncounterLink = page
      .getByRole("link", { name: "View Encounter" })
      .first();

    if (await dischargedEncounterLink.isVisible()) {
      await dischargedEncounterLink.click();

      await expect(page).toHaveURL(/\/encounter\/.*\/updates/, {
        timeout: 10000,
      });

      const currentUrl = page.url();
      const encounterId = currentUrl.match(/\/encounter\/([^/]+)\//)?.[1];

      const targetUrl = `/facility/${facilityId}/patient/${encounterId}/encounter/${encounterId}/questionnaire/encounter`;
      await page.goto(targetUrl);

      // Verify the status dropdown is disabled
      const statusDropdown = page.getByRole("combobox", { name: "Status" });
      await expect(statusDropdown).toBeDisabled();
    }
  });

  test("should show 'Discharge Patient' button for non-discharged encounters", async ({
    page,
  }) => {
    // Navigate to in-progress encounters
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    await page.getByRole("link", { name: "View Encounter" }).first().click();

    await expect(page).toHaveURL(/\/encounter\/.*\/updates/, {
      timeout: 10000,
    });

    const currentUrl = page.url();
    const encounterId = currentUrl.match(/\/encounter\/([^/]+)\//)?.[1];

    const targetUrl = `/facility/${facilityId}/patient/${encounterId}/encounter/${encounterId}/questionnaire/encounter`;
    await page.goto(targetUrl);

    // Verify "Discharge Patient" section is visible
    await expect(
      page.getByRole("heading", { name: "Discharge patient" }),
    ).toBeVisible();

    // Verify the discharge button is present
    await expect(
      page.getByRole("button", { name: "Mark as Discharged" }),
    ).toBeVisible();

    // Open status dropdown to verify "Discharged" is not manually selectable
    await page.getByRole("combobox", { name: "Status" }).click();

    await expect(
      page.getByRole("option", { name: "Discharged", exact: true }),
    ).not.toBeVisible();
  });

  test("should prevent changing status after discharge", async ({ page }) => {
    // Navigate to discharged encounters
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=discharged`,
    );

    const dischargedEncounterLink = page
      .getByRole("link", { name: "View Encounter" })
      .first();

    if (await dischargedEncounterLink.isVisible()) {
      await dischargedEncounterLink.click();

      await expect(page).toHaveURL(/\/encounter\/.*\/updates/, {
        timeout: 10000,
      });

      const currentUrl = page.url();
      const encounterId = currentUrl.match(/\/encounter\/([^/]+)\//)?.[1];

      const targetUrl = `/facility/${facilityId}/patient/${encounterId}/encounter/${encounterId}/questionnaire/encounter`;
      await page.goto(targetUrl);

      // Verify status shows "Discharged"
      await expect(
        page.getByRole("combobox").filter({ hasText: "Discharged" }),
      ).toBeVisible();

      // Verify the dropdown is disabled
      const statusDropdown = page.getByRole("combobox", { name: "Status" });
      await expect(statusDropdown).toBeDisabled();

      // Verify "Discharge Patient" section is NOT visible (already discharged)
      await expect(
        page.getByRole("heading", { name: "Discharge patient" }),
      ).not.toBeVisible();
    }
  });
});
