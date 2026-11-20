import { format, startOfDay } from "date-fns";
import i18next from "i18next";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DateRangePicker,
  type DateRangeValue,
} from "@/components/ui/date-range-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RenderDateFilter from "@/components/ui/multi-filter/dateFilter";

import "@/style/index.css";
import en from "../../../public/locale/en.json";

await i18next.init({
  lng: "en-IN",
  fallbackLng: "en",
  resources: { en: { translation: en } },
});

function Fixture() {
  const params = new URLSearchParams(location.search);
  const [range, setRange] = useState<DateRangeValue>(
    params.has("value")
      ? { from: new Date(2026, 10, 9), to: new Date(2026, 10, 19) }
      : {},
  );
  const [count, setCount] = useState(0);
  const handleApply = (next: DateRangeValue) => {
    setRange(next);
    setCount((previous) => previous + 1);
  };
  const minDate = params.has("min") ? new Date(2026, 9, 10) : undefined;
  const maxDate = params.has("max") ? startOfDay(new Date()) : undefined;
  const panel = params.has("integration") ? (
    <RenderDateFilter
      filter={{
        key: "created_date",
        label: "Created date",
        type: "date",
        options: [],
        meta: { minDate, maxDate },
      }}
      selected={range}
      onFilterChange={(_key, next) => {
        if (Array.isArray(next)) throw new Error("Expected a date range");
        handleApply(next);
      }}
    />
  ) : (
    <DateRangePicker
      variant={params.has("popover") ? "popover" : "panel"}
      value={range}
      title="Custom Date Range"
      allowOpenEnded={!params.has("required")}
      minDate={minDate}
      maxDate={maxDate}
      onApply={handleApply}
    />
  );
  return (
    <main className="p-2">
      {params.has("menu") ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open date filter</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-0" align="start">
            {panel}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        panel
      )}
      <button type="button" className="fixed end-2 top-2" data-testid="outside">
        Outside
      </button>
      <output data-testid="applied">
        {JSON.stringify({
          from: range.from && format(range.from, "yyyy-MM-dd"),
          to: range.to && format(range.to, "yyyy-MM-dd"),
          count,
        })}
      </output>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18next}>
    <Fixture />
  </I18nextProvider>,
);
