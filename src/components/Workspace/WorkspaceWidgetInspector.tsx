import { Braces, ChevronDown, Eye, Puzzle } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCareAppEncounterWidgets } from "@/hooks/useCareAppEncounterWidgets";

import { EncounterStatus } from "@/types/emr/encounter/encounter";
import { EncounterWorkspaceWidget } from "@/types/workspace/encounterWorkspace";
import { getCoreWidgetConfigSchema } from "@/types/workspace/widgetConfigSchemas";

import { WorkspaceSchemaFields } from "./WorkspaceSchemaFields";
import {
  CORE_WIDGET_CATALOG,
  workspaceWidgetLabel,
} from "./workspaceEditorCatalog";
import { parseWorkspaceJson } from "./workspaceEditorUtils";
import { prepareWidgetConfigSchema } from "./workspaceWidgetSchema";
import {
  widgetConfigErrorMessage,
  widgetConfigIssueLabel,
  widgetSchemaText,
} from "./workspaceWidgetSchemaI18n";

export interface WorkspaceWidgetInspectorProps {
  widget: EncounterWorkspaceWidget;
  onChange: (widget: EncounterWorkspaceWidget) => void;
  disabled?: boolean;
  onValidityChange?: (valid: boolean) => void;
}

function parseConfig(text: string): Record<string, unknown> | undefined {
  try {
    return parseWorkspaceJson(text);
  } catch {
    // Incomplete JSON stays local until it can be represented safely.
  }
}

/** Key by widget identity so local, incomplete input belongs to its selection. */
export function WorkspaceWidgetInspector({
  widget,
  onChange,
  disabled = false,
  onValidityChange,
}: WorkspaceWidgetInspectorProps) {
  const { t } = useTranslation();
  const id = useId();
  const { widgets: pluginWidgets } = useCareAppEncounterWidgets();
  const pluginSchema = pluginWidgets.get(widget.type)?.configSchema;
  const schema = useMemo(
    () => getCoreWidgetConfigSchema(widget.type, t) ?? pluginSchema,
    [pluginSchema, t, widget.type],
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
  const statuses = widget.visible_when?.["encounter.status"];
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
    <section
      aria-label={t("workspace_widget_settings")}
      className="min-w-0 bg-white"
    >
      <div className="flex items-start gap-3 border-b border-gray-200 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-950 break-words">
            {workspaceWidgetLabel(widget.type, t)}
          </h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {catalogItem
              ? t(catalogItem.descriptionKey)
              : t("workspace_widget_plugin_description")}
          </p>
        </div>
      </div>

      <div className="space-y-4 border-b border-gray-200 p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {t("workspace_widget_appearance")}
        </h4>
        <div className="space-y-2">
          <Label htmlFor={`${id}-title`} className="text-sm font-medium">
            {t("workspace_widget_title")}
          </Label>
          <Input
            id={`${id}-title`}
            value={widget.title ?? ""}
            placeholder={workspaceWidgetLabel(widget.type, t)}
            maxLength={120}
            disabled={disabled}
            aria-describedby={`${id}-title-help`}
            onChange={(event) => {
              const next = { ...widget };
              if (event.target.value.trim()) next.title = event.target.value;
              else delete next.title;
              onChange(next);
            }}
            className="h-9 text-sm shadow-none"
          />
          <p
            id={`${id}-title-help`}
            className="text-xs leading-5 text-gray-500"
          >
            {t("workspace_widget_title_hint")}
          </p>
        </div>
      </div>

      {preparedSchema ? (
        <section
          aria-label={t("workspace_config_title")}
          className="space-y-4 border-b border-gray-200 p-4"
        >
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {t("workspace_config_title")}
          </h4>
          {preparedSchema.fieldMetadata.length ? (
            <WorkspaceSchemaFields
              config={editedConfig ?? config}
              fields={preparedSchema.fieldMetadata}
              issues={issues}
              disabled={disabled || jsonError}
              onChange={updateConfig}
            />
          ) : (
            <p className="text-xs leading-5 text-gray-500">
              {schema?.description
                ? widgetSchemaText(schema.description, t)
                : t("workspace_widget_no_config_options")}
            </p>
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
      ) : (
        <div>
          <p className="px-4 pt-4 text-xs leading-5 text-gray-500">
            {t(
              schema
                ? "workspace_widget_schema_unsupported"
                : "workspace_widget_schema_unavailable",
            )}
          </p>
        </div>
      )}

      <div className="space-y-4 border-b border-gray-200 p-4">
        <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <Eye className="size-3.5" aria-hidden="true" />
          {t("workspace_widget_visibility")}
        </h4>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Label htmlFor={`${id}-visibility`} className="text-sm leading-5">
              {t("workspace_widget_restrict_status")}
            </Label>
            <p className="text-xs leading-5 text-gray-500">
              {t("workspace_widget_visibility_hint")}
            </p>
          </div>
          <Switch
            id={`${id}-visibility`}
            checked={statuses !== undefined}
            disabled={disabled}
            onCheckedChange={(checked) => {
              const next = { ...widget };
              if (checked)
                next.visible_when = {
                  "encounter.status": [EncounterStatus.IN_PROGRESS],
                };
              else delete next.visible_when;
              onChange(next);
            }}
            className="mt-0.5 shrink-0"
          />
        </div>
        {statuses && (
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
                  id={`${id}-visibility-${status}`}
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
                  htmlFor={`${id}-visibility-${status}`}
                  className="text-sm font-normal leading-5"
                >
                  {t(status)}
                </Label>
              </div>
            ))}
            <p className="pt-1 text-xs leading-5 text-gray-500">
              {t("workspace_widget_visibility_required")}
            </p>
          </fieldset>
        )}
      </div>

      <details
        className="group p-4"
        open={advancedOpen}
        onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-gray-600 [&::-webkit-details-marker]:hidden">
          <Braces className="size-3.5" aria-hidden="true" />
          {t("workspace_widget_advanced_config")}
          <ChevronDown
            className="ml-auto size-3.5 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="space-y-3 pt-3">
          <p className="text-xs leading-5 text-gray-500">
            {t("workspace_widget_advanced_hint")}
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
            rows={7}
            aria-invalid={jsonError}
            aria-describedby={jsonError ? `${id}-config-error` : undefined}
            onChange={(event) => {
              const value = event.target.value;
              setConfigDraft({ text: value });
              const parsed = parseConfig(value);
              if (parsed !== undefined) {
                updateConfig(parsed, value);
              }
            }}
            className="min-h-36 resize-y font-mono text-xs leading-5 shadow-none"
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
    </section>
  );
}
