import { format, isToday, isValid } from "date-fns";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { TooltipComponent } from "@/components/ui/tooltip";

import { relativeDate } from "@/Utils/utils";

type RelativeDateTooltipProps = {
  date: Date | string;
  className?: string;
};

export default function RelativeDateTooltip({
  date,
  className,
}: RelativeDateTooltipProps) {
  const { t } = useTranslation();
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;

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

  return (
    <TooltipComponent content={tooltipContent}>
      <time dateTime={datetimeAttr} className={cn(className, "capitalize")}>
        {relativeDate(dateObj)}
      </time>
    </TooltipComponent>
  );
}
