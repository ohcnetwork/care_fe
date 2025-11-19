import { addDays, format, parse } from "date-fns";
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
  DeliveryOrderCreate,
  DeliveryOrderRetrieve,
  DeliveryOrderStatus,
  DeliveryOrderUpdate,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
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
  SupplyDeliveryCreate,
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";

dotenv.config({ path: [".env.local", ".env"] });

const logger = getLogger();

const GOOGLE_SHEET_ID = "17K-R8i8sVzjzQ4ralQU3S3hCB__143qo";
const SHEET_NAME = "Sheet1";
const FACILITY_ID = process.env.FACILITY_ID;
const LOCATION_ID = process.env.LOCATION_ID;
const SUPPLIER_ID = process.env.SUPPLIER_ID;

const GENERATE_KEY = "$generate";

const HEADERS_MAP = {
  item: "ITEM",
  hsnCode: "HSN CODE",
  batchNumber: GENERATE_KEY,
  expiryDate: GENERATE_KEY,
  quantity: "QUANTITY",
  purchasePrice: "RATE",
  sellingPrice: "MRP",
  taxRate: "GST%",
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
            category: `f-${FACILITY_ID}-cid-medications`,
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

      try {
        const exists = await request<ChargeItemDefinitionBase>(
          `/api/v1/facility/${FACILITY_ID}/charge_item_definition/f-${FACILITY_ID}-${datapoints[0].slug_value}/`,
          "GET",
        );
        logger(
          colorize(
            `${loggerPrefix} | Charge item definition already exists`,
            offset,
          ),
        );
        return [exists];
      } catch (error) {
        const results = await request<ChargeItemDefinitionBase>(
          `/api/v1/facility/${FACILITY_ID}/charge_item_definition/`,
          "POST",
          datapoints[0],
        );

        logger(
          colorize(
            `${loggerPrefix} | Done creating batch of charge item definitions`,
            offset,
          ),
        );

        return [results];
      }
    },
    1,
  );
}

