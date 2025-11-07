import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
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

async function main() {
  for (const { locationId, sheetName } of LOCATION_SHEET_NAME_MAP) {
    logger(
      `📦 Loading charge item definitions for products of location ${locationId} from sheet ${sheetName}`,
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
    logger(`Found ${datapoints.length} charge item definitions to be created`);

    const chargeItemDefinitions = await buildChargeItemDefinitions(datapoints);
    logger(`Created ${chargeItemDefinitions.length} charge item definitions`);
  }
}

main();
