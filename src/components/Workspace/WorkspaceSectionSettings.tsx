import { Braces, ChevronDown, Puzzle, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { AuthorRoleFilter } from "@/components/Facility/ConsultationDetails/AuthorRoleFilter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCareAppEncounterWidgets } from "@/hooks/useCareAppEncounterWidgets";
import type { Code } from "@/types/base/code/code";
import { EncounterStatus } from "@/types/emr/encounter/encounter";
import type { EncounterWorkspaceWidget } from "@/types/workspace/encounterWorkspace";
import { getWidgetRequirements } from "@/types/workspace/widgetAvailability";
import { getCoreWidgetConfigSchema } from "@/types/workspace/widgetConfigSchemas";

import { ObservationChartPicker } from "./ObservationChartPicker";
import { VitalsCodePicker } from "./VitalsCodePicker";
import {
  CORE_WIDGET_CATALOG,
  workspaceWidgetLabel,
} from "./workspaceEditorCatalog";
import { parseWorkspaceJson } from "./workspaceEditorUtils";
import {
  applySectionVisibilityMode,
  sectionVisibilityMode,
  type SectionVisibilityMode,
} from "./workspaceLayouts";
import { WorkspaceSchemaFields } from "./WorkspaceSchemaFields";
import { WorkspaceWidgetAvailability } from "./WorkspaceWidgetAvailability";
import { prepareWidgetConfigSchema } from "./workspaceWidgetSchema";
import {
  widgetConfigErrorMessage,
  widgetConfigIssueLabel,
  widgetSchemaText,
} from "./workspaceWidgetSchemaI18n";

interface WorkspaceSectionSettingsProps {
  widget: EncounterWorkspaceWidget;
  disabled?: boolean;
  onChange: (widget: EncounterWorkspaceWidget) => void;
  onRemove: () => void;
  onClose: () => void;
  onValidityChange?: (valid: boolean) => void;
}

function parseConfig(text: string): Record<string, unknown> | undefined {
  try {
    return parseWorkspaceJson(text);
  } catch {
    // Incomplete JSON stays local until it can be represented safely.
  }
}

/** Mount keyed by section identity so an unfinished draft belongs to one section. */
export function WorkspaceSectionSettings({
  widget,
  disabled = false,
  onChange,
  onRemove,
  onClose,
  onValidityChange,
}: WorkspaceSectionSettingsProps) {
  const { t } = useTranslation();
  const id = useId();
  const { widgets: pluginWidgets } = useCareAppEncounterWidgets();
  const plugin = pluginWidgets.get(widget.type);
  const schema = useMemo(
    () => getCoreWidgetConfigSchema(widget.type, t) ?? plugin?.configSchema,
    [plugin?.configSchema, t, widget.type],
  );
  const preparedSchema = useMemo(
    () => (schema ? prepareWidgetConfigSchema(schema, t) : undefined),
    [schema, t],
  );
  const [advancedOpen, setAdvancedOpen] = useState(!preparedSchema);
  const [configDraft, setConfigDraft] = useState<{
    text: string;
    committed?: string;
  } | null>(null);
  const config = widget.config ?? {};
  const catalogItem = CORE_WIDGET_CATALOG.find(
    (item) => item.type === widget.type,
  );
  const Icon = catalogItem?.icon ?? Puzzle;
  const name = workspaceWidgetLabel(widget.type, t);
  const requirements = getWidgetRequirements(
    widget.type,
    plugin?.requiresActiveEncounter,
  );
  const configText =
    configDraft &&
    (configDraft.committed === undefined ||
      configDraft.committed === JSON.stringify(config))
      ? configDraft.text
      : JSON.stringify(config, null, 2);
  const editedConfig = useMemo(() => parseConfig(configText), [configText]);
  const jsonError = editedConfig === undefined;
  const validation = useMemo(
    () =>
      editedConfig &&
      preparedSchema?.validator.safeParse(editedConfig, {
        error: (issue) => widgetConfigErrorMessage(issue, t),
      }),
    [editedConfig, preparedSchema, t],
  );
  const issues = useMemo(
    () => (validation && !validation.success ? validation.error.issues : []),
    [validation],
  );
  const valid = !jsonError && !issues.length;
  const visibility = sectionVisibilityMode(widget);
  const statuses = widget.visible_when?.["encounter.status"];
  // These options get purpose-built pickers instead of the generic schema form.
  const customFields: Partial<Record<string, readonly string[]>> = {
    questionnaire_responses: ["role"],
    vitals: ["codes"],
    observation_chart: ["plot", "groups"],
  };
  const customFieldNames = customFields[widget.type] ?? [];
  const fields =
    preparedSchema?.fieldMetadata.filter(
      (field) => !customFieldNames.includes(field.name),
    ) ?? [];
  const hasSettings = fields.length > 0 || customFieldNames.length > 0;
  const activeConfig = editedConfig ?? config;
  const selectedCodes = Array.isArray(activeConfig.codes)
    ? (activeConfig.codes as Code[])
    : [];
  const chartGroups = Array.isArray(activeConfig.groups)
    ? (activeConfig.groups as unknown[]).filter(
        (group): group is string => typeof group === "string",
      )
    : undefined;
  const updateConfig = (
    nextConfig: Record<string, unknown>,
    text = JSON.stringify(nextConfig, null, 2),
  ) => {
    const accepted =
      preparedSchema?.validator.safeParse(nextConfig).success !== false;
    setConfigDraft({
      text,
      ...(accepted ? { committed: JSON.stringify(nextConfig) } : {}),
    });
    if (accepted) onChange({ ...widget, config: nextConfig });
  };

  useEffect(() => {
    onValidityChange?.(valid);
  }, [onValidityChange, valid]);
  useEffect(() => () => onValidityChange?.(true), [onValidityChange]);

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        aria-label={t("workspace_studio_section_settings")}
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="space-y-3 border-b border-gray-200 p-5 text-left">
          <SheetTitle className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            {t("workspace_studio_section_settings")}
          </SheetTitle>
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-primary-100 ring-inset">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold break-words text-gray-950">
                {name}
              </h3>
              <SheetDescription className="mt-1 text-xs leading-5">
                {catalogItem
                  ? t(catalogItem.descriptionKey)
                  : t("workspace_widget_plugin_description")}
              </SheetDescription>
            </div>
          </div>
          <WorkspaceWidgetAvailability
            type={widget.type}
            requiresActiveEncounter={plugin?.requiresActiveEncounter}
          />
        </SheetHeader>

        <div className="flex-1 space-y-6 p-5">
          <div className="space-y-2">
            <Label htmlFor={`${id}-title`} className="text-sm font-medium">
              {t("workspace_studio_section_title")}
            </Label>
            <Input
              id={`${id}-title`}
              value={widget.title ?? ""}
              placeholder={name}
              maxLength={120}
              disabled={disabled}
              onChange={(event) => {
                const next = { ...widget };
                if (event.target.value.trim()) next.title = event.target.value;
                else delete next.title;
                onChange(next);
              }}
              className="h-9 text-sm shadow-none"
            />
            <p className="text-xs leading-5 text-gray-500">
              {t("workspace_widget_title_hint")}
            </p>
          </div>

          {preparedSchema ? (
            hasSettings && (
              <section
                aria-label={t("workspace_studio_section_options")}
                className="space-y-4"
              >
                <h4 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  {t("workspace_studio_section_options")}
                </h4>
                {fields.length > 0 && (
                  <WorkspaceSchemaFields
                    config={editedConfig ?? config}
                    fields={fields}
                    issues={issues}
                    disabled={disabled || jsonError}
                    onChange={updateConfig}
                  />
                )}
                {widget.type === "observation_chart" && (
                  <ObservationChartPicker
                    plot={
                      typeof activeConfig.plot === "string"
                        ? activeConfig.plot
                        : undefined
                    }
                    groups={chartGroups}
                    disabled={disabled || jsonError}
                    onChange={({ plot, groups }) => {
                      const nextConfig = { ...activeConfig };
                      if (plot) nextConfig.plot = plot;
                      else delete nextConfig.plot;
                      if (groups?.length) nextConfig.groups = groups;
                      else delete nextConfig.groups;
                      updateConfig(nextConfig);
                    }}
                  />
                )}
                {widget.type === "vitals" && (
                  <VitalsCodePicker
                    value={selectedCodes}
                    disabled={disabled || jsonError}
                    onChange={(codes) => {
                      const nextConfig = { ...activeConfig };
                      if (codes.length) nextConfig.codes = codes;
                      else delete nextConfig.codes;
                      updateConfig(nextConfig);
                    }}
                  />
                )}
                {widget.type === "questionnaire_responses" && (
                  <div className="space-y-1.5">
                    <AuthorRoleFilter
                      value={
                        typeof activeConfig.role === "string"
                          ? activeConfig.role
                          : undefined
                      }
                      disabled={disabled || jsonError}
                      onChange={(roleId) => {
                        const nextConfig = { ...activeConfig };
                        if (roleId) nextConfig.role = roleId;
                        else delete nextConfig.role;
                        updateConfig(nextConfig);
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      {t("author_role_filter_hint")}
                    </p>
                  </div>
                )}
                {!!issues.length && (
                  <Alert variant="destructive" className="p-3">
                    <AlertDescription className="space-y-1 text-xs">
                      <p>{t("workspace_widget_config_schema_error")}</p>
                      {issues.map((issue, index) => (
                        <p key={index}>
                          {issue.path.length
                            ? `${widgetConfigIssueLabel(issue.path, preparedSchema.fieldMetadata)}: `
                            : ""}
                          {issue.message}
                        </p>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
              </section>
            )
          ) : (
            <p className="text-xs leading-5 text-gray-500">
              {t(
                schema
                  ? "workspace_widget_schema_unsupported"
                  : "workspace_widget_schema_unavailable",
              )}
            </p>
          )}

          <section
            aria-label={t("workspace_studio_section_visibility")}
            className="space-y-3"
          >
            <h4 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              {t("workspace_studio_section_visibility")}
            </h4>
            <div className="space-y-2">
              <Label
                htmlFor={`${id}-visibility`}
                className="text-sm font-medium"
              >
                {t("workspace_studio_show_section")}
              </Label>
              <Select
                value={visibility}
                disabled={disabled}
                onValueChange={(mode: SectionVisibilityMode) =>
                  onChange(applySectionVisibilityMode(widget, mode))
                }
              >
                <SelectTrigger id={`${id}-visibility`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">
                    {t("workspace_studio_show_always")}
                  </SelectItem>
                  <SelectItem value="active">
                    {t("workspace_studio_show_active")}
                  </SelectItem>
                  <SelectItem
                    value="closed"
                    disabled={requirements.encounter === "active"}
                  >
                    {t("workspace_studio_show_closed")}
                  </SelectItem>
                  <SelectItem value="custom">
                    {t("workspace_studio_show_custom")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-gray-500">
                {t(
                  requirements.encounter === "active"
                    ? "workspace_studio_show_hint_active_only"
                    : requirements.encounter === "none"
                      ? "workspace_studio_show_hint_patient"
                      : "workspace_studio_show_hint",
                )}
              </p>
            </div>
            {visibility === "custom" && statuses && (
              <fieldset
                disabled={disabled}
                className="space-y-2.5 rounded-lg border border-gray-200 p-3"
              >
                <legend className="sr-only">
                  {t("workspace_widget_encounter_statuses")}
                </legend>
                {Object.values(EncounterStatus).map((status) => (
                  <div key={status} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`${id}-status-${status}`}
                      checked={statuses.includes(status)}
                      disabled={
                        disabled ||
                        (statuses.length === 1 && statuses.includes(status))
                      }
                      onCheckedChange={(checked) => {
                        const nextStatuses = checked
                          ? [...statuses, status]
                          : statuses.filter((value) => value !== status);
                        if (nextStatuses.length)
                          onChange({
                            ...widget,
                            visible_when: { "encounter.status": nextStatuses },
                          });
                      }}
                    />
                    <Label
                      htmlFor={`${id}-status-${status}`}
                      className="text-sm leading-5 font-normal"
                    >
                      {t(status)}
                    </Label>
                  </div>
                ))}
              </fieldset>
            )}
          </section>

          <details
            className="group rounded-lg border border-gray-200"
            open={advancedOpen}
            onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 [&::-webkit-details-marker]:hidden">
              <Braces className="size-3.5" aria-hidden="true" />
              {t("workspace_widget_advanced_config")}
              <ChevronDown
                className="ml-auto size-3.5 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="space-y-3 border-t border-gray-100 p-3">
              <p className="text-xs leading-5 text-gray-500">
                {schema?.description && !preparedSchema?.fieldMetadata.length
                  ? widgetSchemaText(schema.description, t)
                  : t("workspace_widget_advanced_hint")}
              </p>
              <Label htmlFor={`${id}-config`} className="sr-only">
                {t("workspace_widget_config_json")}
              </Label>
              <Textarea
                id={`${id}-config`}
                value={configText}
                disabled={disabled}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                rows={6}
                aria-invalid={jsonError}
                aria-describedby={jsonError ? `${id}-config-error` : undefined}
                onChange={(event) => {
                  const value = event.target.value;
                  setConfigDraft({ text: value });
                  const parsed = parseConfig(value);
                  if (parsed !== undefined) updateConfig(parsed, value);
                }}
                className="min-h-32 resize-y font-mono text-xs leading-5 shadow-none"
              />
              {jsonError && (
                <Alert
                  variant="destructive"
                  id={`${id}-config-error`}
                  className="p-3"
                >
                  <AlertDescription className="text-xs leading-5">
                    {t("workspace_widget_config_json_error")}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </details>
        </div>

        <SheetFooter className="gap-2 border-t border-gray-200 p-4 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={onRemove}
            className="text-gray-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="size-4" />
            {t("workspace_studio_remove_section")}
          </Button>
          <Button type="button" onClick={onClose} disabled={!valid}>
            {t("done")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
