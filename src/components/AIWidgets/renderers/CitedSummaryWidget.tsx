import { useTranslation } from "react-i18next";

import { Markdown } from "@/components/ui/markdown";

import { CitedSummaryOutput } from "@/components/AIWidgets/types";

export function CitedSummaryWidget({ output }: { output: CitedSummaryOutput }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 text-sm text-gray-800">
      <Markdown content={output.summary} className="text-[13px]" />
      {output.citations?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1 text-[11px] text-gray-500">
          <span>{t("ai_widgets__grounded_in")}</span>
          {output.citations.map((c, idx) => (
            <span
              key={idx}
              title={c.tool}
              className="rounded border border-amber-200 bg-amber-50 px-1.5 py-px text-[10px] font-medium text-amber-800"
            >
              {c.tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
