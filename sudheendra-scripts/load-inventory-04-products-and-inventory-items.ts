import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
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
  SupplyDeliveryCreate,
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
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
  "0": [],
  "5": [taxComponent(2.5, "cgst"), taxComponent(2.5, "sgst")],
  "12": [taxComponent(6, "cgst"), taxComponent(6, "sgst")],
  "18": [taxComponent(9, "cgst"), taxComponent(9, "sgst")],
};

function getTaxComponents(
  datapoint: Record<(typeof requiredHeaderKeys)[number], string>,
) {
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

async function buildChargeItemDefinitions(
  datapoints: Record<(typeof requiredHeaderKeys)[number], string>[],
) {
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
  datapoints: Record<(typeof requiredHeaderKeys)[number], string>[],
) {
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
              parse(
                datapoint.expiryDate,
                process.env.INVENTORY_EXPIRATION_DATE_FORMAT ?? "yyyy-MM-dd",
                new Date(),
              ),
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
  );
}

async function buildInventoryItems(
  supplierId: string,
  locationId: string,
  products: ProductRead[],
  datapoints: Record<(typeof requiredHeaderKeys)[number], string>[],
) {
  // create delivery order
  logger(`Creating delivery order for location ${locationId}`);
  const deliveryOrder = await request<DeliveryOrderRetrieve>(
    `/api/v1/facility/${FACILITY_ID}/order/delivery/`,
    "POST",
    {
      name: `Bulk Import Delivery Order`,
      supplier: supplierId,
      destination: locationId,
      status: DeliveryOrderStatus.pending,
      note: "This delivery order was created by a bulk import script",
    } satisfies DeliveryOrderCreate,
  );

  // create supply deliveries
  logger(`Creating Supply Delivery with ${products.length} products`);
  await batchRequest(
    datapoints.map((datapoint) => ({
      ...datapoint,
      product: products.find(
        (product) =>
          product.charge_item_definition!.slug_config.slug_value ===
          createSlug(`${datapoint.item}-${datapoint.batchNumber}`),
      ),
    })),

    async (products, { offset, batchSize }) => {
      const loggerPrefix = `[${offset}:${offset + batchSize - 1}]`.padStart(16);
      logger(
        colorize(`${loggerPrefix} | Creating batch of inventory items`, offset),
      );

      const results = await request(`/api/v1/supply_delivery/upsert/`, "POST", {
        datapoints: products
          .map((datapoint) => {
            if (!datapoint.product) {
              logger(
                `Product not found for datapoint: ${JSON.stringify(datapoint)}`,
              );
              return null;
            }

            return {
              status: SupplyDeliveryStatus.completed,
              supplied_item_type: SupplyDeliveryType.product,
              supplied_item_quantity: +datapoint.quantity,
              supplied_item: datapoint.product?.id ?? "",
              destination: locationId,
              order: deliveryOrder.id,
            };
          })
          .filter(Boolean) as SupplyDeliveryCreate[],
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
  for (const { locationId, sheetName } of LOCATION_SHEET_NAME_MAP) {
    logger(
      `📦 Loading products of location ${locationId} from sheet ${sheetName}`,
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
    logger(`Found ${datapoints.length} products to be created`);

    const products = await buildProducts(datapoints);
    logger(`Created ${products.length} products`);

    await buildInventoryItems(
      process.env.INVENTORY_SUPPLIER_ID!,
      locationId,
      products,
      datapoints,
    );
    logger(`Created ${datapoints.length} inventory items`);
  }
}

main();
