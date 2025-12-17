import {
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";
import {
  getCategoriesToImport,
  getExistingResourceCategories,
  getItemsToImport,
} from "sudheendra-scripts/inventory-from-db/utils";
import { request } from "sudheendra-scripts/utils";

async function main() {
  const resourceCategories = await getCategoriesToImport();
  const existingResourceCategories = await getExistingResourceCategories();
  const itemsToImportProductKnowledge = await getItemsToImport(
    existingResourceCategories,
    resourceCategories,
    (existing, item) => existing.slug === `pk-${item.slug_value}`,
  );
  const itemsToImportChargeItemDefinitions = await getItemsToImport(
    existingResourceCategories,
    resourceCategories,
    (existing, item) => existing.slug === `cid-${item.slug_value}`,
  );
  for (const item of itemsToImportProductKnowledge) {
    await request(
      `/api/v1/facility/${process.env.FACILITY_ID}/resource_category/`,
      "POST",
      {
        title: item.name,
        slug_value: `pk-${item.slug_value}`,
        resource_type: ResourceCategoryResourceType.product_knowledge,
        resource_sub_type: ResourceCategorySubType.other,
      },
    );
    console.log(`Created ${item.name} product knowledge resource category`);
  }

  for (const item of itemsToImportChargeItemDefinitions) {
    await request(
      `/api/v1/facility/${process.env.FACILITY_ID}/resource_category/`,
      "POST",
      {
        title: item.name,
        slug_value: `cid-${item.slug_value}`,
        resource_type: ResourceCategoryResourceType.charge_item_definition,
        resource_sub_type: ResourceCategorySubType.other,
      },
    );

    console.log(
      `Created ${item.name} charge item definition resource category`,
    );
  }
}

main();
