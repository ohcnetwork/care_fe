import { DOSAGE_UNITS_CODES } from "@/types/emr/medicationRequest/medicationRequest";
import {
  ProductKnowledgeBase,
  ProductKnowledgeCreate,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
  ProductNameTypes,
} from "@/types/inventory/productKnowledge/productKnowledge";
import { PaginatedResponse } from "@/Utils/request/types";
import { createHash } from "crypto";
import {
  createSlug,
  fetchCsvFromGoogleSheet,
  getLogger,
  request,
  transformCsvToObjects,
} from "sudheendra-scripts/utils";

const logger = getLogger();

const getConfig = () => {
  const googleSheetId = process.env.PRODUCT_KNOWLEDGE_GOOGLE_SHEET_ID!;
  if (!googleSheetId) {
    throw new Error("PRODUCT_KNOWLEDGE_GOOGLE_SHEET_ID is not set");
  }

  const sheetName = process.env.PRODUCT_KNOWLEDGE_SHEET_NAME!;
  if (!sheetName) {
    throw new Error("PRODUCT_KNOWLEDGE_SHEET_NAME is not set");
  }

  return { googleSheetId, sheetName };
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
  alternateNameValue: 9,
};

const requiredHeaderKeys = [
  "resourceCategory",
  "name",
  "productType",
  "baseUnitDisplay",
] satisfies (keyof typeof headerMap)[];

function createProductKnowledgeSlug(name: string) {
  // this will hash the name and return a slug unlike `createSlug`
  return `${createSlug(name).slice(0, 20)}-${createHash("sha256").update(name).digest("hex").slice(0, 5)}`;
}

async function main() {
  const { googleSheetId, sheetName } = getConfig();
  const csvData = await fetchCsvFromGoogleSheet(googleSheetId, sheetName);
  const datapoints = transformCsvToObjects(csvData, headerMap).map(
    getValidatedDatapoint,
  );

  await upsertProductKnowledges(datapoints);
}

main();

function getValidatedDatapoint(
  datapoint: Record<keyof typeof headerMap, string>,
) {
  if (requiredHeaderKeys.some((key) => !datapoint[key].trim())) {
    throw new Error(
      `Missing required header in datapoint ${JSON.stringify(datapoint)}`,
    );
  }

  const baseUnit = DOSAGE_UNITS_CODES.find(
    (unit) => unit.display === datapoint.baseUnitDisplay.toLowerCase(),
  );
  if (!baseUnit) {
    throw new Error(
      `Could not resolve base unit for '${datapoint.baseUnitDisplay}'`,
    );
  }

  const slug = datapoint.slug || createProductKnowledgeSlug(datapoint.name);

  const productType = [
    ProductKnowledgeType.consumable,
    ProductKnowledgeType.medication,
    ProductKnowledgeType.nutritional_product,
  ].find((type) => type === datapoint.productType.toLowerCase());

  if (!productType) {
    throw new Error(`Product type '${datapoint.productType}' is not valid`);
  }

  let alternateNameType: ProductNameTypes | undefined;

  if (datapoint.alternateNameType) {
    alternateNameType = [
      ProductNameTypes.trade_name,
      ProductNameTypes.alias,
      ProductNameTypes.original_name,
      ProductNameTypes.preferred,
    ].find(
      (type) =>
        type === datapoint.alternateNameType.toLowerCase().replaceAll(" ", "_"),
    );

    if (!alternateNameType) {
      throw new Error(
        `Alternate name type '${datapoint.alternateNameType}' is not valid`,
      );
    }
  }

  return {
    ...datapoint,
    baseUnit,
    slug,
    productType,
    alternateNameType,
  };
}

async function getExistingProductKnowledgeSlugs() {
  const results: ProductKnowledgeBase[] = [];

  let hasNextPage = true;
  let page = 0;

  while (hasNextPage) {
    const existingProductKnowledges: PaginatedResponse<ProductKnowledgeBase> =
      await request(
        `/api/v1/product_knowledge/?facility_is_null=true&limit=100&offset=${page * 100}`,
        "GET",
      );

    results.push(...existingProductKnowledges.results);

    if (existingProductKnowledges.results.length < 100) {
      hasNextPage = false;
    }

    page++;
  }

  return new Set(results.map((pk) => pk.slug_config.slug_value));
}

async function upsertProductKnowledges(
  datapoints: ReturnType<typeof getValidatedDatapoint>[],
) {
  const existingProductKnowledgeSlugs =
    await getExistingProductKnowledgeSlugs();

  const newDatapoints = datapoints.filter(
    (dp) => !existingProductKnowledgeSlugs.has(dp.slug),
  );

  if (newDatapoints.length === 0) {
    logger("No new product knowledges to create");
    return;
  }

  logger(
    `${newDatapoints.length} new product knowledges to create (${datapoints.length - newDatapoints.length} already exist)`,
  );

  for (const datapoint of newDatapoints) {
    const productKnowledge: ProductKnowledgeCreate = {
      slug_value: datapoint.slug,
      name: datapoint.name,
      product_type: datapoint.productType,
      status: ProductKnowledgeStatus.active,
      base_unit: datapoint.baseUnit,
      names: [],
      storage_guidelines: [],
    };

    // Add alternate identifier if provided
    if (datapoint.alternateIdentifier) {
      productKnowledge.alternate_identifier = datapoint.alternateIdentifier;
    }

    // Add alternate name if provided
    if (datapoint.alternateNameType && datapoint.alternateNameValue) {
      productKnowledge.names = [
        {
          name_type: datapoint.alternateNameType,
          name: datapoint.alternateNameValue,
        },
      ];
    }

    try {
      await request("/api/v1/product_knowledge/", "POST", productKnowledge);
      logger(`Created product knowledge: ${datapoint.slug}`);
    } catch (error) {
      logger(`Error creating product knowledge: ${JSON.stringify(datapoint)}`);
      throw error;
    }
  }
}
