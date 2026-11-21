import { Spinner } from "@/components/ui/spinner";
import {
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  RotateCcw,
} from "lucide-react";
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
  /** Clears the saved choice so the standard screens apply again. */
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
  onUseStandard,
}: EncounterWorkspacePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wasSaving = useRef(false);
  const currentWorkspace = workspaces.find(({ id }) => id === workspaceId);
  const label = t("encounter_workspace");
  const currentName = workspaceId
    ? (currentWorkspace?.name ?? t("encounter_workspace_unavailable"))
    : t("encounter_workspace_standard");
  const currentLabel = t("encounter_workspace_current", { name: currentName });
  const busy = isLoading || isError || isSaving;
  const showReset = !!onUseStandard && workspaceId !== undefined;
  useEffect(() => {
    if (wasSaving.current && !isSaving && !saveError) setOpen(false);
    wasSaving.current = isSaving;
  }, [isSaving, saveError]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="xs"
          aria-label={
            isLoading ? t("encounter_workspace_loading") : currentLabel
          }
          aria-busy={isLoading || isSaving}
          title={isLoading ? undefined : currentName}
          className="min-h-11 max-w-full min-w-0 shrink justify-start gap-2 rounded-lg border-gray-200 bg-white pr-2 pl-1.5 text-sm font-normal tracking-normal text-gray-700 shadow-none md:min-h-8"
        >
          <span
            aria-hidden="true"
            className="grid size-6 shrink-0 place-items-center rounded-md bg-primary-50 text-primary-700 md:size-5"
          >
            {isSaving ? (
              <Spinner className="size-3.5 animate-spin" />
            ) : (
              <LayoutDashboard className="size-3.5" />
            )}
          </span>
          {isLoading ? (
            <Skeleton className="h-3.5 w-24" />
          ) : (
            <span className="min-w-0 truncate font-semibold text-gray-900">
              {currentName}
            </span>
          )}
          <ChevronsUpDown
            aria-hidden="true"
            className="size-3.5 shrink-0 text-gray-400"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
        aria-label={label}
      >
        <div className="flex items-start gap-2.5 border-b bg-gray-50/70 px-3 py-3">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-700"
          >
            <LayoutDashboard className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <h2 className="mt-0.5 text-sm font-semibold break-words text-gray-900">
              {currentName}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {t("workspace_picker_scope_hint")}
            </p>
          </div>
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
        {showReset && (
          <div className="border-t p-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                if (!busy) onUseStandard?.();
              }}
              className="w-full justify-start font-medium text-gray-700"
            >
              <RotateCcw aria-hidden="true" />
              {t("encounter_workspace_reset")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
