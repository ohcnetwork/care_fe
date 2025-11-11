import { test } from "@playwright/test";
import { format, subDays } from "date-fns";
import fs from "fs";

import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("navigate to encounter via UI and save encounter metadata", async ({
  page,
}) => {
  const facilityId = getFacilityId();
  const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const createdDateBefore = format(new Date(), "yyyy-MM-dd");

  try {
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    );

    await page.getByRole("button", { name: "View Encounter" }).first().click();

    await page.waitForURL(/\/encounter\/([^/]+)\//);

    const urlMatch = page
      .url()
      .match(/\/facility\/([^/]+)\/patient\/([^/]+)\/encounter\/([^/]+)\//);

    if (!urlMatch) {
      throw new Error(
        "Could not extract encounter metadata from URL: " + page.url(),
      );
    }

    const [, extractedFacilityId, patientId, encounterId] = urlMatch;

    const metadata = {
      facilityId: extractedFacilityId,
      patientId,
      encounterId,
      savedAt: new Date().toISOString(),
    };

    fs.mkdirSync("tests/.auth", { recursive: true });
    fs.writeFileSync(
      "tests/.auth/encounterMeta.json",
      JSON.stringify(metadata, null, 2),
    );

    console.log(`✅ Encounter metadata saved:`);
    console.log(`   Facility ID: ${extractedFacilityId}`);
    console.log(`   Patient ID: ${patientId}`);
    console.log(`   Encounter ID: ${encounterId}`);
  } catch (error) {
    console.error("❌ Failed to set up encounter:", error);
    throw error;
  }
});
