import { useTranslation } from "react-i18next";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DropdownMenu, { DropdownItem } from "./components/Menu";

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
      className="border border-primary-500 bg-white"
      icon={<CareIcon icon="l-sort" />}
    >
      {props.options.map(({ isAscending, value }) => (
        <DropdownItem
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
          <span>{t("SortOptions." + value)}</span>
        </DropdownItem>
      ))}
    </DropdownMenu>
  );
}
