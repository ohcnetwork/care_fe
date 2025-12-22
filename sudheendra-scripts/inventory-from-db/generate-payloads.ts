import dotenv from "dotenv";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  getChargeItemDefinitionsToImport,
  getDeliveryOrdersToImport,
  getProductKnowledgeToImport,
  getProductToImport,
  getResourceCategoriesToImport,
  getSupplyDeliveriesToImport,
} from "sudheendra-scripts/inventory-from-db/utils";

dotenv.config({ path: [".env.local", ".env"] });

const dir = path.join(__dirname, "payloads");

async function writePayloads(payload: Record<string, object[]>) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  for (const [key, value] of Object.entries(payload)) {
    await writeFile(
      path.join(dir, `${key}.json`),
      JSON.stringify(value, null, 2),
    );
  }
}

async function main() {
  await writePayloads({
    "resource-categories": getResourceCategoriesToImport(),
    "product-knowledges": getProductKnowledgeToImport(),
    "charge-item-definitions": getChargeItemDefinitionsToImport(),
    products: getProductToImport(),
    "delivery-orders": getDeliveryOrdersToImport(),
    "supply-deliveries": getSupplyDeliveriesToImport(),
  });
}

main();
