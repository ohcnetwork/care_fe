import { Blocks, Plus, Search } from "lucide-react";
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

import { CORE_WIDGET_CATALOG } from "./workspaceEditorCatalog";

interface WorkspaceWidgetLibraryProps {
  onClose: () => void;
  onAdd: (type: string) => void;
}

export function WorkspaceWidgetLibrary({
  onClose,
  onAdd,
}: WorkspaceWidgetLibraryProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { widgets: plugins, loadingPlugins } = useCareAppEncounterWidgets();
  const options = [
    ...CORE_WIDGET_CATALOG.map((item) => ({
      ...item,
      label: t(item.labelKey),
      description: t(item.descriptionKey),
    })),
    ...[...plugins.keys()].map((type) => ({
      type,
      label: type,
      description: t("workspace_builder_plugin_widget_hint"),
      icon: Blocks,
      group: "plugins",
    })),
  ].filter((item) =>
    (item.label + " " + item.description + " " + item.type)
      .toLowerCase()
      .includes(search.toLowerCase()),
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
          <DialogTitle>{t("workspace_builder_add_widget")}</DialogTitle>
          <DialogDescription>
            {t("workspace_builder_library_hint")}
          </DialogDescription>
        </DialogHeader>
        <div className="relative mx-6 mb-4">
          <Search className="absolute left-3 top-3 size-4 text-gray-400" />
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={t("workspace_builder_search_widgets")}
            placeholder={t("workspace_builder_search_widgets")}
            className="pl-9"
          />
        </div>
        <div className="max-h-[55dvh] space-y-6 overflow-y-auto border-t bg-gray-50/70 p-6">
          {["clinical", "workflow", "details", "plugins"].map((group) => {
            const items = options.filter((item) => item.group === group);
            return (
              items.length > 0 && (
                <section key={group} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t("workspace_builder_group_" + group)}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map(({ type, label, description, icon: Icon }) => (
                      <Button
                        key={type}
                        type="button"
                        variant="outline"
                        aria-label={label}
                        onClick={() => onAdd(type)}
                        className="group h-auto min-h-24 justify-start gap-3 whitespace-normal bg-white p-3 text-left shadow-none hover:border-primary-400 hover:bg-primary-50/50"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-700">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-gray-900 break-words">
                            {label}
                          </span>
                          <span className="mt-1 block text-xs font-normal leading-relaxed text-gray-500">
                            {description}
                          </span>
                        </span>
                        <Plus className="size-4 shrink-0 text-gray-400" />
                      </Button>
                    ))}
                  </div>
                </section>
              )
            );
          })}
          {!options.length && (
            <p className="py-8 text-center text-sm text-gray-500">
              {t("workspace_builder_no_widgets")}
            </p>
          )}
          {loadingPlugins.size > 0 && (
            <p role="status" className="text-xs text-gray-500">
              {t("workspace_builder_plugins_loading")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
