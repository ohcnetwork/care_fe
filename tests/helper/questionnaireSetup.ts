import * as fs from "fs";
import * as path from "path";

/**
 * Ensures a questionnaire exists on the backend. If the slug already exists,
 * this is a no-op. Otherwise it loads the fixture JSON, assigns all role-based
 * organizations, and creates the questionnaire via the API.
 *
 * Call this inside `test.beforeAll()` for any enable_when test suite.
 */
export async function ensureQuestionnaireExists(
  slug: string,
  fixtureRelativePath: string,
) {
  const authFile = path.resolve("tests/.auth/user.json");
  if (!fs.existsSync(authFile)) {
    throw new Error("Auth file not found — run auth setup first");
  }

  const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const tokenEntry = localStorage.find(
    (item: { name: string; value: string }) =>
      item.name === "care_access_token",
  );
  if (!tokenEntry) {
    throw new Error("No access token in auth storage state");
  }

  const accessToken = tokenEntry.value;
  const apiUrl = process.env.REACT_CARE_API_URL || "http://localhost:9000";
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // Check if questionnaire already exists
  const checkRes = await fetch(`${apiUrl}/api/v1/questionnaire/${slug}/`, {
    headers,
  });
  if (checkRes.status === 200) return;

  // Fetch organization IDs (required for questionnaire creation)
  const orgRes = await fetch(`${apiUrl}/api/v1/organization/?org_type=role`, {
    headers,
  });
  if (!orgRes.ok) {
    throw new Error(`Failed to fetch organizations: ${orgRes.status}`);
  }
  const orgData = (await orgRes.json()) as {
    results: { id: string }[];
  };
  const organizationIds = orgData.results.map((org) => org.id);

  // Load fixture and upload
  const fixturePath = path.resolve(fixtureRelativePath);
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
  fixture.organizations = organizationIds;

  const createRes = await fetch(`${apiUrl}/api/v1/questionnaire/`, {
    method: "POST",
    headers,
    body: JSON.stringify(fixture),
  });
  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(
      `Failed to create questionnaire: ${createRes.status} — ${errorText}`,
    );
  }
}
