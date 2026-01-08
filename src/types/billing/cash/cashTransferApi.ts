import { HttpMethod, Type } from "@/Utils/request/types";

import {
  AcceptTransferRequest,
  CancelTransferRequest,
  CreateTransferRequest,
  RejectTransferRequest,
  TransferListResponse,
  TransferResponse,
} from "./cashTransfer";

export default {
  createTransfer: {
    path: "/api/care_odoo/facility/{facilityId}/cash-transfer/",
    method: HttpMethod.POST,
    TRes: Type<TransferResponse>(),
    TBody: Type<CreateTransferRequest>(),
  },
  acceptTransfer: {
    path: "/api/care_odoo/facility/{facilityId}/cash-transfer/{transferId}/accept/",
    method: HttpMethod.PUT,
    TRes: Type<TransferResponse>(),
    TBody: Type<AcceptTransferRequest>(),
  },
  rejectTransfer: {
    path: "/api/care_odoo/facility/{facilityId}/cash-transfer/{transferId}/reject/",
    method: HttpMethod.PUT,
    TRes: Type<TransferResponse>(),
    TBody: Type<RejectTransferRequest>(),
  },
  cancelTransfer: {
    path: "/api/care_odoo/facility/{facilityId}/cash-transfer/{transferId}/cancel/",
    method: HttpMethod.PUT,
    TRes: Type<TransferResponse>(),
    TBody: Type<CancelTransferRequest>(),
  },
  getPendingTransfers: {
    path: "/api/care_odoo/facility/{facilityId}/cash-transfer/pending/",
    method: HttpMethod.GET,
    TRes: Type<TransferListResponse>(),
  },
  getSentTransfers: {
    path: "/api/care_odoo/facility/{facilityId}/cash-transfer/",
    method: HttpMethod.GET,
    TRes: Type<TransferListResponse>(),
  },
} as const;
