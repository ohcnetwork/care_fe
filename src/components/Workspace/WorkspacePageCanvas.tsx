import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Copy,
  GripVertical,
  Plus,
  Puzzle,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { EncounterWorkspaceCustomPage } from "@/types/workspace/encounterWorkspace";

import {
  CORE_WIDGET_CATALOG,
  workspaceWidgetLabel,
} from "./workspaceEditorCatalog";
import { moveItem, type WidgetSelection } from "./workspaceEditorUtils";

interface WorkspacePageCanvasProps {
  page: EncounterWorkspaceCustomPage;
  selected: WidgetSelection | null;
  disabled: boolean;
  canAddWidget: boolean;
  onChange: (page: EncounterWorkspaceCustomPage) => void;
  onSelect: (selection: WidgetSelection | null) => void;
  onAddWidget: (column: number) => void;
}

type CanvasControl =
  | { kind: "width"; column: number; pageRevision: string }
  | { kind: "move"; column: number; widget: number; pageRevision: string };

export function WorkspacePageCanvas({
  page,
  selected,
  disabled,
  canAddWidget,
  onChange,
  onSelect,
  onAddWidget,
}: WorkspacePageCanvasProps) {
  const { t } = useTranslation();
  const dragged = useRef<(WidgetSelection & { pageRevision: string }) | null>(
    null,
  );
  const pageRevision = JSON.stringify(page);
  const [activeControl, setActiveControl] = useState<CanvasControl | null>(
    null,
  );
  if (activeControl && activeControl.pageRevision !== pageRevision)
    setActiveControl(null);
  const totalSpan = page.columns.reduce((sum, column) => sum + column.span, 0);
  const moveWidget = (source: WidgetSelection, target: WidgetSelection) => {
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
    onSelect({ column: target.column, widget: index });
  };
  const moveColumn = (from: number, to: number) => {
    onChange({ ...page, columns: moveItem(page.columns, from, to) });
    onSelect(null);
  };

  return (
    <div className="min-w-0 overflow-x-auto p-4 sm:p-5">
      <div
        className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[var(--editor-columns)]"
        style={
          {
            "--editor-columns": page.columns
              .map((column) => "minmax(180px, " + column.span + "fr)")
              .join(" "),
          } as React.CSSProperties
        }
      >
        {page.columns.map((column, columnIndex) => (
          <section
            key={columnIndex}
            aria-label={t("workspace_builder_column", {
              number: columnIndex + 1,
            })}
            className="min-w-0 rounded-xl border border-gray-200 bg-gray-100/70 p-2"
            onDragOver={(event) => {
              if (!disabled && dragged.current?.pageRevision === pageRevision)
                event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragged.current?.pageRevision === pageRevision)
                moveWidget(dragged.current, {
                  column: columnIndex,
                  widget: column.widgets.length,
                });
              dragged.current = null;
            }}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-1 px-1 py-1">
              <span className="text-xs font-semibold text-gray-600">
                {t("workspace_builder_column", { number: columnIndex + 1 })}
              </span>
              <Select
                value={String(column.span)}
                disabled={disabled}
                open={
                  activeControl?.kind === "width" &&
                  activeControl.column === columnIndex &&
                  activeControl.pageRevision === pageRevision
                }
                onOpenChange={(open) => {
                  setActiveControl(
                    open && !disabled
                      ? { kind: "width", column: columnIndex, pageRevision }
                      : null,
                  );
                }}
                onValueChange={(value) =>
                  onChange({
                    ...page,
                    columns: page.columns.map((item, index) =>
                      index === columnIndex
                        ? { ...item, span: Number(value) }
                        : item,
                    ),
                  })
                }
              >
                <SelectTrigger
                  aria-label={t("workspace_builder_column_width", {
                    number: columnIndex + 1,
                  })}
                  className="w-auto! gap-1 border-none bg-transparent px-1 text-xs shadow-none data-[size=default]:h-7"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 12 - totalSpan + column.span },
                    (_, index) => index + 1,
                  ).map((span) => (
                    <SelectItem key={span} value={String(span)}>
                      {t("workspace_builder_width", { span })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label={t("workspace_builder_move_column_left", {
                    number: columnIndex + 1,
                  })}
                  disabled={disabled || columnIndex === 0}
                  onClick={() => moveColumn(columnIndex, columnIndex - 1)}
                >
                  <ArrowLeft className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label={t("workspace_builder_move_column_right", {
                    number: columnIndex + 1,
                  })}
                  disabled={disabled || columnIndex === page.columns.length - 1}
                  onClick={() => moveColumn(columnIndex, columnIndex + 1)}
                >
                  <ArrowRight className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-gray-500 hover:text-red-700"
                  aria-label={t("workspace_builder_remove_column", {
                    number: columnIndex + 1,
                  })}
                  disabled={
                    disabled ||
                    page.columns.length === 1 ||
                    column.widgets.length > 0
                  }
                  title={
                    column.widgets.length
                      ? t("workspace_builder_empty_column_first")
                      : undefined
                  }
                  onClick={() => {
                    onChange({
                      ...page,
                      columns: page.columns.filter(
                        (_, index) => index !== columnIndex,
                      ),
                    });
                    onSelect(null);
                  }}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {column.widgets.map((widget, widgetIndex) => {
                const label =
                  widget.title ?? workspaceWidgetLabel(widget.type, t);
                const metadata = CORE_WIDGET_CATALOG.find(
                  (item) => item.type === widget.type,
                );
                const Icon = metadata?.icon ?? Puzzle;
                const active =
                  selected?.column === columnIndex &&
                  selected.widget === widgetIndex;
                const settingCount = Object.keys(widget.config ?? {}).length;
                return (
                  <div
                    key={widgetIndex}
                    draggable={!disabled}
                    onDragStart={(event) => {
                      dragged.current = {
                        column: columnIndex,
                        widget: widgetIndex,
                        pageRevision,
                      };
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", widget.type);
                    }}
                    onDragEnd={() => {
                      dragged.current = null;
                    }}
                    onDragOver={(event) => {
                      if (
                        !disabled &&
                        dragged.current?.pageRevision === pageRevision
                      )
                        event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (dragged.current?.pageRevision === pageRevision)
                        moveWidget(dragged.current, {
                          column: columnIndex,
                          widget: widgetIndex,
                        });
                      dragged.current = null;
                    }}
                    className={cn(
                      "group rounded-lg border bg-white shadow-xs transition-colors",
                      active
                        ? "border-primary-500 ring-1 ring-primary-500"
                        : "border-gray-200 hover:border-gray-400",
                    )}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={t("workspace_builder_configure_widget", {
                        name: label,
                      })}
                      aria-pressed={active}
                      onClick={() =>
                        onSelect({ column: columnIndex, widget: widgetIndex })
                      }
                      className="w-full rounded-t-lg p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-md",
                            active
                              ? "bg-primary-50 text-primary-700"
                              : "bg-gray-100 text-gray-500",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1 break-words text-sm font-semibold text-gray-800">
                          {label}
                        </span>
                        <GripVertical
                          aria-hidden
                          className="size-3 shrink-0 cursor-grab text-gray-300"
                        />
                      </div>
                      <p className="min-h-8 text-xs leading-relaxed text-gray-500">
                        {metadata
                          ? t(metadata.descriptionKey)
                          : t("workspace_builder_plugin_widget_hint")}
                      </p>
                      {!!(settingCount || widget.visible_when) && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {settingCount > 0 && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
                              {t("workspace_builder_setting_count", {
                                count: settingCount,
                              })}
                            </span>
                          )}
                          {widget.visible_when && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-800">
                              {t("workspace_builder_conditional")}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                    <div className="flex justify-end gap-0.5 border-t border-gray-100 px-2 py-1 text-gray-400">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mr-auto size-6"
                        aria-label={t("workspace_builder_configure_widget", {
                          name: label,
                        })}
                        disabled={disabled}
                        onClick={() =>
                          onSelect({ column: columnIndex, widget: widgetIndex })
                        }
                      >
                        <SlidersHorizontal className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        aria-label={t("workspace_builder_move_widget_up", {
                          name: label,
                        })}
                        disabled={disabled || widgetIndex === 0}
                        onClick={() =>
                          moveWidget(
                            { column: columnIndex, widget: widgetIndex },
                            { column: columnIndex, widget: widgetIndex - 1 },
                          )
                        }
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                      {page.columns.length > 1 && (
                        <DropdownMenu
                          open={
                            activeControl?.kind === "move" &&
                            activeControl.column === columnIndex &&
                            activeControl.widget === widgetIndex &&
                            activeControl.pageRevision === pageRevision
                          }
                          onOpenChange={(open) => {
                            setActiveControl(
                              open && !disabled
                                ? {
                                    kind: "move",
                                    column: columnIndex,
                                    widget: widgetIndex,
                                    pageRevision,
                                  }
                                : null,
                            );
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              aria-label={t(
                                "workspace_builder_move_widget_column",
                                {
                                  name: label,
                                },
                              )}
                              disabled={disabled}
                            >
                              <ArrowLeftRight className="size-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {page.columns.map((target, targetIndex) => (
                              <DropdownMenuItem
                                key={targetIndex}
                                disabled={
                                  targetIndex === columnIndex ||
                                  target.widgets.length >= 50
                                }
                                onSelect={() =>
                                  moveWidget(
                                    {
                                      column: columnIndex,
                                      widget: widgetIndex,
                                    },
                                    {
                                      column: targetIndex,
                                      widget: target.widgets.length,
                                    },
                                  )
                                }
                              >
                                {t("workspace_builder_column", {
                                  number: targetIndex + 1,
                                })}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        aria-label={t("workspace_builder_move_widget_down", {
                          name: label,
                        })}
                        disabled={
                          disabled || widgetIndex === column.widgets.length - 1
                        }
                        onClick={() =>
                          moveWidget(
                            { column: columnIndex, widget: widgetIndex },
                            { column: columnIndex, widget: widgetIndex + 1 },
                          )
                        }
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        aria-label={t("workspace_builder_duplicate_widget", {
                          name: label,
                        })}
                        disabled={
                          disabled ||
                          !canAddWidget ||
                          column.widgets.length >= 50
                        }
                        onClick={() => {
                          const widgets = [...column.widgets];
                          widgets.splice(
                            widgetIndex + 1,
                            0,
                            structuredClone(widget),
                          );
                          onChange({
                            ...page,
                            columns: page.columns.map((item, index) =>
                              index === columnIndex
                                ? { ...item, widgets }
                                : item,
                            ),
                          });
                          onSelect({
                            column: columnIndex,
                            widget: widgetIndex + 1,
                          });
                        }}
                      >
                        <Copy className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 hover:text-red-700"
                        aria-label={t("workspace_builder_remove_widget", {
                          name: label,
                        })}
                        disabled={disabled}
                        onClick={() => {
                          onChange({
                            ...page,
                            columns: page.columns.map((item, index) =>
                              index === columnIndex
                                ? {
                                    ...item,
                                    widgets: item.widgets.filter(
                                      (_, index) => index !== widgetIndex,
                                    ),
                                  }
                                : item,
                            ),
                          });
                          onSelect(null);
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!column.widgets.length && (
                <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white/40 p-4 text-center">
                  <Plus className="size-5 text-gray-400" />
                  <p className="text-xs leading-relaxed text-gray-500">
                    {t("workspace_builder_empty_column")}
                  </p>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2 border border-dashed border-gray-300 text-xs text-gray-600 hover:border-primary-400 hover:bg-primary-50"
                disabled={
                  disabled || !canAddWidget || column.widgets.length >= 50
                }
                onClick={() => onAddWidget(columnIndex)}
              >
                <Plus className="size-3.5" />
                {t("workspace_builder_add_widget")}
              </Button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
