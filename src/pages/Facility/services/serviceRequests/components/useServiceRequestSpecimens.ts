import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useBatchRequest } from "@/Utils/request/batch";
import mutate from "@/Utils/request/mutate";
import {
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import {
  SpecimenFromDefinitionCreate,
  SpecimenStatus,
} from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

function createDraftPayload(
  requirement: SpecimenDefinitionRead,
): SpecimenFromDefinitionCreate {
  return {
    specimen_definition: requirement.id,
    specimen: {
      status: SpecimenStatus.draft,
      specimen_type: requirement.type_collected,
      accession_identifier: "",
      received_time: null,
      collection: {
        method: requirement.collection || null,
        body_site: null,
        collector: null,
        collected_date_time: null,
        quantity: null,
        procedure: null,
        fasting_status_codeable_concept: null,
        fasting_status_duration: null,
      },
      processing: [],
      condition: [],
      note: null,
    },
  };
}

interface ServiceRequestSpecimensOptions {
  request: ServiceRequestReadSpec;
  requirements: SpecimenDefinitionRead[];
  facilityId: string;
  serviceRequestId: string;
}

export function useServiceRequestSpecimens({
  request,
  requirements,
  facilityId,
  serviceRequestId,
}: ServiceRequestSpecimensOptions) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isQRCodeSheetOpen, setIsQRCodeSheetOpen] = useState(false);
  const invalidateRequest = () => {
    queryClient.invalidateQueries({
      queryKey: ["serviceRequest", facilityId, serviceRequestId],
    });
  };
  const onDraftError = () => toast.error(t("specimen_draft_create_error"));
  const {
    mutate: createDraftSpecimenFromDefinition,
    isPending: isCreatingDraftSpecimen,
  } = useMutation({
    mutationFn: mutate(specimenApi.createSpecimenFromDefinition, {
      pathParams: { facilityId, serviceRequestId },
    }),
    onSuccess: invalidateRequest,
    onError: onDraftError,
  });
  const { mutate: executeBatch, isPending: isPrintingAllQRCodes } =
    useBatchRequest({
      onSuccess: () => {
        invalidateRequest();
        setIsQRCodeSheetOpen(true);
      },
      onError: onDraftError,
    });
  const hasActiveSpecimen = (requirement: SpecimenDefinitionRead) =>
    request.specimens.some(
      (specimen) =>
        specimen.specimen_definition?.id === requirement.id &&
        (specimen.status === SpecimenStatus.available ||
          specimen.status === SpecimenStatus.draft),
    );
  const createDraftSpecimen = (requirement: SpecimenDefinitionRead) => {
    if (!hasActiveSpecimen(requirement)) {
      createDraftSpecimenFromDefinition(createDraftPayload(requirement));
    }
  };
  const preparePrintAllQRCodes = () => {
    const missingDraftDefinitions =
      request.status === Status.completed
        ? []
        : requirements.filter((requirement) => !hasActiveSpecimen(requirement));
    if (!missingDraftDefinitions.length) {
      setIsQRCodeSheetOpen(true);
      return;
    }
    executeBatch(
      missingDraftDefinitions.map((requirement, index) => ({
        api: specimenApi.createSpecimenFromDefinition,
        pathParams: { facilityId, serviceRequestId },
        referenceId: `create_specimen_${index}`,
        body: createDraftPayload(requirement),
      })),
    );
  };
  return {
    isQRCodeSheetOpen,
    setIsQRCodeSheetOpen,
    isCreatingDraftSpecimen,
    isPrintingAllQRCodes,
    createDraftSpecimen,
    preparePrintAllQRCodes,
  };
}
