import { useTranslation } from "react-i18next";

import { FilterSelect } from "@/components/ui/filter-select";

type ArchiveStatus = "active" | "archived";

interface ArchiveStatusFilterProps {
  /** Raw `is_archived` query param: "true", "false" or undefined (all). */
  value?: string;
  onChange: (isArchived: "true" | "false" | undefined) => void;
}

const STATUS_TO_PARAM: Record<ArchiveStatus, "true" | "false"> = {
  active: "false",
  archived: "true",
};

/**
 * Filters a file/report list by archive status. Leaving it cleared lists
 * both active and archived entries.
 */
export function ArchiveStatusFilter({
  value,
  onChange,
}: ArchiveStatusFilterProps) {
  const { t } = useTranslation();

  const selected =
    value === "true" ? "archived" : value === "false" ? "active" : "";

  return (
    <FilterSelect
      value={selected}
      label={t("status")}
      options={Object.keys(STATUS_TO_PARAM)}
      onValueChange={(status) =>
        onChange(status ? STATUS_TO_PARAM[status as ArchiveStatus] : undefined)
      }
      onClear={() => onChange(undefined)}
    />
  );
}
