import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test("navigate to an patient - create and save account id", async ({
  page,
}) => {
  const facilityId = getFacilityId();
  const patientId = getPatientId();

  // Navigate to patient page
  await page.goto(
    `facility/${facilityId}/patient/${patientId}/accounts?status=active`,
  );

  try {
    // Check if an account already exists. Wait for the account list query to
    // settle first: it renders either a "Go to account" row button or the
    // empty state, so the isVisible() check below never sees the skeleton.
    const goToAccountButton = page
      .getByRole("button", { name: "Go to account" })
      .first();
    const noAccountsMessage = page.getByText("No accounts found");
    await expect(goToAccountButton.or(noAccountsMessage)).toBeVisible();

    const accountExists = await goToAccountButton.isVisible();

    if (accountExists) {
      await goToAccountButton.click();
    } else {
      // Create new account
      await page.getByRole("button", { name: "Create Account" }).click();

      // Generate random account name using faker
      const accountName = faker.finance.accountName();

      await page
        .getByRole("textbox", { name: "Name *" })
        .pressSequentially(accountName);
      await page.getByRole("button", { name: "Create" }).click();

      await page.getByRole("button", { name: "Go to account" }).click();
    }

    // Wait for navigation and extract account ID from URL
    await page.waitForURL(/\/account\/[a-f0-9-]+/);
    const accountId = page.url().match(/\/account\/([a-f0-9-]+)/)?.[1];

    if (!accountId) {
      throw new Error("Failed to extract account ID from URL");
    }

    // Save account ID to meta file
    const metaPath = path.resolve("tests/.auth/accountMeta.json");
    fs.writeFileSync(metaPath, JSON.stringify({ id: accountId }, null, 2));
    console.log(`✅ Account created and saved: ${accountId}`);
  } catch (error) {
    console.error("❌ Failed to set up account:", error);
    throw error;
  }
});
