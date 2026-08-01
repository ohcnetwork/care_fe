import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";

import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";

/**
 * The one save mutation for an existing questionnaire (detail page and
 * builder). Owns the cache sequence both surfaces must share:
 *
 * setQueryData BEFORE invalidate — the next save composes its full PUT body
 * (via buildUpdateBody) from the cached detail entry, so the cache must
 * reflect this save immediately; relying on the invalidation refetch alone
 * leaves a stale window (one network round-trip) where a second quick action
 * would silently revert the change that just persisted.
 *
 * `onSaved` runs after the cache work, for surface-local follow-ups (e.g.
 * the builder resets its reducer to the saved questions).
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
