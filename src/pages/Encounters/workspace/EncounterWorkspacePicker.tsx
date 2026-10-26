import { Spinner } from "@/components/ui/spinner";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { EncounterClass } from "@/types/emr/encounter/encounter";
import type { WorkspaceSurface } from "@/types/workspace/encounterWorkspace";
import { WorkspaceRead } from "@/types/workspace/workspace";

interface EncounterWorkspacePickerProps {
  workspaces: WorkspaceRead[];
  workspaceId?: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelect: (workspace: WorkspaceRead) => void;
  isSaving: boolean;
  saveError: boolean;
  encounterClass?: EncounterClass;
  surface?: WorkspaceSurface;
  onUseStandard?: () => void;
}

export function EncounterWorkspacePicker({
  workspaces,
  workspaceId,
  isLoading,
  isError,
  onRetry,
  onSelect,
  isSaving,
  saveError,
  encounterClass,
  surface = "encounter",
  onUseStandard,
}: EncounterWorkspacePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wasSaving = useRef(false);
  const currentWorkspace = workspaces.find(({ id }) => id === workspaceId);
  const label = t(
    surface === "patient_history"
      ? "workspace_history_layout"
      : "encounter_workspace",
  );
  const standardLabel = t(
    surface === "patient_history"
      ? "workspace_history_standard"
      : "encounter_workspace_standard",
  );
  const currentName = workspaceId
    ? (currentWorkspace?.name ?? t("encounter_workspace_unavailable"))
    : standardLabel;
  const busy = isLoading || isError || isSaving;
  useEffect(() => {
    if (wasSaving.current && !isSaving && !saveError) setOpen(false);
    wasSaving.current = isSaving;
  }, [isSaving, saveError]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={label}
              className="size-9 shrink-0 rounded-lg border-gray-200 bg-white text-sm font-bold text-gray-700 shadow-none"
            >
              {isSaving ? (
                <Spinner className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <span aria-hidden="true">W</span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isLoading
            ? t("encounter_workspace_loading")
            : t("encounter_workspace_current", { name: currentName })}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)] p-0"
        aria-label={label}
      >
        <div className="border-b px-3 py-2.5">
          <h2 className="text-sm font-semibold">{label}</h2>
          <p className="mt-1 truncate text-xs text-gray-700">
            {t("encounter_workspace_current", { name: currentName })}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {surface === "patient_history"
              ? t("workspace_history_browser_preference")
              : t("encounter_workspace_picker_hint", {
                  encounterClass: encounterClass
                    ? t(`encounter_class__${encounterClass}`)
                    : t("encounter"),
                })}
          </p>
        </div>
        {isError && (
          <div className="p-2">
            <Alert variant="destructive">
              <AlertDescription className="space-y-2">
                <p>{t("encounter_workspace_list_error")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                >
                  {t("try_again")}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        {saveError && (
          <div className="p-2">
            <Alert variant="destructive">
              <AlertDescription>
                {t("encounter_workspace_select_error")}
              </AlertDescription>
            </Alert>
          </div>
        )}
        <Command>
          <CommandInput
            placeholder={t("search_workspaces")}
            aria-label={t("search_workspaces")}
            disabled={isLoading || isSaving}
          />
          <CommandList aria-label={t("workspaces")}>
            {isLoading ? (
              <div
                className="space-y-2 p-3"
                role="status"
                aria-label={t("encounter_workspace_loading")}
              >
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <CommandEmpty>{t("no_workspaces_found")}</CommandEmpty>
                <CommandGroup>
                  {onUseStandard && (
                    <CommandItem
                      value="standard"
                      keywords={[standardLabel]}
                      disabled={busy}
                      onSelect={() => {
                        if (busy) return;
                        onUseStandard();
                      }}
                    >
                      {standardLabel}
                      {!workspaceId && <Check className="ml-auto size-4" />}
                    </CommandItem>
                  )}
                  {workspaces.map((workspace) => (
                    <CommandItem
                      key={workspace.id}
                      value={workspace.id}
                      keywords={[workspace.name, workspace.description]}
                      disabled={busy}
                      onSelect={() => {
                        if (busy) return;
                        if (workspace.id === workspaceId && !saveError)
                          setOpen(false);
                        else onSelect(workspace);
                      }}
                      className="items-start gap-2 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium">
                          {workspace.name}
                        </p>
                        {workspace.description && (
                          <p className="mt-1 line-clamp-2 break-words text-xs text-gray-600">
                            {workspace.description}
                          </p>
                        )}
                      </div>
                      {workspace.id === workspaceId && (
                        <Check
                          className="mt-0.5 size-4 text-primary-600"
                          aria-label={t("selected")}
                        />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
