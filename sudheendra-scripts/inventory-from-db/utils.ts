import {
  ResourceCategoryRead,
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";
import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { LocationRead } from "@/types/location/location";
import { PaginatedResponse } from "@/Utils/request/types";
import dotenv from "dotenv";
import { createSlug, normalizeTitle, request } from "sudheendra-scripts/utils";

import {
  ProductKnowledgeBase,
  ProductKnowledgeCreate,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";
import itemsJson from "./data/ITEM.json";
import locations from "./data/LOCATION_MASTER.json";
import pharmacyCategories from "./data/PHARM_CATEGORY.json";

dotenv.config({ path: [".env.local", ".env"] });

const FACILITY_ID = process.env.FACILITY_ID!;

type ItemRow = {
  ID: number;
  ITEM_SHORTCODE: string;
  ITEM_NAME: string;
  ITEM_CATEGORY_ID?: number;
  PHARMACY_CATGRY_ID?: number;
  FIRST_PURCHASE_DATE?: string;
  LAST_SELLING_PRICE?: number;
  LAST_PURCHASE_RATE?: number;
  HSN_CODE?: string;
};

const items = itemsJson as ItemRow[];

export const getCategoriesToImport = () => {
  return pharmacyCategories.flatMap((category) => {
    const name = normalizeTitle(category.CATEGORY);
    return [
      {
        title: name,
        slug_value: `pk-${createSlug(name)}`,
        resource_type: ResourceCategoryResourceType.product_knowledge,
        resource_sub_type: ResourceCategorySubType.other,
        ssmm_id: category.ID,
      },
      {
        title: name,
        slug_value: `cid-${createSlug(name)}`,
        resource_type: ResourceCategoryResourceType.charge_item_definition,
        resource_sub_type: ResourceCategorySubType.other,
        ssmm_id: category.ID,
      },
    ];
  });
};

export const getLocationsToImport = () => {
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

export const getProductKnowledgeToImport = (
  defaults: Partial<ProductKnowledgeCreate> = {},
) => {
  const categories = new Map(
    getCategoriesToImport()
      .filter((c) => c.slug_value.startsWith("pk-"))
      .map((c) => [c.ssmm_id, c]),
  );

  const productKnowledges = new Map(
    items
      .filter(
        (item): item is ItemRow & { PHARMACY_CATGRY_ID: number } =>
          item.PHARMACY_CATGRY_ID !== undefined &&
          categories.has(item.PHARMACY_CATGRY_ID),
      )
      .map((item) => [
        createSlug(item.ITEM_NAME),
        {
          alternate_identifier: item.HSN_CODE,
          product_type: ProductKnowledgeType.medication,
          status: ProductKnowledgeStatus.active,
          name: item.ITEM_NAME,
          names: [],
          storage_guidelines: [],
          base_unit: {
            code: "d",
            display: "Day",
            system: "http://unitsofmeasure.org",
          },
          slug_value: createSlug(item.ITEM_NAME),
          category: categories.get(item.PHARMACY_CATGRY_ID)!.slug_value,
          ...defaults,
          ssmm_id: item.ID,
        },
      ]),
  );
  return Array.from(productKnowledges.values());
};

export const getChargeItemDefinitionsToImport = () => {
  return items.map((item) => ({
    id: item.ID,
    name: item.ITEM_NAME,
  }));
};

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

export const getExistingProductKnowledge = async () => {
  return getExistingPaginatedData<ProductKnowledgeBase, { slug: string }>(
    `/api/v1/product_knowledge/`,
    (productKnowledge) => ({
      slug: productKnowledge.slug_config.slug_value,
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
