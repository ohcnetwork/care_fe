import { test } from "@playwright/test";
import fs from "fs";

test.use({ storageState: "tests/.auth/user.json" });

test("enter facility via UI and save facility id", async ({ page }) => {
  await page.goto("/");

  // Wait for the page to load and check if the facility link exists
  try {
    await page
      .getByRole("link", { name: "Facility with Patient" })
      .first()
      .click();
    await page.waitForURL(/\/facility\/([^/]+)\/overview$/);

    const id = page.url().match(/\/facility\/([^/]+)\/overview$/)?.[1];
    if (!id) {
      throw new Error("Could not extract facility ID from URL: " + page.url());
    }

    // Ensure the directory exists
    fs.mkdirSync("tests/.auth", { recursive: true });
    fs.writeFileSync(
      "tests/.auth/facilityMeta.json",
      JSON.stringify({ id }, null, 2),
    );

    console.log(`✅ Facility ID saved: ${id}`);
  } catch (error) {
    console.error("❌ Failed to set up facility:", error);
    throw error;
  }
});
