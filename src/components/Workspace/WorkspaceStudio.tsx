import {
  ArrowDown,
  ArrowUp,
  Braces,
  ChevronDown,
  Columns2,
  Columns3,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  Monitor,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  Settings2,
  Smartphone,
  Square,
  Trash2,
  Undo2,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCareAppEncounterWidgets } from "@/hooks/useCareAppEncounterWidgets";
import { useCareAppTabs } from "@/hooks/useCareApps";
import { cn } from "@/lib/utils";
import { EncounterStatus } from "@/types/emr/encounter/encounter";
import {
  ENCOUNTER_WIDGET_TYPES,
  HISTORY_PAGE_KEYS,
  SYSTEM_PAGE_KEYS,
  getWorkspaceSurface,
  workspaceStructureSchema,
  type EncounterWorkspaceTemplate,
} from "@/types/workspace/encounterWorkspace";
import type { WorkspaceAvailabilityContext } from "@/types/workspace/widgetAvailability";

import {
  moveItem,
  pageWidgetCount,
  parseWorkspaceJson,
  systemPageLabel,
  type WidgetSelection,
  type WorkspacePage,
} from "./workspaceEditorUtils";
import {
  WORKSPACE_LAYOUTS,
  applyLayout,
  canApplyLayout,
  detectLayout,
  layoutColumnLabelKeys,
  type WorkspaceLayoutId,
} from "./workspaceLayouts";
import { standardWorkspaceTemplate } from "./workspacePresets";
import { WorkspaceSectionPicker } from "./WorkspaceSectionPicker";
import { WorkspaceSectionSettings } from "./WorkspaceSectionSettings";
import { WorkspaceStarterPicker } from "./WorkspaceStarterPicker";
import { WorkspaceTabCanvas } from "./WorkspaceTabCanvas";
import { TAB_ICONS, WorkspaceTabDialog } from "./WorkspaceTabDialog";

interface WorkspaceStudioProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onValidityChange?: (valid: boolean) => void;
  savedTemplate?: unknown;
}

interface TabTarget {
  templateValue: string;
  tabKey: string;
}

interface TabDialogState extends Partial<TabTarget> {
  mode: "add" | "edit";
  templateValue: string;
}

interface SectionTarget extends WidgetSelection {
  tabKey: string;
}

interface PickerTarget extends TabTarget {
  column: number;
}

type PreviewAccess = "editing" | "readonly" | "encounter_only" | "details";

const LAYOUT_ICONS: Record<WorkspaceLayoutId, LucideIcon> = {
  single: Square,
  main_side: PanelRight,
  side_main: PanelLeft,
  halves: Columns2,
  thirds: Columns3,
};

const DEVICE_OPTIONS = [
  ["desktop", Monitor],
  ["mobile", Smartphone],
] as const;

const PREVIEW_ACCESS_KEYS: Record<PreviewAccess, string> = {
  editing: "workspace_preview_editable",
  readonly: "workspace_preview_readonly",
  encounter_only: "workspace_preview_encounter_only",
  details: "workspace_preview_metadata",
};

