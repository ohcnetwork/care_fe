import {
  ArrowDown,
  ArrowUp,
  Braces,
  Check,
  Columns3,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  Monitor,
  Plus,
  Redo2,
  Settings2,
  Trash2,
  Undo2,
  WandSparkles,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCareAppEncounterWidgets } from "@/hooks/useCareAppEncounterWidgets";
import { useCareAppTabs } from "@/hooks/useCareApps";
import { cn } from "@/lib/utils";
import {
  createEncounterWorkspaceSchema,
  ENCOUNTER_WIDGET_TYPES,
  MAX_ENCOUNTER_WORKSPACE_COLUMNS,
  SYSTEM_PAGE_KEYS,
  type EncounterWorkspaceTemplate,
} from "@/types/workspace/encounterWorkspace";

import { WorkspacePageCanvas } from "./WorkspacePageCanvas";
import { WorkspacePageDialog } from "./WorkspacePageDialog";
import { WorkspaceSystemPageMenu } from "./WorkspaceSystemPageMenu";
import { WorkspaceWidgetInspector } from "./WorkspaceWidgetInspector";
import { WorkspaceWidgetLibrary } from "./WorkspaceWidgetLibrary";
import {
  moveItem,
  pageWidgetCount,
  parseWorkspaceJson,
  systemPageLabel,
  type WidgetSelection,
  type WorkspacePage,
} from "./workspaceEditorUtils";

interface EncounterWorkspaceEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onValidityChange?: (valid: boolean) => void;
}

interface PageDialogState {
  mode: "add" | "edit";
  templateValue: string;
  pageKey?: string;
}

interface PageTarget {
  templateValue: string;
  pageKey: string;
}

interface WidgetLibraryTarget extends PageTarget {
  column: number;
}

