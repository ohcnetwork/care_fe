import {
  ResourceCategoryRead,
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { LocationRead } from "@/types/location/location";
import { PaginatedResponse } from "@/Utils/request/types";
import dotenv from "dotenv";
import { createSlug, normalizeTitle, request } from "sudheendra-scripts/utils";

import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  DeliveryOrderCreate,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import { ProductStatusOptions } from "@/types/inventory/product/product";
import {
  ProductKnowledgeBase,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import itemsJson from "./data/ITEM.json";
import pharmacyCategories from "./data/PHARM_CATEGORY.json";
import supplyDeliveriesJson from "./data/stock.json";
dotenv.config({ path: [".env.local", ".env"] });

const FACILITY_ID = process.env.FACILITY_ID!;
const FALLBACK_LOCATION_ID = process.env.CARE_LOCATION_ID!;
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

type SupplyDeliveryRow = {
  ITEM_ID: number;
  QTY: number;
  LOCATION_ID: number;
  CARE_LOCATION_ID: string;
};

const items = itemsJson as ItemRow[];
const stock = supplyDeliveriesJson as SupplyDeliveryRow[];

export const getResourceCategoriesToImport = () => {
  return pharmacyCategories.flatMap((category) => {
    const name = normalizeTitle(category.CATEGORY);
    return [
      {
        title: name,
        slug_value: `pk-${createSlug(name)}`,
        resource_type: ResourceCategoryResourceType.product_knowledge,
        resource_sub_type: ResourceCategorySubType.other,
        meta: {
          ssmm_pharm_category_id: category.ID,
        },
        $facility: FACILITY_ID,
      },
      {
        title: name,
        slug_value: `cid-${createSlug(name)}`,
        resource_type: ResourceCategoryResourceType.charge_item_definition,
        resource_sub_type: ResourceCategorySubType.other,
        meta: {
          ssmm_pharm_category_id: category.ID,
        },
        $facility: FACILITY_ID,
      },
    ];
  });
};

export const getProductKnowledgeSlug = (item: ItemRow) => {
  return createSlug(item.ITEM_NAME);
};
export const getChargeItemDefinitionSlug = (item: ItemRow) => {
  return createSlug(`${item.ID}-${item.ITEM_NAME}`);
};

export const getProductKnowledgeToImport = () => {
  const categories = new Map(
    getResourceCategoriesToImport()
      .filter(
        (c) =>
          c.resource_type === ResourceCategoryResourceType.product_knowledge,
      )
      .map((c) => [c.meta.ssmm_pharm_category_id, c]),
  );

  const productKnowledges = new Map(
    items
      .filter(
        (item): item is ItemRow & { PHARMACY_CATGRY_ID: number } =>
          !!item.PHARMACY_CATGRY_ID && categories.has(item.PHARMACY_CATGRY_ID),
      )
      .map((item) => [
        getProductKnowledgeSlug(item),
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
          slug_value: getProductKnowledgeSlug(item),
          category: `f-${FACILITY_ID}-${categories.get(item.PHARMACY_CATGRY_ID)!.slug_value}`,
          facility: FACILITY_ID,
          meta: {
            ssmm_item_id: item.ID,
          },
        },
      ]),
  );
  return Array.from(productKnowledges.values());
};

export const getChargeItemDefinitionsToImport =
  (): ChargeItemDefinitionCreate[] => {
    const categories = new Map(
      getResourceCategoriesToImport()
        .filter(
          (c) =>
            c.resource_type === ResourceCategoryResourceType.product_knowledge,
        )
        .map((c) => [c.meta.ssmm_pharm_category_id, c]),
    );

    return items
      .filter(
        (item): item is ItemRow & { PHARMACY_CATGRY_ID: number } =>
          !!item.PHARMACY_CATGRY_ID && categories.has(item.PHARMACY_CATGRY_ID),
      )
      .map((item) => ({
        status: ChargeItemDefinitionStatus.active,
        title: item.ITEM_NAME,
        slug_value: getChargeItemDefinitionSlug(item),
        category: `f-${FACILITY_ID}-${categories.get(item.PHARMACY_CATGRY_ID)!.slug_value}`,
        price_components: [
          {
            monetary_component_type: MonetaryComponentType.base,
            amount: item.LAST_SELLING_PRICE?.toString() || "0",
          },
        ],
        meta: {
          ssmm_item_id: item.ID,
        },
        $facility: FACILITY_ID,
      }));
  };
export const getProductToImport = () => {
  return items
    .filter(
      (item): item is ItemRow & { PHARMACY_CATGRY_ID: number } =>
        !!item.PHARMACY_CATGRY_ID,
    )
    .map((item) => ({
      product_knowledge: `f-${FACILITY_ID}-${getProductKnowledgeSlug(item)}`,
      charge_item_definition: `f-${FACILITY_ID}-${getChargeItemDefinitionSlug(item)}`,
      extensions: {},
      status: ProductStatusOptions.active,
      $facility: FACILITY_ID,
    }));
};

export const getDeliveryOrdersToImport = () => {
  const deliveryOrders = new Map(
    stock.map((stock) => {
      const item = items.find((item) => item.ID === stock.ITEM_ID);
      if (!item) {
        throw new Error(`Item not found for stock: ${stock.ITEM_ID}`);
      }
      const destinationId = "1aa28206-5a5d-4411-9596-17c0745bb41b";
      return [
        destinationId,
        {
          name: `Bulk Import Delivery Order`,
          destination: destinationId,
          status: DeliveryOrderStatus.pending,
          note: "This delivery order was created by a bulk import script",
          extensions: {},
        } satisfies DeliveryOrderCreate,
      ];
    }),
  );
  return Array.from(deliveryOrders.values());
};

export const getSupplyDeliveriesToImport = () => {
  return stock.map((stock) => {
    const item = items.find((item) => item.ID === stock.ITEM_ID);
    if (!item) {
      throw new Error(`Item not found for stock: ${stock.ITEM_ID}`);
    }
    const destinationId = "1aa28206-5a5d-4411-9596-17c0745bb41b";
    return {
      status: SupplyDeliveryStatus.completed,
      supplied_item_type: SupplyDeliveryType.product,
      supplied_item_quantity: stock.QTY,
      $supplied_item__product_knowledge: `f-${FACILITY_ID}-${getProductKnowledgeSlug(item)}`,
      $supplied_item__charge_item_definition: `f-${FACILITY_ID}-${getChargeItemDefinitionSlug(item)}`,
      $order__destination: destinationId,
      destination: destinationId,
      extensions: {},
    };
  });
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
