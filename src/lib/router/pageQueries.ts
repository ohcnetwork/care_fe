import {
  type DefaultError,
  type EnsureQueryDataOptions,
  type QueryKey,
  queryOptions,
} from "@tanstack/react-query";

import query from "@/Utils/request/query";
import type { RouterContext } from "@/router";
import accountApi from "@/types/billing/account/accountApi";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import facilityApi from "@/types/facility/facilityApi";

/*
 * Queries that a page reads and its route loader starts. Both use these
 * options, so the loader fills the cache entry the page reads. Loaders stay
 * in the entry chunk: import only API route objects here.
 */

/**
 * The loader's request usually ends before the page's code has loaded. Data
 * that arrived this recently is not fetched again when the page mounts. Keep
 * it short: a page opened again after a save elsewhere must refetch.
 */
const staleTime = 3_000;

export const facilityQuery = (facilityId: string) =>
  queryOptions({
    queryKey: ["facility", facilityId],
    staleTime,
    queryFn: query(facilityApi.get, { pathParams: { facilityId } }),
  });

export const patientQuery = (
  id: string,
  facilityId?: string,
  { silent = false } = {},
) =>
  queryOptions({
    queryKey: ["patient", id, facilityId],
    staleTime,
    queryFn: query(patientApi.get, {
      pathParams: { id },
      queryParams: { facility: facilityId },
      silent,
    }),
  });

export const encounterQuery = (
  id: string,
  { facilityId, patientId }: { facilityId?: string; patientId: string },
) =>
  queryOptions({
    queryKey: ["encounter", id],
    staleTime,
    queryFn: query(encounterApi.get, {
      pathParams: { id },
      queryParams: facilityId
        ? { facility: facilityId }
        : { patient: patientId },
    }),
  });

export const accountQuery = (facilityId: string, accountId: string) =>
  queryOptions({
    queryKey: ["account", accountId],
    staleTime,
    queryFn: query(accountApi.retrieveAccount, {
      pathParams: { facilityId, accountId },
    }),
  });

/**
 * Starts a page query from a route loader and does not wait for it, so slow
 * data never holds the navigation. The page's `useQuery` joins the request
 * and shows its own loading and error UI; a failed request stays in the
 * cache for the page.
 *
 * Nothing starts while the staff session loads: a request with an expired
 * token would get a 401 and race the redirect to sign-in. `AuthUserProvider`
 * invalidates the router when the session is known, so the loader runs again.
 */
export function startQuery<TQueryFnData, TData, TQueryKey extends QueryKey>(
  { auth, queryClient }: RouterContext,
  options: EnsureQueryDataOptions<TQueryFnData, DefaultError, TData, TQueryKey>,
) {
  if (auth.status !== "user") return;
  queryClient.ensureQueryData(options).catch(() => {});
}
