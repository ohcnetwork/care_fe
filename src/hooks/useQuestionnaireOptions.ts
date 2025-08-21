import { useQuery } from "@tanstack/react-query";

import query from "@/Utils/request/query";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

export default function useQuestionnaireOptions(slug: string) {
  return (
    useQuery({
      queryKey: ["questionnaires", slug] as const,
      queryFn: query(questionnaireApi.list, {
        queryParams: {
          tag_slug: slug,
          status: "active",
          subject_type: "encounter",
        },
        silent: (res) => res.status === 404,
      }),
    }).data ?? { results: [] }
  );
}
