import { callApi } from "@/Utils/request/query";
import { APICallOptions, Route } from "@/Utils/request/types";

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
export default function mutate<TData, TBody>(
  route: Route<TData, TBody>,
  options?: APICallOptions<TBody>,
) {
  return (variables: TBody) => {
    return callApi(route, { ...options, body: variables });
  };
}
