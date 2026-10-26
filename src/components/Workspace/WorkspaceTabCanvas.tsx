import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Copy,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Plus,
  Puzzle,
  Settings2,
  StretchHorizontal,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCareAppEncounterWidgets } from "@/hooks/useCareAppEncounterWidgets";
import { cn } from "@/lib/utils";
import {
  ENCOUNTER_WIDGET_TYPES,
  type EncounterWorkspaceCustomPage,
} from "@/types/workspace/encounterWorkspace";
import {
  getWidgetAvailability,
  getWidgetRequirements,
  type WorkspaceAvailabilityContext,
} from "@/types/workspace/widgetAvailability";

import {
  CORE_WIDGET_CATALOG,
  workspaceWidgetLabel,
} from "./workspaceEditorCatalog";
import type { WidgetSelection } from "./workspaceEditorUtils";
import { WorkspaceSampleContent } from "./WorkspaceSampleContent";

interface WorkspaceTabCanvasProps {
  page: EncounterWorkspaceCustomPage;
  columnLabelKeys: string[];
  previewContext: WorkspaceAvailabilityContext;
  device: "desktop" | "mobile";
  disabled: boolean;
  canAddSection: boolean;
  onChange: (page: EncounterWorkspaceCustomPage) => void;
  onOpenSettings: (selection: WidgetSelection) => void;
  onAddSection: (column: number) => void;
}

interface OpenMenu extends WidgetSelection {
  pageRevision: string;
}

