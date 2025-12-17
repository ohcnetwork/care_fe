import dotenv from "dotenv";
import { getExistingChargeItemDefinitions } from "sudheendra-scripts/inventory-from-db/utils";
import { getLogger } from "sudheendra-scripts/utils";

dotenv.config({ path: [".env.local", ".env"] });

const FACILITY_ID = process.env.FACILITY_ID!;

const logger = getLogger();

async function main() {
  const existingChargeItemDefinitions =
    await getExistingChargeItemDefinitions();
  logger(
    `Found ${existingChargeItemDefinitions.length} existing charge item definitions`,
  );

  const chargeItemDefinitionsToImport =
    await getChargeItemDefinitionsToImport();
  logger(
    `Found ${chargeItemDefinitionsToImport.length} charge item definitions to import`,
  );
}

main();
