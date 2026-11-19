import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

interface SpecimenCollectCardProps {
  requirement: SpecimenDefinitionRead;
  hasDraft: boolean;
  onToggle: () => void;
  collapsed?: boolean;
  testName?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  children: ReactNode;
}

export function SpecimenCollectCard({
  requirement,
  hasDraft,
  onToggle,
  collapsed = false,
  testName,
  checked,
  onCheckedChange,
  children,
}: SpecimenCollectCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden rounded-lg shadow-xs">
      <CardHeader
        className={cn(
          "p-0",
          onCheckedChange && "flex-row items-center gap-0 bg-muted pl-3",
        )}
      >
        {onCheckedChange && (
          <Checkbox
            checked={checked}
            onCheckedChange={onCheckedChange}
            aria-label={testName ?? requirement.title}
          />
        )}
        <Button
          variant="ghost"
          onClick={onToggle}
          className={cn(
            "h-auto w-full flex-col items-stretch gap-3 bg-muted p-3 text-left font-normal tracking-normal sm:flex-row sm:items-center sm:justify-between sm:gap-2",
            onCheckedChange && "w-auto min-w-0 flex-1",
          )}
          aria-label={collapsed ? t("expand") : t("collapse")}
        >
          <div className="min-w-0 m-0">
            {testName && (
              <div className="text-sm font-semibold text-foreground break-words whitespace-normal">
                {testName}
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              {t("required")}:
            </span>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
              <span className="truncate">{requirement.title}</span>
              {hasDraft && <Badge variant="indigo">{t("draft")}</Badge>}
            </CardTitle>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 justify-between">
            <Badge variant="orange">{t("collection_pending")}</Badge>
            {collapsed ? (
              <ChevronsUpDown className="size-4 mx-2" />
            ) : (
              <ChevronsDownUp className="size-4 mx-2" />
            )}
          </div>
        </Button>
      </CardHeader>
      <CardContent className={cn("bg-muted p-2 pt-0", collapsed && "hidden")}>
        {children}
      </CardContent>
    </Card>
  );
}
