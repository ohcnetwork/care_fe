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
}

/**
 * Ensure the sort option values are present in the locale.
 */
export default function SortDropdownMenu({ label, options, onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <DropdownMenu
      title={label ?? t("sort_by")}
      variant="secondary"
      className="border border-primary-500 bg-white"
      icon={<CareIcon className="care-l-sort" />}
    >
      {options.map((option) => {
        return (
          <SortDropdownOption
            key={option.value}
            {...option}
            onClick={onSelect}
          />
        );
      })}
    </DropdownMenu>
  );
}

export function SortDropdownOption({
  isAscending,
  value,
  onClick,
}: SortOption & { onClick: (query: { ordering: string }) => void }) {
  const { t } = useTranslation();
  return (
    <DropdownItem
      onClick={() => onClick({ ordering: value })}
      icon={
        <CareIcon
          className={
            isAscending ? "care-l-sort-amount-up" : "care-l-sort-amount-down"
          }
        />
      }
    >
      <span>{t(value)}</span>
    </DropdownItem>
  );
}
