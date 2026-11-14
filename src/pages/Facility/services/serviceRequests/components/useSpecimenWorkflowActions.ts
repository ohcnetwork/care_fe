import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import useAuthUser from "@/hooks/useAuthUser";
import {
  ProcessingSpec,
  SpecimenRead,
  SpecimenStatus,
} from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import mutate from "@/Utils/request/mutate";

interface UseSpecimenWorkflowActionsOptions {
  facilityId: string;
  serviceRequestId: string;
  collectedSpecimen?: SpecimenRead;
}

export function useSpecimenWorkflowActions({
  facilityId,
  serviceRequestId,
  collectedSpecimen,
}: UseSpecimenWorkflowActionsOptions) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUserId = useAuthUser().id;

  // --- Mutations (specific to the collected specimen) ---
  const { mutate: updateProcessing } = useMutation({
    mutationFn: (processingSteps: ProcessingSpec[]) => {
      if (!collectedSpecimen) return Promise.reject("No specimen to update");

      const payload: SpecimenRead = {
        ...collectedSpecimen,
        processing: processingSteps,
      };

      return mutate(specimenApi.updateSpecimen, {
        pathParams: { facilityId, specimenId: collectedSpecimen.id },
      })(payload);
    },
    onSuccess: () => {
      toast.success(`Processing updated for ${collectedSpecimen?.id}`);
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
    },
    onError: (err) => {
      toast.error(
        `Failed to update processing: ${err.message || "Unknown error"}`,
      );
    },
  });

  const { mutate: discardSpecimen, isPending: isDiscarding } = useMutation({
    mutationFn: (status: SpecimenStatus) => {
      if (!collectedSpecimen) return Promise.reject("No specimen to discard");
      return mutate(specimenApi.updateSpecimen, {
        pathParams: { facilityId, specimenId: collectedSpecimen.id },
      })({
        ...collectedSpecimen,
        status,
      });
    },
    onSuccess: () => {
      toast.success(`Specimen ${collectedSpecimen?.id} marked as discarded.`);
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
    },
    onError: (err) => {
      toast.error(
        `Failed to discard specimen: ${err.message || "Unknown error"}`,
      );
    },
  });

  // --- Handlers (acting on the collected specimen) ---
  const handleAddProcessing = (newStep: ProcessingSpec) => {
    if (!currentUserId || !collectedSpecimen) return; // Need user and specimen
    const stepWithPerformer: ProcessingSpec = {
      ...newStep,
      performer: currentUserId,
      time_date_time: new Date().toISOString(),
    };
    const updatedProcessing = [
      ...(collectedSpecimen.processing ?? []),
      stepWithPerformer,
    ];
    updateProcessing(updatedProcessing);
  };

  const handleUpdateProcessing = (
    index: number,
    updatedStepData: ProcessingSpec,
  ) => {
    if (!currentUserId || !collectedSpecimen) return;
    const updatedProcessing = [...(collectedSpecimen.processing ?? [])];
    if (updatedProcessing[index]) {
      updatedProcessing[index] = {
        ...updatedProcessing[index],
        ...updatedStepData,
        performer: currentUserId,
        time_date_time:
          updatedStepData.time_date_time ??
          updatedProcessing[index].time_date_time,
      };
      updateProcessing(updatedProcessing);
    } else {
      toast.error(t("attempted_update_nonexistent_step"));
    }
  };

  return {
    discardSpecimen,
    isDiscarding,
    handleAddProcessing,
    handleUpdateProcessing,
  };
}
