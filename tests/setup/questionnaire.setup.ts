import * as fs from "fs";
import * as path from "path";

import { test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test("ensure enable-when questionnaire exists", async () => {
  const slug = "enable-when-string-test";
  const fixturePath = "tests/fixtures/questionnaires/enableWhenTest.json";

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
  if (checkRes.status === 200) {
    console.log(`✅ Questionnaire already exists: ${slug}`);
    return;
  }
  if (checkRes.status !== 404) {
    const errorText = await checkRes.text();
    throw new Error(
      `Failed to check questionnaire existence: ${checkRes.status} — ${errorText}`,
    );
  }

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

  // Load fixture and create
  const fixture = JSON.parse(
    fs.readFileSync(path.resolve(fixturePath), "utf-8"),
  );
  fixture.slug = slug;
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
  console.log(`✅ Questionnaire created: ${slug}`);
});
