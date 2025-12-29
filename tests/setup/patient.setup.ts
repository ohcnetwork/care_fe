import { test } from "@playwright/test";
import { format, subDays } from "date-fns";
import fs from "fs";
import path from "path";
import { ensureAuthentication } from "../helper/auth";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("navigate to an encounter and save patient and encounter id", async ({
  page,
}) => {
  // Ensure authentication is still valid
  await ensureAuthentication(page, "admin", "admin");

  const facilityId = getFacilityId();
  const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const createdDateBefore = format(new Date(), "yyyy-MM-dd");
  
  // Navigate to encounters overview page with a wide date range to show all encounters
  await page.goto(
    `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    { waitUntil: "domcontentloaded", timeout: 15000 },
  );

  try {
    // Wait for encounter link to be visible
    const encounterLink = page.getByRole("link", { name: "View Encounter" }).first();
    await encounterLink.waitFor({ state: "visible", timeout: 10000 });
    await encounterLink.click();

    // Wait for navigation to the encounter page
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
      { timeout: 10000 },
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
    const authDir = "tests/.auth";
    fs.mkdirSync(authDir, { recursive: true });

    // Save patient ID
    const patientMetaPath = path.join(authDir, "patientMeta.json");
    fs.writeFileSync(
      patientMetaPath,
      JSON.stringify({ id: patientId }, null, 2),
    );

    // Save encounter ID
    const encounterMetaPath = path.join(authDir, "encounterMeta.json");
    fs.writeFileSync(
      encounterMetaPath,
      JSON.stringify({ id: encounterId }, null, 2),
    );

    console.log(`✅ Patient ID saved: ${patientId}`);
    console.log(`✅ Encounter ID saved: ${encounterId}`);
  } catch (error) {
    console.error("❌ Failed to set up patient and encounter:", error);
    throw error;
  }
});
