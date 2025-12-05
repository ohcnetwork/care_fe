import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Metrics } from "@/types/base/condition/condition";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionRead,
} from "./chargeItemDefinition";

export default {
  listChargeItemDefinition: {
    path: "/api/v1/facility/{facilityId}/charge_item_definition/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ChargeItemDefinitionBase>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveChargeItemDefinition: {
    path: "/api/v1/facility/{facilityId}/charge_item_definition/{slug}/",
    method: HttpMethod.GET,
    TRes: Type<ChargeItemDefinitionRead>(),
  },
  createChargeItemDefinition: {
    path: "/api/v1/facility/{facilityId}/charge_item_definition/",
    method: HttpMethod.POST,
    TRes: Type<ChargeItemDefinitionRead>(),
    TBody: Type<ChargeItemDefinitionCreate>(),
  },
  updateChargeItemDefinition: {
    path: "/api/v1/facility/{facilityId}/charge_item_definition/{slug}/",
    method: HttpMethod.PUT,
    TRes: Type<ChargeItemDefinitionRead>(),
    TBody: Type<ChargeItemDefinitionCreate>(),
  },
  listMetrics: {
    // TODO: To be changed to /api/v1/charge_item_definition/metrics/ when BE is ready
    path: "/api/v1/observation_definition/metrics/",
    method: HttpMethod.GET,
    TRes: Type<Metrics[]>(),
  },
} as const;
