import { useTranslation } from "react-i18next";

import {
  BedAvailableSelected,
  BedAvailableUnselected,
  BedUnavailableSelected,
  BedUnavailableUnselected,
} from "@/CAREUI/icons/CustomIcons";
import { cn } from "@/lib/utils";

interface BedStatusLegendProps {
  className?: string;
}

export function BedStatusLegend({ className }: BedStatusLegendProps) {
  const { t } = useTranslation();

  const statuses = [
    {
      icon: BedAvailableUnselected,
      label: t("available"),
    },
    {
      icon: BedAvailableSelected,
      label: t("available_selected"),
    },
    {
      icon: BedUnavailableUnselected,
      label: t("occupied"),
    },
    {
      icon: BedUnavailableSelected,
      label: t("occupied_selected"),
    },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {statuses.map((status) => (
        <div key={status.label} className="flex items-center gap-2">
          <div className="relative size-6">
            <status.icon className="h-full w-full" />
          </div>
          <span className="text-xs">{status.label}</span>
        </div>
      ))}
    </div>
  );
}
