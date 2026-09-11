import { HttpMethod, Type } from "@/Utils/request/types";
import {
  BecknActionResult,
  BecknSlice,
  BecknTxnStatus,
} from "@/types/beckn/becknModels";

/**
 * BAP REST client for the Care backend (base `/api/v1/beckn`).
 *
 * Same-origin + automatically authenticated (Bearer access-token attached by the
 * shared request util). No onyx URL, CORS, TLS or client-side Beckn `context` —
 * the BE mediates everything. All actions are async: `action` returns
 * `{transactionId, result}` immediately; poll `status`, then fetch `slice`.
 */
export default {
  // POST /bap/<action> — action ∈ discover|select|init|confirm|status|cancel|update
  action: {
    path: "/api/v1/beckn/bap/{action}",
    method: HttpMethod.POST,
    TBody: Type<Record<string, unknown>>(),
    TRes: Type<BecknActionResult>(),
  },
  // GET /bap/transaction/<id> — lightweight status record (poll this).
  status: {
    path: "/api/v1/beckn/bap/transaction/{transactionId}",
    method: HttpMethod.GET,
    TRes: Type<BecknTxnStatus>(),
  },
  // GET /bap/transaction/<id>?action=on_* — a single action's stored payload.
  slice: {
    path: "/api/v1/beckn/bap/transaction/{transactionId}",
    method: HttpMethod.GET,
    TRes: Type<BecknSlice>(),
  },
} as const;
