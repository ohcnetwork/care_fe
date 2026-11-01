import { expect, test } from "@playwright/test";

import { navigateToOrganizationPatient } from "tests/organization/patient/helpers";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Encounter Access via Organization", () => {
  test("can view encounter from organization patient encounters tab", async ({
    page,
  }) => {
    await navigateToOrganizationPatient(page);

    // Go to Encounters tab
    await page.getByRole("tab", { name: "Encounters" }).click();
    await page.waitForURL(/\/encounters/);

    // Click "View Encounter" link
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Verify we can see the encounter page: the header shows its class
    await expect(
      page
        .getByRole("region", { name: "Encounter", exact: true })
        .getByText(
          /^(Inpatient|Ambulatory|Observation|Emergency|Virtual|Home Health)$/i,
        ),
    ).toBeVisible();
  });
});
