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
  ResourceCategoryCreate,
  ResourceCategoryRead,
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import {
  ProductCreate,
  ProductRead,
  ProductStatusOptions,
} from "@/types/inventory/product/product";
import {
  ProductKnowledgeBase,
  ProductKnowledgeCreate,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryBase,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
  SupplyDeliveryUpsert,
} from "@/types/inventory/supplyDelivery/supplyDelivery";

dotenv.config({ path: [".env.local", ".env"] });

const logger = getLogger();

const GOOGLE_SHEET_ID = "1CB3rqqc2MBaR8e0_oFjEh7KRTOWMamAExNHJ5qGZJpE";
const SHEET_NAME = "Sheet1";
const FACILITY_ID = process.env.FACILITY_ID;
const LOCATION_ID = process.env.LOCATION_ID;

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

  const results = await request(
    `/api/v1/facility/${FACILITY_ID}/resource_category/upsert/`,
    "POST",
    { datapoints },
  );

  return results as ResourceCategoryRead[];
}

async function buildProductKnowledges(datapoints: Datapoints) {
  const productKnowledges = Object.entries(
    Object.fromEntries(
      datapoints.map((datapoint) => {
        return [
          createSlug(datapoint.item),
          {
            name: datapoint.item,
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
    ([item, { name, hsnCode, baseUnit }]) =>
      ({
        name,
        slug_value: createSlug(item),
        alternate_identifier: hsnCode,
        facility: FACILITY_ID!,
        product_type: ProductKnowledgeType.medication,
        status: ProductKnowledgeStatus.active,
        names: [],
        storage_guidelines: [],
        base_unit: baseUnit,
        category: "pk-medicines",
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

      const results = await request(
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

      return [results] as ProductKnowledgeBase[];
    },
    1,
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
    return TAX_COMPONENTS[datapoint.taxRate as keyof typeof TAX_COMPONENTS].map(
      (component) => ({
        ...component,
        conditions: [],
      }),
    );
  }
  logger(
    `Unknown tax rate: ${datapoint.taxRate} for (slug_value: ${createSlug(`${datapoint.item}-${datapoint.batchNumber}`)})`,
  );
  return [];
}

async function buildChargeItemDefinitions(datapoints: Datapoints) {
  const chargeItemDefinitions = Object.values(
    Object.fromEntries(
      datapoints.map((datapoint) => {
        const slug_value = createSlug(
          `${datapoint.item}-${datapoint.batchNumber}`,
        );
        return [
          slug_value,
          {
            title: datapoint.item,
            slug_value: slug_value,
            status: ChargeItemDefinitionStatus.active,
            price_components: [
              {
                monetary_component_type: MonetaryComponentType.base,
                amount: datapoint.sellingPrice,
                conditions: [],
              },
              ...getTaxComponents(datapoint),
            ],
            category: "cid-medications",
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

async function buildProducts(datapoints: Datapoints) {
  logger(`Creating ${datapoints.length} products`);

  return batchRequest(
    datapoints.map((datapoint) => {
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
        product_knowledge: createSlug(datapoint.item),
        charge_item_definition: createSlug(
          `${datapoint.item}-${datapoint.batchNumber}`,
        ),
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
      return results as ProductRead[];
    },
  );
}

async function buildInventoryItems(
  datapoints: Datapoints,
  products: ProductRead[],
) {
  logger(`Creating ${products.length} inventory items`);

  return batchRequest(
    datapoints.map((datapoint) => ({
      ...datapoint,
      product: products.find(
        (product) =>
          product.charge_item_definition.slug_config.slug_value ===
          createSlug(`${datapoint.item}-${datapoint.batchNumber}`),
      ),
    })),
    async (products, { offset, batchSize }) => {
      const loggerPrefix = `[${offset}:${offset + batchSize - 1}]`.padStart(16);
      logger(
        colorize(`${loggerPrefix} | Creating batch of inventory items`, offset),
      );

      const results = await request(`/api/v1/supply_delivery/upsert/`, "POST", {
        datapoints: products.map((datapoint) => {
          if (!datapoint.product) {
            console.log({ datapoint, products });
          }
          return {
            supplied_item_quantity: +datapoint.quantity,
            supplied_item: datapoint.product!.id,
            destination: LOCATION_ID,
            status: SupplyDeliveryStatus.completed,
            supplied_item_type: SupplyDeliveryType.product,
          } as SupplyDeliveryUpsert;
        }),
      });

      logger(
        colorize(
          `${loggerPrefix} | Done creating batch of inventory items`,
          offset,
        ),
      );
      return results as SupplyDeliveryBase[];
    },
    undefined,
    1,
  );
}

async function main() {
  const csvContent = await fetchCsvFromGoogleSheet(GOOGLE_SHEET_ID, SHEET_NAME);
  let datapoints = transformCsvToObjects(csvContent, HEADERS_MAP);

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

  logger(`Found ${datapoints.length} products to be created`);

  const resourceCategories = await ensureResourceCategories();
  logger(`Created ${resourceCategories.length} resource categories`);

  const productKnowledges = await buildProductKnowledges(datapoints);
  logger(`Created ${productKnowledges.length} product knowledges`);

  const chargeItemDefinitions = await buildChargeItemDefinitions(datapoints);
  logger(`Created ${chargeItemDefinitions.length} charge item definitions`);

  const products = await buildProducts(datapoints);
  logger(`Created ${products.length} products`);

  await buildInventoryItems(datapoints, products);
}

main();
