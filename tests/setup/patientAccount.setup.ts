import { faker } from "@faker-js/faker";
import { test } from "@playwright/test";
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
  await page.goto(`facility/${facilityId}/patient/${patientId}`);

  try {
    // Navigate to Accounts tab and create account
    await page.getByRole("tab", { name: "Accounts" }).click();
    await page.getByRole("button", { name: "Create Account" }).click();

    // Generate random account name using faker
    const accountName = faker.finance.accountName();

    await page.getByRole("textbox", { name: "Name *" }).click();
    await page.getByRole("textbox", { name: "Name *" }).fill(accountName);
    await page.getByRole("button", { name: "Create" }).click();

    await page.getByRole("button", { name: "Go to account" }).click();

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
