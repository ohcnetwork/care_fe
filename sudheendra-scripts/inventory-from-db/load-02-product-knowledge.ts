import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";

import dotenv from "dotenv";
import {
  getExistingProductKnowledge,
  getItemsToImport,
  getProductKnowledgeToImport,
} from "sudheendra-scripts/inventory-from-db/utils";
import { batchRequest, getLogger, request } from "sudheendra-scripts/utils";
import { createProgress } from "sudheendra-scripts/utils/progress";

dotenv.config({ path: [".env.local", ".env"] });

const FACILITY_ID = process.env.FACILITY_ID!;

const logger = getLogger();

async function main() {
  const toCreate = getItemsToImport(
    await getExistingProductKnowledge(),
    getProductKnowledgeToImport({ facility: FACILITY_ID }),
    (a, b) => a.slug === b.slug_value,
  );

  const progress = createProgress({
    label: "Creating product knowledges",
    total: toCreate.length,
  });

  progress.start();

  await batchRequest(toCreate, async (datapoints) => {
    const result = await request<ProductKnowledgeBase>(
      `/api/v1/product_knowledge/`,
      "POST",
      datapoints[0],
    );

    progress.tick();

    return [result];
  });
}

main();
