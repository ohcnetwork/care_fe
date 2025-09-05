import { format, parse } from "date-fns";
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

import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import {
  ProductBase,
  ProductCreate,
  ProductStatusOptions,
} from "@/types/inventory/product/product";
import {
  ProductKnowledgeBase,
  ProductKnowledgeCreate,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";

dotenv.config({ path: [".env.local", ".env"] });

const logger = getLogger();

const GOOGLE_SHEET_ID = "1CB3rqqc2MBaR8e0_oFjEh7KRTOWMamAExNHJ5qGZJpE";
const SHEET_NAME = "Sheet1";
const FACILITY_ID = "fa778d26-b5d5-4ff0-9785-ff44486e6bd6";

const HEADERS_MAP = {
  item: "Item",
  hsnCode: "HSN Code",
  batchNumber: "Batch No..",
  expiryDate: "Exp Date",
  quantity: "Qty",
  purchasePrice: "P/Rate",
  sellingPrice: "S/Rate",
  taxRate: "RATE",
} as const;

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

type Datapoints = Record<keyof typeof HEADERS_MAP, string>[];

async function buildProductKnowledges(datapoints: Datapoints) {
  const productKnowledges = Object.entries(
    Object.fromEntries(
      datapoints.map((datapoint) => {
        return [
          datapoint.item,
          {
            hsnCode: datapoint.hsnCode,
            baseUnit:
              +datapoint.sellingPrice < +datapoint.purchasePrice
                ? BASE_UNIT.tablets
                : BASE_UNIT.count,
          },
        ];
      }),
    ),
  ).map(
    ([item, { hsnCode, baseUnit }]) =>
      ({
        name: item,
        slug: createSlug(item),
        alternate_identifier: hsnCode,
        facility: FACILITY_ID,
        product_type: ProductKnowledgeType.medication,
        status: ProductKnowledgeStatus.active,
        names: [],
        storage_guidelines: [],
        base_unit: baseUnit,
      }) as ProductKnowledgeCreate,
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

      const results = await request(
        "/api/v1/product_knowledge/upsert/",
        "POST",
        { datapoints },
      );

      logger(
        colorize(
          `${loggerPrefix} | Done creating batch of product knowledges`,
          offset,
        ),
      );

      return results as ProductKnowledgeBase[];
    },
  );
}

const taxComponent = (factor: number, code: "cgst" | "sgst") => {
  return {
    monetary_component_type: MonetaryComponentType.tax,
    code: {
      system: "http://ohc.network/codes/monetary/tax",
      code,
      display: code.toUpperCase(),
    },
    factor,
  };
};

const TAX_COMPONENTS = {
  "5": [taxComponent(2.5, "cgst"), taxComponent(2.5, "sgst")],
  "12": [taxComponent(6, "cgst"), taxComponent(6, "sgst")],
  "18": [taxComponent(9, "cgst"), taxComponent(9, "sgst")],
};

function getTaxComponents(datapoint: Datapoints[number]) {
  if (datapoint.taxRate in TAX_COMPONENTS) {
    return TAX_COMPONENTS[datapoint.taxRate as keyof typeof TAX_COMPONENTS];
  }
  logger(
    `Unknown tax rate: ${datapoint.taxRate} for (slug: ${createSlug(`${datapoint.item}-${datapoint.batchNumber}`)})`,
  );
  return [];
}

async function buildChargeItemDefinitions(datapoints: Datapoints) {
  const chargeItemDefinitions = Object.values(
    Object.fromEntries(
      datapoints.map((datapoint) => {
        const slug = createSlug(`${datapoint.item}-${datapoint.batchNumber}`);
        return [
          slug,
          {
            title: datapoint.item,
            slug,
            status: ChargeItemDefinitionStatus.active,
            price_components: [
              {
                monetary_component_type: MonetaryComponentType.base,
                amount: datapoint.sellingPrice,
              },
              ...getTaxComponents(datapoint),
            ],
          } satisfies ChargeItemDefinitionCreate,
        ];
      }),
    ),
  );

  logger(`Creating ${chargeItemDefinitions.length} charge item definitions`);

  return batchRequest(
    chargeItemDefinitions,
    async (datapoints, { offset, batchSize }) => {
      const loggerPrefix = `[${offset}:${offset + batchSize - 1}]`.padStart(16);
      logger(
        colorize(
          `${loggerPrefix} | Creating batch of charge item definitions`,
          offset,
        ),
      );

      const results = await request(
        `/api/v1/facility/${FACILITY_ID}/charge_item_definition/upsert/`,
        "POST",
        { datapoints },
      );

      logger(
        colorize(
          `${loggerPrefix} | Done creating batch of charge item definitions`,
          offset,
        ),
      );
      return results as ChargeItemDefinitionBase[];
    },
  );
}

async function buildProducts(
  datapoints: Datapoints,
  productKnowledges: ProductKnowledgeBase[],
  chargeItemDefinitions: ChargeItemDefinitionBase[],
) {
  logger(`Creating ${datapoints.length} products`);

  return batchRequest(
    datapoints.map((datapoint) => {
      const productKnowledge = productKnowledges.find(
        (productKnowledge) => productKnowledge.name === datapoint.item,
      );
      if (!productKnowledge) {
        throw new Error(`Product knowledge not found for ${datapoint.item}`);
      }

      const cidSlug = createSlug(`${datapoint.item}-${datapoint.batchNumber}`);
      const chargeItemDefinition = chargeItemDefinitions.find(
        (chargeItemDefinition) => chargeItemDefinition.slug === cidSlug,
      );
      if (!chargeItemDefinition) {
        throw new Error(
          `Charge item definition not found for ${datapoint.item}`,
        );
      }

      return {
        status: ProductStatusOptions.active,
        batch: datapoint.batchNumber
          ? { lot_number: datapoint.batchNumber }
          : undefined,
        expiration_date: datapoint.expiryDate
          ? format(
              parse(datapoint.expiryDate, "M/dd/yyyy", new Date()),
              "yyyy-MM-dd",
            )
          : undefined,
        product_knowledge: productKnowledge.id,
        charge_item_definition: chargeItemDefinition.id,
      } satisfies ProductCreate;
    }),

    async (datapoints, { offset, batchSize }) => {
      const loggerPrefix = `[${offset}:${offset + batchSize - 1}]`.padStart(16);
      logger(colorize(`${loggerPrefix} | Creating batch of products`, offset));

      const results = await request(
        `/api/v1/facility/${FACILITY_ID}/product/upsert/`,
        "POST",
        { datapoints },
      );

      logger(
        colorize(`${loggerPrefix} | Done creating batch of products`, offset),
      );
      return results as ProductBase[];
    },
  );
}

async function main() {
  const csvContent = await fetchCsvFromGoogleSheet(GOOGLE_SHEET_ID, SHEET_NAME);
  let datapoints = transformCsvToObjects(csvContent, HEADERS_MAP);

  // cleanup: exclude rows without item names
  datapoints = datapoints.filter((row) => row.item !== "");

  logger(`Found ${datapoints.length} products to be created`);

  const productKnowledges = await buildProductKnowledges(datapoints);
  logger(`Created ${productKnowledges.length} product knowledges`);

  const chargeItemDefinitions = await buildChargeItemDefinitions(datapoints);
  logger(`Created ${chargeItemDefinitions.length} charge item definitions`);

  const products = await buildProducts(
    datapoints,
    productKnowledges,
    chargeItemDefinitions,
  );
  logger(`Created ${products.length} products`);
}

main();
