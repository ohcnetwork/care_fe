import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import {
  DeliveryOrderRetrieve,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import { ProductRead } from "@/types/inventory/product/product";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { SupplyDeliveryRead } from "@/types/inventory/supplyDelivery/supplyDelivery";
import {
  getChargeItemDefinitionsToImport,
  getDeliveryOrdersToImport,
  getExistingChargeItemDefinitionSlugs,
  getExistingProduct,
  getExistingProductKnowledgeSlugs,
  getExistingResourceCategorySlugs,
  getProductKnowledgeToImport,
  getProductsToImport,
  getResourceCategoriesToImport,
  getSupplyDeliveriesToImport,
} from "sudheendra-scripts/inventory-from-db/utils";
import { batchRequest, request } from "sudheendra-scripts/utils";
import { createProgressTree } from "sudheendra-scripts/utils/progress";

const FACILITY_ID = process.env.FACILITY_ID!;

const progress = createProgressTree([
  {
    label: "Resource Categories",
    children: [
      {
        label: "scan",
        status: "pending",
      },
      {
        label: "import",
        status: "pending",
      },
    ],
  },
  {
    label: "Product Knowledge",
    children: [
      {
        label: "scan",
        status: "pending",
      },
      {
        label: "import",
        status: "pending",
      },
    ],
  },
  {
    label: "Charge Item Definitions",
    children: [
      {
        label: "scan",
        status: "pending",
      },
      {
        label: "import",
        status: "pending",
      },
    ],
  },
  {
    label: "Products",
    children: [
      {
        label: "scan",
        status: "pending",
      },
      {
        label: "import",
        status: "pending",
      },
    ],
  },
  {
    label: "Delivery Orders",
    children: [
      {
        label: "create delivery orders",
        status: "pending",
      },
      {
        label: "create supply deliveries",
        status: "pending",
      },
      {
        label: "complete delivery orders",
        status: "pending",
      },
    ],
  },
]);

const [
  resourceCategoryProgress,
  productKnowledgeProgress,
  chargeItemDefinitionsProgress,
  productsProgress,
  deliveryOrdersProgress,
] = progress.nodes;

async function importResourceCategories() {
  const [fetching, uploading] = resourceCategoryProgress.children;

  const existingSlugs = await getExistingResourceCategorySlugs({
    tree: progress,
    node: fetching,
  });

  const allItems = getResourceCategoriesToImport();
  const toCreate = allItems.filter(
    (item) => !existingSlugs.includes(item.slug_value),
  );

  progress.setTotal(uploading, toCreate.length);
  progress.status(uploading, "uploading");

  for (const item of toCreate) {
    progress.tick(uploading);
    await request(
      `/api/v1/facility/${FACILITY_ID}/resource_category/`,
      "POST",
      item,
    );
  }

  progress.status(uploading, "done");
}

async function importProductKnowledge() {
  const [fetching, uploading] = productKnowledgeProgress.children;

  const existingSlugs = await getExistingProductKnowledgeSlugs({
    tree: progress,
    node: fetching,
  });

  const allItems = getProductKnowledgeToImport();
  const toCreate = allItems.filter(
    (item) => !existingSlugs.includes(item.slug_value),
  );

  progress.setTotal(uploading, toCreate.length);
  progress.status(uploading, "uploading");

  await batchRequest(
    toCreate,
    async (datapoints) => {
      const results = await request(
        `/api/v1/product_knowledge/upsert/`,
        "POST",
        { datapoints },
      );
      progress.tick(uploading, datapoints.length);
      return results as ProductKnowledgeBase[];
    },
    1,
  );

  progress.status(uploading, "done");
}

async function importChargeItemDefinitions() {
  const [fetching, uploading] = chargeItemDefinitionsProgress.children;
  const existingSlugs = await getExistingChargeItemDefinitionSlugs({
    tree: progress,
    node: fetching,
  });

  const allItems = getChargeItemDefinitionsToImport();
  const toCreate = allItems.filter(
    (item) => !existingSlugs.includes(item.slug_value),
  );

  progress.setTotal(uploading, toCreate.length);
  progress.status(uploading, "uploading");

  await batchRequest(
    toCreate,
    async (datapoints) => {
      const results = await request(
        `/api/v1/facility/${FACILITY_ID}/charge_item_definition/upsert/`,
        "POST",
        { datapoints },
      );
      progress.tick(uploading, datapoints.length);
      return results as ChargeItemDefinitionBase[];
    },
    1,
  );

  progress.status(uploading, "done");
}

async function importProducts() {
  const [fetching, uploading] = productsProgress.children;
  const existing = await getExistingProduct({ tree: progress, node: fetching });

  const allItems = getProductsToImport();
  const toCreate = allItems.filter(
    (item) =>
      !existing.some(
        ({ pk_slug, cid_slug }) =>
          pk_slug === item.product_knowledge &&
          cid_slug === item.charge_item_definition,
      ),
  );

  progress.setTotal(uploading, toCreate.length);
  progress.status(uploading, "uploading");

  const products = await batchRequest(
    toCreate,
    async (datapoints) => {
      const results = await request(
        `/api/v1/facility/${FACILITY_ID}/product/upsert/`,
        "POST",
        { datapoints },
      );
      progress.tick(uploading, datapoints.length);
      return results as ProductRead[];
    },
    1,
  );

  progress.status(uploading, "done");

  return products;
}

async function importDeliveryOrders(products: ProductRead[]) {
  const [creating, creatingSupplyDeliveries, completing] =
    deliveryOrdersProgress.children;

  const deliveryOrdersToCreate = getDeliveryOrdersToImport();

  progress.setTotal(creating, deliveryOrdersToCreate.length);
  progress.status(creating, "creating");

  const deliveryOrders = await batchRequest(
    deliveryOrdersToCreate,
    async (datapoints) => {
      const results = await request(
        `/api/v1/facility/${FACILITY_ID}/order/delivery/upsert/`,
        "POST",
        { datapoints },
      );
      progress.tick(creating, datapoints.length);
      return results as DeliveryOrderRetrieve[];
    },
    1,
  );

  progress.status(creating, "done");

  const supplyDeliveriesToCreate = getSupplyDeliveriesToImport(
    products,
    deliveryOrders,
  );
  progress.setTotal(creatingSupplyDeliveries, supplyDeliveriesToCreate.length);
  progress.status(creatingSupplyDeliveries, "creating");

  await batchRequest(
    supplyDeliveriesToCreate,
    async (datapoints) => {
      const results = await request(`/api/v1/supply_delivery/upsert/`, "POST", {
        datapoints,
      });
      progress.tick(creatingSupplyDeliveries, datapoints.length);
      return results as SupplyDeliveryRead[];
    },
    1,
  );
  progress.status(creatingSupplyDeliveries, "done");

  progress.setTotal(completing, deliveryOrders.length);
  progress.status(completing, "completing");

  await batchRequest(
    deliveryOrders,
    async (datapoints) => {
      const results = await request(
        `/api/v1/facility/${FACILITY_ID}/order/delivery/upsert/`,
        "POST",
        {
          datapoints: datapoints.map((deliveryOrder) => ({
            id: deliveryOrder.id,
            name: deliveryOrder.name,
            supplier: deliveryOrder.supplier?.id,
            destination: deliveryOrder.destination.id,
            status: DeliveryOrderStatus.completed,
            origin: deliveryOrder.origin?.id,
            note: deliveryOrder.note,
            extensions: {},
          })),
        },
      );
      progress.tick(completing, datapoints.length);
      return results as DeliveryOrderRetrieve[];
    },
    1,
  );
  progress.status(completing, "done");
}

async function main() {
  progress.start();

  // await importResourceCategories();
  // await importProductKnowledge();
  // await importChargeItemDefinitions();
  const products = await importProducts();

  const deliveryOrders = await importDeliveryOrders(products);

  progress.stop();
}

main();
