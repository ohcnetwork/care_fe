import { z } from "zod";

import {
  paginationSearch,
  searchEnum,
  searchPositiveInt,
  searchString,
} from "@/lib/router/search/fields";
import { ChargeItemDefinitionStatus } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import {
  Classification,
  Status,
} from "@/types/emr/activityDefinition/activityDefinition";
import {
  ObservationDefinitionCategory,
  ObservationDefinitionStatus,
} from "@/types/emr/observationDefinition/observationDefinition";
import { SpecimenDefinitionStatus } from "@/types/emr/specimenDefinition/specimenDefinition";
import { TemplateStatuses, TemplateTypes } from "@/types/emr/template/template";
import { ProductStatusOptions } from "@/types/inventory/product/product";
import {
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";

/**
 * The categories of a resource (`ResourceCategoryList`), on the activity
 * definition, charge item definition and product knowledge pages.
 */
export const resourceCategoryListSearch = z.object({
  ...paginationSearch,
  searchCategory: searchString(),
});

/** The activity definitions of a category. */
export const activityDefinitionListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
  status: searchEnum(Status),
  classification: searchEnum(Classification),
});

/** The activity definitions page: the categories and their definitions. */
export const activityDefinitionsPageSearch = resourceCategoryListSearch.extend(
  activityDefinitionListSearch.shape,
);

/** The charge item definitions of a category. */
export const chargeItemDefinitionListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
  status: searchEnum(ChargeItemDefinitionStatus),
});

/** The charge item definitions page: the categories and their definitions. */
export const chargeItemDefinitionsPageSearch =
  resourceCategoryListSearch.extend(chargeItemDefinitionListSearch.shape);

/** The product knowledge of a category. */
export const productKnowledgeListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
  status: searchEnum(ProductKnowledgeStatus),
  product_type: searchEnum(ProductKnowledgeType),
});

/** The product knowledge page: the categories and their products. */
export const productKnowledgePageSearch = resourceCategoryListSearch.extend(
  productKnowledgeListSearch.shape,
);

/** The device list. */
export const deviceListSearch = z.object({
  ...paginationSearch,
  search_text: searchString(),
  /** A plugin device type (`usePluginDevices`). */
  care_type: searchString(),
});

/** The add and edit device pages (`DeviceForm`). */
export const deviceFormSearch = z.object({
  /** A plugin device type. Set by the add device menu of the device list. */
  type: searchString(),
});

/** The device page: the page of its service history. */
export const deviceShowSearch = z.object({
  page: searchPositiveInt(),
});

/** The healthcare service list. */
export const healthcareServiceListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
});

/** The observation definition list. */
export const observationDefinitionListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
  status: searchEnum(ObservationDefinitionStatus),
  category: searchEnum(ObservationDefinitionCategory),
});

/**
 * The departments page: the sub-departments (`FacilityOrganizationView`) or
 * the users (`FacilityOrganizationUsers`) of a department.
 */
export const facilityOrganizationListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
});

/** The product list. */
export const productListSearch = z.object({
  ...paginationSearch,
  status: searchEnum(ProductStatusOptions),
  product_knowledge_slug: searchString(),
});

/** The specimen definition list. */
export const specimenDefinitionListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
  status: searchEnum(SpecimenDefinitionStatus),
});

/** The report template list (`TemplateList`). */
export const templateListSearch = z.object({
  ...paginationSearch,
  name: searchString(),
  status: searchEnum(TemplateStatuses),
  template_type: searchEnum(TemplateTypes),
});
