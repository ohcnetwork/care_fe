import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { batchQuery, useBatchRequest } from "@/Utils/request/batch";
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

/**
 * Loads requests and their activity definitions in batch requests, creates
 * missing drafts as Print All QR Codes does, and saves in one batch.
 */
export function useBatchSpecimenCollection(
  facilityId: string,
  requests: ServiceRequestReadSpec[],
  onSaved: () => void,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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
    mutate: createDrafts,
    isPending: isCreatingDrafts,
    isError: draftsFailed,
  } = useBatchRequest({
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["service_request_batch"] }),
  });
  // Waits for fresh data, so drafts are made once and only for what's missing.
  const draftsRequested = useRef(false);
  useEffect(() => {
    if (isFetching || !missing.length || draftsRequested.current) return;
    draftsRequested.current = true;
    createDrafts(
      missing.map(({ key, request, requirement }) => ({
        api: specimenApi.createSpecimenFromDefinition,
        pathParams: { facilityId, serviceRequestId: request.id },
        referenceId: key,
        body: createDraftPayload(requirement),
      })),
    );
  }, [isFetching, missing, createDrafts, facilityId]);

  const { mutate: saveBatch, isPending: isSaving } = useBatchRequest({
    onSuccess: (_, collected) => {
      toast.success(
        t("specimens_collected_count", { count: collected.length }),
      );
      queryClient.invalidateQueries({
        queryKey: ["serviceRequests", facilityId],
      });
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId],
      });
      onSaved();
    },
  });

  return {
    pending,
    isPreparing:
      isLoading || isCreatingDrafts || (missing.length > 0 && !draftsFailed),
    isSaving,
    save: (specimens: SpecimenRead[]) =>
      saveBatch(
        specimens.map((specimen) => ({
          api: specimenApi.updateSpecimen,
          pathParams: { facilityId, specimenId: specimen.id },
          referenceId: specimen.id,
          body: specimen,
        })),
      ),
  };
}