export function WorkspaceTabCanvas({
  page,
  columnLabelKeys,
  previewContext,
  device,
  disabled,
  canAddSection,
  onChange,
  onOpenSettings,
  onAddSection,
}: WorkspaceTabCanvasProps) {
  const { t } = useTranslation();
  const { widgets: plugins, loadingPlugins } = useCareAppEncounterWidgets();
  const dragged = useRef<(WidgetSelection & { pageRevision: string }) | null>(
    null,
  );
  const pageRevision = JSON.stringify(page);
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
  // A refreshed page must not leave a menu pointing at a replaced section.
  if (openMenu && openMenu.pageRevision !== pageRevision) setOpenMenu(null);

  const moveSection = (source: WidgetSelection, target: WidgetSelection) => {
    const sourceColumn = page.columns[source.column];
    const targetColumn = page.columns[target.column];
    if (
      disabled ||
      !sourceColumn ||
      !targetColumn ||
      !sourceColumn.widgets[source.widget] ||
      (source.column !== target.column && targetColumn.widgets.length >= 50)
    )
      return;
    const columns = page.columns.map((column) => ({
      ...column,
      widgets: [...column.widgets],
    }));
    const [widget] = columns[source.column].widgets.splice(source.widget, 1);
    if (!widget) return;
    const index = Math.min(
      target.widget,
      columns[target.column].widgets.length,
    );
    columns[target.column].widgets.splice(index, 0, widget);
    onChange({ ...page, columns });
  };
  const updateColumn = (
    columnIndex: number,
    widgets: EncounterWorkspaceCustomPage["columns"][number]["widgets"],
  ) =>
    onChange({
      ...page,
      columns: page.columns.map((column, index) =>
        index === columnIndex ? { ...column, widgets } : column,
      ),
    });
  const acceptDrop = (event: React.DragEvent) => {
    if (!disabled && dragged.current?.pageRevision === pageRevision)
      event.preventDefault();
  };

  return (
    <div className="min-w-0 bg-muted-background/70 p-4 sm:p-5">
      <div
        className={cn(
          "@container mx-auto min-w-0 transition-[max-width]",
          device === "mobile" && "max-w-[390px]",
        )}
      >
        <div
          className={cn(
            "grid min-w-0 grid-cols-1 items-start gap-3 @4xl:grid-cols-[var(--workspace-columns)]",
            page.columns.length > 1 && "@xl:grid-cols-2",
          )}
          style={
            {
              "--workspace-columns": page.columns
                .map(({ span }) => `minmax(0, ${span}fr)`)
                .join(" "),
            } as React.CSSProperties
          }
        >
          {page.columns.map((column, columnIndex) => {
            const label = columnLabelKeys[columnIndex]
              ? t(columnLabelKeys[columnIndex])
              : t("workspace_builder_column", { number: columnIndex + 1 });
            const allHidden =
              column.widgets.length > 0 &&
              column.widgets.every(
                (widget) =>
                  getWidgetAvailability(
                    widget,
                    previewContext,
                    plugins.get(widget.type)?.requiresActiveEncounter,
                  ).state === "hidden",
              );
            return (
              <section
                key={columnIndex}
                aria-label={label}
                onDragOver={acceptDrop}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragged.current?.pageRevision === pageRevision)
                    moveSection(dragged.current, {
                      column: columnIndex,
                      widget: column.widgets.length,
                    });
                  dragged.current = null;
                }}
                className="min-w-0 rounded-xl border border-dashed border-strong-border bg-background/40 p-2"
              >
                <div className="mb-2 flex min-h-6 flex-wrap items-center justify-between gap-2 px-1">
                  <span className="text-xs font-semibold tracking-wide text-soft-foreground uppercase">
                    {label}
                  </span>
                  {allHidden && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-900">
                      <EyeOff className="size-3" aria-hidden="true" />
                      {t("workspace_studio_column_hidden_in_preview")}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {column.widgets.map((widget, widgetIndex) => {
                    const title =
                      widget.title ?? workspaceWidgetLabel(widget.type, t);
                    const metadata = CORE_WIDGET_CATALOG.find(
                      (item) => item.type === widget.type,
                    );
                    const Icon = metadata?.icon ?? Puzzle;
                    const plugin = plugins.get(widget.type);
                    const unavailable =
                      !ENCOUNTER_WIDGET_TYPES.includes(widget.type) &&
                      !plugin &&
                      !loadingPlugins.has(widget.type.split(".")[0]);
                    const availability = getWidgetAvailability(
                      widget,
                      previewContext,
                      plugin?.requiresActiveEncounter,
                    );
                    const hidden = availability.state === "hidden";
                    const cramped =
                      !!metadata?.fullWidth &&
                      page.columns.length > 1 &&
                      column.span < 8;
                    const requirements = getWidgetRequirements(
                      widget.type,
                      plugin?.requiresActiveEncounter,
                    );
                    const selection = {
                      column: columnIndex,
                      widget: widgetIndex,
                    };
                    const menuOpen =
                      openMenu?.column === columnIndex &&
                      openMenu.widget === widgetIndex &&
                      openMenu.pageRevision === pageRevision;
                    return (
                      <article
                        key={widgetIndex}
                        aria-label={title}
                        draggable={!disabled}
                        onDragStart={(event) => {
                          dragged.current = { ...selection, pageRevision };
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", widget.type);
                        }}
                        onDragEnd={() => {
                          dragged.current = null;
                        }}
                        onDragOver={acceptDrop}
                        onDrop={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (dragged.current?.pageRevision === pageRevision)
                            moveSection(dragged.current, selection);
                          dragged.current = null;
                        }}
                        className={cn(
                          "group relative min-w-0 rounded-xl border bg-background shadow-xs transition-colors",
                          hidden
                            ? "border-dashed border-amber-300"
                            : "border-border hover:border-primary-300",
                        )}
                      >
                        <div className="flex items-center gap-2 border-b border-soft-border px-2 py-1.5">
                          <GripVertical
                            aria-hidden="true"
                            className="size-4 shrink-0 cursor-grab text-disabled-foreground"
                          />
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onOpenSettings(selection)}
                            aria-label={t("workspace_studio_edit_section", {
                              name: title,
                            })}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 text-left focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
                          >
                            <span
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center rounded-md",
                                hidden
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-primary-50 text-primary-700",
                              )}
                            >
                              <Icon className="size-3.5" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                              {title}
                            </span>
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-soft-foreground"
                            aria-label={t(
                              "workspace_studio_section_settings_for",
                              {
                                name: title,
                              },
                            )}
                            disabled={disabled}
                            onClick={() => onOpenSettings(selection)}
                          >
                            <Settings2 className="size-4" />
                          </Button>
                          <DropdownMenu
                            open={menuOpen}
                            onOpenChange={(open) =>
                              setOpenMenu(
                                open && !disabled
                                  ? { ...selection, pageRevision }
                                  : null,
                              )
                            }
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 text-soft-foreground"
                                aria-label={t(
                                  "workspace_studio_section_actions",
                                  {
                                    name: title,
                                  },
                                )}
                                disabled={disabled}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem
                                disabled={widgetIndex === 0}
                                onSelect={() =>
                                  moveSection(selection, {
                                    column: columnIndex,
                                    widget: widgetIndex - 1,
                                  })
                                }
                              >
                                <ArrowUp className="size-4" />
                                {t("workspace_studio_move_up")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={
                                  widgetIndex === column.widgets.length - 1
                                }
                                onSelect={() =>
                                  moveSection(selection, {
                                    column: columnIndex,
                                    widget: widgetIndex + 1,
                                  })
                                }
                              >
                                <ArrowDown className="size-4" />
                                {t("workspace_studio_move_down")}
                              </DropdownMenuItem>
                              {page.columns.length > 1 && (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger openOnHover={false}>
                                    <ArrowLeftRight className="size-4" />
                                    {t("workspace_studio_move_to")}
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {page.columns.map((target, targetIndex) => (
                                      <DropdownMenuItem
                                        key={targetIndex}
                                        disabled={
                                          targetIndex === columnIndex ||
                                          target.widgets.length >= 50
                                        }
                                        onSelect={() =>
                                          moveSection(selection, {
                                            column: targetIndex,
                                            widget: target.widgets.length,
                                          })
                                        }
                                      >
                                        {columnLabelKeys[targetIndex]
                                          ? t(columnLabelKeys[targetIndex])
                                          : t("workspace_builder_column", {
                                              number: targetIndex + 1,
                                            })}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}
                              <DropdownMenuItem
                                disabled={
                                  !canAddSection || column.widgets.length >= 50
                                }
                                onSelect={() => {
                                  const widgets = [...column.widgets];
                                  widgets.splice(
                                    widgetIndex + 1,
                                    0,
                                    structuredClone(widget),
                                  );
                                  updateColumn(columnIndex, widgets);
                                }}
                              >
                                <Copy className="size-4" />
                                {t("workspace_studio_duplicate")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-700 focus:text-red-700"
                                onSelect={() =>
                                  updateColumn(
                                    columnIndex,
                                    column.widgets.filter(
                                      (_, index) => index !== widgetIndex,
                                    ),
                                  )
                                }
                              >
                                <Trash2 className="size-4" />
                                {t("workspace_studio_remove_section")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div
                          className={cn(
                            "relative min-w-0 p-3",
                            hidden && "opacity-50 grayscale",
                          )}
                        >
                          <WorkspaceSampleContent
                            type={widget.type}
                            unavailable={unavailable}
                            denied={availability.state === "denied"}
                            deniedMessage={t(
                              requirements.encounter === "none"
                                ? "workspace_patient_history_access_denied"
                                : "no_permission_to_view_clinical_data",
                            )}
                          />
                        </div>
                        {hidden && (
                          <p className="flex items-start gap-2 rounded-b-xl border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                            <EyeOff
                              className="mt-0.5 size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>
                              {t("workspace_studio_hidden_in_preview", {
                                reason: t(availability.reason),
                              })}
                            </span>
                          </p>
                        )}
                        {!hidden && cramped && (
                          <p className="flex items-start gap-2 rounded-b-xl border-t border-border bg-soft-background px-3 py-2 text-xs text-muted-foreground">
                            <StretchHorizontal
                              className="mt-0.5 size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{t("workspace_studio_full_width_hint")}</span>
                          </p>
                        )}
                      </article>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      disabled || !canAddSection || column.widgets.length >= 50
                    }
                    onClick={() => onAddSection(columnIndex)}
                    aria-label={t("workspace_studio_add_section_to", {
                      column: label,
                    })}
                    className={cn(
                      "w-full border-dashed shadow-none",
                      column.widgets.length === 0 &&
                        "min-h-28 bg-background/60",
                    )}
                  >
                    <Plus className="size-4" />
                    {t("workspace_studio_add_section")}
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
