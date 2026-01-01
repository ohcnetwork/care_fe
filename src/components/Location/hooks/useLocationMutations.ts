import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import mutate from "@/Utils/request/mutate";
import batchApi from "@/types/base/batch/batchApi";
import locationApi from "@/types/location/locationApi";

interface UnlinkLocationParams {
  facilityId: string;
  locationId: string;
  associationId: string;
  encounterId: string;
  status: "active" | "planned";
}

export function useLocationMutations(encounterId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const executeBatch = useMutation({
    mutationFn: mutate(batchApi.batchRequest, { silent: true }),
    onSuccess: () => {
      toast.success(t("bed_assigned_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["encounter", encounterId],
      });
    },
    onError: (error) => {
      const errorData = error.cause as {
        results?: Array<{
          reference_id: string;
          status_code: number;
          data: {
            errors?: Array<{
              msg?: string;
              error?: string;
              type?: string;
              loc?: string[];
            }>;
            non_field_errors?: string[];
            detail?: string;
          };
        }>;
      };

      if (errorData?.results) {
        const failedResults = errorData.results.filter(
          (result) => result.status_code !== 200,
        );

        let errorDisplayed = false;
        failedResults.forEach((result) => {
          const errors = result.data?.errors || [];
          const nonFieldErrors = result.data?.non_field_errors || [];
          const detailError = result.data?.detail;

          errors.forEach((error) => {
            const message = error.msg || error.error || t("validation_failed");
            toast.error(message);
            errorDisplayed = true;
          });

          nonFieldErrors.forEach((message) => {
            toast.error(message);
            errorDisplayed = true;
          });

          if (detailError) {
            toast.error(detailError);
            errorDisplayed = true;
          }
        });

        if (failedResults.length > 0 && !errorDisplayed) {
          toast.error(t("error_updating_location"));
        }
      } else {
        toast.error(t("error_updating_location"));
      }
    },
  });

  const unlinkLocation = useMutation({
    mutationFn: ({
      facilityId,
      locationId,
      associationId,
      encounterId,
    }: UnlinkLocationParams) => {
      return mutate(locationApi.deleteAssociation, {
        pathParams: {
          facility_external_id: facilityId,
          location_external_id: locationId,
          external_id: associationId,
        },
      })({ encounter: encounterId, status: "completed" });
    },
    onSuccess: (_, variables) => {
      if (variables.status === "active") {
        toast.success(t("bed_active_removed_due_to_error"));
      } else {
        toast.success(t("bed_planned_cancelled"));
      }
      queryClient.invalidateQueries({ queryKey: ["encounter", encounterId] });
    },
    onError: () => {
      toast.error(t("error_removing_bed_assignment"));
    },
  });

  return {
    executeBatch,
    unlinkLocation,
    isPending: executeBatch.isPending || unlinkLocation.isPending,
  };
}
