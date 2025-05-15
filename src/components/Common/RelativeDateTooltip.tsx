import { format, isValid } from "date-fns";
import { useTranslation } from "react-i18next";

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

  const hasTime = !!(
    dateObj.getHours() ||
    dateObj.getMinutes() ||
    dateObj.getSeconds()
  );

  const tooltipContent = hasTime
    ? format(dateObj, "PPpp")
    : format(dateObj, "PP");

  const datetimeAttr = dateObj.toISOString();

  return (
    <TooltipComponent content={tooltipContent}>
      <time dateTime={datetimeAttr} className={className}>
        {relativeDate(dateObj)}
      </time>
    </TooltipComponent>
  );
}
