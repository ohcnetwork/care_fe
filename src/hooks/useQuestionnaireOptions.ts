import { useQueries } from "@tanstack/react-query";

import query from "@/Utils/request/query";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface EditQuestionnaireOption {
  slug: string;
  title: string;
}

const DEFAULT_OPTIONS: EditQuestionnaireOption[] = [
  {
    slug: "encounter",
    title: "Update Encounter",
  },
];

export default function useQuestionnaireOptions(slugs: string[]) {
  const queries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ["questionnaire", slug] as const,
      queryFn: query(questionnaireApi.list, {
        queryParams: {
          tag_slug: slug,
        },
      }),
    })),
  });

  const allQuestionnaireOptions = queries.reduce((acc, queryResult) => {
    if (queryResult.data?.results) {
      const newOptions = queryResult.data.results.map((q) => ({
        slug: q.slug,
        title: q.title,
      }));
      return [...acc, ...newOptions];
    }
    return acc;
  }, [] as Array<EditQuestionnaireOption>);

  return [...DEFAULT_OPTIONS, ...allQuestionnaireOptions];
}