export function WorkspaceStudio({
  value,
  onChange,
  disabled = false,
  onValidityChange,
  savedTemplate,
}: WorkspaceStudioProps) {
  const { t } = useTranslation();
  const id = useId();
  const pluginTabs = useCareAppTabs("encounterTabs");
  const { widgets: pluginWidgets, loadingPlugins } =
    useCareAppEncounterWidgets();
  const [mode, setMode] = useState<"design" | "json">("design");
  const [selectedTab, setSelectedTab] = useState<string>();
  const [settingsTarget, setSettingsTarget] = useState<SectionTarget | null>(
    null,
  );
  const [tabDialog, setTabDialog] = useState<TabDialogState | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [removeTabTarget, setRemoveTabTarget] = useState<TabTarget | null>(
    null,
  );
  const [settingsValid, setSettingsValid] = useState(true);
  const [formatError, setFormatError] = useState(false);
  const [previewEncounter, setPreviewEncounter] = useState<"active" | "closed">(
    "active",
  );
  const [previewAccess, setPreviewAccess] = useState<PreviewAccess>("editing");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [history, setHistory] = useState({
    past: [] as string[],
    future: [] as string[],
    lastValue: value,
  });
  // A server refresh starts a new editing history; local controlled edits retain it.
  if (history.lastValue !== value)
    setHistory({ past: [], future: [], lastValue: value });
  useEffect(() => {
    onValidityChange?.(settingsValid);
  }, [settingsValid, onValidityChange]);

  let raw: unknown;
  try {
    raw = parseWorkspaceJson(value);
  } catch {
    /* Keep malformed JSON editable without replacing it. */
  }
  const parsed = workspaceStructureSchema.safeParse(raw);
  const template = parsed.success
    ? (raw as EncounterWorkspaceTemplate)
    : undefined;
  const surface = getWorkspaceSurface(raw);
  const systemKeys =
    surface === "patient_history"
      ? HISTORY_PAGE_KEYS
      : [...new Set([...SYSTEM_PAGE_KEYS, ...Object.keys(pluginTabs)])];
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
  const tabIndex = Math.max(
    0,
    pages.findIndex((page) => page.key === selectedTab),
  );
  const tab = pages[tabIndex];
  const convertibleTab =
    tab?.kind === "system"
      ? standardWorkspaceTemplate(surface, t).pages.find(
          (item) => item.key === tab.key && item.kind === "custom",
        )
      : undefined;
  const unavailableTabs = pages.filter(
    (item) => item.kind === "system" && !systemKeys.includes(item.key),
  );
  const totalSections = pages.reduce(
    (sum, page) => sum + pageWidgetCount(page),
    0,
  );
  const layout = tab?.kind === "custom" ? detectLayout(tab.columns) : "custom";
  const columnLabelKeys = layoutColumnLabelKeys(layout);
  const previewContext: WorkspaceAvailabilityContext =
    surface === "patient_history"
      ? {
          canReadClinicalData: true,
          canReadPatientHistory: true,
          canReadSelectedEncounter: false,
          canWriteClinicalData: false,
        }
      : {
          facilityId: "preview",
          selectedEncounter: {
            status:
              previewEncounter === "active"
                ? EncounterStatus.IN_PROGRESS
                : EncounterStatus.COMPLETED,
          },
          canReadClinicalData: previewAccess !== "details",
          canReadPatientHistory:
            previewAccess === "editing" || previewAccess === "readonly",
          canReadSelectedEncounter: true,
          canWriteClinicalData:
            previewAccess === "editing" && previewEncounter === "active",
        };

  const dialogTab = tabDialog?.tabKey
    ? pages.find((item) => item.key === tabDialog.tabKey)
    : undefined;
  const activeTabDialog =
    tabDialog?.templateValue === value &&
    (tabDialog.mode === "add" || dialogTab?.kind === "custom")
      ? tabDialog
      : null;
  const pickerTab =
    pickerTarget?.templateValue === value
      ? pages.find((item) => item.key === pickerTarget.tabKey)
      : undefined;
  const pickerColumn =
    pickerTab?.kind === "custom" && pickerTarget
      ? pickerTab.columns[pickerTarget.column]
      : undefined;
  const removeTab =
    removeTabTarget?.templateValue === value
      ? pages.find((item) => item.key === removeTabTarget.tabKey)
      : undefined;
  const settingsTab = settingsTarget
    ? pages.find((item) => item.key === settingsTarget.tabKey)
    : undefined;
  const settingsWidget =
    settingsTab?.kind === "custom" && settingsTarget
      ? settingsTab.columns[settingsTarget.column]?.widgets[
          settingsTarget.widget
        ]
      : undefined;
  // Dialogs belong to the template and tab they were opened for. A refresh
  // must not retarget an action to a fallback tab or leave a stale column index.
  if (tabDialog && !activeTabDialog) setTabDialog(null);
  if (pickerTarget && !pickerColumn) setPickerTarget(null);
  if (removeTabTarget && !removeTab) setRemoveTabTarget(null);
  if (settingsTarget && !settingsWidget) setSettingsTarget(null);
  const busy = disabled || !settingsValid;

  const commit = (next: string) => {
    if (disabled || next === value) return;
    setHistory({
      past: [...history.past, value].slice(-30),
      future: [],
      lastValue: next,
    });
    onChange(next);
  };
  const writeTemplate = (next: EncounterWorkspaceTemplate) =>
    commit(JSON.stringify(next, null, 2));
  const write = (nextPages: WorkspacePage[]) =>
    writeTemplate({
      ...(template ?? { schema_version: 1 }),
      pages: nextPages,
    } as EncounterWorkspaceTemplate);
  const updateTab = (next: WorkspacePage) =>
    write(pages.map((item, index) => (index === tabIndex ? next : item)));
  const addTab = (next: WorkspacePage) => {
    if (
      busy ||
      pages.length >= 50 ||
      pages.some((page) => page.key === next.key)
    )
      return;
    write([...pages, next]);
    setSelectedTab(next.key);
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
    setSettingsTarget(null);
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
  const tabIcon = (page: WorkspacePage): LucideIcon => {
    if (page.kind === "system") return LockKeyhole;
    return (page.icon && TAB_ICONS[page.icon]) || LayoutDashboard;
  };
  const tabTitle = (page: WorkspacePage) =>
    page.kind === "custom" ? page.title : systemPageLabel(page.key, t);

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <LayoutDashboard className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-950">
              {t("workspace_studio_title")}
            </h2>
            {template && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {t(`workspace_studio_surface_${surface}`)}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {template
              ? t("workspace_studio_counts", {
                  tabs: pages.length,
                  sections: totalSections,
                })
              : t("workspace_studio_intro")}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
        {template && !showJson && surface === "encounter" && (
          <div
            role="group"
            aria-label={t("workspace_studio_preview_as")}
            className="flex rounded-lg bg-gray-100 p-1"
          >
            {(["active", "closed"] as const).map((state) => (
              <Button
                key={state}
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={previewEncounter === state}
                className={cn(
                  "h-7 px-3 text-xs",
                  previewEncounter === state && "bg-white shadow-sm",
                )}
                onClick={() => setPreviewEncounter(state)}
              >
                {t(`workspace_studio_preview_${state}`)}
              </Button>
            ))}
          </div>
        )}
        {template && !showJson && (
          <div
            role="group"
            aria-label={t("workspace_preview_size")}
            className="flex rounded-lg bg-gray-100 p-1"
          >
            {DEVICE_OPTIONS.map(([size, Icon]) => (
              <Button
                key={size}
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t(`workspace_preview_${size}`)}
                aria-pressed={device === size}
                className={cn(
                  "size-7",
                  device === size && "bg-white shadow-sm",
                )}
                onClick={() => setDevice(size)}
              >
                <Icon className="size-3.5" />
              </Button>
            ))}
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shadow-none"
              aria-label={t("workspace_studio_more")}
              disabled={busy}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {showJson ? (
              <DropdownMenuItem
                disabled={!template && !empty}
                onSelect={() => setMode("design")}
              >
                <LayoutDashboard className="size-4" />
                {t("workspace_studio_back_to_design")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => {
                  setSettingsTarget(null);
                  setMode("json");
                }}
              >
                <Braces className="size-4" />
                {t("workspace_studio_edit_json")}
              </DropdownMenuItem>
            )}
            {template && !showJson && surface === "encounter" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Settings2 className="size-4" />
                    {t("workspace_studio_preview_access")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={previewAccess}
                      onValueChange={(next) =>
                        setPreviewAccess(next as PreviewAccess)
                      }
                    >
                      {(
                        Object.keys(PREVIEW_ACCESS_KEYS) as PreviewAccess[]
                      ).map((access) => (
                        <DropdownMenuRadioItem key={access} value={access}>
                          {t(PREVIEW_ACCESS_KEYS[access])}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <section
      aria-label={t("workspace_studio_title")}
      className="overflow-clip rounded-xl border border-gray-200 bg-white shadow-xs"
    >
      {toolbar}
      {unsupportedWidgets.length > 0 && (
        <Alert className="rounded-none border-x-0 border-t-0">
          <AlertDescription>
            {t("encounter_workspace_unsupported_widgets", {
              widgets: unsupportedWidgets.join(", "),
            })}
          </AlertDescription>
        </Alert>
      )}
      {unavailableTabs.length > 0 && (
        <Alert className="rounded-none border-x-0 border-t-0">
          <AlertDescription>
            {t("workspace_unavailable_pages_preserved", {
              pages: unavailableTabs.map((item) => item.key).join(", "),
            })}
          </AlertDescription>
        </Alert>
      )}
      {savedTemplate !== undefined &&
        template &&
        getWorkspaceSurface(savedTemplate) !== surface && (
          <Alert className="rounded-none border-x-0 border-t-0">
            <AlertDescription>
              {t("workspace_surface_change_notice")}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label htmlFor={`${id}-json`}>{t("workspace_template")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={format}
              >
                {t("workspace_format_json")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || (!template && !empty)}
                onClick={() => setMode("design")}
              >
                <LayoutDashboard className="size-3.5" />
                {t("workspace_studio_back_to_design")}
              </Button>
            </div>
          </div>
          <Textarea
            id={`${id}-json`}
            value={value}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={20}
            onChange={(event) => {
              setFormatError(false);
              setMode("json");
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
        <WorkspaceStarterPicker
          disabled={busy}
          onPick={(starter) => {
            writeTemplate(starter.build(t, Object.keys(pluginTabs)));
            setSelectedTab(undefined);
          }}
          onUseJson={() => setMode("json")}
        />
      ) : (
        <div className="grid min-h-[560px] lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="min-w-0 border-b border-gray-200 bg-white lg:border-r lg:border-b-0">
            <div className="flex items-center justify-between px-4 py-4">
              <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                {t("workspace_studio_tabs")}
              </h3>
              <span className="rounded bg-gray-100 px-1.5 text-xs text-gray-500">
                {pages.length}
              </span>
            </div>
            <nav
              aria-label={t("workspace_studio_tabs")}
              className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible"
            >
              {pages.map((item) => {
                const Icon = tabIcon(item);
                return (
                  <Button
                    key={item.key}
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    aria-pressed={item.key === tab?.key}
                    onClick={() => setSelectedTab(item.key)}
                    className={cn(
                      "h-auto min-h-10 shrink-0 justify-start gap-2 px-3 py-2 text-left text-sm font-normal lg:w-full lg:whitespace-normal",
                      item.key === tab?.key &&
                        "bg-primary-50 font-semibold text-primary-900 hover:bg-primary-100",
                      item.hidden && "text-gray-400",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0",
                        item.kind === "system" && "text-gray-400",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 break-words">
                      {tabTitle(item)}
                    </span>
                    {item.hidden && (
                      <EyeOff
                        aria-hidden="true"
                        className="size-3.5 shrink-0"
                      />
                    )}
                  </Button>
                );
              })}
            </nav>
            <div className="px-3 pb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy || pages.length >= 50}
                    className="w-full border-dashed shadow-none"
                  >
                    <Plus className="size-3.5" />
                    {t("workspace_studio_add_tab")}
                    <ChevronDown className="ml-auto size-3.5 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-80 w-64 overflow-y-auto"
                >
                  <DropdownMenuItem
                    onSelect={() =>
                      setTabDialog({ mode: "add", templateValue: value })
                    }
                  >
                    <LayoutDashboard className="size-4" />
                    {t("workspace_studio_new_tab")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-gray-500">
                    {t("workspace_studio_builtin_tabs")}
                  </DropdownMenuLabel>
                  {systemKeys.map((key) => {
                    const added = pages.some((page) => page.key === key);
                    return (
                      <DropdownMenuItem
                        key={key}
                        disabled={added}
                        onSelect={() => addTab({ kind: "system", key })}
                      >
                        <LockKeyhole className="size-4 text-gray-400" />
                        <span className="flex-1">
                          {systemPageLabel(key, t)}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="mt-3 hidden text-xs leading-relaxed text-gray-400 lg:block">
                {t("workspace_studio_tabs_hint")}
              </p>
            </div>
          </aside>

          <div className="min-w-0">
            {tab && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    {(() => {
                      const Icon = tabIcon(tab);
                      return (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                      );
                    })()}
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                        {t(
                          tab.kind === "custom"
                            ? "workspace_studio_tab"
                            : "workspace_studio_builtin_tab",
                        )}
                      </p>
                      <h3 className="text-base font-semibold tracking-tight break-words text-gray-950">
                        {tabTitle(tab)}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <div className="mr-2 flex items-center gap-2">
                      <Switch
                        id={`${id}-tab-visible`}
                        checked={!tab.hidden}
                        disabled={busy}
                        aria-label={t("workspace_studio_show_tab")}
                        onCheckedChange={(checked) => {
                          const next = { ...tab };
                          if (checked) delete next.hidden;
                          else next.hidden = true;
                          updateTab(next);
                        }}
                      />
                      <Label
                        htmlFor={`${id}-tab-visible`}
                        className="text-xs font-medium text-gray-600"
                      >
                        {t(
                          tab.hidden
                            ? "workspace_studio_tab_hidden"
                            : "workspace_studio_tab_visible",
                        )}
                      </Label>
                    </div>
                    {tab.kind === "custom" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={t("workspace_studio_tab_settings")}
                        disabled={busy}
                        onClick={() =>
                          setTabDialog({
                            mode: "edit",
                            templateValue: value,
                            tabKey: tab.key,
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
                      aria-label={t("workspace_studio_move_tab_up")}
                      disabled={busy || tabIndex === 0}
                      onClick={() => {
                        write(moveItem(pages, tabIndex, tabIndex - 1));
                        setSelectedTab(tab.key);
                      }}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={t("workspace_studio_move_tab_down")}
                      disabled={busy || tabIndex === pages.length - 1}
                      onClick={() => {
                        write(moveItem(pages, tabIndex, tabIndex + 1));
                        setSelectedTab(tab.key);
                      }}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-gray-400 hover:text-red-700"
                      aria-label={t("workspace_studio_remove_tab")}
                      disabled={busy || pages.length === 1}
                      onClick={() =>
                        setRemoveTabTarget({
                          templateValue: value,
                          tabKey: tab.key,
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {tab.kind === "custom" ? (
                  <>
                    <div
                      role="group"
                      aria-label={t("workspace_studio_layout")}
                      className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2.5 sm:px-5"
                    >
                      <span className="text-xs font-medium text-gray-500">
                        {t("workspace_studio_layout")}
                      </span>
                      {WORKSPACE_LAYOUTS.map((option) => {
                        const Icon = LAYOUT_ICONS[option.id];
                        const active = layout === option.id;
                        return (
                          <Button
                            key={option.id}
                            type="button"
                            size="sm"
                            variant="outline"
                            aria-pressed={active}
                            disabled={
                              busy || !canApplyLayout(tab, option.spans)
                            }
                            onClick={() =>
                              updateTab(applyLayout(tab, option.spans))
                            }
                            className={cn(
                              "h-8 gap-1.5 px-2.5 text-xs shadow-none",
                              active &&
                                "border-primary-500 bg-primary-50 text-primary-900 ring-1 ring-primary-500",
                            )}
                          >
                            <Icon className="size-3.5" aria-hidden="true" />
                            {t(`workspace_studio_layout_${option.id}`)}
                          </Button>
                        );
                      })}
                      {layout === "custom" && (
                        <span className="text-xs text-gray-500">
                          {t("workspace_studio_layout_custom")}
                        </span>
                      )}
                    </div>
                    <WorkspaceTabCanvas
                      page={tab}
                      columnLabelKeys={columnLabelKeys}
                      previewContext={previewContext}
                      device={device}
                      disabled={busy}
                      canAddSection={totalSections < 200}
                      onChange={updateTab}
                      onOpenSettings={(selection) =>
                        setSettingsTarget({ ...selection, tabKey: tab.key })
                      }
                      onAddSection={(column) =>
                        setPickerTarget({
                          templateValue: value,
                          tabKey: tab.key,
                          column,
                        })
                      }
                    />
                    <p className="flex items-start gap-2 px-5 pb-5 text-xs leading-relaxed text-gray-400">
                      <Monitor className="mt-0.5 size-3.5 shrink-0" />
                      {t("workspace_studio_canvas_hint")}
                    </p>
                  </>
                ) : (
                  <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
                    <span className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-xs">
                      <LockKeyhole className="size-6 text-gray-400" />
                    </span>
                    <h4 className="text-base font-semibold text-gray-800">
                      {t("workspace_studio_builtin_title")}
                    </h4>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                      {t(
                        convertibleTab
                          ? "workspace_studio_builtin_hint_convertible"
                          : "workspace_studio_builtin_hint",
                      )}
                    </p>
                    {convertibleTab?.kind === "custom" && (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-5"
                        disabled={
                          busy ||
                          totalSections + pageWidgetCount(convertibleTab) > 200
                        }
                        onClick={() => {
                          writeTemplate({
                            ...template,
                            schema_version: 2,
                            surface,
                            pages: pages.map((item, index) =>
                              index === tabIndex
                                ? { ...convertibleTab, hidden: tab.hidden }
                                : item,
                            ),
                          });
                        }}
                      >
                        <WandSparkles className="size-4" />
                        {t("workspace_studio_customize_tab")}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {settingsTarget && settingsWidget && (
        <WorkspaceSectionSettings
          key={`${settingsTarget.tabKey}:${settingsTarget.column}:${settingsTarget.widget}:${settingsWidget.type}`}
          widget={settingsWidget}
          disabled={disabled}
          onValidityChange={setSettingsValid}
          onClose={() => setSettingsTarget(null)}
          onRemove={() => {
            if (settingsTab?.kind !== "custom") return;
            write(
              pages.map((item) =>
                item.key === settingsTab.key && item.kind === "custom"
                  ? {
                      ...item,
                      columns: item.columns.map((column, index) =>
                        index === settingsTarget.column
                          ? {
                              ...column,
                              widgets: column.widgets.filter(
                                (_, widgetIndex) =>
                                  widgetIndex !== settingsTarget.widget,
                              ),
                            }
                          : column,
                      ),
                    }
                  : item,
              ),
            );
            setSettingsTarget(null);
          }}
          onChange={(next) => {
            if (settingsTab?.kind !== "custom") return;
            write(
              pages.map((item) =>
                item.key === settingsTab.key && item.kind === "custom"
                  ? {
                      ...item,
                      columns: item.columns.map((column, index) =>
                        index === settingsTarget.column
                          ? {
                              ...column,
                              widgets: column.widgets.map(
                                (widget, widgetIndex) =>
                                  widgetIndex === settingsTarget.widget
                                    ? next
                                    : widget,
                              ),
                            }
                          : column,
                      ),
                    }
                  : item,
              ),
            );
          }}
        />
      )}
      {activeTabDialog && (
        <WorkspaceTabDialog
          page={
            activeTabDialog.mode === "edit" && dialogTab?.kind === "custom"
              ? dialogTab
              : undefined
          }
          pages={pages}
          systemKeys={systemKeys}
          allowSystemKeys={template?.schema_version === 2}
          onClose={() => setTabDialog(null)}
          onSave={(next) => {
            if (busy || activeTabDialog.templateValue !== value) return;
            if (activeTabDialog.mode === "edit") {
              if (!dialogTab || dialogTab.kind !== "custom") return;
              write(
                pages.map((item) =>
                  item.key === activeTabDialog.tabKey ? next : item,
                ),
              );
            } else addTab(next);
            setSelectedTab(next.key);
            setTabDialog(null);
          }}
        />
      )}
      {pickerTarget && pickerTab?.kind === "custom" && pickerColumn && (
        <WorkspaceSectionPicker
          surface={surface}
          onClose={() => setPickerTarget(null)}
          onAdd={(type) => {
            if (
              busy ||
              pickerTarget.templateValue !== value ||
              pickerColumn.widgets.length >= 50 ||
              totalSections >= 200
            )
              return;
            write(
              pages.map((item) =>
                item.key === pickerTarget.tabKey
                  ? {
                      ...pickerTab,
                      columns: pickerTab.columns.map((column, index) =>
                        index === pickerTarget.column
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
            setSelectedTab(pickerTarget.tabKey);
            setPickerTarget(null);
          }}
        />
      )}
      <AlertDialog
        open={!!removeTab}
        onOpenChange={(open) => {
          if (!open) setRemoveTabTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("workspace_studio_remove_tab")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("workspace_studio_remove_tab_hint")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || pages.length <= 1 || !removeTab}
              onClick={() => {
                if (
                  busy ||
                  pages.length <= 1 ||
                  !removeTab ||
                  removeTabTarget?.templateValue !== value
                )
                  return;
                write(
                  pages.filter((item) => item.key !== removeTabTarget.tabKey),
                );
                setSelectedTab(undefined);
                setRemoveTabTarget(null);
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
