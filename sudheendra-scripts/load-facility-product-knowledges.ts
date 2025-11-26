import {
  ResourceCategoryRead,
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";
import { DOSAGE_UNITS_CODES } from "@/types/emr/medicationRequest/medicationRequest";
import {
  ProductKnowledgeBase,
  ProductKnowledgeCreate,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  createSlug,
  fetchCsvFromGoogleSheet,
  getLogger,
  request,
  transformCsvToObjects,
} from "sudheendra-scripts/utils";

const logger = getLogger();

const getConfig = () => {
  const facilityIds = process.env.FACILITY_IDS?.split(",") || [];
  if (facilityIds.length === 0) {
    throw new Error("FACILITY_IDS is not set");
  }

  const googleSheetId = process.env.PRODUCT_KNOWLEDGE_GOOGLE_SHEET_ID!;
  if (!googleSheetId) {
    throw new Error("PRODUCT_KNOWLEDGE_GOOGLE_SHEET_ID is not set");
  }

  const sheetName = process.env.PRODUCT_KNOWLEDGE_SHEET_NAME!;
  if (!sheetName) {
    throw new Error("PRODUCT_KNOWLEDGE_SHEET_NAME is not set");
  }

  return { facilityIds, googleSheetId, sheetName };
};

const headerMap = {
  resourceCategory: 0,

  //product knowledge
  slug: 1,
  name: 2,
  productType: 3,
  baseUnitDisplay: 5,
  // status: 4,
  alternateIdentifier: 6,
  alternateNameType: 8,
  // alternateNameValue: 9,
};

async function main() {
  const { facilityIds, googleSheetId, sheetName } = getConfig();
  const csvData = await fetchCsvFromGoogleSheet(googleSheetId, sheetName);
  const datapoints = transformCsvToObjects(csvData, headerMap);

  const resourceCategories = [
    ...new Set(datapoints.map((dp) => dp.resourceCategory)),
  ];

  for (const facilityId of facilityIds) {
    logger(`Processing facility ${facilityId}`);

    const categoryMap = await ensureResourceCategories(
      facilityId,
      resourceCategories,
    );

    await ensureProductKnowledges(
      facilityId,
      datapoints,
      categoryMap as ResourceCategoryRead[],
    );
  }
}

main();

async function ensureResourceCategories(
  facilityId: string,
  resourceCategories: string[],
) {
  const existingCategories = (await request(
    `/api/v1/facility/${facilityId}/resource_category/?limit=100`,
    "GET",
  )) as PaginatedResponse<ResourceCategoryRead>;

  const existingSlugs = new Set(
    existingCategories.results.map((cat) => cat.slug_config.slug_value),
  );
  const newDatapoints = resourceCategories.filter(
    (cat) => !existingSlugs.has(`pk-${createSlug(cat)}`),
  );

  logger(
    `${newDatapoints.length} new categories to create (${resourceCategories.length - newDatapoints.length} already exist)`,
  );

  if (newDatapoints.length === 0) {
    logger("No new categories to create");
    return existingCategories.results;
  }

  // Only upsert new categories
  await request(
    `/api/v1/facility/${facilityId}/resource_category/upsert/`,
    "POST",
    {
      datapoints: newDatapoints.map((data) => ({
        title: data,
        slug_value: `pk-${createSlug(data)}`,
        resource_type: ResourceCategoryResourceType.product_knowledge,
        resource_sub_type: ResourceCategorySubType.other,
      })),
    },
  );

  // Fetch all categories again to get the complete list
  const allCategories = (await request(
    `/api/v1/facility/${facilityId}/resource_category/?limit=100`,
    "GET",
  )) as PaginatedResponse<ResourceCategoryRead>;

  return allCategories.results;
}

async function ensureProductKnowledges(
  facilityId: string,
  datapoints: Record<keyof typeof headerMap, string>[],
  categoryMap: ResourceCategoryRead[],
) {
  logger(
    `Processing ${datapoints.length} product knowledges for facility ${facilityId}`,
  );

  const results = [];

  let hasNextPage = true;
  let page = 0;

  while (hasNextPage) {
    const existingProductKnowledges = (await request(
      `/api/v1/product_knowledge/?facility=${facilityId}&limit=100&offset=${page * 100}`,
      "GET",
    )) as PaginatedResponse<ProductKnowledgeBase>;

    results.push(...existingProductKnowledges.results);

    if (existingProductKnowledges.results.length < 100) {
      hasNextPage = false;
    }

    page++;
  }

  const existingPKSlugs = new Set(
    results.map((pk) => pk.slug_config.slug_value),
  );

  let created = 0;
  let skipped = 0;

  for (const datapoint of datapoints) {
    const productSlug = createSlug(datapoint.name);

    // Skip if product knowledge already exists
    if (existingPKSlugs.has(productSlug)) {
      logger(`Skipping existing product knowledge: ${productSlug}`);
      skipped++;
      continue;
    }

    // Get the category for this product
    const category = categoryMap.find(
      (cat) =>
        cat.slug_config.slug_value ===
        `pk-${createSlug(datapoint.resourceCategory)}`,
    );
    if (!category) {
      logger(
        `Category not found for ${datapoint.resourceCategory}, skipping product ${datapoint.name}`,
      );
      continue;
    }

    const baseUnitMap = DOSAGE_UNITS_CODES.find(
      (unit) =>
        unit.display.toLowerCase() === datapoint.baseUnitDisplay.toLowerCase(),
    );
    if (!baseUnitMap) {
      throw new Error(`Base unit not found for ${datapoint.baseUnitDisplay}`);
    }

    // Create the product knowledge
    const productKnowledge: ProductKnowledgeCreate = {
      slug_value: createSlug(datapoint.name),
      name: datapoint.name,
      facility: facilityId,
      product_type: ProductKnowledgeType.consumable,
      status: ProductKnowledgeStatus.active,
      base_unit: baseUnitMap,
      category: `f-${facilityId}-pk-${createSlug(datapoint.resourceCategory)}`,
      names: [],
      storage_guidelines: [],
    };

    // Add alternate identifier if provided
    if (datapoint.alternateIdentifier) {
      productKnowledge.alternate_identifier = datapoint.alternateIdentifier;
    }

    // Add alternate name if provided
    // if (datapoint.alternateNameType && datapoint.alternateNameValue) {
    //   productKnowledge.names = [
    //     {
    //       name_type: datapoint.alternateNameType as any,
    //       name: datapoint.alternateNameValue,
    //     },
    //   ];
    // }

    try {
      await request(
        "/api/v1/product_knowledge/",
        "POST",
        productKnowledge as unknown as Record<string, unknown>,
      );
      logger(`Created product knowledge: ${productSlug}`);
      created++;
    } catch (error) {
      logger(`Error creating product knowledge ${productSlug}: ${error}`);
    }
  }

  logger(
    `Product knowledge summary for facility ${facilityId}: ${created} created, ${skipped} skipped`,
  );
}
