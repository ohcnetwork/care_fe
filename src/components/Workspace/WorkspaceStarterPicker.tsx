import { Braces, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { WorkspaceStarter } from "./workspacePresets";

interface WorkspaceStarterPickerProps<T> {
  starters: WorkspaceStarter<T>[];
  title: string;
  hint: string;
  disabled: boolean;
  onPick: (starter: WorkspaceStarter<T>) => void;
  onUseJson?: () => void;
}

export function WorkspaceStarterPicker<T>({
  starters,
  title,
  hint,
  disabled,
  onPick,
  onUseJson,
}: WorkspaceStarterPickerProps<T>) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 px-5 py-8 sm:px-8">
      <div className="max-w-2xl">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-soft-foreground">
          {hint}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {starters.map((starter) => (
          <Button
            key={starter.id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={t(starter.titleKey)}
            onClick={() => onPick(starter)}
            className={cn(
              "h-auto min-h-28 flex-col items-start justify-start gap-2 p-4 text-left whitespace-normal shadow-none hover:border-primary-400 hover:bg-primary-50/40",
              starter.recommended && "border-primary-200 bg-primary-50/30",
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">
                {t(starter.titleKey)}
              </span>
              {starter.recommended && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-medium text-primary-800">
                  <Check className="size-3" aria-hidden="true" />
                  {t("workspace_studio_recommended")}
                </span>
              )}
            </span>
            <span className="text-xs leading-relaxed font-normal text-soft-foreground">
              {t(starter.descriptionKey)}
            </span>
          </Button>
        ))}
      </div>
      {onUseJson && (
        <Button
          type="button"
          variant="link"
          disabled={disabled}
          onClick={onUseJson}
          className="h-auto px-0 text-xs text-soft-foreground"
        >
          <Braces className="size-3.5" />
          {t("workspace_studio_start_from_json")}
        </Button>
      )}
    </div>
  );
}
