import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  PaymentReconciliationBase,
  PaymentReconciliationCancel,
  PaymentReconciliationCreate,
  PaymentReconciliationRead,
  PaymentReconciliationUpdate,
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
    TBody: Type<PaymentReconciliationUpdate>(),
  },
  cancelPaymentReconciliation: {
    path: "/api/v1/facility/{facilityId}/payment_reconciliation/{paymentReconciliationId}/cancel_payment_reconciliation/",
    method: HttpMethod.POST,
    TRes: Type<PaymentReconciliationRead>(),
    TBody: Type<PaymentReconciliationCancel>(),
  },
} as const;