export function EncounterWorkspaceEditor({
  value,
  onChange,
  disabled = false,
  onValidityChange,
}: EncounterWorkspaceEditorProps) {
  const { t } = useTranslation();
  const id = useId();
  const pluginTabs = useCareAppTabs("encounterTabs");
  const { widgets: pluginWidgets, loadingPlugins } =
    useCareAppEncounterWidgets();
  const systemKeys = [
    ...new Set([...SYSTEM_PAGE_KEYS, ...Object.keys(pluginTabs)]),
  ];
  const [mode, setMode] = useState<"visual" | "json">("visual");
  const [selectedPage, setSelectedPage] = useState<string>();
  const [selection, setSelection] = useState<WidgetSelection | null>(null);
  const [pageDialog, setPageDialog] = useState<PageDialogState | null>(null);
  const [libraryTarget, setLibraryTarget] =
    useState<WidgetLibraryTarget | null>(null);
  const [removePageTarget, setRemovePageTarget] = useState<PageTarget | null>(
    null,
  );
  const [inspectorValid, setInspectorValid] = useState(true);
  const inspectorRef = useRef<HTMLElement>(null);
  const [formatError, setFormatError] = useState(false);
  const [history, setHistory] = useState({
    past: [] as string[],
    future: [] as string[],
    lastValue: value,
  });
  // A server refresh starts a new editing history; local controlled edits retain it.
  if (history.lastValue !== value)
    setHistory({ past: [], future: [], lastValue: value });
  useEffect(() => {
    onValidityChange?.(inspectorValid);
  }, [inspectorValid, onValidityChange]);
  useEffect(() => {
    if (selection && window.innerWidth < 1280) {
      inspectorRef.current?.scrollIntoView({ block: "start" });
    }
  }, [selection, selectedPage]);
  let raw: unknown;
  try {
    raw = parseWorkspaceJson(value);
  } catch {
    /* Keep malformed JSON editable without replacing it. */
  }
  const parsed = createEncounterWorkspaceSchema(
    Object.keys(pluginTabs),
  ).safeParse(raw);
  const template = parsed.success
    ? (raw as EncounterWorkspaceTemplate)
    : undefined;
  const empty =
    raw !== null &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    Object.keys(raw).length === 0;
  const showJson = mode === "json" || (!template && !empty);
  const pages = template?.pages ?? [];
  const unsupportedWidgets = [
    ...new Set(
      pages.flatMap((page) =>
        page.kind === "custom"
          ? page.columns.flatMap((column) =>
              column.widgets.map((widget) => widget.type),
            )
          : [],
      ),
    ),
  ].filter(
    (type) =>
      !ENCOUNTER_WIDGET_TYPES.includes(type) &&
      !pluginWidgets.has(type) &&
      !loadingPlugins.has(type.split(".")[0]),
  );
  const pageIndex = Math.max(
    0,
    pages.findIndex((page) => page.key === selectedPage),
  );
  const page = pages[pageIndex];
  const totalWidgets = pages.reduce(
    (sum, page) => sum + pageWidgetCount(page),
    0,
  );
  const dialogPage = pageDialog?.pageKey
    ? pages.find((item) => item.key === pageDialog.pageKey)
    : undefined;
  const activePageDialog =
    pageDialog?.templateValue === value &&
    (pageDialog.mode === "add" || dialogPage?.kind === "custom")
      ? pageDialog
      : null;
  const libraryPage =
    libraryTarget?.templateValue === value
      ? pages.find((item) => item.key === libraryTarget.pageKey)
      : undefined;
  const libraryColumn =
    libraryPage?.kind === "custom" && libraryTarget
      ? libraryPage.columns[libraryTarget.column]
      : undefined;
  const removePage =
    removePageTarget?.templateValue === value
      ? pages.find((item) => item.key === removePageTarget.pageKey)
      : undefined;
  // Dialogs belong to the template and page they were opened for. A refresh
  // must not retarget an action to a fallback page or leave a stale column index.
  if (pageDialog && !activePageDialog) setPageDialog(null);
  if (libraryTarget && !libraryColumn) setLibraryTarget(null);
  if (removePageTarget && !removePage) setRemovePageTarget(null);
  const busy = disabled || !inspectorValid;
  const widget =
    page?.kind === "custom" && selection
      ? page.columns[selection.column]?.widgets[selection.widget]
      : undefined;
  const commit = (next: string) => {
    if (disabled || next === value) return;
    setHistory({
      past: [...history.past, value].slice(-30),
      future: [],
      lastValue: next,
    });
    onChange(next);
  };
  const write = (nextPages: WorkspacePage[]) =>
    commit(
      JSON.stringify(
        { ...(template ?? { schema_version: 1 }), pages: nextPages },
        null,
        2,
      ),
    );
  const updatePage = (next: WorkspacePage) =>
    write(pages.map((item, index) => (index === pageIndex ? next : item)));
  const addPage = (next: WorkspacePage) => {
    if (
      busy ||
      pages.length >= 50 ||
      pages.some((page) => page.key === next.key)
    )
      return;
    write([...pages, next]);
    setSelectedPage(next.key);
    setSelection(null);
  };
  const navigateHistory = (direction: "undo" | "redo") => {
    const source = direction === "undo" ? history.past : history.future;
    const next = source.at(-1);
    if (next === undefined) return;
    setHistory(
      direction === "undo"
        ? {
            past: history.past.slice(0, -1),
            future: [...history.future, value],
            lastValue: next,
          }
        : {
            past: [...history.past, value],
            future: history.future.slice(0, -1),
            lastValue: next,
          },
    );
    setSelection(null);
    onChange(next);
  };
  const format = () => {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      setFormatError(true);
      return;
    }
    setFormatError(false);
    commit(JSON.stringify(raw, null, 2));
  };

  return (
    <section
      aria-label={t("workspace_builder")}
      className="overflow-clip rounded-xl border border-gray-200 bg-white shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
            <LayoutDashboard className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-950">
              {t("workspace_builder")}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {template
                ? t("workspace_builder_counts", {
                    pages: pages.length,
                    widgets: totalWidgets,
                  })
                : t("workspace_builder_intro")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t("workspace_builder_undo")}
              disabled={busy || !history.past.length}
              onClick={() => navigateHistory("undo")}
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t("workspace_builder_redo")}
              disabled={busy || !history.future.length}
              onClick={() => navigateHistory("redo")}
            >
              <Redo2 className="size-4" />
            </Button>
          </div>
          <div
            className="flex rounded-lg bg-gray-100 p-1"
            role="group"
            aria-label={t("workspace_builder_editing_mode")}
          >
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={!showJson}
              disabled={busy || (!template && !empty)}
              className={cn(
                "h-7 px-3 text-xs",
                !showJson && "bg-white shadow-sm",
              )}
              onClick={() => setMode("visual")}
            >
              <LayoutDashboard className="size-3.5" />
              {t("workspace_builder_visual")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={showJson}
              disabled={busy}
              className={cn(
                "h-7 px-3 text-xs",
                showJson && "bg-white shadow-sm",
              )}
              onClick={() => {
                setSelection(null);
                setMode("json");
              }}
            >
              <Braces className="size-3.5" />
              {t("workspace_builder_json")}
            </Button>
          </div>
        </div>
      </div>
      {unsupportedWidgets.length > 0 && (
        <Alert className="rounded-none border-x-0 border-t-0">
          <AlertDescription>
            {t("encounter_workspace_unsupported_widgets", {
              widgets: unsupportedWidgets.join(", "),
            })}
          </AlertDescription>
        </Alert>
      )}
      {showJson ? (
        <div className="space-y-4 p-4 sm:p-5">
          {!template && !empty && (
            <Alert>
              <AlertDescription>
                {t("workspace_builder_json_fallback")}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={id + "-json"}>{t("workspace_template")}</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={format}
            >
              {t("workspace_format_json")}
            </Button>
          </div>
          <Textarea
            id={id + "-json"}
            value={value}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={20}
            onChange={(event) => {
              setFormatError(false);
              commit(event.target.value);
            }}
            className="min-h-96 resize-y bg-gray-50/70 font-mono text-xs leading-6"
          />
          <p className="text-xs leading-relaxed text-gray-500">
            {t("workspace_template_hint")}
          </p>
          {formatError && (
            <p role="alert" className="text-sm text-red-600">
              {t("workspace_template_invalid")}
            </p>
          )}
        </div>
      ) : !template ? (
        <div className="flex min-h-96 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-5 flex items-end gap-2" aria-hidden>
            <div className="h-16 w-10 rounded-lg border border-gray-200 bg-gray-50" />
            <div className="flex h-20 w-16 items-center justify-center rounded-lg border border-primary-200 bg-primary-50">
              <WandSparkles className="size-6 text-primary-600" />
            </div>
            <div className="h-12 w-10 rounded-lg border border-gray-200 bg-gray-50" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-gray-950">
            {t("workspace_builder_empty_title")}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
            {t("workspace_builder_empty_hint")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                setPageDialog({ mode: "add", templateValue: value })
              }
            >
              <Plus className="size-4" />
              {t("workspace_builder_create_custom")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() =>
                write(SYSTEM_PAGE_KEYS.map((key) => ({ key, kind: "system" })))
              }
            >
              {t("workspace_builder_use_standard")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid min-h-[560px] lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_384px]">
          <aside className="min-w-0 border-b border-gray-200 bg-white lg:border-r lg:border-b-0">
            <div className="flex items-center justify-between px-4 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t("workspace_builder_pages")}
              </h3>
              <span className="rounded bg-gray-100 px-1.5 text-xs text-gray-500">
                {pages.length}
              </span>
            </div>
            <div className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible">
              {pages.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  aria-pressed={item.key === page?.key}
                  onClick={() => {
                    setSelectedPage(item.key);
                    setSelection(null);
                  }}
                  className={cn(
                    "h-auto min-h-10 shrink-0 justify-start gap-2 px-3 py-2 text-left text-sm font-normal lg:w-full lg:whitespace-normal",
                    item.key === page?.key &&
                      "bg-primary-50 font-semibold text-primary-900 hover:bg-primary-100",
                    item.hidden && "text-gray-400",
                  )}
                >
                  {item.kind === "system" ? (
                    <LockKeyhole className="size-3.5 shrink-0 text-gray-400" />
                  ) : (
                    <LayoutDashboard className="size-3.5 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 break-words">
                    {item.kind === "custom"
                      ? item.title
                      : systemPageLabel(item.key, t)}
                  </span>
                  {item.hidden && (
                    <EyeOff aria-hidden className="size-3.5 shrink-0" />
                  )}
                </Button>
              ))}
            </div>
            <div className="space-y-2 px-3 pb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || pages.length >= 50}
                className="w-full border-dashed shadow-none"
                onClick={() =>
                  setPageDialog({ mode: "add", templateValue: value })
                }
              >
                <Plus className="size-3.5" />
                {t("workspace_builder_add_page")}
              </Button>
              <WorkspaceSystemPageMenu
                pages={pages}
                systemKeys={systemKeys}
                disabled={busy || pages.length >= 50}
                className="w-full"
                onAdd={addPage}
              />
            </div>
            <p className="hidden border-t border-gray-100 px-4 py-4 text-xs leading-relaxed text-gray-400 lg:block">
              {t("workspace_builder_navigation_hint")}
            </p>
          </aside>
          <div className="min-w-0 bg-gray-50/60">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white/70 px-5 py-4">
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {t(
                    page.kind === "custom"
                      ? "workspace_builder_custom_page"
                      : "workspace_builder_system_page",
                  )}
                </p>
                <h3 className="break-words text-lg font-semibold tracking-tight text-gray-950">
                  {page.kind === "custom"
                    ? page.title
                    : systemPageLabel(page.key, t)}
                </h3>
              </div>
              <div className="flex items-center gap-0.5">
                {page.kind === "custom" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t("workspace_builder_page_settings")}
                    disabled={busy}
                    onClick={() =>
                      setPageDialog({
                        mode: "edit",
                        templateValue: value,
                        pageKey: page.key,
                      })
                    }
                  >
                    <Settings2 className="size-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t("workspace_builder_move_page_up")}
                  disabled={busy || pageIndex === 0}
                  onClick={() => {
                    write(moveItem(pages, pageIndex, pageIndex - 1));
                    setSelectedPage(page.key);
                  }}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t("workspace_builder_move_page_down")}
                  disabled={busy || pageIndex === pages.length - 1}
                  onClick={() => {
                    write(moveItem(pages, pageIndex, pageIndex + 1));
                    setSelectedPage(page.key);
                  }}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-gray-400 hover:text-red-700"
                  aria-label={t("workspace_builder_remove_page")}
                  disabled={busy || pages.length === 1}
                  onClick={() =>
                    setRemovePageTarget({
                      templateValue: value,
                      pageKey: page.key,
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <Label className="flex cursor-pointer items-center gap-2 border-b border-gray-200 bg-white px-5 py-3 text-xs text-gray-600">
              <Checkbox
                checked={!page.hidden}
                disabled={busy}
                onCheckedChange={(checked) => {
                  const next = { ...page };
                  if (checked) delete next.hidden;
                  else next.hidden = true;
                  updatePage(next);
                }}
              />
              {t("workspace_builder_show_page")}
            </Label>
            {page.kind === "custom" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
                  <p className="flex items-center gap-2 text-xs text-gray-500">
                    <Columns3 className="size-3.5" />
                    {t("workspace_builder_columns_hint")}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={
                      busy ||
                      page.columns.length >= MAX_ENCOUNTER_WORKSPACE_COLUMNS ||
                      page.columns.reduce((sum, item) => sum + item.span, 0) >=
                        12
                    }
                    onClick={() =>
                      updatePage({
                        ...page,
                        columns: [...page.columns, { span: 1, widgets: [] }],
                      })
                    }
                  >
                    <Plus className="size-3.5" />
                    {t("workspace_builder_add_column")}
                  </Button>
                </div>
                <WorkspacePageCanvas
                  page={page}
                  selected={selection}
                  disabled={busy}
                  canAddWidget={totalWidgets < 200}
                  onChange={updatePage}
                  onSelect={setSelection}
                  onAddWidget={(column) =>
                    setLibraryTarget({
                      templateValue: value,
                      pageKey: page.key,
                      column,
                    })
                  }
                />
                <p className="flex items-start gap-2 px-5 pb-5 text-xs leading-relaxed text-gray-400">
                  <Monitor className="mt-0.5 size-3.5 shrink-0" />
                  {t("workspace_builder_layout_hint")}
                </p>
              </>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
                <span className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-xs">
                  <LockKeyhole className="size-6 text-gray-400" />
                </span>
                <h4 className="text-base font-semibold text-gray-800">
                  {t("workspace_builder_system_locked")}
                </h4>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                  {t("workspace_builder_system_hint")}
                </p>
              </div>
            )}
          </div>
          <aside
            ref={inspectorRef}
            className="min-w-0 scroll-mt-28 border-t border-gray-200 bg-white lg:col-span-2 xl:sticky xl:top-28 xl:col-span-1 xl:max-h-[calc(100dvh-8rem)] xl:self-start xl:overflow-y-auto xl:border-t-0 xl:border-l"
          >
            {widget && selection && page.kind === "custom" ? (
              <WorkspaceWidgetInspector
                key={page.key + ":" + selection.column + ":" + selection.widget}
                widget={widget}
                disabled={disabled}
                onValidityChange={setInspectorValid}
                onChange={(next) =>
                  updatePage({
                    ...page,
                    columns: page.columns.map((column, index) =>
                      index === selection.column
                        ? {
                            ...column,
                            widgets: column.widgets.map((item, index) =>
                              index === selection.widget ? next : item,
                            ),
                          }
                        : column,
                    ),
                  })
                }
              />
            ) : (
              <div className="p-5">
                <h3 className="text-sm font-semibold text-gray-800">
                  {t("workspace_builder_settings")}
                </h3>
                <div className="mt-8 flex flex-col items-center px-3 text-center">
                  <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-gray-50">
                    <Settings2 className="size-5 text-gray-400" />
                  </span>
                  <p className="text-sm font-medium text-gray-600">
                    {t("workspace_builder_select_widget")}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-400">
                    {t("workspace_builder_select_widget_hint")}
                  </p>
                </div>
                <div className="mt-10 space-y-3 border-t border-gray-100 pt-5">
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary-600" />
                    {t("workspace_builder_shared_widgets")}
                  </p>
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                    <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-gray-400" />
                    {t("workspace_builder_system_fixed")}
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
      {activePageDialog && (
        <WorkspacePageDialog
          page={
            activePageDialog.mode === "edit" && dialogPage?.kind === "custom"
              ? dialogPage
              : undefined
          }
          pages={pages}
          systemKeys={systemKeys}
          onClose={() => setPageDialog(null)}
          onSave={(next) => {
            if (busy || activePageDialog.templateValue !== value) return;
            if (activePageDialog.mode === "edit") {
              if (!dialogPage || dialogPage.kind !== "custom") return;
              write(
                pages.map((item) =>
                  item.key === activePageDialog.pageKey ? next : item,
                ),
              );
            } else addPage(next);
            setSelectedPage(next.key);
            setSelection(null);
            setPageDialog(null);
          }}
        />
      )}
      {libraryTarget && libraryPage?.kind === "custom" && libraryColumn && (
        <WorkspaceWidgetLibrary
          onClose={() => setLibraryTarget(null)}
          onAdd={(type) => {
            if (
              busy ||
              libraryTarget.templateValue !== value ||
              libraryColumn.widgets.length >= 50 ||
              totalWidgets >= 200
            )
              return;
            write(
              pages.map((item) =>
                item.key === libraryTarget.pageKey
                  ? {
                      ...libraryPage,
                      columns: libraryPage.columns.map((column, index) =>
                        index === libraryTarget.column
                          ? {
                              ...column,
                              widgets: [...column.widgets, { type }],
                            }
                          : column,
                      ),
                    }
                  : item,
              ),
            );
            setSelectedPage(libraryTarget.pageKey);
            setSelection({
              column: libraryTarget.column,
              widget: libraryColumn.widgets.length,
            });
            setLibraryTarget(null);
          }}
        />
      )}
      <AlertDialog
        open={!!removePage}
        onOpenChange={(open) => {
          if (!open) setRemovePageTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("workspace_builder_remove_page")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("workspace_builder_remove_page_hint")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || pages.length <= 1 || !removePage}
              onClick={() => {
                if (
                  busy ||
                  pages.length <= 1 ||
                  !removePage ||
                  removePageTarget?.templateValue !== value
                )
                  return;
                write(
                  pages.filter((item) => item.key !== removePageTarget.pageKey),
                );
                setSelectedPage(undefined);
                setSelection(null);
                setRemovePageTarget(null);
              }}
            >
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
