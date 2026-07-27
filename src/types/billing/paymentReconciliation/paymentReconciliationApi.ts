import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

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
  changeAccount: {
    path: "/api/v1/facility/{facilityId}/payment_reconciliation/change_account/",
    method: HttpMethod.POST,
    TBody: Type<{
      target_account: string;
      payment_reconciliations: string[];
    }>(),
    TRes: Type<void>(),
  },
} as const;