async function buildProducts(datapoints: Datapoints) {
  logger(`Fetching existing products from API`);

  // Fetch all existing products using pagination
  const existingProducts: ProductRead[] = [];
  let hasNextPage = true;
  let page = 0;
  const pageSize = 100;

  while (hasNextPage) {
    logger(`Fetching page ${page + 1} of products`);
    const response = await request<{ count: number; results: ProductRead[] }>(
      `/api/v1/facility/${FACILITY_ID}/product/?limit=${pageSize}&offset=${page * pageSize}`,
      "GET",
    );

    existingProducts.push(...response.results);

    if (existingProducts.length >= response.count) {
      hasNextPage = false;
    }

    page++;
  }

  logger(`Found ${existingProducts.length} existing products`);

  // Create a map of existing products by unique combination of:
  const existingProductsMap = new Map(
    existingProducts.map((product) => {
      return [
        `${product.charge_item_definition?.slug_config.slug_value}`,
        product,
      ];
    }),
  );

  // Filter out datapoints that already have products
  const newDatapoints = datapoints.filter((datapoint) => {
    const key = createSlug(`${datapoint.item}-${datapoint.batchNumber}`);
    const exists = existingProductsMap.has(key);
    if (exists) {
      logger(
        `Product already exists for: ${datapoint.item} (batch: ${datapoint.batchNumber})`,
      );
    }
    return !exists;
  });

  logger(
    `Creating ${newDatapoints.length} new products (${datapoints.length - newDatapoints.length} already exist)`,
  );

  if (newDatapoints.length === 0) {
    logger(`No new products to create, returning existing products`);
    return existingProducts.filter((product) =>
      datapoints.some((datapoint) => {
        const pkSlug = `f-${FACILITY_ID}-${createSlug(datapoint.item)}`;
        const cidSlug = `f-${FACILITY_ID}-${createSlug(`${datapoint.item}-${datapoint.batchNumber}`)}`;
        const lotNumber = datapoint.batchNumber || "";
        return (
          product.product_knowledge?.slug_config.slug_value === pkSlug &&
          product.charge_item_definition?.slug_config.slug_value === cidSlug &&
          (product.batch?.lot_number || "") === lotNumber
        );
      }),
    );
  }

  console.log(`Need to create ${newDatapoints.length} products`);

  const newProducts = await batchRequest(
    newDatapoints.map((datapoint) => {
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
        product_knowledge: `f-${FACILITY_ID}-${createSlug(datapoint.item)}`,
        charge_item_definition: `f-${FACILITY_ID}-${createSlug(
          `${datapoint.item}-${datapoint.batchNumber}`,
        )}`,
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
    5,
  );

  // Return all products (existing + new)
  return [
    ...existingProducts.filter((product) =>
      datapoints.some((datapoint) => {
        const pkSlug = `f-${FACILITY_ID}-${createSlug(datapoint.item)}`;
        const cidSlug = `f-${FACILITY_ID}-${createSlug(`${datapoint.item}-${datapoint.batchNumber}`)}`;
        const lotNumber = datapoint.batchNumber || "";
        return (
          product.product_knowledge?.slug_config.slug_value === pkSlug &&
          product.charge_item_definition?.slug_config.slug_value === cidSlug &&
          (product.batch?.lot_number || "") === lotNumber
        );
      }),
    ),
    ...newProducts,
  ];
}

async function buildInventoryItems(datapoints: Datapoints) {
  logger(`Fetching all products to match with datapoints`);

  // Fetch all existing products using pagination
  const allProducts: ProductRead[] = [];
  let hasNextPage = true;
  let page = 0;
  const pageSize = 100;

  while (hasNextPage) {
    logger(`Fetching page ${page + 1} of products`);
    const response = await request<{ count: number; results: ProductRead[] }>(
      `/api/v1/facility/${FACILITY_ID}/product/?limit=${pageSize}&offset=${page * pageSize}`,
      "GET",
    );

    allProducts.push(...response.results);

    if (allProducts.length >= response.count) {
      hasNextPage = false;
    }

    page++;
  }

  logger(`Found ${allProducts.length} total products`);

  // Create a map of products by charge_item_definition slug for quick lookup
  const productsMap = new Map(
    allProducts.map((product) => [
      product.charge_item_definition?.slug_config.slug_value,
      product,
    ]),
  );

  // Match datapoints with products
  const datapointsWithProducts = datapoints
    .map((datapoint) => {
      const cidSlug = createSlug(`${datapoint.item}-${datapoint.batchNumber}`);
      const product = productsMap.get(cidSlug);

      if (!product) {
        logger(
          `⚠️  Product not found for: ${datapoint.item} (batch: ${datapoint.batchNumber}, slug: ${cidSlug})`,
        );
        return null;
      }

      return {
        ...datapoint,
        product,
      };
    })
    .filter(Boolean) as (Datapoints[number] & { product: ProductRead })[];

  logger(
    `Matched ${datapointsWithProducts.length} datapoints with products (${datapoints.length - datapointsWithProducts.length} not found)`,
  );

  if (datapointsWithProducts.length === 0) {
    logger(`No products matched, skipping inventory creation`);
    return;
  }

  // create delivery order
  logger(`Creating delivery order for location ${LOCATION_ID}`);
  const deliveryOrder = await request<DeliveryOrderRetrieve>(
    `/api/v1/facility/${FACILITY_ID}/order/delivery/`,
    "POST",
    {
      name: `Bulk Import Delivery Order`,
      supplier: SUPPLIER_ID!,
      destination: LOCATION_ID!,
      status: DeliveryOrderStatus.pending,
      note: "This delivery order was created by a bulk import script",
    } satisfies DeliveryOrderCreate,
  );

  // create supply deliveries
  logger(
    `Creating Supply Delivery with ${datapointsWithProducts.length} products`,
  );
  await batchRequest(
    datapointsWithProducts,

    async (datapointsWithProducts, { offset, batchSize }) => {
      const loggerPrefix = `[${offset}:${offset + batchSize - 1}]`.padStart(16);
      logger(
        colorize(`${loggerPrefix} | Creating batch of inventory items`, offset),
      );

      const results = await request(`/api/v1/supply_delivery/upsert/`, "POST", {
        datapoints: datapointsWithProducts.map((datapoint) => ({
          status: SupplyDeliveryStatus.completed,
          supplied_item_type: SupplyDeliveryType.product,
          supplied_item_quantity: +datapoint.quantity,
          supplied_item: datapoint.product.id,
          destination: LOCATION_ID,
          order: deliveryOrder.id,
        })) as SupplyDeliveryCreate[],
      });

      logger(
        colorize(
          `${loggerPrefix} | Done creating batch of inventory items`,
          offset,
        ),
      );
      return results as SupplyDeliveryRead[];
    },
  );

  // update delivery order as completed
  logger(`Updating delivery order as completed`);
  await request(
    `/api/v1/facility/${FACILITY_ID}/order/delivery/${deliveryOrder.id}/`,
    "PUT",
    {
      id: deliveryOrder.id,
      name: deliveryOrder.name,
      supplier: deliveryOrder.supplier?.id,
      destination: deliveryOrder.destination.id,
      status: DeliveryOrderStatus.completed,
      origin: deliveryOrder.origin?.id,
      note: deliveryOrder.note,
    } satisfies DeliveryOrderUpdate,
  );
}

async function main() {
  const csvContent = await fetchCsvFromGoogleSheet(GOOGLE_SHEET_ID, SHEET_NAME);
  let datapoints = transformCsvToObjects(csvContent, HEADERS_MAP, {
    batchNumber: () => {
      return `BATCH-${new Date().toISOString()}-${Math.floor(Math.random() * 1000000)}`;
    },
    expiryDate: () => {
      return format(addDays(new Date(), 365), "M/dd/yyyy");
    },
  });

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

  // const resourceCategories = await ensureResourceCategories();
  // logger(`Created ${resourceCategories.length} resource categories`);

  // const productKnowledges = await buildProductKnowledges(datapoints);
  // logger(`Created ${productKnowledges.length} product knowledges`);

  const chargeItemDefinitions = await buildChargeItemDefinitions(datapoints);
  logger(`Created ${chargeItemDefinitions.length} charge item definitions`);

  // const products = await buildProducts(datapoints);
  // logger(`Created ${products.length} products`);

  // await buildInventoryItems(datapoints);
}

main();
