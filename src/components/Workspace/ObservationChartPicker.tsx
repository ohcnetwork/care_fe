import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ObservationPlotConfig } from "@/types/emr/observation/observation";

interface ObservationChartPickerProps {
  plot?: string;
  groups?: string[];
  disabled?: boolean;
  onChange: (next: { plot?: string; groups?: string[] }) => void;
}

/** Chooses a plot and its chart groups from the plots configuration. */
export function ObservationChartPicker({
  plot,
  groups,
  disabled = false,
  onChange,
}: ObservationChartPickerProps) {
  const { t } = useTranslation();
  const id = useId();
  const { data: plots, isLoading } = useQuery<ObservationPlotConfig>({
    queryKey: ["plots-config"],
    queryFn: async ({ signal }) => {
      const response = await fetch(careConfig.plotsConfigUrl, { signal });
      if (!response.ok)
        throw new Error("Unable to load vital signs configuration");
      return response.json();
    },
  });
  const selectedPlot =
    (plot ? plots?.find((candidate) => candidate.id === plot) : plots?.[0]) ??
    undefined;
  const groupTitles = (selectedPlot?.groups ?? [])
    .map((group) => group.title)
    .filter((title, index, titles) => titles.indexOf(title) === index);
  const selectedCount = groups
    ? groupTitles.filter((title) => groups.includes(title)).length
    : groupTitles.length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${id}-plot`} className="text-sm font-medium">
          {t("workspace_widget_chart_plot")}
        </Label>
        <Select
          value={selectedPlot?.id ?? ""}
          disabled={disabled || isLoading || !plots?.length}
          onValueChange={(value) =>
            // Groups belong to a plot, so a new plot starts with all of them.
            onChange({ plot: value, groups: undefined })
          }
        >
          <SelectTrigger id={`${id}-plot`} className="w-full">
            <SelectValue
              placeholder={
                isLoading ? t("loading") : t("workspace_widget_chart_plot")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {plots?.map((candidate) => (
              <SelectItem key={candidate.id} value={candidate.id}>
                {candidate.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs leading-5 text-gray-500">
          {t("workspace_widget_chart_plot_hint")}
        </p>
      </div>
      {groupTitles.length > 0 && (
        <fieldset disabled={disabled} className="space-y-2">
          <legend className="text-sm font-medium">
            {t("workspace_widget_chart_groups")}
          </legend>
          <div className="space-y-2 rounded-lg border border-gray-200 p-3">
            {groupTitles.map((title) => {
              const checked = !groups || groups.includes(title);
              return (
                <div key={title} className="flex items-center gap-2.5">
                  <Checkbox
                    id={`${id}-group-${title}`}
                    checked={checked}
                    // At least one chart must remain.
                    disabled={disabled || (checked && selectedCount === 1)}
                    onCheckedChange={(state) => {
                      const next = groupTitles.filter((candidate) =>
                        candidate === title
                          ? state
                          : !groups || groups.includes(candidate),
                      );
                      onChange({
                        plot: selectedPlot?.id,
                        // Every group selected means no filter at all.
                        groups:
                          next.length === groupTitles.length ? undefined : next,
                      });
                    }}
                  />
                  <Label
                    htmlFor={`${id}-group-${title}`}
                    className="text-sm leading-5 font-normal"
                  >
                    {title}
                  </Label>
                </div>
              );
            })}
          </div>
          <p className="text-xs leading-5 text-gray-500">
            {t("workspace_widget_chart_groups_hint")}
          </p>
        </fieldset>
      )}
    </div>
  );
}
