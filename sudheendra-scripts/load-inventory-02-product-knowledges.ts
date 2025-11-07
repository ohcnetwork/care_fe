import {
  ProductKnowledgeBase,
  ProductKnowledgeCreate,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";
import dotenv from "dotenv";
import {
  batchRequest,
  colorize,
  createSlug,
  fetchCsvFromGoogleSheet,
  getLogger,
  request,
  transformCsvToObjects,
} from "sudheendra-scripts/utils";

dotenv.config({ path: [".env.local", ".env"] });

const logger = getLogger();

const requiredHeaderKeys = [
  "item",
  "hsnCode",
  "batchNumber",
  "expiryDate",
  "quantity",
  "purchasePrice",
  "sellingPrice",
  "taxRate",
] as const;

const FACILITY_ID = process.env.FACILITY_ID!;
const GOOGLE_SHEET_ID = process.env.INVENTORY_GOOGLE_SHEET_ID!;
const LOCATION_SHEET_NAME_MAP = (() => {
  const input = process.env.INVENTORY_LOCATION_SHEET_NAME_MAP!;
  return input.split(",").map((item) => {
    const [locationId, sheetName] = item.split(":");
    return {
      locationId,
      sheetName,
    };
  });
})();

const HEADERS_MAP = (() => {
  const input = process.env.INVENTORY_HEADERS_MAP!;
  const map = Object.fromEntries(
    input.split(",").map((item) => {
      const [key, value] = item.split(":");
      return [key, value];
    }),
  );
  for (const key of requiredHeaderKeys) {
    if (!map[key]) {
      throw new Error(`Header ${key} is required`);
    }
  }
  return map as Record<(typeof requiredHeaderKeys)[number], string>;
})();

const BASE_UNIT = {
  tablets: {
    code: "{tbl}",
    display: "tablets",
    system: "http://unitsofmeasure.org",
  },
  count: {
    code: "{count}",
    display: "count",
    system: "http://unitsofmeasure.org",
  },
};

async function buildProductKnowledges(
  datapoints: Record<(typeof requiredHeaderKeys)[number], string>[],
) {
  const productKnowledges = Object.entries(
    Object.fromEntries(
      datapoints.map((datapoint) => {
        return [
          createSlug(datapoint.item),
          {
            name: datapoint.item,
            hsnCode: datapoint.hsnCode,
            baseUnit: BASE_UNIT.count,
          },
        ];
      }),
    ),
  ).map(
    ([item, { name, hsnCode, baseUnit }]) =>
      ({
        name,
        slug_value: item,
        alternate_identifier: hsnCode,
        facility: FACILITY_ID!,
        product_type: ProductKnowledgeType.medication,
        status: ProductKnowledgeStatus.active,
        names: [],
        storage_guidelines: [],
        base_unit: baseUnit,
        category: `f-${FACILITY_ID}-pk-medicines`,
      }) satisfies ProductKnowledgeCreate,
  );

  logger(`Creating ${productKnowledges.length} product knowledges`);

  return batchRequest(
    productKnowledges,
    async (datapoints, { offset, batchSize }) => {
      const loggerPrefix = `[${offset}:${offset + batchSize - 1}]`.padStart(16);
      logger(
        colorize(
          `${loggerPrefix} | Creating batch of product knowledges`,
          offset,
        ),
      );

      try {
        const exists = await request<ProductKnowledgeBase>(
          `/api/v1/product_knowledge/f-${FACILITY_ID}-${datapoints[0].slug_value}/`,
          "GET",
        );
        logger(
          colorize(
            `${loggerPrefix} | Product knowledge already exists`,
            offset,
          ),
        );
        return [exists];
      } catch (error) {
        const results = await request<ProductKnowledgeBase>(
          "/api/v1/product_knowledge/",
          "POST",
          datapoints[0],
        );

        logger(
          colorize(
            `${loggerPrefix} | Done creating batch of product knowledges`,
            offset,
          ),
        );

        return [results];
      }
    },
    1,
  );
}

async function main() {
  for (const { locationId, sheetName } of LOCATION_SHEET_NAME_MAP) {
    logger(
      `📦 Loading product knowledges of location ${locationId} from sheet ${sheetName}`,
    );
    const csvData = await fetchCsvFromGoogleSheet(GOOGLE_SHEET_ID, sheetName);
    let datapoints = transformCsvToObjects(csvData, HEADERS_MAP);

    // cleanup: exclude rows without items without required fields
    datapoints = datapoints.filter((row) =>
      [
        row.item,
        row.batchNumber,
        row.purchasePrice,
        row.sellingPrice,
        row.quantity,
        row.taxRate,
      ].every((v) => v !== ""),
    );
    logger(`Found ${datapoints.length} product knowledges to be created`);

    const productKnowledges = await buildProductKnowledges(datapoints);
    logger(`Created ${productKnowledges.length} product knowledges`);
  }
}

main();
