import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ResourceCategoryRead,
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";
import {
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { createHash } from "crypto";
import dotenv from "dotenv";
import { getExistingChargeItemDefinitionSlugs } from "sudheendra-scripts/inventory-from-db/utils";
import {
  createSlug,
  fetchCsvFromGoogleSheet,
  request,
  transformCsvToObjects,
} from "sudheendra-scripts/utils";

dotenv.config({ path: [".env.local", ".env"] });

const getConfig = () => {
  const facilityId = process.env.FACILITY_ID!;
  if (facilityId.length === 0) {
    throw new Error("FACILITY_ID is not set");
  }

  const googleSheetId = process.env.CHARGE_ITEM_DEFINITION_GOOGLE_SHEET_ID!;
  if (!googleSheetId) {
    throw new Error("CHARGE_ITEM_DEFINITION_GOOGLE_SHEET_ID is not set");
  }

  const sheetName = process.env.CHARGE_ITEM_DEFINITION_SHEET_NAME!;
  if (!sheetName) {
    throw new Error("CHARGE_ITEM_DEFINITION_SHEET_NAME is not set");
  }

  const sheetTitle = process.env.CHARGE_ITEM_DEFINITION_SHEET_TITLE!;
  if (!sheetTitle) {
    throw new Error("CHARGE_ITEM_DEFINITION_SHEET_TITLE is not set");
  }

  return { facilityId, googleSheetId, sheetName, sheetTitle };
};

const headerMap = {
  title: 0,
  price: 1,
};

function createChargeItemDefinitionSlug(name: string) {
  // this will hash the name and return a slug unlike `createSlug`
  return `${createSlug(name).slice(0, 20)}-${createHash("sha256").update(name).digest("hex").slice(0, 5)}`;
}

const createResourceCategory = async (
  facilityId: string,
  title: string,
): Promise<ResourceCategoryRead> => {
  try {
    const response = await request(
      `/api/v1/facility/${facilityId}/resource_category/`,
      "POST",
      {
        title,
        slug_value: createSlug(title),
        resource_type: ResourceCategoryResourceType.charge_item_definition,
        resource_sub_type: ResourceCategorySubType.other,
      },
    );
    return response as ResourceCategoryRead;
  } catch (error) {
    console.error(`Failed to create resource category "${title}":`, error);
    throw error;
  }
};

const creatChargeItemDefinition = async (
  facilityId: string,
  resourceCategorySlug: string,
  datapoints: Record<keyof typeof headerMap, string>[],
) => {
  const existingSlugs = await getExistingChargeItemDefinitionSlugs();

  console.log(`Found ${existingSlugs.length} existing charge item definitions`);

  for (const datapoint of datapoints) {
    const { title, price } = datapoint;
    const slug = createChargeItemDefinitionSlug(title);

    if (existingSlugs.includes(slug)) {
      console.log(`Skipping "${title}" - already exists with slug: ${slug}`);
      continue;
    }

    const chargeItemDefinition: ChargeItemDefinitionCreate = {
      title,
      slug_value: slug,
      status: ChargeItemDefinitionStatus.active,
      category: resourceCategorySlug,
      price_components: [
        {
          monetary_component_type: MonetaryComponentType.base,
          amount: price,
        },
      ],
    };

    const response = await request(
      `/api/v1/facility/${facilityId}/charge_item_definition/`,
      "POST",
      chargeItemDefinition,
    );

    console.log(`Created charge item definition: ${title}`);
  }
};

async function main() {
  const { facilityId, googleSheetId, sheetName, sheetTitle } = getConfig();
  const csvData = await fetchCsvFromGoogleSheet(googleSheetId, sheetName);
  const datapoints = transformCsvToObjects(csvData, headerMap);
  await createResourceCategory(facilityId, sheetTitle);
  const resourceCategorySlug = `f-${facilityId}-${createSlug(sheetTitle)}`;

  await creatChargeItemDefinition(facilityId, resourceCategorySlug, datapoints);
}

main();
