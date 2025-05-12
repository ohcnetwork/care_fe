import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

export function DeviceStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const { t } = useTranslation();

  const statusClass =
    {
      active: "bg-green-100 text-green-800 hover:bg-green-100/80",
      inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100/80",
      entered_in_error: "bg-red-100 text-red-800 hover:bg-red-100/80",
    }[status] ?? "bg-gray-100 text-gray-800 hover:bg-gray-100/80";

  return (
    <Badge variant="secondary" className={cn(className, statusClass)}>
      {t(`device_status_${status}`)}
    </Badge>
  );
}

export function DeviceAvailabilityStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const statusClass =
    {
      available: "bg-green-100 text-green-800 hover:bg-green-100/80",
      lost: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
      damaged: "bg-red-100 text-red-800 hover:bg-red-100/80",
      destroyed: "bg-red-100 text-red-800 hover:bg-red-100/80",
    }[status] ?? "bg-gray-100 text-gray-800 hover:bg-gray-100/80";

  return (
    <Badge variant="secondary" className={cn(className, statusClass)}>
      {t(`device_availability_status_${status}`)}
    </Badge>
  );
}
