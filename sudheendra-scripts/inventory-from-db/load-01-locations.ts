import { LocationRead, LocationWrite } from "@/types/location/location";
import dotenv from "dotenv";
import {
  getExistingLocations,
  getItemsToImport,
  getLocationsToImport,
} from "sudheendra-scripts/inventory-from-db/utils";
import {
  batchRequest,
  colorize,
  getLogger,
  request,
} from "sudheendra-scripts/utils";

dotenv.config({ path: [".env.local", ".env"] });

const FACILITY_ID = process.env.FACILITY_ID!;

const logger = getLogger();

async function main() {
  const existingLocations = await getExistingLocations();
  logger(`Found ${existingLocations.length} existing locations`);

  const locationsToImport = getLocationsToImport();
  logger(`Found ${locationsToImport.length} locations to import`);

  const locationsToCreate = getItemsToImport(
    existingLocations,
    locationsToImport,
    (existing, item) => existing.name === item.name,
  );
  logger(`Found ${locationsToCreate.length} locations to create`);

  await batchRequest(
    locationsToCreate,
    async (locations, { offset, batchSize }) => {
      const loggerPrefix = `[${offset}:${offset + batchSize - 1}]`.padStart(16);
      logger(
        colorize(
          `${loggerPrefix} | Creating batch of ${locations.length} locations`,
          offset,
        ),
      );

      return request<LocationRead[]>(
        `/api/v1/facility/${FACILITY_ID}/location/upsert/`,
        "POST",
        {
          datapoints: locations.map(
            (location) =>
              ({
                name: location.name,
                description: location.name,
                status: "active",
                operational_status: "O",
                form: "ro",
                organizations: [],
                mode: "kind",
              }) satisfies LocationWrite,
          ),
        },
      );
    },
  );
}

main();
