import { ResourceCategoryRead } from "@/types/base/resourceCategory/resourceCategory";
import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { LocationRead } from "@/types/location/location";
import { PaginatedResponse } from "@/Utils/request/types";
import dotenv from "dotenv";
import { createSlug, request } from "sudheendra-scripts/utils";

import itemsJson from "./data/ITEM.json";
import locations from "./data/LOCATION_MASTER.json";
import pharmacyCategories from "./data/PHARM_CATEGORY.json";

dotenv.config({ path: [".env.local", ".env"] });

const FACILITY_ID = process.env.FACILITY_ID!;

type ItemRow = {
  ID: number;
  ITEM_SHORTCODE: string;
  ITEM_NAME: string;
  ITEM_CATEGORY_ID: number;
  PHARMACY_CATGRY_ID: number;
  FIRST_PURCHASE_DATE?: string;
  LAST_SELLING_PRICE?: number;
  LAST_PURCHASE_RATE?: number;
  HSN_CODE?: string;
};

const items = itemsJson as ItemRow[];

export const getCategoriesToImport = async () => {
  return pharmacyCategories.map((category) => ({
    slug_value: createSlug(category.CATEGORY),
    name: category.CATEGORY,
  }));
};

export const getLocationsToImport = async () => {
  return locations.map((location) => ({
    id: location.ID,
    name: location.DESCRIPTION,
  }));
};

// export const getChargeItemDefinitionsToImport = async () => {
//   return items.map((item) => ({
//     id: item.ID,
//     name: item.DESCRIPTION,
//   }));
// };

const getExistingPaginatedData = async <TInput, TOutput>(
  url: string,
  transform: (data: TInput) => TOutput,
) => {
  const data: TOutput[] = [];
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const response = await request<PaginatedResponse<TInput>>(
      `${url}?limit=${pageSize}&offset=${offset}`,
      "GET",
    );

    data.push(...response.results.map(transform));

    if (response.results.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return data;
};

export const getItemsToImport = <TExisting, TItem>(
  existingItems: TExisting[],
  importItems: TItem[],
  isSame: (existing: TExisting, item: TItem) => boolean,
) => {
  return importItems.filter((item) =>
    existingItems.every((existing) => !isSame(existing, item)),
  );
};

export const getExistingLocations = async () => {
  return getExistingPaginatedData<LocationRead, { id: string; name: string }>(
    `/api/v1/facility/${FACILITY_ID}/location/`,
    (location) => ({
      id: location.id,
      name: location.name,
    }),
  );
};

export const getExistingResourceCategories = async () => {
  return getExistingPaginatedData<ResourceCategoryRead, { slug: string }>(
    `/api/v1/facility/${FACILITY_ID}/resource_category/`,
    (resourceCategory) => ({
      slug: resourceCategory.slug_config.slug_value,
    }),
  );
};

export const getExistingChargeItemDefinitions = async () => {
  return getExistingPaginatedData<ChargeItemDefinitionBase, { slug: string }>(
    `/api/v1/facility/${FACILITY_ID}/charge_item_definition/`,
    (chargeItemDefinition) => ({
      slug: chargeItemDefinition.slug_config.slug_value,
    }),
  );
};
