import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { ensureAuthentication } from "../helper/auth";

test.use({ storageState: "tests/.auth/user.json" });

test("enter facility via UI and save facility id", async ({ page }) => {
  // Ensure authentication is still valid
  await ensureAuthentication(page, "admin", "admin");

  await page.goto("/");

  // Wait for the page to load and check if the facility link exists
  try {
    const facilityLink = page
      .getByRole("link", { name: "Facility with Patient" })
      .first();
    await facilityLink.waitFor({ state: "visible", timeout: 10000 });
    await facilityLink.click();
    
    await page.waitForURL(/\/facility\/([^/]+)\/overview$/, { timeout: 10000 });

    const id = page.url().match(/\/facility\/([^/]+)\/overview$/)?.[1];
    if (!id) {
      throw new Error("Could not extract facility ID from URL: " + page.url());
    }

    // Ensure the directory exists
    const authDir = "tests/.auth";
    fs.mkdirSync(authDir, { recursive: true });
    
    const facilityMetaPath = path.join(authDir, "facilityMeta.json");
    fs.writeFileSync(
      facilityMetaPath,
      JSON.stringify({ id }, null, 2),
    );

    console.log(`✅ Facility ID saved: ${id}`);
  } catch (error) {
    console.error("❌ Failed to set up facility:", error);
    throw error;
  }
});
