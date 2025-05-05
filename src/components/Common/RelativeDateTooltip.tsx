import {
  differenceInDays,
  differenceInHours,
  format,
  formatDistanceToNow,
  isToday,
  isValid,
} from "date-fns";
import { useTranslation } from "react-i18next";

import { TooltipComponent } from "@/components/ui/tooltip";

type RelativeDateTooltipProps = {
  date: Date | string;
  className?: string;
  formatType?: "ago" | "since";
};

export default function RelativeDateTooltip({
  date,
  className,
  formatType = "ago",
}: RelativeDateTooltipProps) {
  const { t } = useTranslation();
  if (!date) return null;

  const dateObj = new Date(date);
  const now = new Date();

  if (!isValid(dateObj)) {
    return (
      <TooltipComponent content={t("invalid_date")}>
        <span className={className}>{t("invalid_date")}</span>
      </TooltipComponent>
    );
  }

  const isDateToday = isToday(dateObj);

  const hasTime =
    dateObj.getHours() !== 0 ||
    dateObj.getMinutes() !== 0 ||
    dateObj.getSeconds() !== 0;

  const tooltipContent = hasTime
    ? format(dateObj, "PPpp")
    : format(dateObj, "PP");

  if (isDateToday && !hasTime) {
    return (
      <TooltipComponent content={tooltipContent}>
        <span className={className}>{t("today")}</span>
      </TooltipComponent>
    );
  }

  const diffHours = differenceInHours(now, dateObj);
  const diffDays = differenceInDays(now, dateObj);

  let label: string;
  if (diffHours < 24) {
    label = formatDistanceToNow(dateObj, { addSuffix: true });
  } else {
    label = t(formatType === "ago" ? "day_ago_count" : "since_day_count", {
      count: diffDays,
    });
  }

  return (
    <TooltipComponent content={tooltipContent}>
      <span className={className}>{label}</span>
    </TooltipComponent>
  );
}
