import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";

import query, { callApi } from "@/Utils/request/query";
import becknApi from "@/types/beckn/becknApi";
import {
  BecknActionName,
  BecknActionResult,
  BecknInitResult,
  BecknSlice,
  BecknSlot,
  BecknTxnStatus,
  CatalogOption,
  extractInitResult,
  extractOffers,
  extractSlots,
  isTerminalStatus,
  sliceActionFor,
} from "@/types/beckn/becknModels";

export type BecknPhase =
  | "idle"
  | "discovering"
  | "discovered"
  | "selecting"
  | "selected"
  | "initializing"
  | "initialized"
  | "confirming"
  | "confirmed"
  | "error";

function phaseFor(status: string | undefined): BecknPhase {
  switch (status) {
    case undefined:
      return "idle";
    case "DISCOVER":
      return "discovering";
    case "ON_DISCOVER":
      return "discovered";
    case "SELECT":
      return "selecting";
    case "ON_SELECT":
      return "selected";
    case "INIT":
      return "initializing";
    case "ON_INIT":
      return "initialized";
    case "CONFIRM":
      return "confirming";
    case "ON_CONFIRM":
      return "confirmed";
    case "NACK":
    case "ERROR":
      return "error";
    default:
      return "idle";
  }
}

const POLL_MS = 1500;
const SLICE_POLL_MS = 1200;

/**
 * Drives one Beckn transaction end-to-end against the Care BAP REST endpoints.
 *
 * `act(name, body)` fires an action (discover starts the txn and captures its
 * `transactionId`) and marks that action's `on_*` callback as *awaited*. The
 * status record is polled every ~1.5s **only while a callback is awaited**; the
 * moment the matching `ON_*` arrives it's the FE's turn, so polling pauses until
 * the next action fires. When the awaited `ON_*` lands, its slice is auto-fetched
 * and cached by action so earlier slices (e.g. the catalog) stay available.
 * Polling also stops on `NACK` / `ERROR`.
 */
export function useBecknTransaction() {
  const qc = useQueryClient();
  const [transactionId, setTransactionId] = useState<string>();
  const [slices, setSlices] = useState<Record<string, BecknSlice>>({});
  const [error, setError] = useState<string>();
  const [acting, setActing] = useState(false);
  // The action whose `on_*` callback we're waiting for; null when it's the FE's
  // turn (an `ON_*` was received) or the flow is at rest. Drives the poller.
  const [awaiting, setAwaiting] = useState<BecknActionName | null>(null);

  const statusQuery = useQuery<BecknTxnStatus>({
    queryKey: ["beckn", "status", transactionId],
    queryFn: query(becknApi.status, {
      pathParams: { transactionId: transactionId as string },
    }),
    enabled: !!transactionId,
    refetchInterval: awaiting ? POLL_MS : false,
  });

  const status = statusQuery.data?.status;
  const sliceAction = sliceActionFor(status);

  const sliceQuery = useQuery<BecknSlice>({
    queryKey: ["beckn", "slice", transactionId, sliceAction],
    queryFn: query(becknApi.slice, {
      pathParams: { transactionId: transactionId as string },
      queryParams: { action: sliceAction as string },
    }),
    enabled: !!transactionId && !!sliceAction,
    refetchInterval: (q) => (q.state.data?.ready ? false : SLICE_POLL_MS),
  });

  // Stop polling once the awaited callback (matching `ON_*`) or a terminal error
  // arrives — it's now the FE's turn (or the flow has failed).
  useEffect(() => {
    if (!awaiting) return;
    const expected = `ON_${awaiting.toUpperCase()}`;
    if (status === expected || status === "NACK" || status === "ERROR") {
      setAwaiting(null);
    }
  }, [status, awaiting]);

  // Cache each ON_* slice once it is ready so the catalog survives later phases.
  useEffect(() => {
    const data = sliceQuery.data;
    if (data?.ready && sliceAction) {
      setSlices((prev) =>
        prev[sliceAction] ? prev : { ...prev, [sliceAction]: data },
      );
    }
  }, [sliceQuery.data, sliceAction]);

  useEffect(() => {
    if (status === "NACK" || status === "ERROR") {
      setError((p) => p ?? t("beckn_request_failed"));
    }
  }, [status]);

  const act = useCallback(
    async (
      name: BecknActionName,
      body: Record<string, unknown>,
    ): Promise<BecknActionResult> => {
      setError(undefined);
      setActing(true);
      // Expect an `on_<name>` callback → (re)start the poller.
      setAwaiting(name);
      try {
        const res = await callApi(becknApi.action, {
          pathParams: { action: name },
          body,
        });
        if (name === "discover") {
          setTransactionId(res.transactionId);
        }
        if (res.result === "nack" || res.result === "error") {
          setError(t("beckn_request_failed"));
          setAwaiting(null);
        } else if (res.result === "skipped") {
          setError(t("beckn_network_not_configured"));
          setAwaiting(null);
        }
        const tid = res.transactionId ?? transactionId;
        if (tid) {
          await qc.invalidateQueries({
            queryKey: ["beckn", "status", tid],
          });
        }
        return res;
      } finally {
        setActing(false);
      }
    },
    [qc, transactionId],
  );

  const reset = useCallback(() => {
    setTransactionId(undefined);
    setSlices({});
    setError(undefined);
    setAwaiting(null);
  }, []);

  // Seed an existing transaction (persisted on a ResourceRequest) so the CC
  // console can fire `confirm` and poll a transaction it did not discover.
  const resume = useCallback((existingTransactionId: string) => {
    setTransactionId(existingTransactionId);
    setError(undefined);
  }, []);

  const catalog: CatalogOption[] = useMemo(
    () => extractOffers(slices["on_discover"]),
    [slices],
  );
  const slots: BecknSlot[] = useMemo(
    () => extractSlots(slices["on_select"]),
    [slices],
  );
  const initResult: BecknInitResult = useMemo(
    () => extractInitResult(slices["on_init"]),
    [slices],
  );

  return {
    transactionId,
    status,
    phase: phaseFor(status),
    awaiting,
    isTerminal: isTerminalStatus(status),
    isPolling: statusQuery.isFetching || sliceQuery.isFetching,
    acting,
    error,
    resourceRequestId: statusQuery.data?.resourceRequestId,
    statusRecord: statusQuery.data,
    catalog,
    slots,
    initResult,
    slices,
    act,
    reset,
    resume,
  };
}

export type UseBecknTransaction = ReturnType<typeof useBecknTransaction>;
