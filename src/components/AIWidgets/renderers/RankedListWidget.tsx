import { AlertTriangle, MapPin, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { RankedListOutput } from "@/components/AIWidgets/types";

const SCORE_COLOR: Record<string, string> = {
  Low: "bg-emerald-500",
  Mod: "bg-amber-500",
  High: "bg-rose-500",
};

export function RankedListWidget({ output }: { output: RankedListOutput }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 text-sm text-gray-800">
      {output.title && (
        <h4 className="text-sm font-semibold text-gray-900">{output.title}</h4>
      )}
      <ul className="flex flex-col divide-y divide-gray-100 rounded border border-gray-200">
        {output.items?.map((item, idx) => (
          <li
            key={idx}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[13px] font-medium text-gray-900">
                {item.name}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-[10px] text-gray-500 underline underline-offset-2 hover:text-gray-700"
                  >
                    {t("ai_widgets__why")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs text-xs">
                  {item.why}
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ScoreBar score={item.score} label={item.score_label} />
              <button
                type="button"
                className="inline-flex items-center gap-0.5 rounded border border-transparent px-1.5 py-0.5 text-[11px] text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => toast.info(t("ai_widgets__plan_placeholder"))}
              >
                <Plus className="h-2.5 w-2.5" />
                {t("ai_widgets__plan")}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {output.disclaimer && (
        <div className="flex items-start gap-1.5 rounded border-l-2 border-amber-400 bg-amber-50/60 p-2 text-[11px] text-amber-900">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
          <span>{output.disclaimer}</span>
        </div>
      )}
      {output.source_note && (
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <MapPin className="h-2.5 w-2.5" />
          {output.source_note}
        </div>
      )}
    </div>
  );
}

function ScoreBar({
  score,
  label,
}: {
  score: number;
  label: RankedListOutput["items"][number]["score_label"];
}) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full ${SCORE_COLOR[label] ?? "bg-gray-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-[10px] text-gray-600">
        {label} · {pct}%
      </span>
    </div>
  );
}
