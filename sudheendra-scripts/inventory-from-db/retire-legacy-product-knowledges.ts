import {
  ProductKnowledgeBase,
  ProductKnowledgeStatus,
} from "@/types/inventory/productKnowledge/productKnowledge";
import { getExistingPaginatedData } from "sudheendra-scripts/inventory-from-db/utils";
import { batchRequest, request } from "sudheendra-scripts/utils";
import { createProgressTree } from "sudheendra-scripts/utils/progress";

const FACILITY_ID = process.env.FACILITY_ID!;

const progress = createProgressTree([
  {
    label: "Retire Legacy Product Knowledges",
    children: [
      {
        label: "scan",
        status: "pending",
      },
      {
        label: "retire",
        status: "pending",
      },
    ],
  },
]);

const [retireLegacyProductKnowledgesProgress] = progress.nodes;

async function retireLegacyProductKnowledges() {
  const [scanning, retiring] = retireLegacyProductKnowledgesProgress.children;

  const productKnowledges = await getExistingPaginatedData<
    ProductKnowledgeBase,
    ProductKnowledgeBase
  >(
    `/api/v1/product_knowledge/`,
    { facility: FACILITY_ID, ordering: "created_date" },
    (item) => item,
    {
      tree: progress,
      node: scanning,
    },
  );

  const toRetire = productKnowledges.filter((item) =>
    item.slug_config.slug_value.startsWith("b-"),
  );

  progress.setTotal(retiring, toRetire.length);
  progress.status(retiring, "retiring");

  await batchRequest(
    toRetire,
    async ([item]) => {
      const results = await request(
        `/api/v1/product_knowledge/${item.slug}/`,
        "PUT",
        {
          name: item.name,
          slug_value: item.slug_config.slug_value,
          product_type: item.product_type,
          status: ProductKnowledgeStatus.retired,
          alternate_identifier: item.alternate_identifier,
          category: item.category.slug,
          code: item.code?.code ? item.code : undefined,
          base_unit: item.base_unit,
          names: item.names,
          storage_guidelines: item.storage_guidelines,
          definitional:
            item.definitional && Object.keys(item.definitional).length > 0
              ? item.definitional
              : null,
          facility: FACILITY_ID,
        },
      );
      progress.tick(retiring, 1);
      return results as ProductKnowledgeBase[];
    },
    1,
  );

  progress.status(retiring, "done");
}

async function main() {
  progress.start();
  await retireLegacyProductKnowledges();
  progress.stop();
}

main();
