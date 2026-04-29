import { AlertTriangle, Info } from "lucide-react";

import { Markdown } from "@/components/ui/markdown";

import { MarkdownOutput } from "@/components/AIWidgets/types";

export function MarkdownWidget({ output }: { output: MarkdownOutput }) {
  return (
    <div className="flex flex-col gap-2.5 text-sm text-gray-800">
      {output.title && (
        <h4 className="text-sm font-semibold text-gray-900">{output.title}</h4>
      )}
      {output.intro && (
        <Markdown
          content={output.intro}
          className="text-[13px] text-gray-700"
        />
      )}
      {output.sections?.map((section, idx) => (
        <Section key={idx} section={section} />
      ))}
      {output.footer_note && (
        <p className="text-[11px] italic text-gray-500">{output.footer_note}</p>
      )}
    </div>
  );
}

function Section({ section }: { section: MarkdownOutput["sections"][number] }) {
  const isWarning = section.callout === "warning";
  const isInfo = section.callout === "info";
  return (
    <div className="flex flex-col gap-1">
      <h5 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {section.heading}
      </h5>
      {isWarning || isInfo ? (
        <div
          className={`flex items-start gap-1.5 rounded border-l-2 p-2 ${
            isWarning
              ? "border-amber-400 bg-amber-50/60"
              : "border-blue-400 bg-blue-50/60"
          }`}
        >
          {isWarning ? (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          ) : (
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
          )}
          <Markdown content={section.markdown} className="text-[13px]" />
        </div>
      ) : (
        <Markdown content={section.markdown} className="text-[13px]" />
      )}
    </div>
  );
}
