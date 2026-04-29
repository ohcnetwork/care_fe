import { MapPin } from "lucide-react";

import { ScoreOutput, ScoreSeverity } from "@/components/AIWidgets/types";

const SEVERITY_STYLE: Record<ScoreSeverity, { chip: string; bar: string }> = {
  low: {
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
  },
  moderate: {
    chip: "bg-amber-50 text-amber-800 border-amber-200",
    bar: "bg-amber-500",
  },
  high: {
    chip: "bg-orange-50 text-orange-800 border-orange-200",
    bar: "bg-orange-500",
  },
  critical: {
    chip: "bg-rose-50 text-rose-800 border-rose-200",
    bar: "bg-rose-500",
  },
};

export function ScoreWidget({ output }: { output: ScoreOutput }) {
  const sev = output.severity ?? "low";
  const style = SEVERITY_STYLE[sev] ?? SEVERITY_STYLE.low;

  return (
    <div className="flex flex-col gap-2 text-sm text-gray-800">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold leading-none text-gray-900">
            {output.score}
          </span>
          {output.scale && (
            <span className="text-xs text-gray-500">{output.scale}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-600">
            {output.title}
          </span>
          {output.severity && (
            <span
              className={`rounded border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide ${style.chip}`}
            >
              {output.severity}
            </span>
          )}
        </div>
      </div>

      {output.interpretation && (
        <p className="text-[13px] italic text-gray-700">
          {output.interpretation}
        </p>
      )}

      {output.components && output.components.length > 0 && (
        <ul className="flex flex-col divide-y divide-gray-100 rounded border border-gray-200 text-[12px]">
          {output.components.map((c, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between gap-2 px-2 py-1"
            >
              <span className="truncate text-gray-700">{c.name}</span>
              <span className="flex shrink-0 items-center gap-2 text-gray-500">
                <span>{c.value}</span>
                <span
                  className={`rounded px-1 py-px text-[10px] font-medium tabular-nums text-white ${style.bar}`}
                >
                  +{c.contribution}
                </span>
              </span>
            </li>
          ))}
        </ul>
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
