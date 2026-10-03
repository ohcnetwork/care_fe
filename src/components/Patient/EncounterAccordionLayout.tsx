import { ChevronsDownUp, ChevronsUpDown, SquarePen } from "lucide-react";
import { Link } from "raviger";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface EncounterAccordionLayoutProps {
  children: ReactNode;
  className?: string;
  readOnly?: boolean;
  title: string;
  editLink?: string;
  actionButton?: ReactNode;
  presentation?: "default" | "panel";
}

export function EncounterAccordionLayout({
  children,
  className,
  readOnly = false,
  actionButton,
  title,
  editLink,
  presentation = "default",
}: EncounterAccordionLayoutProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const isPanel = presentation === "panel";

  return (
    <Card
      className={cn(
        isPanel
          ? "rounded-xl border border-gray-200 bg-white shadow-none"
          : "border-none rounded-md",
        className,
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div
          className={cn(
            "w-full flex items-center gap-2",
            isPanel ? "px-3 py-1" : "px-2 py-1",
            isPanel && isExpanded && "border-b border-gray-200",
          )}
        >
          <CardHeader
            className={cn(
              "min-w-0 w-full flex flex-row items-center justify-between p-0",
              isPanel ? "gap-3 space-y-0" : "pl-2",
            )}
          >
            <CardTitle
              className={
                isPanel
                  ? "min-w-0 [overflow-wrap:anywhere] text-sm font-bold uppercase tracking-wide text-gray-600"
                  : "min-w-0 [overflow-wrap:anywhere] text-base mt-1"
              }
            >
              {t(title)}
              {!isPanel && ":"}
            </CardTitle>
            <div
              className={cn(
                isPanel
                  ? "flex shrink-0 items-center gap-1"
                  : "flex rounded-md border border-gray-500 lg:border-0 lg:divide-x-0 mt-1",
                !isPanel &&
                  (editLink || actionButton) &&
                  "divide-x divide-gray-500",
              )}
            >
              {!readOnly && editLink && (
                <div className="flex">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="hover:bg-transparent text-gray-500 hover:text-gray-500"
                  >
                    <Link href={editLink} aria-label={t("edit")}>
                      <SquarePen className="size-4" />
                    </Link>
                  </Button>
                </div>
              )}
              <div className="flex">{actionButton && actionButton}</div>
              <div className="flex">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hover:bg-transparent text-gray-500 hover:text-gray-500"
                    aria-label={isExpanded ? t("collapse") : t("expand")}
                  >
                    {isExpanded ? (
                      <ChevronsDownUp className="size-4 text-gray-500" />
                    ) : (
                      <ChevronsUpDown className="size-4 text-gray-500" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
        </div>

        <CollapsibleContent>
          <CardContent className="p-2">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
