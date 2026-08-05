import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";

import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";

/**
 * Save mutation for an existing questionnaire. Cache is updated before
 * invalidation because the next full PUT body is composed from cached detail
 * data; `onSaved` runs after that cache update for surface-local follow-ups.
 */
export function useUpdateQuestionnaire(
  id: string,
  onSaved?: (updated: QuestionnaireRead) => void,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutate(questionnaireApi.update, { pathParams: { id } }),
    onSuccess: (updated: QuestionnaireRead) => {
      queryClient.setQueryData(questionnaireKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.all });
      toast.success(t("questionnaire_updated_successfully"));
      onSaved?.(updated);
    },
  });
}
