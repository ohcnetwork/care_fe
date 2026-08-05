import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const META_PATH = path.resolve("tests/.auth/questionnaireMeta.json");
let cachedId: string | null = null;

/**
 * Returns the enable-when fixture questionnaire's id saved during setup.
 * The fill-flow routes fetch questionnaires by external_id (slug lookup was
 * not supported), so specs must navigate by id.
 * Auto-runs the setup if the meta file is missing or invalid.
 */
export function getQuestionnaireId(): string {
  if (cachedId) return cachedId;

  if (!fs.existsSync(META_PATH)) {
    console.warn(
      "⚠️ Questionnaire meta missing — running questionnaire setup...",
    );
    try {
      execSync(
        "npx playwright test --project=setup tests/setup/questionnaire.setup.ts",
        {
          stdio: "inherit",
          cwd: process.cwd(),
        },
      );
    } catch (error) {
      throw new Error(
        `Failed to run questionnaire setup: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const raw = fs.readFileSync(META_PATH, "utf8");
  try {
    const { id } = JSON.parse(raw);
    if (!id) throw new Error("Missing id in questionnaireMeta.json");
    cachedId = id;
    return id;
  } catch (err) {
    throw new Error(
      `Invalid questionnaireMeta.json: ${err instanceof Error ? err.message : err}`,
    );
  }
}
