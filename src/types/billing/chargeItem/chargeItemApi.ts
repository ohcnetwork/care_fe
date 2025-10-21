import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  ApplyMultipleChargeItemDefinitionRequest,
  ChargeItemCreate,
  ChargeItemRead,
  ChargeItemUpdate,
} from "./chargeItem";

export default {
  listChargeItem: {
    path: "/api/v1/facility/{facilityId}/charge_item/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ChargeItemRead>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveChargeItem: {
    path: "/api/v1/facility/{facilityId}/charge_item/{chargeItemId}/",
    method: HttpMethod.GET,
    TRes: Type<ChargeItemRead>(),
  },
  createChargeItem: {
    path: "/api/v1/facility/{facilityId}/charge_item/",
    method: HttpMethod.POST,
    TRes: Type<ChargeItemRead>(),
    TBody: Type<ChargeItemCreate>(),
  },
  updateChargeItem: {
    path: "/api/v1/facility/{facilityId}/charge_item/{chargeItemId}/",
    method: HttpMethod.PUT,
    TRes: Type<ChargeItemRead>(),
    TBody: Type<ChargeItemUpdate>(),
  },
  applyChargeItemDefinitions: {
    path: "/api/v1/facility/{facilityId}/charge_item/apply_charge_item_defs/",
    method: HttpMethod.POST,
    TRes: Type<ChargeItemRead>(),
    TBody: Type<ApplyMultipleChargeItemDefinitionRequest>(),
  },
  addChargeItemsToInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/{invoiceId}/attach_items_to_invoice/",
    method: HttpMethod.POST,
    TRes: Type<ChargeItemRead>(),
    TBody: Type<{ charge_items: string[] }>(),
  },
  removeChargeItemFromInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/{invoiceId}/remove_item_from_invoice/",
    method: HttpMethod.POST,
    TRes: Type<ChargeItemRead>(),
    TBody: Type<{ charge_item: string }>(),
  },
  upsertChargeItem: {
    path: "/api/v1/facility/{facilityId}/charge_item/upsert/",
    method: HttpMethod.POST,
    TRes: Type<ChargeItemRead>(),
    TBody: Type<{ datapoints: ChargeItemUpdate[] }>(),
  },
} as const;
