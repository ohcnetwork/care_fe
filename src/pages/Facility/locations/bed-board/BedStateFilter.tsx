import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { BedCounts, BedState } from "./bedState";

export type BedFilter = BedState | "all";

const FILTERS = [
  { value: "all", label: "all", count: "total" },
  { value: "patient", label: "occupied", count: "patient" },
  { value: "reserved", label: "reserved", count: "reserved" },
  { value: "free", label: "free", count: "free" },
  { value: "unavailable", label: "unavailable", count: "unavailable" },
] as const;

interface BedStateFilterProps {
  value: BedFilter;
  onChange: (value: BedFilter) => void;
  counts: BedCounts;
}

/** Shows how many beds are in each state and narrows the board to one. */
export function BedStateFilter({
  value,
  onChange,
  counts,
}: BedStateFilterProps) {
  const { t } = useTranslation();

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const next = FILTERS.find((filter) => filter.value === values[0]);
        if (next) onChange(next.value);
      }}
      multiple={false}
      aria-label={t("filter_beds")}
      spacing={2}
      className="flex-wrap"
    >
      {FILTERS.map((filter) => (
        <ToggleGroupItem
          key={filter.value}
          value={filter.value}
          className="h-8 cursor-pointer gap-1.5 rounded-full border border-border px-3 text-muted-foreground aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary data-pressed:bg-primary/10"
        >
          {t(filter.label)}{" "}
          <span className="tabular-nums">{counts[filter.count]}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
