import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  BatchRequestObject,
  batchQuery,
  useBatchRequest,
} from "@/Utils/request/batch";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import specimenApi from "@/types/emr/specimen/specimenApi";

import { type PendingSpecimen, matchRequirements } from "./specimenCollection";
import { createDraftPayload } from "./useServiceRequestSpecimens";

// The backend takes at most 20 requests in one batch.
const BATCH_SIZE = 20;

/** Sends the requests 20 at a time and returns how many went through. */
async function sendInBatches(
  send: (requests: BatchRequestObject[]) => Promise<unknown>,
  requests: BatchRequestObject[],
) {
  let sent = 0;
  try {
    while (sent < requests.length) {
      const batch = requests.slice(sent, sent + BATCH_SIZE);
      await send(batch);
      sent += batch.length;
    }
  } catch {
    // useBatchRequest has already shown the error.
  }
  return sent;
}

export function useBatchSpecimenCollection(
  facilityId: string,
  requests: ServiceRequestReadSpec[],
  onSaved: () => void,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // A page has at most 20 requests, so one batch loads them.
  const ids = requests.map(({ id }) => id);
  const requestBatch = useQuery({
    queryKey: ["service_request_batch", facilityId, ids],
    queryFn: batchQuery<ServiceRequestReadSpec>(
      ids.map((id) => ({
        api: serviceRequestApi.retrieveServiceRequest,
        pathParams: { facilityId, serviceRequestId: id },
        referenceId: id,
      })),
      { silent: true },
    ),
    enabled: ids.length > 0,
    // Load afresh on each open, so collected specimens don't show as pending.
    gcTime: 0,
  });
  const loaded = (requestBatch.data?.results ?? []).flatMap(
    ({ status_code, data }) => (status_code === 200 && data ? [data] : []),
  );

  const slugs = [
    ...new Set(
      loaded.flatMap(
        ({ activity_definition }) => activity_definition?.slug ?? [],
      ),
    ),
  ];
  const definitionBatch = useQuery({
    queryKey: ["activity_definition_batch", facilityId, slugs],
    queryFn: batchQuery<ActivityDefinitionReadSpec>(
      slugs.map((slug) => ({
        api: activityDefinitionApi.retrieveActivityDefinition,
        pathParams: { facilityId, activityDefinitionSlug: slug },
        referenceId: slug,
      })),
      { silent: true },
    ),
    enabled: slugs.length > 0,
    gcTime: 0,
  });
  const definitions = new Map(
    (definitionBatch.data?.results ?? []).flatMap(
      ({ reference_id, status_code, data }) =>
        status_code === 200 && data ? [[reference_id, data] as const] : [],
    ),
  );

  const isLoading = requestBatch.isLoading || definitionBatch.isLoading;
  const isError = requestBatch.isError || definitionBatch.isError;

  const pending: PendingSpecimen[] = [];
  let collectedCount = 0;
  for (const request of loaded) {
    const definition = definitions.get(request.activity_definition?.slug ?? "");
    const matched = matchRequirements(
      request,
      definition?.specimen_requirements ?? [],
    );
    pending.push(...matched.pending);
    collectedCount += matched.collected.length;
  }

  // Drafts exist only to print labels before saving, so they're made on demand.
  const { mutateAsync: createDrafts } = useBatchRequest({});
  const { mutateAsync: prepareDrafts, isPending: isPreparingDrafts } =
    useMutation({
      mutationFn: async (items: PendingSpecimen[]) => {
        await sendInBatches(
          createDrafts,
          items.map(({ key, request, requirement }) => ({
            api: specimenApi.createSpecimenFromDefinition,
            pathParams: { facilityId, serviceRequestId: request.id },
            referenceId: key,
            body: createDraftPayload(requirement),
          })),
        );
        await queryClient.invalidateQueries({
          queryKey: ["service_request_batch"],
        });
      },
    });

  const { mutateAsync: saveBatch } = useBatchRequest({});
  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (requests: BatchRequestObject[]) =>
      sendInBatches(saveBatch, requests),
    onSuccess: (collected, requests) => {
      if (!collected) return;
      toast.success(t("specimens_collected_count", { count: collected }));
      queryClient.invalidateQueries({
        queryKey: ["serviceRequests", facilityId],
      });
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId],
      });
      if (collected === requests.length) {
        onSaved();
      } else {
        // A later batch failed: reload so only the unsaved tests remain.
        queryClient.invalidateQueries({ queryKey: ["service_request_batch"] });
      }
    },
  });

  return {
    pending,
    collectedCount,
    isError,
    isLoading,
    isSaving,
    save,
    prepareDrafts,
    isPreparingDrafts,
  };
}
