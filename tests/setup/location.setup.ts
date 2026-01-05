import { test } from "@playwright/test";
import fs from "fs";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("navigate to a location via UI and save location id", async ({ page }) => {
  const facilityId = getFacilityId();

  await page.goto(`/facility/${facilityId}/services/`);

  try {
    // Look for Pathology Lab service
    const pathologyLabLink = page.getByRole("link", { name: "Pathology Lab" });
    await pathologyLabLink.waitFor({ state: "visible", timeout: 10000 });
    await pathologyLabLink.click();

    // Click on Bio-Chemistry location
    const bioChemistryLink = page.getByRole("link", { name: "Bio-Chemistry" });
    await bioChemistryLink.waitFor({ state: "visible", timeout: 10000 });
    await bioChemistryLink.click();

    // Wait for URL to contain location ID
    await page.waitForURL(
      new RegExp(`/facility/${facilityId}/locations/([^/]+)/`),
    );

    const locationIdMatch = page
      .url()
      .match(new RegExp(`/facility/${facilityId}/locations/([^/]+)/`));

    const id = locationIdMatch?.[1];

    if (!id) {
      throw new Error("Could not extract location ID from URL: " + page.url());
    }

    // Ensure the directory exists
    fs.mkdirSync("tests/.auth", { recursive: true });
    fs.writeFileSync(
      "tests/.auth/locationMeta.json",
      JSON.stringify({ id }, null, 2),
    );

    console.log(`✅ Location ID saved: ${id}`);
  } catch (error) {
    console.error("❌ Failed to set up location:", error);
    throw error;
  }
});
