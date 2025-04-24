import { useTranslation } from "react-i18next";

import { TooltipComponent } from "@/components/ui/tooltip";

import dayjs from "@/Utils/dayjs";
import { formatDateTime } from "@/Utils/utils";

type RelativeDateTooltipProps = {
  date: string | number | Date | dayjs.Dayjs | null | undefined;
  className?: string;
  format?: "ago" | "since";
};

export default function RelativeDateTooltip({
  date,
  className = "",
  format = "ago",
}: RelativeDateTooltipProps) {
  const { t } = useTranslation();
  if (!date) return null;

  const dateObj = dayjs(date);
  const now = dayjs();

  const isMidnight =
    dateObj.hour() === 0 && dateObj.minute() === 0 && dateObj.second() === 0;
  const isToday = dateObj.isSame(now, "day");

  if (isToday && isMidnight) {
    return (
      <TooltipComponent content={formatDateTime(dateObj)}>
        <span className={className}>Today</span>
      </TooltipComponent>
    );
  }

  const diffInHours = now.diff(dateObj, "hour");
  const diffInDays = now.diff(dateObj, "day");

  let label: string;

  if (diffInHours < 24) {
    label = dateObj.fromNow();
  } else {
    label = t(format == "ago" ? "day_ago_count" : "since_day_count", {
      count: diffInDays,
    });
  }

  return (
    <TooltipComponent content={formatDateTime(dateObj)}>
      <span className={className}>{label}</span>
    </TooltipComponent>
  );
}
