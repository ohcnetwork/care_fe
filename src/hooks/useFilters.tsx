import { QueryParam, setQueryParamsOptions, useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import GenericFilterBadge from "@/CAREUI/display/FilterBadge";

import PaginationComponent from "@/components/Common/Pagination";

import FiltersCache from "@/Utils/FiltersCache";
import { QueryParams } from "@/Utils/request/types";
import { humanizeStrings } from "@/Utils/utils";

export type FilterState = Record<string, unknown>;

interface FilterBadgeProps {
  name: string;
  value?: string;
  paramKey: string | string[];
}

/**
 * A custom hook wrapped around raviger's `useQueryParams` hook to ease handling
 * of pagination and filters.
 */
export default function useFilters({
  limit = 14,
  cacheBlacklist = [],
  disableCache = false,
  defaultQueryParams = {},
}: {
  limit?: number;
  cacheBlacklist?: string[];
  disableCache?: boolean;
  defaultQueryParams?: QueryParams;
}) {
  const { t } = useTranslation();
  const hasPagination = limit > 0;
  const [showFilters, setShowFilters] = useState(false);
  const [qParams, _setQueryParams] = useQueryParams();
  const [clearSearch, setClearSearch] = useState<{
    value: boolean;
    params?: string[];
  }>({ value: false });

  const updateCache = (query: QueryParam) => {
    if (disableCache) return;
    const blacklist = FILTERS_CACHE_BLACKLIST.concat(cacheBlacklist);
    FiltersCache.set(query, blacklist);
  };

  const setQueryParams = (
    query: QueryParam,
    options?: setQueryParamsOptions,
  ) => {
    query = FiltersCache.utils.clean(query);
    _setQueryParams(query, { ...options, replace: true });
    updateCache(query);
  };

  const updateQuery = (filter: FilterState) => {
    filter = hasPagination ? { page: 1, limit, ...filter } : filter;
    setQueryParams(Object.assign({}, qParams, filter), { overwrite: true });
    setClearSearch({ value: false });
  };
  const updatePage = (page: number) => {
    if (!hasPagination) return;
    setQueryParams(Object.assign({}, qParams, { page }), { overwrite: true });
  };
  const removeFilters = (params?: string[]) => {
    params ??= Object.keys(qParams);
    setQueryParams(removeFromQuery(qParams, params));
    setClearSearch({ value: true, params: params });
  };
  const removeFilter = (param: string) => removeFilters([param]);

  useEffect(() => {
    if (disableCache) {
      // Clean-up any existing cache if present for this path.
      FiltersCache.invalidate();

      // Skip cache restoration logic for this usage.
      return;
    }

    const qParamKeys = Object.keys(qParams);

    // If we navigate to a path that has query params set on mount,
    // skip restoring the cache, instead update the cache with new filters.
    if (qParamKeys.length) {
      updateCache(qParams);
      return;
    }

    const cache = FiltersCache.get();
    if (!cache) {
      return;
    }

    // Restore cache
    setQueryParams(cache);
  }, []);

  useEffect(() => {
    const defaults = Object.fromEntries(
      Object.entries(defaultQueryParams).filter(
        ([key]) => qParams[key] === undefined,
      ),
    );
    if (Object.keys(defaults).length > 0) {
      updateQuery(defaults);
    }
  }, []);

  const FilterBadge = ({ name, value, paramKey }: FilterBadgeProps) => {
    if (Array.isArray(paramKey))
      return (
        <GenericFilterBadge
          key={name}
          name={name}
          value={
            value === undefined
              ? humanizeStrings(paramKey.map((k) => qParams[k]).filter(Boolean))
              : value
          }
          onRemove={() => removeFilters(paramKey)}
        />
      );
    return (
      <GenericFilterBadge
        name={name}
        value={value === undefined ? qParams[paramKey] : value}
        onRemove={() => removeFilter(paramKey)}
      />
    );
  };

  const badgeUtils = {
    badge(name: string, paramKey: FilterBadgeProps["paramKey"]) {
      return { name, paramKey };
    },
    ordering(name = "Sort by", paramKey = "ordering") {
      return {
        name,
        paramKey,
        value: qParams[paramKey] && t("SORT_OPTIONS__" + qParams[paramKey]),
      };
    },
    value(name: string, paramKey: FilterBadgeProps["paramKey"], value: string) {
      return { name, value, paramKey };
    },
    phoneNumber(name = "Phone Number", paramKey = "phone_number") {
      return { name, value: qParams[paramKey] as string, paramKey };
    },
    range(name: string, paramKey: string, minKey = "min", maxKey = "max") {
      const paramKeys = [paramKey + "_" + minKey, paramKey + "_" + maxKey];
      const values = [qParams[paramKeys[0]], qParams[paramKeys[1]]];
      if (values[0] === values[1])
        return [{ name, value: values[0], paramKey: paramKeys[0] }];
      return [name + " " + minKey, name + " " + maxKey].map((name, i) => {
        return { name, value: values[i], paramKey: paramKeys[i] };
      });
    },
    dateRange(name = "Date", paramKey = "date") {
      return badgeUtils.range(name, paramKey, "after", "before");
    },
    boolean(
      name: string,
      paramKey: string,
      options?: {
        trueLabel?: string;
        falseLabel?: string;
        trueValue?: string;
        falseValue?: string;
      },
    ) {
      const {
        trueLabel = "Yes",
        falseLabel = "No",
        trueValue = "true",
        falseValue = "false",
      } = options || {};

      const value =
        (qParams[paramKey] === trueValue && trueLabel) ||
        (qParams[paramKey] === falseValue && falseLabel) ||
        "";
      return { name, value, paramKey };
    },
  };

  const FilterBadges = ({
    badges,
    children,
  }: {
    badges: (utils: typeof badgeUtils) => FilterBadgeProps[];
    children?: React.ReactNode;
  }) => {
    const compiledBadges = badges(badgeUtils);
    const { t } = useTranslation();

    const activeFilters = compiledBadges.reduce((acc, badge) => {
      const { paramKey } = badge;

      if (Array.isArray(paramKey)) {
        const active = paramKey.filter((key) => qParams[key]);
        if (active) acc.concat(active);
      } else {
        if (qParams[paramKey]) acc.push(paramKey);
      }

      return acc;
    }, [] as string[]);

    const show = activeFilters.length > 0 || children;

    return (
      <div
        className={`col-span-3 flex w-full flex-wrap items-center gap-2 ${show ? "" : "hidden"}`}
      >
        {compiledBadges.map((props) => (
          <FilterBadge {...props} name={t(props.name)} key={props.name} />
        ))}
        {children}
        {show && (
          <button
            id="clear-all-filters"
            className="rounded-full border border-secondary-300 bg-white px-2 py-1 text-xs text-secondary-600 hover:text-secondary-800"
            onClick={() => removeFilters()}
          >
            {t("clear_all_filters")}
          </button>
        )}
      </div>
    );
  };

  const Pagination = ({
    totalCount,
    noMargin,
  }: {
    totalCount: number;
    noMargin?: boolean;
  }) => {
    if (!hasPagination) {
      const errorMsg = "Do not render Pagination component, when limit is <= 0";
      return <span className="bg-red-500 text-white">{errorMsg}</span>;
    }
    return (
      <div
        className={cn(
          "flex w-full justify-center",
          totalCount > limit ? "visible" : "invisible",
          !noMargin && "mt-4",
        )}
      >
        <PaginationComponent
          cPage={qParams.page}
          defaultPerPage={limit}
          data={{ totalCount }}
          onChange={(page) => updatePage(page)}
        />
      </div>
    );
  };

  return {
    qParams,
    resultsPerPage: limit,
    /**
     * Updates the query params and resets to page 1.
     * To prevent reset to page 1, pass the `page` property along with the obj.
     */
    updateQuery,
    /** Temp. alias of `updateQuery` until the new Filters slideover. Do not use. */
    applyFilter: updateQuery,
    /** Updates the query params with the specified page. */
    updatePage,
    /**
     * Removes the filter from query param
     * @param param is the key of the filter to be removed.
     */
    removeFilter,
    clearSearch,

    /**
     * Removes multiple filters from query param
     * @param params is the list of keys to be removed.
     */
    removeFilters,
    FilterBadge,
    FilterBadges,
    Pagination,

    advancedFilter: {
      show: showFilters,
      setShow: setShowFilters,
      filter: qParams,
      removeFilters,
      onChange: (filter: FilterState) => {
        updateQuery(filter);
        setShowFilters(false);
      },
      closeFilter: () => setShowFilters(false),
    },
  };
}

const removeFromQuery = (query: Record<string, unknown>, params: string[]) => {
  const result = { ...query };
  for (const param of params) {
    delete result[param];
  }
  return result;
};

const FILTERS_CACHE_BLACKLIST = ["page", "limit", "offset"];
