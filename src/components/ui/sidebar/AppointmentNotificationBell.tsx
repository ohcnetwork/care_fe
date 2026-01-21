import { Bell } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import scheduleApi from "@/types/scheduling/scheduleApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";

interface AppointmentNotificationBellProps {
  facilityId: string;
}

export function AppointmentNotificationBell({
  facilityId,
}: AppointmentNotificationBellProps) {
  const { t } = useTranslation();
  const { open } = useSidebar();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Fetch today's booked appointments for the current user
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments-notification", facilityId, today],
    queryFn: query(scheduleApi.appointments.list, {
      pathParams: { facilityId },
      queryParams: {
        slot_date_after: today,
        slot_date_before: today,
        status: "booked",
        limit: 1, // We only need the count, not all records
      },
      silent: true, // Don't show error alerts
    }),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: false, // Don't retry on failure
  });

  const count = appointments?.count ?? 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8 shrink-0"
            asChild
          >
            <Link href={`/facility/${facilityId}/appointments`}>
              <Bell className={`size-4 ${isLoading ? "animate-pulse" : ""}`} />
              {count > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs font-bold"
                >
                  {count > 99 ? "99+" : count}
                </Badge>
              )}
              <span className="sr-only">
                {t("appointments_notification", { count })}
              </span>
            </Link>
          </Button>
        </TooltipTrigger>
        {!open && (
          <TooltipContent side="right">
            {count > 0
              ? t("appointments_today_count", { count })
              : t("no_appointments_today")}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
