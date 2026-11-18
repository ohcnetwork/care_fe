import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
import { SpecimenRead, SpecimenStatus } from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

import { createDraftPayload } from "./useServiceRequestSpecimens";

export interface PendingSpecimen {
  key: string;
  request: ServiceRequestReadSpec;
  requirement: SpecimenDefinitionRead;
  draft?: SpecimenRead;
}

// The backend takes at most 20 requests in one batch.
const BATCH_SIZE = 20;

/**
 * Sends the requests 20 at a time, one batch after another, and returns how
 * many went through. A batch saves all or nothing, so after a failed batch
 * the earlier ones stay saved.
 */
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

/**
 * Loads requests and their activity definitions in batch requests, creates
 * missing drafts as Print All QR Codes does, and saves them, 20 to a batch.
 */
export function useBatchSpecimenCollection(
  facilityId: string,
  requests: ServiceRequestReadSpec[],
  onSaved: () => void,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Ticks cover one page of at most 20 requests, so one batch loads them.
  const ids = requests.map(({ id }) => id);
  const requestBatch = useQuery({
    queryKey: ["service_request_batch", facilityId, ids],
    queryFn: batchQuery<ServiceRequestReadSpec>(
      ids.map((id) => ({
        api: serviceRequestApi.retrieveServiceRequest,
        pathParams: { facilityId, serviceRequestId: id },
        referenceId: id,
      })),
    ),
    enabled: ids.length > 0,
    // Each opening loads afresh, so collected specimens never show as pending.
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
  const isFetching = requestBatch.isFetching || definitionBatch.isFetching;

  // As on the request page, a requirement is pending until a specimen for it
  // is available, and each specimen fills one requirement.
  const pending: PendingSpecimen[] = loaded.flatMap((request) => {
    const definition = definitions.get(request.activity_definition?.slug ?? "");
    const used = new Set<string>();
    return (definition?.specimen_requirements ?? []).flatMap(
      (requirement, index) => {
        const matching = request.specimens.filter(
          (specimen) =>
            specimen.specimen_definition?.id === requirement.id &&
            !used.has(specimen.id),
        );
        const specimen =
          matching.find(({ status }) => status === SpecimenStatus.available) ??
          matching.find(({ status }) => status === SpecimenStatus.draft);
        if (specimen) used.add(specimen.id);
        return specimen?.status === SpecimenStatus.available
          ? []
          : [
              {
                key: `${request.id}-${index}`,
                request,
                requirement,
                draft: specimen,
              },
            ];
      },
    );
  });

  const missing = pending.filter(({ draft }) => !draft);
  const {
    mutateAsync: createDrafts,
    isPending: isCreatingDrafts,
    isError: draftsFailed,
  } = useBatchRequest({
    // After each batch, so drafts made before a failed batch still show.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["service_request_batch"] }),
  });
  // Waits for fresh data, so drafts are made once and only for what's missing.
  const draftsRequested = useRef(false);
  useEffect(() => {
    if (isFetching || !missing.length || draftsRequested.current) return;
    draftsRequested.current = true;
    sendInBatches(
      createDrafts,
      missing.map(({ key, request, requirement }) => ({
        api: specimenApi.createSpecimenFromDefinition,
        pathParams: { facilityId, serviceRequestId: request.id },
        referenceId: key,
        body: createDraftPayload(requirement),
      })),
    );
  }, [isFetching, missing, createDrafts, facilityId]);

  const { mutateAsync: saveBatch } = useBatchRequest({});
  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (specimens: SpecimenRead[]) =>
      sendInBatches(
        saveBatch,
        specimens.map((specimen) => ({
          api: specimenApi.updateSpecimen,
          pathParams: { facilityId, specimenId: specimen.id },
          referenceId: specimen.id,
          body: specimen,
        })),
      ),
    onSuccess: (collected, specimens) => {
      if (!collected) return;
      toast.success(t("specimens_collected_count", { count: collected }));
      queryClient.invalidateQueries({
        queryKey: ["serviceRequests", facilityId],
      });
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId],
      });
      if (collected === specimens.length) {
        onSaved();
      } else {
        // A later batch failed: stay open, and reload so only the rest show.
        queryClient.invalidateQueries({ queryKey: ["service_request_batch"] });
      }
    },
  });

  return {
    pending,
    isPreparing:
      isLoading || isCreatingDrafts || (missing.length > 0 && !draftsFailed),
    isSaving,
    save,
  };
}
