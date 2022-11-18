import { useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import GenericFilterBadge from "../../CAREUI/display/FilterBadge";
import PaginationComponent from "../../Components/Common/Pagination";
import { KASP_STRING } from "../constants";

export type FilterState = Record<string, unknown>;
export type FilterParamKeys = string | string[];
interface FilterBadgeProps {
  name: string;
  value?: string;
  paramKey: FilterParamKeys;
}

/**
 * A custom hook wrapped around raviger's `useQueryParams` hook to ease handling
 * of pagination and filters.
 */
export default function useFilters({ limit = 14 }: { limit?: number }) {
  const hasPagination = limit > 0;
  const [showFilters, setShowFilters] = useState(false);
  const [qParams, setQueryParams] = useQueryParams();

  const updateQuery = (filter: FilterState) => {
    filter = hasPagination ? { page: 1, limit, ...filter } : filter;
    setQueryParams(Object.assign({}, qParams, filter), { replace: true });
  };
  const updatePage = (page: number) => {
    if (!hasPagination) return;
    setQueryParams(Object.assign({}, qParams, { page }), { replace: true });
  };
  const removeFilter = (param: string) => updateQuery({ [param]: "" });
  const removeFilters = (keys: string[]) =>
    updateQuery(keys.reduce((acc, key) => ({ ...acc, [key]: "" }), qParams));

  const FilterBadge = ({ name, value, paramKey }: FilterBadgeProps) => {
    if (Array.isArray(paramKey))
      return (
        <GenericFilterBadge
          key={name}
          name={name}
          value={
            value === undefined
              ? paramKey
                  .map((k) => qParams[k])
                  .filter(Boolean)
                  .join(", ")
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
    badge(name: string, paramKey: FilterParamKeys) {
      return { name, paramKey };
    },
    value(name: string, paramKey: FilterParamKeys, value: string) {
      return { name, value, paramKey };
    },
    phoneNumber(name = "Phone Number", paramKey = "phone_number") {
      return { name, value: qParams[paramKey] as string, paramKey };
    },
    range(name: string, paramKey: string, minKey = "min", maxKey = "max") {
      const paramKeys = [paramKey + "_" + minKey, paramKey + "_" + maxKey];
      const values = [qParams[paramKeys[0]], qParams[paramKeys[1]]];
      if (values[0] === values[1])
        return [{ name, value: values[0], paramKey: paramKeys }];
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
      }
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
    kasp(nameSuffix = "", paramKey = "is_kasp") {
      const name = nameSuffix ? KASP_STRING + " " + nameSuffix : KASP_STRING;
      const [trueLabel, falseLabel] = [KASP_STRING, "Non " + KASP_STRING];
      return badgeUtils.boolean(name, paramKey, { trueLabel, falseLabel });
    },
  };

  const FilterBadges = ({
    badges,
  }: {
    badges: (utils: typeof badgeUtils) => FilterBadgeProps[];
  }) => {
    const compiledBadges = badges(badgeUtils);
    const { t } = useTranslation();
    return (
      <div className="flex items-center gap-2 my-2 flex-wrap w-full col-span-3">
        {compiledBadges.map((props) => (
          <FilterBadge {...props} name={t(props.name)} key={props.name} />
        ))}
      </div>
    );
  };

  const Pagination = ({ totalCount }: { totalCount: number }) => {
    if (!hasPagination) {
      const errorMsg = "Do not render Pagination component, when limit is <= 0";
      return <span className="bg-red-500 text-white">{errorMsg}</span>;
    }
    return (
      <div
        className={`mt-4 flex w-full justify-center ${
          totalCount > limit ? "visible" : "invisible"
        }`}
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

    /**
     * Removes multiple filters from query param
     * @param params is the list of keys to be removed.
     */
    removeFilters,
    FilterBadge,
    FilterBadges,
    Pagination,
    // TODO: update this props to be compliant with new FiltersSlideOver when #3996 is merged.
    advancedFilter: {
      show: showFilters,
      setShow: setShowFilters,
      filter: qParams,
      onChange: (filter: FilterState) => {
        updateQuery(filter);
        setShowFilters(false);
      },
      closeFilter: () => setShowFilters(false),
    },
  };
}
