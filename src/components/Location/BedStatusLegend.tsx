import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface BedStatusLegendProps {
  className?: string;
}

export function BedStatusLegend({ className }: BedStatusLegendProps) {
  const { t } = useTranslation();

  const statuses = [
    {
      image: "/images/bed-available.svg",
      label: t("available"),
    },
    {
      image: "/images/bed-available-selected.svg",
      label: t("available_selected"),
    },
    {
      image: "/images/bed-unavailable.svg",
      label: t("occupied"),
    },
    {
      image: "/images/bed-unavailable-selected.svg",
      label: t("occupied_selected"),
    },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {statuses.map((status) => (
        <div key={status.label} className="flex items-center gap-2">
          <div className="relative size-6">
            <img
              src={status.image}
              alt={status.label}
              className="w-full h-full"
            />
          </div>
          <span className="text-xs">{status.label}</span>
        </div>
      ))}
    </div>
  );
}
