import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  SpecimenDefinitionCreate,
  SpecimenDefinitionRead,
} from "./specimenDefinition";

export default {
  listSpecimenDefinitions: {
    path: "/api/v1/facility/{facilityId}/specimen_definition/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<SpecimenDefinitionRead>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveSpecimenDefinition: {
    path: "/api/v1/facility/{facilityId}/specimen_definition/{specimenSlug}/",
    method: HttpMethod.GET,
    TRes: Type<SpecimenDefinitionRead>(),
  },
  updateSpecimenDefinition: {
    path: "/api/v1/facility/{facilityId}/specimen_definition/{specimenSlug}/",
    method: HttpMethod.PUT,
    TRes: Type<SpecimenDefinitionRead>(),
    TBody: Type<SpecimenDefinitionCreate>(),
  },
  createSpecimenDefinition: {
    path: "/api/v1/facility/{facilityId}/specimen_definition/",
    method: HttpMethod.POST,
    TRes: Type<SpecimenDefinitionRead>(),
    TBody: Type<SpecimenDefinitionCreate>(),
  },
};
