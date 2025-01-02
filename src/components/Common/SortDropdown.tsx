import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Select
      value={props.selected}
      onValueChange={(v) => props.onSelect({ ordering: v })}
    >
      <SelectTrigger className="w-auto">
        {props.selected ? (
          <SelectValue />
        ) : (
          <div>
            <CareIcon icon="l-sort" className="mr-2" />
            {t("sort_by")}
          </div>
        )}
      </SelectTrigger>
      <SelectContent>
        {props.options.map(({ isAscending, value }, i) => (
          <SelectItem key={i} value={value}>
            <CareIcon
              icon={isAscending ? "l-sort-amount-up" : "l-sort-amount-down"}
              className="mr-2"
            />
            {t("SORT_OPTIONS__" + value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
