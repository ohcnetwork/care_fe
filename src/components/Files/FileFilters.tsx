import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterButtonProps {
  onFilterChange: (filter: {
    is_archived: string;
    include_archived?: boolean;
  }) => void;
  activeLabel: string;
  archivedLabel: string;
  includeArchivedParam?: boolean;
}

export function FilterButton({
  onFilterChange,
  activeLabel,
  archivedLabel,
  includeArchivedParam = false,
}: FilterButtonProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="text-sm text-secondary-800">
          <span className="flex flex-row items-center gap-1">
            <CareIcon icon="l-filter" />
            <span>{t("filter")}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[calc(100vw-2.5rem)] sm:w-[calc(100%-2rem)]"
      >
        <DropdownMenuItem
          className="text-primary-900"
          onClick={() => {
            onFilterChange(
              includeArchivedParam
                ? { is_archived: "false", include_archived: false }
                : { is_archived: "false" },
            );
          }}
        >
          <span>{activeLabel}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-primary-900"
          onClick={() => {
            onFilterChange(
              includeArchivedParam
                ? { is_archived: "true", include_archived: true }
                : { is_archived: "true" },
            );
          }}
        >
          <span>{archivedLabel}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface FilterBadgesProps {
  isArchived?: string;
  onClearFilter: () => void;
  activeLabel: string;
  archivedLabel: string;
}

export function FilterBadges({
  isArchived,
  onClearFilter,
  activeLabel,
  archivedLabel,
}: FilterBadgesProps) {
  const { t } = useTranslation();

  if (typeof isArchived === "undefined") return null;

  return (
    <div className="flex flex-row gap-2 mt-2 mx-2">
      <Badge
        variant="outline"
        className="cursor-pointer"
        onClick={onClearFilter}
      >
        {t(isArchived === "false" ? activeLabel : archivedLabel)}
        <CareIcon icon="l-times-circle" className="ml-1" />
      </Badge>
    </div>
  );
}
