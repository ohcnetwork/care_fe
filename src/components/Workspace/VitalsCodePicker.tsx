import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Plus, X } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import type { Code } from "@/types/base/code/code";
import type { ObservationPlotConfig } from "@/types/emr/observation/observation";
import { VITALS_MAX_CODES } from "@/types/workspace/widgetConfigSchemas";

interface VitalsCodePickerProps {
  value: Code[];
  disabled?: boolean;
  onChange: (codes: Code[]) => void;
}

function sameCode(a: Code, b: Code) {
  return a.code === b.code && a.system === b.system;
}

/** Picks observation codes for the vitals tiles from the configured plots and the observation value set. */
export function VitalsCodePicker({
  value,
  disabled = false,
  onChange,
}: VitalsCodePickerProps) {
  const { t } = useTranslation();
  const id = useId();
  const { data: plots } = useQuery<ObservationPlotConfig>({
    queryKey: ["plots-config"],
    queryFn: async ({ signal }) => {
      const response = await fetch(careConfig.plotsConfigUrl, { signal });
      if (!response.ok)
        throw new Error("Unable to load vital signs configuration");
      return response.json();
    },
  });
  const presetGroups = (plots ?? [])
    .map((plot) => ({
      id: plot.id,
      title: plot.name,
      codes: plot.groups
        .flatMap((group) => group.codes)
        .filter(
          (code, index, codes) =>
            !!code.system &&
            !!code.code &&
            !!code.display &&
            codes.findIndex((other) => sameCode(other, code)) === index,
        ),
    }))
    .filter((group) => group.codes.length > 0);
  const [primaryGroup, ...moreGroups] = presetGroups;
  const atLimit = value.length >= VITALS_MAX_CODES;
  const add = (code: Code) => {
    if (atLimit || value.some((selected) => sameCode(selected, code))) return;
    onChange([...value, code]);
  };
  const remove = (code: Code) =>
    onChange(value.filter((selected) => !sameCode(selected, code)));
  const presetButtons = (codes: Code[]) => (
    <div className="flex flex-wrap gap-1.5">
      {codes.map((code) => {
        const selected = value.some((item) => sameCode(item, code));
        return (
          <Button
            key={`${code.system}|${code.code}`}
            type="button"
            variant="outline"
            size="xs"
            aria-pressed={selected}
            disabled={disabled || (!selected && atLimit)}
            onClick={() => (selected ? remove(code) : add(code))}
            className={
              selected
                ? "border-primary-300 bg-primary-50 text-primary-900 hover:bg-primary-100"
                : "text-muted-foreground"
            }
          >
            {!selected && <Plus className="size-3" aria-hidden="true" />}
            {code.display}
          </Button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {t("workspace_widget_vital_codes")}
        </Label>
        {value.length ? (
          <ul
            aria-label={t("workspace_widget_vital_codes")}
            className="flex flex-wrap gap-1.5"
          >
            {value.map((code) => (
              <li
                key={`${code.system}|${code.code}`}
                className="flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 py-0.5 pr-0.5 pl-2 text-xs font-medium text-primary-900"
              >
                <span className="max-w-48 truncate" title={code.display}>
                  {code.display}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  aria-label={t("workspace_vitals_picker_remove", {
                    name: code.display,
                  })}
                  onClick={() => remove(code)}
                  className="size-5 text-primary-700 hover:bg-primary-100 hover:text-primary-900"
                >
                  <X className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs leading-5 text-soft-foreground">
            {t("workspace_vitals_picker_empty")}
          </p>
        )}
        <p className="text-xs leading-5 text-soft-foreground">
          {t("workspace_widget_vital_codes_hint", {
            maximum: VITALS_MAX_CODES,
          })}
        </p>
      </div>

      {primaryGroup && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-soft-foreground">
            {t("workspace_vitals_picker_presets")}
          </p>
          <fieldset disabled={disabled} className="space-y-1.5">
            <legend className="text-xs text-soft-foreground">
              {primaryGroup.title}
            </legend>
            {presetButtons(primaryGroup.codes)}
          </fieldset>
          {moreGroups.length > 0 && (
            <details className="group rounded-lg border border-border">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-soft-foreground [&::-webkit-details-marker]:hidden">
                {t("workspace_vitals_picker_more_presets")}
                <ChevronDown
                  className="ml-auto size-3.5 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="space-y-3 border-t border-soft-border p-3">
                {moreGroups.map((group) => (
                  <fieldset
                    key={group.id}
                    disabled={disabled}
                    className="space-y-1.5"
                  >
                    <legend className="text-xs text-soft-foreground">
                      {group.title}
                    </legend>
                    {presetButtons(group.codes)}
                  </fieldset>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-search`} className="text-xs font-medium">
          {t("workspace_vitals_picker_search")}
        </Label>
        <ValueSetSelect
          id={`${id}-search`}
          system="system-observation"
          placeholder={t("workspace_vitals_picker_search_placeholder")}
          onSelect={add}
          disabled={disabled || atLimit}
          showCode
          className="w-full"
        />
        {atLimit && (
          <p className="text-xs leading-5 text-soft-foreground">
            {t("workspace_vitals_picker_limit", { maximum: VITALS_MAX_CODES })}
          </p>
        )}
      </div>
    </div>
  );
}
