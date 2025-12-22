import dotenv from "dotenv";
import { writeFile } from "fs/promises";
import {
  getCategoriesToImport,
  getProductKnowledgeToImport,
} from "sudheendra-scripts/inventory-from-db/utils";
import { getLogger } from "sudheendra-scripts/utils";

dotenv.config({ path: [".env.local", ".env"] });

const FACILITY_ID = process.env.FACILITY_ID!;

const logger = getLogger();

async function writePayloads(payload: Record<string, object[]>) {
  for (const [key, value] of Object.entries(payload)) {
    await writeFile(`${key}.json`, JSON.stringify(value, null, 2));
  }
}

async function main() {
  const resourceCategories = getCategoriesToImport();
  const productKnowledge = getProductKnowledgeToImport({
    facility: FACILITY_ID,
  });
  await writePayloads({
    resourceCategories,
    productKnowledge,
  });
}

main();
