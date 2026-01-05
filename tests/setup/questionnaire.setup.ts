import { chromium, test as setup } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Questionnaires to be loaded - customize this list
// Map of slug to filename (without .json extension)
const QUESTIONNAIRES_TO_LOAD = [
  { slug: "enable-when-test", filename: "enableWhenTest" },
];

const authFile = "tests/.auth/user.json";

interface Organization {
  id: string;
  org_type: string;
  name: string;
}

interface OrganizationResponse {
  count: number;
  results: Organization[];
}

/**
 * Check, load, and verify a single questionnaire
 */
async function processQuestionnaire(
  apiUrl: string,
  accessToken: string,
  questionnaireSlug: string,
  questionnaireFilename: string,
  organizationIds: string[],
): Promise<boolean> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Check if questionnaire exists
    console.log(`\n🔍 Checking '${questionnaireSlug}'...`);

    const checkResponse = await page.request.get(
      `${apiUrl}/api/v1/questionnaire/${questionnaireSlug}/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (checkResponse.status() === 200) {
      console.log(`  ✅ Already exists, skipping`);
      return true;
    }

    console.log(`  ⚠️ Not found, will create it`);

    // Step 2: Load questionnaire from local fixture
    const questionnairePath = path.join(
      __dirname,
      "..",
      "fixtures",
      "questionnaires",
      `${questionnaireFilename}.json`,
    );

    if (!fs.existsSync(questionnairePath)) {
      console.error(`  ❌ Fixture file not found: ${questionnairePath}`);
      return false;
    }

    console.log(`  📤 Loading from fixture...`);

    const questionnaireData = JSON.parse(
      fs.readFileSync(questionnairePath, "utf-8"),
    );

    // Step 3: Inject organization IDs
    questionnaireData.organizations = organizationIds;

    // Fix tags if present - convert tag objects to just IDs
    if (Array.isArray(questionnaireData.tags)) {
      questionnaireData.tags = questionnaireData.tags.map((tag: unknown) => {
        if (typeof tag === "object" && tag !== null && "id" in tag) {
          return (tag as { id: string }).id;
        }
        return tag;
      });
    }

    // Create the questionnaire
    const createResponse = await page.request.post(
      `${apiUrl}/api/v1/questionnaire/`,
      {
        data: questionnaireData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!createResponse.ok()) {
      const errorText = await createResponse.text();
      console.error(
        `  ❌ Failed to create: ${createResponse.status()} - ${errorText}`,
      );
      return false;
    }

    console.log(`  ✅ Created successfully`);

    // Step 4: Verify it was created
    console.log(`  🔍 Verifying creation...`);

    const verifyResponse = await page.request.get(
      `${apiUrl}/api/v1/questionnaire/${questionnaireSlug}/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (verifyResponse.status() === 200) {
      console.log(`  ✅ Verified successfully`);
      return true;
    } else {
      console.error(`  ❌ Verification failed: ${verifyResponse.status()}`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error processing questionnaire:`, error);
    return false;
  } finally {
    await browser.close();
  }
}

/**
 * Fetch all organization IDs from the API
 */
async function fetchOrganizationIds(
  apiUrl: string,
  accessToken: string,
): Promise<string[]> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const response = await page.request.get(
      `${apiUrl}/api/v1/organization/?org_type=role`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status() === 200) {
      const data: OrganizationResponse = await response.json();
      return data.results.map((org) => org.id);
    }

    console.error(`Failed to fetch organizations: ${response.status()}`);
    return [];
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Setup test to load questionnaires
 * Runs AFTER auth.setup.ts completes, ensuring valid tokens exist
 */
setup("load questionnaires", async () => {
  console.log("\n=== Questionnaire Setup ===\n");

  if (!fs.existsSync(authFile)) {
    console.log("⚠️ Auth file not found, skipping questionnaire setup");
    return;
  }

  try {
    const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));

    if (
      !Array.isArray(storageState.origins) ||
      storageState.origins.length === 0
    ) {
      console.log(
        "⚠️ No origins found in storage state, skipping questionnaire setup",
      );
      return;
    }

    const firstOrigin = storageState.origins[0];
    const localStorage = Array.isArray(firstOrigin.localStorage)
      ? firstOrigin.localStorage
      : [];
    const accessTokenEntry = localStorage.find(
      (item: { name: string; value: string }) =>
        item.name === "care_access_token",
    );

    if (!accessTokenEntry) {
      console.log(
        "⚠️ No access token found in storage state, skipping questionnaire setup",
      );
      return;
    }

    const accessToken = accessTokenEntry.value;
    const apiUrl = process.env.REACT_CARE_API_URL || "http://localhost:9000";

    // Fetch organization IDs first
    const organizationIds = await fetchOrganizationIds(apiUrl, accessToken);
    if (organizationIds.length === 0) {
      console.log("⚠️ No organizations found, skipping questionnaire setup");
      return;
    }

    // Process each questionnaire: check → load if needed → verify
    console.log(
      `\n📦 Processing ${QUESTIONNAIRES_TO_LOAD.length} questionnaires...`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const entry of QUESTIONNAIRES_TO_LOAD) {
      const success = await processQuestionnaire(
        apiUrl,
        accessToken,
        entry.slug,
        entry.filename,
        organizationIds,
      );

      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Summary
    console.log(`\n${"=".repeat(50)}`);
    console.log(`📊 Summary:`);
    console.log(
      `  ✅ Successful: ${successCount}/${QUESTIONNAIRES_TO_LOAD.length}`,
    );
    if (failCount > 0) {
      console.log(`  ❌ Failed: ${failCount}`);
    }
    console.log(`${"=".repeat(50)}`);

    if (failCount > 0) {
      console.log(`\n⚠️ ${failCount} questionnaire(s) failed to process`);
    } else {
      console.log(`\n✅ All questionnaires processed successfully`);
    }
  } catch (error) {
    console.error("❌ Error in questionnaire setup:", error);
  }
});
