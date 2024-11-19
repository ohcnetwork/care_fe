import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import DropdownMenu, { DropdownItem } from "@/components/Common/Menu";

export interface SortOption {
  isAscending: boolean;
  value: string;
}

interface Props {
  label?: string;
  options: SortOption[];
  onSelect: (query: { ordering: string }) => void;
  selected?: string;
}

/**
 * Ensure the sort option values are present in the locale.
 */
export default function SortDropdownMenu(props: Props) {
  const { t } = useTranslation();
  return (
    <DropdownMenu
      title={props.label ?? t("sort_by")}
      variant="secondary"
      className="w-full border border-primary-500 bg-white md:w-auto"
      icon={<CareIcon icon="l-sort" />}
      containerClassName="w-full md:w-auto"
    >
      {props.options.map(({ isAscending, value }, i) => (
        <DropdownItem
          key={i}
          className={
            props.selected === value
              ? "bg-primary-100 !font-medium text-primary-500"
              : ""
          }
          onClick={() => props.onSelect({ ordering: value })}
          icon={
            <CareIcon
              icon={isAscending ? "l-sort-amount-up" : "l-sort-amount-down"}
            />
          }
        >
          <span>{t("SORT_OPTIONS__" + value)}</span>
        </DropdownItem>
      ))}
    </DropdownMenu>
  );
}
