import { Braces, Check, ClipboardList, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkspaceSurface } from "@/types/workspace/encounterWorkspace";

import { WORKSPACE_STARTERS, type WorkspaceStarter } from "./workspacePresets";

interface WorkspaceStarterPickerProps {
  disabled: boolean;
  onPick: (starter: WorkspaceStarter) => void;
  onUseJson: () => void;
}

const SURFACES: { surface: WorkspaceSurface; icon: typeof Stethoscope }[] = [
  { surface: "encounter", icon: Stethoscope },
  { surface: "patient_history", icon: ClipboardList },
];

export function WorkspaceStarterPicker({
  disabled,
  onPick,
  onUseJson,
}: WorkspaceStarterPickerProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8 px-5 py-8 sm:px-8">
      <div className="max-w-2xl">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {t("workspace_studio_starter_title")}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-soft-foreground">
          {t("workspace_studio_starter_hint")}
        </p>
      </div>
      {SURFACES.map(({ surface, icon: Icon }) => (
        <section
          key={surface}
          aria-labelledby={`workspace-starter-${surface}`}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-soft-foreground" aria-hidden="true" />
            <h4
              id={`workspace-starter-${surface}`}
              className="text-sm font-semibold text-foreground"
            >
              {t(`workspace_studio_surface_${surface}`)}
            </h4>
            <span className="text-xs text-soft-foreground">
              {t(`workspace_studio_surface_${surface}_hint`)}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {WORKSPACE_STARTERS.filter((item) => item.surface === surface).map(
              (starter) => (
                <Button
                  key={starter.id}
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  aria-label={t(starter.titleKey)}
                  onClick={() => onPick(starter)}
                  className={cn(
                    "h-auto min-h-28 flex-col items-start justify-start gap-2 p-4 text-left whitespace-normal shadow-none hover:border-primary-400 hover:bg-primary-50/40",
                    starter.recommended &&
                      "border-primary-200 bg-primary-50/30",
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
              ),
            )}
          </div>
        </section>
      ))}
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
    </div>
  );
}
