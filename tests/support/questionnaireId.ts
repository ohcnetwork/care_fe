import fs from "fs";
import path from "path";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";

const META_PATH = path.resolve("tests/.auth/questionnaireMeta.json");
const AUTH_PATH = path.resolve("tests/.auth/user.json");
const SLUG = "enable-when-test";
const FIXTURE_PATH = path.resolve(
  "tests/fixtures/questionnaires/enableWhenTest.json",
);

let cachedId: string | null = null;

interface QuestionnaireListEntry {
  id: string;
  slug: string;
  version?: string;
}

/**
 * Seeds the enable-when fill-flow fixture questionnaire and records its id
 * in `tests/.auth/questionnaireMeta.json` for the specs.
 *
 * The detail endpoint looks up by external_id only (no slug lookup) and the
 * list endpoint has no slug filter, so the slug is resolved client-side from
 * a title-filtered list; the questionnaire is created when missing and
 * updated in place when the fixture version changed.
 *
 * Plain fetch + fs on purpose: this also runs on demand from
 * `getQuestionnaireId` inside an already-running worker, and shelling out to
 * a nested `playwright test --project=setup` there would re-run
 * `globalSetup` — restoring the DB snapshot mid-run, under the feet of every
 * other worker.
 */
export async function ensureEnableWhenQuestionnaire(): Promise<string> {
  if (!fs.existsSync(AUTH_PATH)) {
    throw new Error("Auth file not found — run auth setup first");
  }
  const headers = adminApiHeaders();
  const apiUrl = apiBaseUrl();

  const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf-8")) as Record<
    string,
    unknown
  > & { title: string; version?: string };
  fixture.slug = SLUG;
  // Required by QuestionnaireCreateSpec; instance creation is superuser-only
  // and this runs as the admin superuser.
  fixture.auth_context ??= "instance";

  const saveMeta = (id: string) => {
    fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
    fs.writeFileSync(META_PATH, JSON.stringify({ id }, null, 2));
    return id;
  };

  const limit = 100;
  let offset = 0;
  let existing: QuestionnaireListEntry | undefined;

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
      results: QuestionnaireListEntry[];
    };
    existing = listData.results.find((entry) => entry.slug === SLUG);

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
        `✅ Questionnaire already exists at version ${existing.version}: ${SLUG} (${existing.id})`,
      );
      return saveMeta(existing.id);
    }
    console.log(
      `♻️ Questionnaire version changed (${existing.version} → ${fixture.version}), updating: ${SLUG}`,
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
    console.log(`✅ Questionnaire updated: ${SLUG}`);
    return saveMeta(existing.id);
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
  console.log(`✅ Questionnaire created: ${SLUG} (${created.id})`);
  return saveMeta(created.id);
}

/**
 * Returns the enable-when fixture questionnaire's id saved during setup.
 * The fill-flow routes fetch questionnaires by external_id (slug lookup was
 * not supported), so specs must navigate by id.
 * Seeds the fixture in-process only when the meta file is ABSENT; a present
 * but unparseable meta file throws instead, because silently re-seeding over
 * one would hide a corrupt setup behind specs that still pass.
 */
export async function getQuestionnaireId(): Promise<string> {
  if (cachedId) return cachedId;

  if (!fs.existsSync(META_PATH)) {
    console.warn("⚠️ Questionnaire meta missing — seeding the fixture...");
    cachedId = await ensureEnableWhenQuestionnaire();
    return cachedId;
  }

  const raw = fs.readFileSync(META_PATH, "utf8");
  try {
    const { id } = JSON.parse(raw) as { id?: string };
    if (!id) throw new Error("Missing id in questionnaireMeta.json");
    cachedId = id;
    return id;
  } catch (err) {
    throw new Error(
      `Invalid questionnaireMeta.json: ${err instanceof Error ? err.message : err}`,
    );
  }
}
