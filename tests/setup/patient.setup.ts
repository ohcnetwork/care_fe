import { test } from "@playwright/test";
import { format, subDays } from "date-fns";
import fs from "fs";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("navigate to an encounter and save patient and encounter id", async ({
  page,
}) => {
  const facilityId = getFacilityId();
  const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const createdDateBefore = format(new Date(), "yyyy-MM-dd");
  // Navigate to encounters overview page with a wide date range to show all encounters
  await page.goto(
    `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
  );

  try {
    // Wait for encounter link to be visible
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Wait for navigation to the encounter page
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );

    // Extract patient ID and encounter ID from the URL
    const url = page.url();
    const patientIdMatch = url.match(/\/patient\/([^/]+)/);
    const encounterIdMatch = url.match(/\/encounter\/([^/]+)/);

    const patientId = patientIdMatch?.[1];
    const encounterId = encounterIdMatch?.[1];
    if (!patientId || !encounterId) {
      throw new Error(`Failed to extract IDs from URL: ${url}`);
    }

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
  } catch (error) {
    console.error("❌ Failed to set up patient and encounter:", error);
    throw error;
  }
});
