import { useQueryParams } from "raviger";
import GenericFilterBadge from "../../CAREUI/display/FilterBadge";

interface FilterBadgeProps {
  name: string;
  value?: string | undefined;
  paramKey: string;
}

/**
 * A custom hook wrapped around raviger's `useQueryParams` hook to ease handling
 * of pagination and filters.
 */
export default function usePaginatedQueryParams({ limit }: { limit: number }) {
  const [qParams, setQueryParams] = useQueryParams();

  const updateQuery = (params: Record<string, unknown>) => {
    setQueryParams(Object.assign({}, qParams, { page: 1, limit, ...params }), {
      replace: true,
    });
  };

  const updatePage = (page: number) => {
    setQueryParams(Object.assign({}, qParams, { page }), { replace: true });
  };

  const applyFilter = (filters: Record<string, unknown>) => {
    updateQuery({ ...qParams, ...filters });
  };

  const removeFilter = (param: string) => {
    updateQuery({ ...qParams, [param]: "" });
  };

  const removeFilters = (params: string[]) => {
    const filter = { ...qParams };
    params.forEach((key) => {
      filter[key] = "";
    });
    updateQuery(filter);
  };

  const FilterBadge = ({ name, value, paramKey }: FilterBadgeProps) => {
    return (
      <GenericFilterBadge
        name={name}
        value={value === undefined ? qParams[paramKey] : value}
        onRemove={() => removeFilter(paramKey)}
      />
    );
  };

  return {
    qParams,

    /**
     * Updates the query params and resets to page 1.
     * To prevent reset to page 1, pass the `page` property along with the obj.
     */
    updateQuery,

    /**
     * Updates the query params with the specified page.
     */
    updatePage,

    /**
     * Updates query params with the filters.
     */
    applyFilter,

    /**
     * Removes the filter from query param
     * @param param is the key of the filter to be removed.
     */
    removeFilter,

    /**
     * Removes multiple filters from query param
     * @param params is the list of keys to be removed.
     */
    removeFilters,

    FilterBadge,
  };
}
