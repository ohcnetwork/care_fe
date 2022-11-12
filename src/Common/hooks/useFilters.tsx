import { useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import GenericFilterBadge from "../../CAREUI/display/FilterBadge";

interface FilterBadgeProps {
  name: string;
  value?: string | undefined;
  paramKey: string;
}

interface FilterBadgesProps {
  badges: (FilterBadgeProps | undefined)[];
}

/**
 * A custom hook wrapped around raviger's `useQueryParams` hook to ease handling
 * of pagination and filters.
 */
export default function useFilters({ limit }: { limit: number }) {
  const [showFilters, setShowFilters] = useState(false);
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

  const FilterBadges = ({ badges }: FilterBadgesProps) => {
    const { t } = useTranslation();
    return (
      <div className="flex items-center gap-2 my-2 flex-wrap w-full col-span-3">
        {badges.map(
          (props) => props && <FilterBadge {...props} name={t(props.name)} />
        )}
      </div>
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
    FilterBadges,

    // TODO: update this props to be compliant with new FiltersSlideOver when #3996 is merged.
    advancedFilter: {
      show: showFilters,
      setShow: setShowFilters,
      filter: qParams,
      onChange: (data: Record<string, unknown>) => {
        applyFilter(data);
        setShowFilters(false);
      },
      closeFilter: () => setShowFilters(false),
    },
  };
}
