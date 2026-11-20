import { useQueryParams } from "raviger";

import { QuestionnaireResponseStatus } from "@/types/questionnaire/questionnaireResponse";

import type { ResourceResponseFilterValues } from "./ResourceResponseFilters";

/** Keep response selection, pagination and filter labels in the shareable URL. */
export function useResourceResponseParams() {
  const [params, setParams] = useQueryParams();
  const parsedPage = Number(params.page);
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const responseId = params.response || undefined;
  const filters: ResourceResponseFilterValues = {
    questionnaire: params.questionnaire || undefined,
    questionnaireTitle: params.questionnaire_title || undefined,
    createdBy: params.created_by || undefined,
    creatorName: params.creator_name || undefined,
    status: Object.values(QuestionnaireResponseStatus).includes(params.status)
      ? (params.status as QuestionnaireResponseStatus)
      : undefined,
  };
  const hasFilters = !!(
    filters.questionnaire ||
    filters.createdBy ||
    filters.status
  );

  const updateParams = (
    patch: Record<string, string | undefined>,
    replace = false,
  ) => {
    setParams(
      Object.fromEntries(
        Object.entries({ ...params, ...patch }).filter(
          ([, value]) => value !== undefined && value !== "",
        ),
      ),
      { replace },
    );
  };
  const handleFiltersChange = (
    patch: Partial<ResourceResponseFilterValues>,
  ) => {
    const next = { ...filters, ...patch };
    updateParams({
      questionnaire: next.questionnaire,
      questionnaire_title: next.questionnaire
        ? next.questionnaireTitle
        : undefined,
      created_by: next.createdBy,
      creator_name: next.createdBy ? next.creatorName : undefined,
      status: next.status,
      page: undefined,
      response: undefined,
    });
  };
  const clearFilters = () =>
    handleFiltersChange({
      questionnaire: undefined,
      questionnaireTitle: undefined,
      createdBy: undefined,
      creatorName: undefined,
      status: undefined,
    });

  return {
    page,
    responseId,
    filters,
    hasFilters,
    updateParams,
    handleFiltersChange,
    clearFilters,
  };
}
