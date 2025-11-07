import {
  ResourceCategoryCreate,
  ResourceCategoryRead,
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";
import { PaginatedResponse } from "@/Utils/request/types";
import dotenv from "dotenv";
import { getLogger, request } from "sudheendra-scripts/utils";

dotenv.config({ path: [".env.local", ".env"] });

const logger = getLogger();

const FACILITY_ID = process.env.FACILITY_ID!;

async function ensureResourceCategories() {
  const datapoints = [
    {
      title: "Medicines",
      slug_value: "pk-medicines",
      resource_type: ResourceCategoryResourceType.product_knowledge,
      resource_sub_type: ResourceCategorySubType.other,
    },
    {
      title: "Consumables",
      slug_value: "pk-consumables",
      resource_type: ResourceCategoryResourceType.product_knowledge,
      resource_sub_type: ResourceCategorySubType.other,
    },
    {
      title: "Medications",
      slug_value: "cid-medications",
      resource_type: ResourceCategoryResourceType.charge_item_definition,
      resource_sub_type: ResourceCategorySubType.other,
    },
    {
      title: "Consumables",
      slug_value: "cid-consumables",
      resource_type: ResourceCategoryResourceType.charge_item_definition,
      resource_sub_type: ResourceCategorySubType.other,
    },
  ] as ResourceCategoryCreate[];

  // Fetch existing resource categories
  logger("Fetching existing resource categories...");
  const existingCategories = (await request(
    `/api/v1/facility/${FACILITY_ID}/resource_category/?limit=100`,
    "GET",
  )) as PaginatedResponse<ResourceCategoryRead>;

  logger(
    `Found ${existingCategories.results.length} existing resource categories`,
  );

  // Filter out categories that already exist (compare by slug_value)
  const existingSlugs = new Set(
    existingCategories.results.map((cat) => cat.slug),
  );
  const newDatapoints = datapoints.filter(
    (dp) => !existingSlugs.has(`f-${FACILITY_ID}-${dp.slug_value}`),
  );

  logger(
    `${newDatapoints.length} new categories to create (${datapoints.length - newDatapoints.length} already exist)`,
  );

  if (newDatapoints.length === 0) {
    logger("No new categories to create");
    return existingCategories;
  }

  // Only upsert new categories
  const results = await request(
    `/api/v1/facility/${FACILITY_ID}/resource_category/upsert/`,
    "POST",
    { datapoints: newDatapoints },
  );

  return results as ResourceCategoryRead[];
}

async function main() {
  const results = await ensureResourceCategories();
}

main();
