import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  PaymentReconciliationBase,
  PaymentReconciliationCreate,
  PaymentReconciliationRead,
} from "./paymentReconciliation";

export default {
  listPaymentReconciliation: {
    path: "/api/v1/facility/{facilityId}/payment_reconciliation/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PaymentReconciliationBase>>(),
  },
  retrievePaymentReconciliation: {
    path: "/api/v1/facility/{facilityId}/payment_reconciliation/{paymentReconciliationId}/",
    method: HttpMethod.GET,
    TRes: Type<PaymentReconciliationRead>(),
  },
  createPaymentReconciliation: {
    path: "/api/v1/facility/{facilityId}/payment_reconciliation/",
    method: HttpMethod.POST,
    TRes: Type<PaymentReconciliationRead>(),
    TBody: Type<PaymentReconciliationCreate>(),
  },
  updatePaymentReconciliation: {
    path: "/api/v1/facility/{facilityId}/payment_reconciliation/{paymentReconciliationId}/",
    method: HttpMethod.PUT,
    TRes: Type<PaymentReconciliationRead>(),
    TBody: Type<PaymentReconciliationCreate>(),
  },
} as const;
