import type { ResourceResponseFilterValues } from "./ResourceResponseFilters";

import { useQueryParams } from "@/lib/router/queryParams";
import { resourceResponseListSearch } from "@/lib/router/search/questionnaire";

/** Keep response selection, pagination and filter labels in the shareable URL. */
export function useResourceResponseParams() {
  const [params, setParams] = useQueryParams(resourceResponseListSearch);
  const page = params.page ?? 1;
  const responseId = params.response || undefined;
  const filters: ResourceResponseFilterValues = {
    questionnaire: params.questionnaire || undefined,
    questionnaireTitle: params.questionnaire_title || undefined,
    createdBy: params.created_by || undefined,
    creatorName: params.creator_name || undefined,
    status: params.status,
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
