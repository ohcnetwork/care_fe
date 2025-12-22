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
  const resourceCategories = getCategoriesToImport();
  const existingResourceCategories = await getExistingResourceCategories();

  const itemsToImportProductKnowledge = getItemsToImport(
    existingResourceCategories,
    resourceCategories,
    (existing, item) => existing.slug === item.pkSlug,
  );

  for (const item of itemsToImportProductKnowledge) {
    await request(
      `/api/v1/facility/${process.env.FACILITY_ID}/resource_category/`,
      "POST",
      {
        title: item.name,
        slug_value: item.pkSlug,
        resource_type: ResourceCategoryResourceType.product_knowledge,
        resource_sub_type: ResourceCategorySubType.other,
      },
    );
    console.log(`Created ${item.name} product knowledge resource category`);
  }

  const itemsToImportChargeItemDefinitions = getItemsToImport(
    existingResourceCategories,
    resourceCategories,
    (existing, item) => existing.slug === item.cidSlug,
  );

  for (const item of itemsToImportChargeItemDefinitions) {
    await request(
      `/api/v1/facility/${process.env.FACILITY_ID}/resource_category/`,
      "POST",
      {
        title: item.name,
        slug_value: item.cidSlug,
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
