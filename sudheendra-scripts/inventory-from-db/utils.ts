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
  DeliveryOrderRetrieve,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import {
  ProductRead,
  ProductStatusOptions,
} from "@/types/inventory/product/product";
import {
  ProductKnowledgeBase,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import { ProgressNode, ProgressTree } from "sudheendra-scripts/utils/progress";
import itemsJson from "./data/ITEM.json";
import pharmacyCategories from "./data/PHARM_CATEGORY.json";
import supplyDeliveriesJson from "./data/stock.json";
dotenv.config({ path: [".env.local", ".env"] });

const FACILITY_ID = process.env.FACILITY_ID!;
const SUPPLIER_ID = process.env.SUPPLIER_ID!;

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
      },
      {
        title: name,
        slug_value: `cid-${createSlug(name)}`,
        resource_type: ResourceCategoryResourceType.charge_item_definition,
        resource_sub_type: ResourceCategorySubType.other,
        meta: {
          ssmm_pharm_category_id: category.ID,
        },
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
            c.resource_type ===
            ResourceCategoryResourceType.charge_item_definition,
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
      }));
  };
export const getProductsToImport = () => {
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
    }));
};

export const getDeliveryOrdersToImport = () => {
  const deliveryOrders = new Map(
    stock
      .filter(
        (stock) =>
          !!stock.CARE_LOCATION_ID &&
          items.find((item) => item.ID === stock.ITEM_ID),
      )
      .map((stock) => {
        const destinationId = stock.CARE_LOCATION_ID;
        return [
          destinationId,
          {
            name: `Bulk Import Delivery Order`,
            destination: destinationId,
            status: DeliveryOrderStatus.pending,
            note: "This delivery order was created by a bulk import script",
            extensions: {},
            supplier: SUPPLIER_ID,
          } satisfies DeliveryOrderCreate,
        ];
      }),
  );
  return Array.from(deliveryOrders.values());
};

export const getSupplyDeliveriesToImport = (
  products: ProductRead[],
  deliveryOrders: DeliveryOrderRetrieve[],
) => {
  const productMap = new Map(
    products.map((product) => [
      `${product.product_knowledge.slug}--${product.charge_item_definition?.slug}`,
      product.id,
    ]),
  );

  const deliveryOrderMap = new Map(
    deliveryOrders.map((deliveryOrder) => [
      deliveryOrder.destination.id,
      deliveryOrder.id,
    ]),
  );

  return stock
    .filter(
      (stock) =>
        !!stock.CARE_LOCATION_ID &&
        items.find((item) => item.ID === stock.ITEM_ID),
    )
    .map((stock) => {
      const item = items.find((item) => item.ID === stock.ITEM_ID)!;
      const destinationId = stock.CARE_LOCATION_ID;
      return {
        status: SupplyDeliveryStatus.completed,
        supplied_item_type: SupplyDeliveryType.product,
        supplied_item_quantity: stock.QTY,
        supplied_item: productMap.get(
          `f-${FACILITY_ID}-${getProductKnowledgeSlug(item)}--f-${FACILITY_ID}-${getChargeItemDefinitionSlug(item)}`,
        ),
        order: deliveryOrderMap.get(destinationId),
        destination: destinationId,
        extensions: {},
      };
    });
};

export const getExistingPaginatedData = async <TInput, TOutput>(
  url: string,
  queryParams: Record<string, string>,
  transform: (data: TInput) => TOutput,
  progress?: { tree: ProgressTree; node: ProgressNode },
) => {
  progress?.tree.status(progress?.node, "counting");

  const queryString = new URLSearchParams(queryParams ?? {});
  queryString.set("limit", "0");

  const { count } = await request<PaginatedResponse<TInput>>(
    `${url}?${queryString.toString()}`,
    "GET",
  );

  const data: TOutput[] = [];
  let offset = 0;
  const pageSize = 100;

  progress?.tree.setTotal(progress?.node, count);
  progress?.tree.status(progress?.node, "fetching");

  while (true) {
    queryString.set("limit", pageSize.toString());
    queryString.set("offset", offset.toString());
    const response = await request<PaginatedResponse<TInput>>(
      `${url}?${queryString.toString()}`,
      "GET",
    );

    data.push(...response.results.map(transform));
    progress?.tree.tick(progress?.node, response.results.length);

    if (response.results.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  progress?.tree.status(progress?.node, "done");

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

export const getExistingLocations = async (progress?: {
  tree: ProgressTree;
  node: ProgressNode;
}) => {
  return getExistingPaginatedData<LocationRead, { id: string; name: string }>(
    `/api/v1/facility/${FACILITY_ID}/location/`,
    {},
    (location) => ({ id: location.id, name: location.name }),
    progress,
  );
};

export const getExistingResourceCategorySlugs = async (progress?: {
  tree: ProgressTree;
  node: ProgressNode;
}) => {
  return getExistingPaginatedData<ResourceCategoryRead, string>(
    `/api/v1/facility/${FACILITY_ID}/resource_category/`,
    {},
    (item) => item.slug_config.slug_value,
    progress,
  );
};

export const getExistingProductKnowledgeSlugs = async (progress?: {
  tree: ProgressTree;
  node: ProgressNode;
}) => {
  return getExistingPaginatedData<ProductKnowledgeBase, string>(
    `/api/v1/product_knowledge/`,
    { facility: FACILITY_ID },
    (item) => item.slug_config.slug_value,
    progress,
  );
};

export const getExistingChargeItemDefinitionSlugs = async (progress?: {
  tree: ProgressTree;
  node: ProgressNode;
}) => {
  return getExistingPaginatedData<ChargeItemDefinitionBase, string>(
    `/api/v1/facility/${FACILITY_ID}/charge_item_definition/`,
    {},
    (item) => item.slug_config.slug_value,
    progress,
  );
};

export const getExistingProduct = async (progress?: {
  tree: ProgressTree;
  node: ProgressNode;
}) => {
  return getExistingPaginatedData<
    ProductRead,
    { pk_slug: string; cid_slug: string }
  >(
    `/api/v1/facility/${FACILITY_ID}/product/`,
    {},
    (item) => ({
      pk_slug: item.product_knowledge.slug_config.slug_value,
      cid_slug: item.charge_item_definition?.slug_config.slug_value ?? "",
    }),
    progress,
  );
};
