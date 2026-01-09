import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import {
  InvoiceCancel,
  InvoiceCreate,
  InvoiceList,
  InvoiceRead,
} from "./invoice";

export default {
  listInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<InvoiceList>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/{invoiceId}/",
    method: HttpMethod.GET,
    TRes: Type<InvoiceRead>(),
  },
  createInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/",
    method: HttpMethod.POST,
    TRes: Type<InvoiceRead>(),
    TBody: Type<InvoiceCreate>(),
  },
  updateInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/{invoiceId}/",
    method: HttpMethod.PUT,
    TRes: Type<InvoiceRead>(),
    TBody: Type<InvoiceCreate>(),
  },
  cancelInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/{invoiceId}/cancel_invoice/",
    method: HttpMethod.POST,
    TRes: Type<InvoiceRead>(),
    TBody: Type<InvoiceCancel>(),
  },
  lockInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/{invoiceId}/lock/",
    method: HttpMethod.POST,
    TRes: Type<InvoiceRead>(),
  },
  unlockInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/{invoiceId}/unlock/",
    method: HttpMethod.POST,
    TRes: Type<InvoiceRead>(),
  },
} as const;
