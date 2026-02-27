import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.describe("Account Management Permissions", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to healthcare services
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/billing/account`);
  });

  test.describe("facility admin", () => {
    test.use({ storageState: "tests/.auth/facilityAdmin.json" });

    test("can edit and rebalance accounts", async ({ page }) => {
      // Verify Edit button is visible on accounts list
      await expect(
        page.getByRole("heading", { name: /accounts/i }),
      ).toBeVisible();

      // Navigate to account detail page
      await page
        .getByRole("button", { name: /go to account/i })
        .first()
        .click();

      // Verify Edit button is visible on account details
      const accountEditButton = page
        .getByRole("button", { name: /edit/i })
        .nth(0);
      await expect(accountEditButton).toBeVisible();

      // Verify Rebalance button is visible
      const rebalanceButton = page.getByRole("button", { name: /rebalance/i });
      await expect(rebalanceButton).toBeVisible();
    });
  });

  test.describe("admin", () => {
    test.use({ storageState: "tests/.auth/user.json" });

    test("can edit and rebalance accounts", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /accounts/i }),
      ).toBeVisible();

      // Navigate to account detail page
      await page
        .getByRole("button", { name: /go to account/i })
        .first()
        .click();

      // Verify Edit button is visible on account details
      const accountEditButton = page
        .getByRole("button", { name: /edit/i })
        .nth(0);
      await expect(accountEditButton).toBeVisible();

      // Verify Rebalance button is visible
      const rebalanceButton = page.getByRole("button", { name: /rebalance/i });
      await expect(rebalanceButton).toBeVisible();
    });
  });

  test.describe("nurse", () => {
    test.use({ storageState: "tests/.auth/nurse.json" });

    test("cannot edit or rebalance accounts", async ({ page }) => {
      // Navigate to account detail page
      await page
        .getByRole("button", { name: /go to account/i })
        .first()
        .click();

      // Verify Edit button is not visible on account details
      const accountEditButton = page
        .getByRole("button", { name: /edit/i })
        .nth(0);
      await expect(accountEditButton).not.toBeVisible();

      // Verify Rebalance button is not visible
      const rebalanceButton = page.getByRole("button", { name: /rebalance/i });
      await expect(rebalanceButton).not.toBeVisible();
    });
  });
});
