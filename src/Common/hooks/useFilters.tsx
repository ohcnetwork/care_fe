import { useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import GenericFilterBadge from "../../CAREUI/display/FilterBadge";
import { KASP_STRING } from "../constants";

export type FilterState = Record<string, unknown>;

interface FilterBadgeProps {
  name: string;
  value?: string | undefined;
  paramKey: string | string[];
}

/**
 * A custom hook wrapped around raviger's `useQueryParams` hook to ease handling
 * of pagination and filters.
 */
export default function useFilters({ limit }: { limit: number }) {
  const [showFilters, setShowFilters] = useState(false);
  const [qParams, setQueryParams] = useQueryParams();

  const updateQuery = (filter: FilterState) => {
    setQueryParams(Object.assign({}, qParams, { page: 1, limit, ...filter }), {
      replace: true,
    });
  };

  const updatePage = (page: number) => {
    setQueryParams(Object.assign({}, qParams, { page }), { replace: true });
  };

  const applyFilter = (filter: FilterState) => {
    updateQuery({ ...qParams, ...filter });
  };

  const removeFilter = (param: string) => {
    updateQuery({ ...qParams, [param]: "" });
  };

  const removeFilters = (keys: string[]) => {
    updateQuery(keys.reduce((acc, key) => ({ ...acc, [key]: "" }), qParams));
  };

  const FilterBadge = ({ name, value, paramKey }: FilterBadgeProps) => {
    if (Array.isArray(paramKey)) {
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
    }

    return (
      <GenericFilterBadge
        name={name}
        value={value === undefined ? qParams[paramKey] : value}
        onRemove={() => removeFilter(paramKey)}
      />
    );
  };

  const badgeConstructorUtils = {
    badge(name: string, paramKey: string) {
      return { name, paramKey };
    },

    value(name: string, paramKey: string, value: string) {
      return { name, value, paramKey };
    },

    phoneNumber(name = "Phone Number", paramKey = "phone_number") {
      return {
        name: name,
        value: qParams[paramKey] as string,
        paramKey: paramKey,
      };
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
      return badgeConstructorUtils.range(name, paramKey, "after", "before");
    },

    kasp(nameSuffix = "", paramKey = "is_kasp") {
      const value =
        (qParams[paramKey] === "true" && KASP_STRING) ||
        (qParams[paramKey] === "false" && "Non " + KASP_STRING) ||
        "";
      const name = nameSuffix ? KASP_STRING + " " + nameSuffix : KASP_STRING;
      return { name, value, paramKey };
    },
  };

  const FilterBadges = ({
    badges,
  }: {
    badges: (utils: typeof badgeConstructorUtils) => FilterBadgeProps[];
  }) => {
    const compiledBadges = badges(badgeConstructorUtils);
    const { t } = useTranslation();
    return (
      <div className="flex items-center gap-2 my-2 flex-wrap w-full col-span-3">
        {compiledBadges.map((props) => (
          <FilterBadge {...props} name={t(props.name)} />
        ))}
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
      onChange: (filter: FilterState) => {
        applyFilter(filter);
        setShowFilters(false);
      },
      closeFilter: () => setShowFilters(false),
    },
  };
}
