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
  // Pin to writable encounters (planned or in_progress); without a status
  // filter the list is -modified_date ordered and can hand back a discharged
  // or completed encounter where questionnaires are locked.
  await page.goto(
    `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=planned,in_progress`,
  );

  try {
    // Capture every patient id in the list before navigating away, so we can
    // also record a second, distinct patient. Suites that book their own
    // appointment use it to avoid racing the primary fixture patient for the
    // same slot on parallel workers.
    const encounterLinks = page.getByRole("link", { name: "View Encounter" });
    await encounterLinks.first().waitFor({ state: "visible" });
    const patientIds = (
      await encounterLinks.evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      )
    ).map((href) => href.match(/\/patient\/([^/]+)/)?.[1]);

    // Wait for encounter link to be visible
    await encounterLinks.first().click();

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

    const secondPatientId = patientIds.find(
      (id): id is string => !!id && id !== patientId,
    );
    if (!secondPatientId) {
      throw new Error(
        "Could not find a second distinct patient in the encounter list",
      );
    }

    // Ensure the directory exists
    fs.mkdirSync("tests/.auth", { recursive: true });

    // Save patient IDs (primary + a distinct second patient)
    fs.writeFileSync(
      "tests/.auth/patientMeta.json",
      JSON.stringify({ id: patientId, secondId: secondPatientId }, null, 2),
    );

    // Save encounter ID
    fs.writeFileSync(
      "tests/.auth/encounterMeta.json",
      JSON.stringify({ id: encounterId }, null, 2),
    );

    console.log(`✅ Patient ID saved: ${patientId}`);
    console.log(`✅ Second patient ID saved: ${secondPatientId}`);
    console.log(`✅ Encounter ID saved: ${encounterId}`);
  } catch (error) {
    console.error("❌ Failed to set up patient and encounter:", error);
    throw error;
  }
});
