import * as fs from "fs";
import * as path from "path";

import { test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

const META_PATH = path.resolve("tests/.auth/questionnaireMeta.json");

/**
 * Seeds the legacy enable-when fill-flow fixture questionnaire.
 *
 * The detail endpoint looks up by external_id only (ENG-737 removed slug
 * lookup), and the list endpoint has no slug filter — so this resolves the
 * slug client-side from a title-filtered list, creates the questionnaire if
 * missing, updates it in place when the fixture version changed, and saves
 * the resolved id to tests/.auth/questionnaireMeta.json for the specs.
 */
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

  const fixture = JSON.parse(
    fs.readFileSync(path.resolve(fixturePath), "utf-8"),
  ) as Record<string, unknown> & { title: string; version?: string };
  fixture.slug = slug;
  // Required by QuestionnaireCreateSpec; instance creation is superuser-only
  // and this setup runs as the admin superuser.
  fixture.auth_context ??= "instance";

  const saveMeta = (id: string) => {
    fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
    fs.writeFileSync(META_PATH, JSON.stringify({ id }, null, 2));
  };

  // Resolve the slug via the list endpoint (client-side match).
  const limit = 100;
  let offset = 0;
  let existing: { id: string; slug: string; version?: string } | undefined;

  while (true) {
    const listRes = await fetch(
      `${apiUrl}/api/v1/questionnaire/?title=${encodeURIComponent(
        fixture.title,
      )}&limit=${limit}&offset=${offset}`,
      { headers },
    );
    if (!listRes.ok) {
      const errorText = await listRes.text();
      throw new Error(
        `Failed to list questionnaires: ${listRes.status} — ${errorText}`,
      );
    }
    const listData = (await listRes.json()) as {
      results: { id: string; slug: string; version?: string }[];
    };
    existing = listData.results.find((entry) => entry.slug === slug);

    if (existing) {
      break;
    }

    // If we got fewer results than the limit, we've reached the end
    if (listData.results.length < limit) {
      break;
    }

    offset += limit;
  }

  if (existing) {
    if (existing.version === fixture.version) {
      console.log(
        `✅ Questionnaire already exists at version ${existing.version}: ${slug} (${existing.id})`,
      );
      saveMeta(existing.id);
      return;
    }
    console.log(
      `♻️ Questionnaire version changed (${existing.version} → ${fixture.version}), updating: ${slug}`,
    );
    // PUT endpoint doesn't accept organizations — only send questionnaire fields
    const { organizations: _orgs, ...updateBody } = { ...fixture };
    const updateRes = await fetch(
      `${apiUrl}/api/v1/questionnaire/${existing.id}/`,
      { method: "PUT", headers, body: JSON.stringify(updateBody) },
    );
    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      throw new Error(
        `Failed to update questionnaire: ${updateRes.status} — ${errorText}`,
      );
    }
    console.log(`✅ Questionnaire updated: ${slug}`);
    saveMeta(existing.id);
    return;
  }

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
  const created = (await createRes.json()) as { id: string };
  console.log(`✅ Questionnaire created: ${slug} (${created.id})`);
  saveMeta(created.id);
});
