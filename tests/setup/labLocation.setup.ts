import { test } from "@playwright/test";
import fs from "fs";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("find Bio-Chemistry lab location and save location metadata", async ({
  page,
}) => {
  const facilityId = getFacilityId();

  try {
    await page.goto(`/facility/${facilityId}/settings/locations`);

    const biochemLabRow = page
      .getByRole("row", { name: /bio.*chemistry.*lab/i })
      .first();

    const locationNameCell = biochemLabRow.getByRole("cell").first();
    const locationName = await locationNameCell.textContent();
    if (!locationName) {
      throw new Error("Could not get location name from Bio-Chemistry Lab row");
    }

    await biochemLabRow.click();
    await page.waitForURL(/\/settings\/locations\/[^/?]+/);

    const currentUrl = page.url();
    const locationIdMatch = currentUrl.match(/\/settings\/locations\/([^/?]+)/);

    if (!locationIdMatch) {
      throw new Error(`Could not extract location ID from URL: ${currentUrl}`);
    }

    const locationId = locationIdMatch[1];

    const metadata = {
      facilityId,
      locationId,
      locationName: locationName.trim(),
      savedAt: new Date().toISOString(),
    };

    fs.mkdirSync("tests/.auth", { recursive: true });
    fs.writeFileSync(
      "tests/.auth/locationMeta.json",
      JSON.stringify(metadata, null, 2),
    );

    console.log(`✅ Lab location metadata saved: ${locationName.trim()}`);
    console.log(`   Location ID: ${locationId}`);
  } catch (error) {
    console.error("❌ Failed to set up lab location:", error);
    throw error;
  }
});
