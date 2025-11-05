import { test } from "@playwright/test";
import fs from "fs";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("navigate to an encounter and save patient and encounter id", async ({
  page,
}) => {
  const facilityId = getFacilityId();

  // Navigate to encounters overview page with a wide date range to show all encounters
  await page.goto(
    `/facility/${facilityId}/encounters/patients/all?created_date_after=2000-01-01&created_date_before=2099-12-31`,
  );

  try {
    // Wait for encounter link to be visible
    const encounterLink = page.locator('a[href*="/encounter/"]').first();
    await encounterLink.waitFor({ state: "visible", timeout: 10000 });

    if (await encounterLink.isVisible()) {
      const href = await encounterLink.getAttribute("href");

      if (!href) {
        throw new Error("Could not get encounter link href");
      }

      // Extract patient ID and encounter ID from the URL
      // URL format: /facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/...
      const patientMatch = href.match(/\/patient\/([^/]+)/);
      const encounterMatch = href.match(/\/encounter\/([^/]+)/);

      if (!patientMatch || !encounterMatch) {
        throw new Error(`Could not extract IDs from URL: ${href}`);
      }

      const patientId = patientMatch[1];
      const encounterId = encounterMatch[1];

      // Ensure the directory exists
      fs.mkdirSync("tests/.auth", { recursive: true });

      // Save patient ID
      fs.writeFileSync(
        "tests/.auth/patientMeta.json",
        JSON.stringify({ id: patientId }, null, 2),
      );

      // Save encounter ID
      fs.writeFileSync(
        "tests/.auth/encounterMeta.json",
        JSON.stringify({ id: encounterId }, null, 2),
      );

      console.log(`✅ Patient ID saved: ${patientId}`);
      console.log(`✅ Encounter ID saved: ${encounterId}`);
    } else {
      throw new Error("No encounters found. Please create an encounter first.");
    }
  } catch (error) {
    console.error("❌ Failed to set up patient and encounter:", error);
    throw error;
  }
});
