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
  const isFetching = requestBatch.isFetching || definitionBatch.isFetching;
  const isError = requestBatch.isError || definitionBatch.isError;

  // A requirement is pending until it has its own available specimen.
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["service_request_batch"] }),
  });
  // Once, after fresh data loads, so only missing drafts are made.
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
        // A later batch failed: reload so only the unsaved cards remain.
        queryClient.invalidateQueries({ queryKey: ["service_request_batch"] });
      }
    },
  });

  return {
    pending,
    isError,
    isPreparing:
      isLoading || isCreatingDrafts || (missing.length > 0 && !draftsFailed),
    isSaving,
    save,
  };
}
