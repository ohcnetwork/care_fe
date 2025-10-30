import { test } from "@playwright/test";
import fs from "fs";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("navigate to billing accounts and save account id", async ({ page }) => {
  const facilityId = getFacilityId();

  // Navigate to billing accounts page
  await page.goto(`/facility/${facilityId}/billing/accounts`);

  // Wait for the accounts table to load
  const tableBody = page.locator("tbody");
  await tableBody.waitFor({ state: "visible", timeout: 10000 });

  try {
    // Check if any accounts exist
    const accountButton = page
      .getByRole("button", { name: /go to account/i })
      .first();

    // Wait for at least one account to be visible
    await accountButton.waitFor({ state: "visible", timeout: 5000 });

    // Click to navigate to account page
    await accountButton.click();

    // Wait for navigation to account page
    await page.waitForURL(/\/billing\/account\/[^/]+/, { timeout: 10000 });

    // Extract account ID from URL
    const accountId = page.url().match(/\/account\/([^/]+)/)?.[1];
    if (!accountId) {
      throw new Error("Could not extract account ID from URL: " + page.url());
    }

    // Ensure the directory exists
    fs.mkdirSync("tests/.auth", { recursive: true });
    fs.writeFileSync(
      "tests/.auth/accountMeta.json",
      JSON.stringify({ id: accountId, facilityId }, null, 2),
    );

    console.log(`✅ Account ID saved: ${accountId}`);
  } catch (error) {
    console.error(
      "❌ Failed to set up account:",
      error instanceof Error ? error.message : error,
    );
    console.error(
      "💡 Tip: Ensure at least one billing account exists in the facility.",
    );
    console.error(
      "   You can create one by: Patient → Create consultation → Lab/Pharmacy order → Invoice",
    );
    throw error;
  }
});
