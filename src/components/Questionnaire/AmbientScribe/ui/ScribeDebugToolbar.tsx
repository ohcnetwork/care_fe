import {
  ChevronDown,
  ChevronUp,
  Coins,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  type UsageBucket,
  type UsageSource,
  type UsageSummary,
  clearAccount,
  resetSession,
} from "@/components/Questionnaire/AmbientScribe/usage/usageTracker";
import { useUsage } from "@/components/Questionnaire/AmbientScribe/usage/useUsage";

const SOURCE_LABEL: Record<UsageSource, string> = {
  realtime: "Realtime STT",
  diarize: "Diarization",
  form_fill: "Form fill",
};

const SOURCE_ORDER: UsageSource[] = ["realtime", "diarize", "form_fill"];

function formatUsd(value: number): string {
  if (value === 0) return "$0.0000";
  if (value < 0.0001) return "<$0.0001";
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function formatTokens(value: number): string {
  if (value < 1000) return `${value}`;
  if (value < 1_000_000) return `${(value / 1000).toFixed(1)}k`;
  return `${(value / 1_000_000).toFixed(2)}M`;
}

function formatSeconds(value: number): string {
  if (value < 60) return `${value.toFixed(1)}s`;
  const m = Math.floor(value / 60);
  const s = Math.round(value % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

interface ColumnProps {
  title: string;
  summary: UsageSummary;
  onReset: () => void;
  resetTitle: string;
  resetIcon: React.ReactNode;
}

function UsageColumn({
  title,
  summary,
  onReset,
  resetTitle,
  resetIcon,
}: ColumnProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
          {title}
        </h4>
        <button
          type="button"
          onClick={onReset}
          title={resetTitle}
          aria-label={resetTitle}
          className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded"
        >
          {resetIcon}
        </button>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] text-gray-500">Cost</span>
          <span className="font-mono tabular-nums text-sm font-semibold text-primary-700">
            {formatUsd(summary.costUsd)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] text-gray-500">Tokens</span>
          <span className="font-mono tabular-nums text-xs text-gray-700">
            <span className="text-emerald-700">
              {formatTokens(summary.promptTokens)}
            </span>
            <span className="text-gray-400 mx-0.5">/</span>
            <span className="text-sky-700">
              {formatTokens(summary.completionTokens)}
            </span>
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] text-gray-500">Audio</span>
          <span className="font-mono tabular-nums text-xs text-gray-700">
            {formatSeconds(summary.audioInputSeconds)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] text-gray-500">Calls</span>
          <span className="font-mono tabular-nums text-xs text-gray-700">
            {summary.requests}
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-dashed border-gray-200 space-y-1">
        {SOURCE_ORDER.map((source) => {
          const bucket = summary.bySource[source];
          if (!bucket || bucket.requests === 0) return null;
          return (
            <SourceRow
              key={source}
              label={SOURCE_LABEL[source]}
              bucket={bucket}
            />
          );
        })}
      </div>
    </div>
  );
}

function SourceRow({ label, bucket }: { label: string; bucket: UsageBucket }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[10px]">
      <span className="text-gray-500 truncate">{label}</span>
      <span className="font-mono tabular-nums text-gray-600 shrink-0">
        {formatUsd(bucket.costUsd)}
      </span>
    </div>
  );
}

/**
 * Floating dev-only widget that summarizes Ambient Scribe API usage:
 *   - left column: current session (cleared on every new mic-on)
 *   - right column: account totals (persisted via localStorage)
 *
 * Returns `null` outside of `import.meta.env.DEV` so production bundles get
 * tree-shaken. Mount it once near the questionnaire root.
 */
export function ScribeDebugToolbar() {
  const [expanded, setExpanded] = useState(false);
  const usage = useUsage();

  if (!import.meta.env.DEV) return null;

  const totalSessionCost = usage.session.costUsd;
  const totalSessionTokens =
    usage.session.promptTokens + usage.session.completionTokens;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto rounded-2xl border bg-white/95 backdrop-blur shadow-2xl",
          "border-primary-200 ring-1 ring-primary-100/80",
          "transition-all duration-200 overflow-hidden",
          expanded ? "w-[380px]" : "w-auto",
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex items-center justify-between gap-3 w-full px-3 py-2",
            "text-left hover:bg-primary-50/40 transition-colors",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-6 rounded-md bg-linear-to-br from-primary-500 to-purple-600 text-white shadow-sm">
              <Sparkles className="size-3.5" />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
              Scribe Debug
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs">
              <Coins className="size-3 text-primary-600" />
              <span className="font-mono tabular-nums font-semibold text-primary-700">
                {formatUsd(totalSessionCost)}
              </span>
              <span className="text-gray-400">·</span>
              <span className="font-mono tabular-nums text-gray-600">
                {formatTokens(totalSessionTokens)}t
              </span>
            </span>
            {expanded ? (
              <ChevronDown className="size-3.5 text-gray-400" />
            ) : (
              <ChevronUp className="size-3.5 text-gray-400" />
            )}
          </div>
        </button>

        {expanded && (
          <>
            <div className="flex gap-3 px-3 py-3 border-t border-primary-100 bg-linear-to-br from-white to-primary-50/30">
              <UsageColumn
                title="Session"
                summary={usage.session}
                onReset={resetSession}
                resetTitle="Reset session counters"
                resetIcon={<RotateCcw className="size-3" />}
              />
              <div className="w-px bg-gray-200" />
              <UsageColumn
                title="Account"
                summary={usage.account}
                onReset={clearAccount}
                resetTitle="Clear persisted account totals"
                resetIcon={<Trash2 className="size-3" />}
              />
            </div>
            <footer className="flex items-center justify-between gap-2 px-3 py-1.5 border-t border-primary-100 bg-gray-50/60">
              <span className="text-[10px] text-gray-500">
                Tokens shown as{" "}
                <span className="text-emerald-700 font-medium">in</span>
                <span className="text-gray-400"> / </span>
                <span className="text-sky-700 font-medium">out</span>. Costs are
                estimates.
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => setExpanded(false)}
              >
                Hide
              </Button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
