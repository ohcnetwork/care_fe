import { Blocks, Plus, Search, StretchHorizontal } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCareAppEncounterWidgets } from "@/hooks/useCareAppEncounterWidgets";
import type { WorkspaceSurface } from "@/types/workspace/encounterWorkspace";
import { getWidgetRequirements } from "@/types/workspace/widgetAvailability";

import { CORE_WIDGET_CATALOG } from "./workspaceEditorCatalog";
import { WorkspaceWidgetAvailability } from "./WorkspaceWidgetAvailability";

interface WorkspaceSectionPickerProps {
  surface: WorkspaceSurface;
  onClose: () => void;
  onAdd: (type: string) => void;
}

const GROUP_ORDER = {
  encounter: ["clinical", "workflow", "details", "history", "plugins"],
  patient_history: ["history", "clinical", "workflow", "details", "plugins"],
} as const;

export function WorkspaceSectionPicker({
  surface,
  onClose,
  onAdd,
}: WorkspaceSectionPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { widgets: plugins, loadingPlugins } = useCareAppEncounterWidgets();
  const options = [
    ...CORE_WIDGET_CATALOG.map((item) => ({
      ...item,
      label: t(item.labelKey),
      description: t(item.descriptionKey),
      requiresActiveEncounter: undefined as boolean | undefined,
    })),
    ...[...plugins.entries()].map(([type, plugin]) => ({
      type,
      label: type,
      description: t("workspace_builder_plugin_widget_hint"),
      icon: Blocks,
      group: "plugins" as const,
      fullWidth: false,
      requiresActiveEncounter: plugin.requiresActiveEncounter,
    })),
  ].filter((item) =>
    `${item.label} ${item.description} ${item.type}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85dvh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{t("workspace_studio_add_section")}</DialogTitle>
          <DialogDescription>
            {t("workspace_studio_add_section_hint")}
          </DialogDescription>
        </DialogHeader>
        <div className="relative mx-6 mb-4">
          <Search className="absolute top-3 left-3 size-4 text-placeholder-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={t("workspace_studio_search_sections")}
            placeholder={t("workspace_studio_search_sections")}
            className="pl-9"
          />
        </div>
        <div className="max-h-[55dvh] space-y-6 overflow-y-auto border-t bg-soft-background/70 p-6">
          {GROUP_ORDER[surface].map((group) => {
            const items = options.filter((item) => item.group === group);
            if (!items.length) return null;
            return (
              <section key={group} className="space-y-2">
                <h3 className="text-xs font-semibold tracking-wider text-soft-foreground uppercase">
                  {t(`workspace_studio_group_${group}`)}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const incompatible =
                      surface === "patient_history" &&
                      getWidgetRequirements(
                        item.type,
                        item.requiresActiveEncounter,
                      ).encounter !== "none";
                    return (
                      <Button
                        key={item.type}
                        type="button"
                        variant="outline"
                        aria-label={item.label}
                        disabled={incompatible}
                        title={
                          incompatible
                            ? t("workspace_studio_section_needs_encounter")
                            : undefined
                        }
                        onClick={() => onAdd(item.type)}
                        className="group h-auto min-h-24 justify-start gap-3 bg-background p-3 text-left whitespace-normal shadow-none hover:border-primary-400 hover:bg-primary-50/50"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted-background text-soft-foreground group-hover:bg-primary-100 group-hover:text-primary-700">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold break-words text-foreground">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed font-normal text-soft-foreground">
                            {item.description}
                          </span>
                          <span className="mt-2 flex flex-wrap items-center gap-1.5">
                            <WorkspaceWidgetAvailability
                              type={item.type}
                              requiresActiveEncounter={
                                item.requiresActiveEncounter
                              }
                            />
                            {item.fullWidth && (
                              <span className="inline-flex items-center gap-1 rounded bg-muted-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                <StretchHorizontal
                                  className="size-3"
                                  aria-hidden="true"
                                />
                                {t("workspace_studio_full_width")}
                              </span>
                            )}
                          </span>
                        </span>
                        <Plus className="size-4 shrink-0 text-placeholder-foreground" />
                      </Button>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {!options.length && (
            <p className="py-8 text-center text-sm text-soft-foreground">
              {t("workspace_builder_no_widgets")}
            </p>
          )}
          {loadingPlugins.size > 0 && (
            <p role="status" className="text-xs text-soft-foreground">
              {t("workspace_builder_plugins_loading")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
