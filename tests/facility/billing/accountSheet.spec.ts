import { faker } from "@faker-js/faker";

import { createAccount } from "tests/helper/billing";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "shows translated closed billing statuses without offering them as new choices",
  { tag: ["@atomic", "@cap:billing.account.edit"] },
  async ({ page, facilityId, isolatedPatient }) => {
    const statuses = [
      ["closed_baddebt", "Closed Bad Debt"],
      ["closed_voided", "Closed Voided"],
      ["closed_completed", "Closed Completed"],
      ["closed_combined", "Closed Combined"],
    ];

    for (const [status, label] of statuses) {
      // The accounts go on a patient of this test's own, not the shared
      // fixture patient.
      const account = await createAccount(
        facilityId,
        isolatedPatient.patientId,
        {
          name: `Account editor ${faker.string.alphanumeric(12)}`,
          billing_status: status,
        },
      );
      await page.goto(`/facility/${facilityId}/billing/account/${account.id}`);
      await page.getByRole("button", { name: /^Edit(?:\s|$)/ }).click();

      const billingStatus = page.getByRole("combobox", {
        name: "Billing Status",
        exact: true,
      });
      await expect(billingStatus).toHaveText(label);
      await billingStatus.click();
      await expect(
        page.getByRole("option", { name: label, exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("option", { name: "Open", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    }
  },
);
