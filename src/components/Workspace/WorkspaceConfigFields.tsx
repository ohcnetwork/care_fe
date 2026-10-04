import { Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConfigRow {
  id: string;
  key: string;
  text: string;
}

interface WorkspaceConfigFieldsProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  disabled?: boolean;
  onValidityChange?: (valid: boolean) => void;
}

function parseValue(
  text: string,
): { valid: true; value: unknown } | { valid: false } {
  let nonFinite = false;
  try {
    const value: unknown = JSON.parse(text, (_key, value: unknown) => {
      if (typeof value === "number" && !Number.isFinite(value))
        nonFinite = true;
      return value;
    });
    return nonFinite ? { valid: false } : { valid: true, value };
  } catch {
    // Plain text needs no quoting; incomplete structured values remain drafts.
    return ["[", "{", '"'].includes(text.trimStart().charAt(0))
      ? { valid: false }
      : { valid: true, value: text };
  }
}

function formatValue(value: unknown): string {
  if (typeof value === "string" && !/[\r\n]/.test(value)) {
    const parsed = parseValue(value);
    if (parsed.valid && parsed.value === value) return value;
  }
  return JSON.stringify(value) ?? "";
}

export function WorkspaceConfigFields({
  config,
  onChange,
  disabled = false,
  onValidityChange,
}: WorkspaceConfigFieldsProps) {
  const { t } = useTranslation();
  const id = useId();
  const nextId = useRef(0);
  const [draft, setDraft] = useState<{
    rows: ConfigRow[];
    committed?: string;
  } | null>(null);
  const serialized = JSON.stringify(config);
  // Incomplete rows stay local; completed edits follow later external updates.
  const rows =
    draft && (draft.committed === undefined || draft.committed === serialized)
      ? draft.rows
      : Object.entries(config).map(([key, value]) => ({
          id: `saved:${key}`,
          key,
          text: formatValue(value),
        }));
  const keyError = (row: ConfigRow, allRows: ConfigRow[]) =>
    !row.key.trim()
      ? "workspace_config_key_required"
      : allRows.some((other) => other.id !== row.id && other.key === row.key)
        ? "workspace_config_key_duplicate"
        : undefined;
  const valid = rows.every(
    (row) => !keyError(row, rows) && parseValue(row.text).valid,
  );

  useEffect(() => {
    onValidityChange?.(valid);
  }, [onValidityChange, valid]);
  useEffect(() => () => onValidityChange?.(true), [onValidityChange]);

  const updateRows = (nextRows: ConfigRow[]) => {
    if (disabled) return;
    const entries: [string, unknown][] = [];
    for (const row of nextRows) {
      const parsed = parseValue(row.text);
      if (keyError(row, nextRows) || !parsed.valid) {
        setDraft({ rows: nextRows });
        return;
      }
      entries.push([row.key, parsed.value]);
    }
    const nextConfig = Object.fromEntries(entries);
    setDraft({ rows: nextRows, committed: JSON.stringify(nextConfig) });
    onChange(nextConfig);
  };
  const updateRow = (rowId: string, update: Partial<ConfigRow>) =>
    updateRows(
      rows.map((row) => (row.id === rowId ? { ...row, ...update } : row)),
    );

  return (
    <section
      aria-label={t("workspace_config_title")}
      className="space-y-3 border-b border-gray-200 p-4"
    >
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t("workspace_config_title")}
      </h4>
      <p className="text-xs leading-5 text-gray-500">
        {t("workspace_config_value_hint")}
      </p>
      <div className="space-y-3">
        {rows.map((row, index) => {
          const number = index + 1;
          const fieldId = `${id}-${row.id}`;
          const error = keyError(row, rows);
          const valueError = !parseValue(row.text).valid;
          return (
            <div
              key={row.id}
              role="group"
              aria-label={t("workspace_config_entry", { number })}
              className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/60 p-2.5"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`${fieldId}-key`}
                    className="text-xs text-gray-500"
                  >
                    {t("workspace_config_key")}
                  </Label>
                  <Input
                    id={`${fieldId}-key`}
                    aria-label={t("workspace_config_key_number", { number })}
                    value={row.key}
                    disabled={disabled}
                    aria-invalid={!!error}
                    aria-describedby={
                      error ? `${fieldId}-key-error` : undefined
                    }
                    onChange={(event) =>
                      updateRow(row.id, { key: event.target.value })
                    }
                    className="h-8 bg-white font-mono text-xs shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`${fieldId}-value`}
                    className="text-xs text-gray-500"
                  >
                    {t("workspace_config_value")}
                  </Label>
                  <Input
                    id={`${fieldId}-value`}
                    aria-label={t("workspace_config_value_number", { number })}
                    value={row.text}
                    disabled={disabled}
                    aria-invalid={valueError}
                    aria-describedby={
                      valueError ? `${fieldId}-value-error` : undefined
                    }
                    onChange={(event) =>
                      updateRow(row.id, { text: event.target.value })
                    }
                    className="h-8 bg-white font-mono text-xs shadow-none"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={disabled}
                  aria-label={t("workspace_config_remove", { number })}
                  onClick={() =>
                    updateRows(rows.filter((item) => item.id !== row.id))
                  }
                  className="size-8 text-gray-400 hover:text-red-700"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              {error && (
                <p id={`${fieldId}-key-error`} className="text-xs text-red-600">
                  {t(error)}
                </p>
              )}
              {valueError && (
                <p
                  id={`${fieldId}-value-error`}
                  className="text-xs text-red-600"
                >
                  {t("workspace_config_value_invalid")}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() =>
          updateRows([
            ...rows,
            { id: `new:${nextId.current++}`, key: "", text: "" },
          ])
        }
        className="h-8 w-full border-dashed text-xs shadow-none"
      >
        <Plus className="size-3.5" />
        {t("workspace_config_add")}
      </Button>
    </section>
  );
}
