import { useQuery } from "@tanstack/react-query";

import careConfig from "@careConfig";

import query from "@/Utils/request/query";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

export function useQuestionnaireFavorites(
  facilityId: string | undefined,
  subjectType = "encounter",
) {
  return useQuery({
    queryKey: ["questionnaire-favorites", facilityId, subjectType],
    queryFn: async (context) => {
      // Favorite writes use the questionnaire's own facility. Instance forms
      // and facility forms therefore live in separate favorite lists.
      const responses = await Promise.all(
        [undefined, ...(facilityId ? [facilityId] : [])].map((facility) =>
          query.paginated(questionnaireApi.list, {
            silent: true,
            pageSize: careConfig.maxFormDialogFavorites,
            queryParams: {
              favorite_list: "favorites_form",
              facility,
              facility_or_instance: facilityId,
              status: "active",
              subject_type: subjectType,
            },
          })(context),
        ),
      );
      return Array.from(
        new Map(
          responses.flatMap((response) =>
            response.results.map((form) => [form.id, form] as const),
          ),
        ).values(),
      );
    },
  });
}
