import { ExternalLink, File, TriangleAlert, X } from "lucide-react";
import { Fragment, ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Avatar } from "@/components/Common/Avatar";
import RelativeDateTooltip from "@/components/Common/RelativeDateTooltip";
import { BadgeButtonDropdownTrigger } from "@/components/Patient/Common/ClinicalInformationRow";

import { formatName } from "@/Utils/utils";
import { UserReadMinimal } from "@/types/user/user";

export interface ClinicalSummaryItem {
  id: string;
  name: string;
  /** Short facts shown after the name, separated by dots. */
  meta: ReactNode[];
  /** Resolved or inactive entries recede so active problems lead. */
  dimmed?: boolean;
  note?: string;
  createdBy: UserReadMinimal;
  onViewEncounter?: () => void;
}

/** Compact two-column problem list for clinical panels. */
export function ClinicalSummaryGrid({
  items,
}: {
  items: ClinicalSummaryItem[];
}) {
  return (
    <ul className="-mx-2 -mb-2 grid grid-cols-1 overflow-hidden @md/clinical-widget:grid-cols-2">
      {items.map((item) => (
        <ClinicalSummaryRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

function ClinicalSummaryRow({ item }: { item: ClinicalSummaryItem }) {
  const { t } = useTranslation();
  const [showNote, setShowNote] = useState(false);
  const meta = item.meta.filter(Boolean);

  return (
    <li className="-mb-px flex min-w-0 items-start gap-2 border-b border-soft-border py-2.5 pr-1 pl-3 @md/clinical-widget:odd:border-r">
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-medium wrap-break-word",
            item.dimmed ? "text-soft-foreground" : "text-foreground",
          )}
        >
          {item.name}
        </p>
        {meta.length > 0 && (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-soft-foreground">
            {meta.map((part, index) => (
              <Fragment key={index}>
                {index > 0 && (
                  <span aria-hidden="true" className="text-strong-border">
                    ·
                  </span>
                )}
                {part}
              </Fragment>
            ))}
          </p>
        )}
        {showNote && item.note && (
          <div className="mt-2 rounded-md bg-soft-background p-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 wrap-break-word whitespace-pre-wrap text-muted-foreground">
                {item.note}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => setShowNote(false)}
                aria-label={t("hide_note")}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <DropdownMenu>
        <BadgeButtonDropdownTrigger note={item.note} />
        <DropdownMenuContent className="mx-1 w-40 p-1 text-xs" align="end">
          {item.note && (
            <DropdownMenuItem
              onClick={() => setShowNote(!showNote)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium"
            >
              <File className="size-3.5" />
              <span>{showNote ? t("hide_note") : t("see_note")}</span>
            </DropdownMenuItem>
          )}
          {!!item.onViewEncounter && (
            <DropdownMenuItem
              onClick={item.onViewEncounter}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium"
            >
              <ExternalLink className="size-3.5" />
              <span>{t("go_to_encounter")}</span>
            </DropdownMenuItem>
          )}
          {(!!item.onViewEncounter || item.note) && (
            <div className="my-1 border-t border-dashed border-border" />
          )}
          <div className="p-1 text-xs">
            <div className="text-soft-foreground">{t("reported_by")}:</div>
            <div className="mt-1 flex items-center gap-1.5">
              <Avatar
                name={formatName(item.createdBy, true)}
                className="size-5"
                imageUrl={item.createdBy?.profile_picture_url}
              />
              <span className="truncate font-medium text-foreground">
                {formatName(item.createdBy)}
              </span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

const SEVERITY_TONES = {
  severe: "font-medium text-danger-700 dark:text-danger-300",
  moderate: "font-medium text-warning-700 dark:text-warning-300",
  mild: "text-primary",
} as const;

/** Severity in the meta line: colour carries rank and the icon flags severe. */
export function SeverityMeta({
  severity,
  children,
}: {
  severity?: keyof typeof SEVERITY_TONES | null;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  if (!severity) return null;
  return (
    <span
      className={cn("inline-flex items-center gap-1", SEVERITY_TONES[severity])}
    >
      {severity === "severe" && (
        <TriangleAlert className="size-3" aria-hidden="true" />
      )}
      {children ?? t(severity)}
    </span>
  );
}

export function OnsetMeta({
  onset,
}: {
  onset?: {
    onset_datetime?: string;
    onset_age?: string;
    onset_string?: string;
  };
}) {
  const { t } = useTranslation();
  if (onset?.onset_datetime) {
    return (
      <span>
        {t("onset")} <RelativeDateTooltip date={onset.onset_datetime} />
      </span>
    );
  }
  const text = onset?.onset_string || onset?.onset_age;
  return text ? (
    <span>
      {t("onset")} {text}
    </span>
  ) : null;
}
