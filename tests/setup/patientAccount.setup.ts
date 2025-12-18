import { faker } from "@faker-js/faker";
import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test("navigate to patient and setup account", async ({ page }) => {
  const facilityId = getFacilityId();
  const patientId = getPatientId();
  const NAVIGATION_TIMEOUT = 10000;

  // Navigate to patient page
  await page.goto(`facility/${facilityId}/patient/${patientId}`);

  try {
    // Set up API response listener BEFORE clicking tab to avoid race condition
    const accountsResponse = page.waitForResponse(
      (response) => {
        const url = response.url();
        return (
          url.includes(`/api/v1/facility/${facilityId}/account/`) &&
          url.includes(`patient=${patientId}`) &&
          response.status() === 200
        );
      },
      { timeout: 10000 },
    );

    // Click Accounts tab - this triggers the API call
    await page.getByRole("tab", { name: "Accounts" }).click();

    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Now wait for the API response we set up earlier
    const accountsData = await (await accountsResponse).json();

    console.log(`API returned ${accountsData.count} accounts for patient`);

    if (accountsData.count > 0) {
      // Use existing account - wait for and click "Go to account" button
      await page.waitForSelector('button:has-text("Go to account")', {
        timeout: 5000,
      });
      await page.locator('button:has-text("Go to account")').first().click();
    } else {
      // Create new account
      await page.getByRole("button", { name: "Create Account" }).click();

      const accountName = faker.finance.accountName();
      await page.getByRole("textbox", { name: "Name *" }).fill(accountName);

      // Set up listener for account creation API before clicking Create
      const createResponse = page.waitForResponse(
        (response) => {
          const url = response.url();
          return (
            url.includes(`/api/v1/facility/${facilityId}/account/`) &&
            response.request().method() === "POST" &&
            response.status() === 200
          );
        },
        { timeout: 10000 },
      );

      await page.getByRole("button", { name: "Create" }).click();

      // Wait for account creation to complete
      await createResponse;

      // Now wait for and click "Go to account" button
      await page.waitForSelector('button:has-text("Go to account")', {
        timeout: 5000,
      });
      await page.getByRole("button", { name: "Go to account" }).click();
    }

    // Wait for navigation to account page
    await page.waitForURL(/\/account\/[a-f0-9-]+/, {
      timeout: NAVIGATION_TIMEOUT,
    });
    const accountId = page.url().match(/\/account\/([a-f0-9-]+)/)?.[1];

    if (!accountId) {
      throw new Error(`Failed to extract account ID from URL: ${page.url()}`);
    }

    // Save account ID to meta file for use by other tests
    const metaPath = path.resolve("tests/.auth/accountMeta.json");
    fs.mkdirSync("tests/.auth", { recursive: true });
    fs.writeFileSync(metaPath, JSON.stringify({ id: accountId }, null, 2));

    console.log(`✅ Account setup completed: ${accountId}`);
  } catch (error) {
    console.error("❌ Account setup failed:", error);
    throw error;
  }
});
