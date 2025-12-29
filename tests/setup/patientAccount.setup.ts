import { faker } from "@faker-js/faker";
import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { ensureAuthentication } from "../helper/auth";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test("navigate to an patient - create and save account id", async ({
  page,
}) => {
  // Ensure authentication is still valid
  await ensureAuthentication(page, "admin", "admin");

  const facilityId = getFacilityId();
  const patientId = getPatientId();

  // Navigate to patient page
  await page.goto(
    `facility/${facilityId}/patient/${patientId}/accounts?status=active`,
    { waitUntil: "domcontentloaded", timeout: 15000 },
  );

  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    // Check if an account already exists
    const goToAccountButton = page.getByRole("button", {
      name: "Go to account",
    });
    const accountExists = await goToAccountButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (accountExists) {
      await goToAccountButton.click();
    } else {
      // Create new account
      const createButton = page.getByRole("button", { name: "Create Account" });
      await createButton.waitFor({ state: "visible", timeout: 5000 });
      await createButton.click();

      // Generate random account name using faker
      const accountName = faker.finance.accountName();

      const nameField = page.getByRole("textbox", { name: "Name *" });
      await nameField.waitFor({ state: "visible", timeout: 5000 });
      await nameField.fill(accountName);
      
      const createSubmitButton = page.getByRole("button", { name: "Create" });
      await createSubmitButton.click();

      const goToNewAccountButton = page.getByRole("button", { name: "Go to account" });
      await goToNewAccountButton.waitFor({ state: "visible", timeout: 5000 });
      await goToNewAccountButton.click();
    }

    // Wait for navigation and extract account ID from URL
    await page.waitForURL(/\/account\/[a-f0-9-]+/, { timeout: 10000 });
    const accountId = page.url().match(/\/account\/([a-f0-9-]+)/)?.[1];

    if (!accountId) {
      throw new Error("Failed to extract account ID from URL");
    }

    // Save account ID to meta file
    const authDir = "tests/.auth";
    fs.mkdirSync(authDir, { recursive: true });
    
    const metaPath = path.join(authDir, "accountMeta.json");
    fs.writeFileSync(metaPath, JSON.stringify({ id: accountId }, null, 2));
    console.log(`✅ Account created and saved: ${accountId}`);
  } catch (error) {
    console.error("❌ Failed to set up account:", error);
    throw error;
  }
});
