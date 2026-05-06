import { getApiOverride } from "@/lib/override/api";
import { callApi } from "@/Utils/request/query";
import { ApiCallOptions, ApiRoute } from "@/Utils/request/types";

/**
 * Creates a TanStack Query compatible mutation function.
 *
 * Example:
 * ```tsx
 * const { mutate: createPrescription, isPending } = useMutation({
 *   mutationFn: mutate(MedicineRoutes.createPrescription, {
 *     pathParams: { consultationId },
 *   }),
 *   onSuccess: () => {
 *     toast.success(t("medication_request_prescribed"));
 *   },
 * });
 * ```
 */
export default function mutate<Route extends ApiRoute<unknown, unknown>>(
  route: Route,
  options?: ApiCallOptions<Route>,
) {
  return (variables: Route["TBody"]) => {
    const override = getApiOverride(route);
    if (override) {
      return override(
        {
          pathParams: options?.pathParams,
          queryParams: options?.queryParams,
          body: variables,
          signal: options?.signal,
          pathname:
            typeof window !== "undefined"
              ? window.location.pathname
              : undefined,
        },
        () => callApi(route, { ...options, body: variables }),
      );
    }
    return callApi(route, { ...options, body: variables });
  };
}
