import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_I18N, type FilterI18nConfig } from "@/components/ui/filters";

/** Localizes CareUI's filter framework while retaining its non-text defaults. */
export function useFilterI18n(): FilterI18nConfig {
  const { t } = useTranslation();

  return useMemo<FilterI18nConfig>(() => {
    const operators: FilterI18nConfig["operators"] = {
      is: t("is"),
      isNot: t("is_not"),
      isAnyOf: t("filter_is_any_of"),
      isNotAnyOf: t("filter_is_not_any_of"),
      includesAll: t("filter_includes_all"),
      excludesAll: t("filter_excludes_all"),
      before: t("before"),
      after: t("after"),
      between: t("filter_between"),
      notBetween: t("filter_not_between"),
      contains: t("action_operator_contains"),
      notContains: t("action_operator_not_contains"),
      startsWith: t("filter_starts_with"),
      endsWith: t("filter_ends_with"),
      isExactly: t("filter_is_exactly"),
      equals: t("equals"),
      notEquals: t("not_equals"),
      greaterThan: t("greater"),
      lessThan: t("less"),
      overlaps: t("filter_overlaps"),
      includes: t("filter_includes"),
      excludes: t("filter_excludes"),
      includesAllOf: t("filter_includes_all_of"),
      includesAnyOf: t("filter_includes_any_of"),
      empty: t("filter_is_empty"),
      notEmpty: t("filter_is_not_empty"),
    };
    const operatorLabels = Object.fromEntries(
      Object.entries(operators).map(([key, label]) => [
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        label,
      ]),
    );

    return {
      addFilter: t("add_filter"),
      clearAll: t("clear_all"),
      removeFilter: t("remove_filter"),
      changeOperator: t("filter_change_operator"),
      searchFields: t("filter_search_fields"),
      noFieldsFound: t("filter_no_fields_found"),
      noResultsFound: t("no_results_found"),
      select: t("select"),
      true: t("true"),
      false: t("false"),
      min: t("min"),
      max: t("max"),
      to: t("to"),
      typeAndPressEnter: t("filter_type_and_press_enter"),
      selected: t("selected"),
      selectedCount: t("selected"),
      percent: DEFAULT_I18N.percent,
      defaultCurrency: DEFAULT_I18N.defaultCurrency,
      defaultColor: DEFAULT_I18N.defaultColor,
      addFilterTitle: t("filters"),
      operators,
      placeholders: {
        enterField: (fieldType) => t("filter_enter_field", { fieldType }),
        selectField: t("select"),
        searchField: (fieldName) => t("filter_search_field", { fieldName }),
        enterKey: t("filter_enter_key"),
        enterValue: t("enter_value"),
      },
      helpers: {
        formatOperator: (operator) =>
          operatorLabels[operator] ??
          t(operator, { defaultValue: operator.replace(/_/g, " ") }),
      },
      validation: {
        invalidEmail: t("invalid_email_format"),
        invalidUrl: t("invalid_url_format"),
        invalidTel: t("invalid_phone_format"),
        invalid: t("invalid_input_format"),
      },
    };
  }, [t]);
}
