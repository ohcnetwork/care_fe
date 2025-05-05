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

  const dateObj = typeof date === "string" ? new Date(date) : date;
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

  const datetimeAttr = dateObj.toISOString();

  if (isDateToday && !hasTime) {
    return (
      <TooltipComponent content={tooltipContent}>
        <time dateTime={datetimeAttr} className={className}>
          {t("today")}
        </time>
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
      <time dateTime={datetimeAttr} className={className}>
        {label}
      </time>
    </TooltipComponent>
  );
}
