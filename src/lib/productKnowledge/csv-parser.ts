import { parseCsv } from "@/lib/csv-parser";

import { parseEnum } from "@/Utils/utils";
import {
  ProductKnowledgeCreate,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";

export function parseCsvToProductKnowledge(
  csvText: string,
  defaults?: Partial<Record<string, string>>,
) {
  return parseCsv(
    csvText,
    (row) => {
      const productKnowledge: ProductKnowledgeCreate = {
        name: row.name || "",
        slug: row.slug || "",
        product_type:
          parseEnum(ProductKnowledgeType, row.product_type) ??
          ProductKnowledgeType.nutritional_product,
        status:
          parseEnum(ProductKnowledgeStatus, row.status) ??
          ProductKnowledgeStatus.active,
        facility: row.facility,
        names: [],
        storage_guidelines: [],
      };

      if (row.code_code && row.code_display && row.code_system) {
        productKnowledge.code = {
          code: row.code_code,
          display: row.code_display,
          system: row.code_system,
        };
      }

      return productKnowledge;
    },
    defaults,
  );
}
