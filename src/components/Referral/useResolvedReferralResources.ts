import { useQueries } from "@tanstack/react-query";

import { batchQuery } from "@/Utils/request/batch";
import { HTTPError } from "@/Utils/request/types";
import {
  ReferralResource,
  ResolvedReferralResource,
} from "@/types/emr/referral/referralResource";
import referralResourceApi from "@/types/emr/referral/referralResourceApi";

export interface ResolvedReferralResourceState {
  data?: ResolvedReferralResource;
  error?: Error;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

// Matches the backend's default batch limit and the attachment list page size.
const RESOLVE_BATCH_SIZE = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function matchesAttachment(
  data: unknown,
  attachment: ReferralResource,
): data is ResolvedReferralResource {
  return (
    isRecord(data) &&
    data.resource_type === attachment.resource_type &&
    isRecord(data.resource) &&
    data.resource.id === attachment.resource_id
  );
}

/** Resolve only explicit referral attachments, retaining independent failures.
 * Ordered chunks preserve already-loaded pages when the list appends another
 * page. All data stays in batch queries; no per-resource cache is populated.
 */
export function useResolvedReferralResources(
  attachments: readonly ReferralResource[],
): ReadonlyMap<string, ResolvedReferralResourceState> {
  const byReferral = new Map<string, ReferralResource[]>();
  const states = new Map<string, ResolvedReferralResourceState>();
  for (const attachment of attachments) {
    if (
      !UUID.test(attachment.referral) ||
      !UUID.test(attachment.id) ||
      !UUID.test(attachment.resource_id)
    ) {
      states.set(attachment.id, {
        isLoading: false,
        isError: true,
        error: new Error("Invalid referral attachment identifier"),
        refetch: async () => {},
      });
      continue;
    }
    const group = byReferral.get(attachment.referral) ?? [];
    if (!group.some((entry) => entry.id === attachment.id))
      group.push(attachment);
    byReferral.set(attachment.referral, group);
  }
  const batches = [...byReferral.values()].flatMap((group) => {
    const chunks: ReferralResource[][] = [];
    for (let offset = 0; offset < group.length; offset += RESOLVE_BATCH_SIZE) {
      chunks.push(group.slice(offset, offset + RESOLVE_BATCH_SIZE));
    }
    return chunks;
  });
  const queries = useQueries({
    queries: batches.map((batch) => ({
      queryKey: [
        "referrals",
        batch[0].referral,
        "resolved-resources",
        batch.map(({ id, resource_type, resource_id }) => ({
          id,
          resource_type,
          resource_id,
        })),
      ],
      queryFn: batchQuery<unknown>(
        batch.map((attachment) => ({
          api: referralResourceApi.resolve,
          pathParams: {
            referralId: attachment.referral,
            resourceId: attachment.id,
          },
          referenceId: attachment.id,
        })),
        { silent: true, allowPartialResults: true },
      ),
      retry: false,
    })),
  });

  batches.forEach((batch, index) => {
    const query = queries[index];
    const refetch = async () => {
      await query.refetch();
    };
    for (const attachment of batch) {
      // Never expose cached payloads after an outer auth/transport failure.
      if (query.isError) {
        states.set(attachment.id, {
          isLoading: query.isFetching,
          isError: true,
          error: query.error,
          refetch,
        });
        continue;
      }
      if (query.isPending) {
        states.set(attachment.id, {
          isLoading: true,
          isError: false,
          refetch,
        });
        continue;
      }
      const matches = query.data.results.filter(
        (result) => result.reference_id === attachment.id,
      );
      const result = matches.length === 1 ? matches[0] : undefined;
      if (
        result &&
        result.status_code >= 200 &&
        result.status_code < 300 &&
        matchesAttachment(result.data, attachment)
      ) {
        states.set(attachment.id, {
          data: result.data,
          isLoading: false,
          isError: false,
          refetch,
        });
      } else {
        const error =
          result && result.status_code >= 300
            ? new HTTPError({
                message: "Request Failed",
                status: result.status_code,
                silent: true,
                cause: isRecord(result.data) ? result.data : undefined,
              })
            : new Error("Referral attachment was not resolved");
        states.set(attachment.id, {
          isLoading: query.isFetching,
          isError: true,
          error,
          refetch,
        });
      }
    }
  });
  return states;
}
