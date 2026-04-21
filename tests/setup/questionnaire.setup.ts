import * as fs from "fs";
import * as path from "path";

import { test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test("ensure enable-when questionnaire exists", async () => {
  const slug = "enable-when-test";
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

  // Load fixture early so we can compare versions with any existing questionnaire
  const fixture = JSON.parse(
    fs.readFileSync(path.resolve(fixturePath), "utf-8"),
  );

  // Check if questionnaire already exists
  const checkRes = await fetch(`${apiUrl}/api/v1/questionnaire/${slug}/`, {
    headers,
  });

  if (checkRes.status === 200) {
    const existing = (await checkRes.json()) as { version?: string };
    if (existing.version === fixture.version) {
      console.log(
        `✅ Questionnaire already exists at version ${existing.version}: ${slug}`,
      );
      return;
    }
    // Version mismatch — update in place with new content
    console.log(
      `♻️ Questionnaire version changed (${existing.version} → ${fixture.version}), updating: ${slug}`,
    );
    // PUT endpoint doesn't accept organizations — only send questionnaire fields
    const { organizations: _orgs, ...updateBody } = { ...fixture, slug };
    const updateRes = await fetch(`${apiUrl}/api/v1/questionnaire/${slug}/`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateBody),
    });
    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      throw new Error(
        `Failed to update questionnaire: ${updateRes.status} — ${errorText}`,
      );
    }
    console.log(`✅ Questionnaire updated: ${slug}`);
    return;
  }

  if (checkRes.status !== 404) {
    const errorText = await checkRes.text();
    throw new Error(
      `Failed to check questionnaire existence: ${checkRes.status} — ${errorText}`,
    );
  }

  await prepareFixture(fixture, slug, apiUrl, headers);
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

async function prepareFixture(
  fixture: Record<string, unknown>,
  slug: string,
  apiUrl: string,
  headers: Record<string, string>,
) {
  const orgRes = await fetch(`${apiUrl}/api/v1/organization/?org_type=role`, {
    headers,
  });
  if (!orgRes.ok) {
    throw new Error(`Failed to fetch organizations: ${orgRes.status}`);
  }
  const orgData = (await orgRes.json()) as {
    results: { id: string }[];
  };
  fixture.slug = slug;
  fixture.organizations = orgData.results.map((org) => org.id);
}
