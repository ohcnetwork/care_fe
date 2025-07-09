import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

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
  },
  retrieveChargeItemDefinition: {
    path: "/api/v1/facility/{facilityId}/charge_item_definition/{chargeItemDefinitionId}/",
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
    path: "/api/v1/facility/{facilityId}/charge_item_definition/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<ChargeItemDefinitionRead>(),
    TBody: Type<ChargeItemDefinitionCreate>(),
  },
} as const;
