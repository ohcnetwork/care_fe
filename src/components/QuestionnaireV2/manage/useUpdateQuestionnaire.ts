import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";
import { useBatchRequest } from "@/Utils/request/batch";

import {
  QuestionnaireRead,
  QuestionnaireScope,
  QuestionnaireUpdate,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";

import type { OrganizationSelection } from "./OrganizationsField";

interface OrganizationUpdate extends OrganizationSelection {
  scope: QuestionnaireScope;
}

interface SaveVariables {
  body: QuestionnaireUpdate;
  organizations?: OrganizationUpdate;
  onCallSaved?: (updated: QuestionnaireRead) => void;
}

/** Metadata and pending organization access changes save atomically. */
export function useUpdateQuestionnaire(
  id: string,
  onSaved?: (updated: QuestionnaireRead) => void,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const batch = useBatchRequest({});

  const update = useMutation({
    mutationFn: async ({ body, organizations }: SaveVariables) => {
      if (!organizations) {
        return mutate(questionnaireApi.update, { pathParams: { id } })(body);
      }
      const facility = organizations.scope.authContext === "facility";
      const { results } = await batch.mutateAsync([
        {
          api: questionnaireApi.update,
          pathParams: { id },
          body,
          referenceId: "questionnaire",
        },
        {
          api: facility
            ? questionnaireApi.setFacilityOrganizations
            : questionnaireApi.setOrganizations,
          pathParams: { id },
          body: facility
            ? { facility_organizations: organizations.ids }
            : { organizations: organizations.ids },
          referenceId: "organizations",
        },
      ]);
      // The batch reference always contains the typed update response.
      return results.find((result) => result.reference_id === "questionnaire")
        ?.data as QuestionnaireRead;
    },
    onSuccess: async (updated, { organizations, onCallSaved }) => {
      queryClient.setQueryData(questionnaireKeys.detail(id), updated);
      if (organizations) {
        const facility = organizations.scope.authContext === "facility";
        const records = facility
          ? (organizations.facilityOrganizations ?? [])
          : organizations.organizations;
        const selectedIds = new Set(organizations.ids);
        // Seed the saved selection even if its picker is unmounted or the
        // following background refresh fails. Never restore stale access.
        if (
          records.length === organizations.ids.length &&
          records.every((record) => selectedIds.has(record.id))
        ) {
          queryClient.setQueryData(
            questionnaireKeys.organizations(
              id,
              facility ? "facility" : "instance",
            ),
            { count: records.length, results: records },
          );
        }
      }
      // Keep controls locked until the new baseline is available. Only then
      // may the page clear its pending selection and report a clean form.
      await queryClient.invalidateQueries({ queryKey: questionnaireKeys.all });
      toast.success(t("questionnaire_updated_successfully"));
      onSaved?.(updated);
      onCallSaved?.(updated);
    },
  });

  return {
    isPending: update.isPending,
    mutate: (
      body: QuestionnaireUpdate,
      organizations?: OrganizationUpdate,
      onCallSaved?: (updated: QuestionnaireRead) => void,
    ) => update.mutate({ body, organizations, onCallSaved }),
  };
}
