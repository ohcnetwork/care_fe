/* eslint-disable i18next/no-literal-string */
// Dev-only debug toolbar — intentionally not localized; renders a developer
// console for the Ambient Scribe POC and is excluded from production builds.
import {
  Activity,
  AudioLines,
  ChevronDown,
  ChevronUp,
  CircleDot,
  ListTree,
  Radio,
  RotateCcw,
  ScrollText,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import type { ScribeHandle } from "@/components/Questionnaire/AmbientScribe/types";
import {
  type CallStatus,
  type LogEntry,
  type LogLevel,
  type UsageBucket,
  type UsageRecord,
  type UsageSource,
  type UsageSummary,
  clearAccount,
  clearLogs,
  resetSession,
} from "@/components/Questionnaire/AmbientScribe/usage/usageTracker";
import { useUsage } from "@/components/Questionnaire/AmbientScribe/usage/useUsage";

type Tab = "overview" | "calls" | "logs" | "audio";

const SOURCE_LABEL: Record<UsageSource, string> = {
  realtime: "realtime",
  translate: "translate",
  diarize: "diarize",
  form_fill: "form_fill",
};

const SOURCE_COLOR: Record<UsageSource, string> = {
  realtime: "text-orange-400",
  translate: "text-cyan-400",
  diarize: "text-violet-400",
  form_fill: "text-emerald-400",
};

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: "text-zinc-500",
  info: "text-zinc-300",
  warn: "text-amber-300",
  error: "text-red-400",
};

const LEVEL_TAG: Record<LogLevel, string> = {
  debug: "DBG",
  info: "INF",
  warn: "WRN",
  error: "ERR",
};

const STATUS_DOT: Record<CallStatus, string> = {
  success: "bg-emerald-400",
  error: "bg-red-400",
};

// ----------------------------- formatters ----------------------------------

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
  if (value === 0) return "0.0s";
  if (value < 60) return `${value.toFixed(1)}s`;
  const m = Math.floor(value / 60);
  const s = Math.round(value % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function formatLatency(ms?: number): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// ----------------------------- live ticker ---------------------------------

/** A counter that re-renders the toolbar every second, used for "x ago"
 * relative timestamps and live elapsed counters. */
function useTick(intervalMs: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

// ----------------------------- subcomponents -------------------------------

function StatusPill({ status }: { status: ScribeHandle["status"] }) {
  const cfg: Record<
    ScribeHandle["status"],
    { label: string; dot: string; ring: string }
  > = {
    idle: {
      label: "idle",
      dot: "bg-zinc-500",
      ring: "ring-zinc-700/60",
    },
    connecting: {
      label: "connecting",
      dot: "bg-amber-400 animate-pulse",
      ring: "ring-amber-700/60",
    },
    listening: {
      label: "listening",
      dot: "bg-emerald-400 animate-pulse",
      ring: "ring-emerald-700/60",
    },
    paused: {
      label: "paused",
      dot: "bg-zinc-400",
      ring: "ring-zinc-600/60",
    },
    error: {
      label: "error",
      dot: "bg-red-400",
      ring: "ring-red-700/60",
    },
  };
  const c = cfg[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5",
        "text-[10px] uppercase tracking-wider font-mono ring-1",
        c.ring,
        "bg-zinc-900/60",
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.dot)} />
      <span className="text-zinc-300">{c.label}</span>
    </span>
  );
}

function StatRow({
  label,
  value,
  valueClass,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <span className="text-[11px] text-zinc-500" title={hint}>
        {label}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums text-xs text-zinc-200",
          valueClass,
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-zinc-500 mt-2 mb-1">
      <span className="h-px flex-1 bg-zinc-800" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-zinc-800" />
    </div>
  );
}

// ----------------------------- tabs ----------------------------------------

function OverviewTab({
  scribe,
  session,
  account,
}: {
  scribe?: ScribeHandle;
  session: UsageSummary;
  account: UsageSummary;
}) {
  useTick(1000); // refresh elapsed counters

  const elapsed = scribe?.sessionStartedAt
    ? Math.floor((Date.now() - scribe.sessionStartedAt) / 1000)
    : 0;
  const aiFields = scribe
    ? Object.values(scribe.provenance).filter((p) => p.status === "ai").length
    : 0;
  const editedFields = scribe
    ? Object.values(scribe.provenance).filter((p) => p.status === "ai_edited")
        .length
    : 0;
  const turns = scribe?.transcript.length ?? 0;
  const partialTurns =
    scribe?.transcript.filter((t) => t.status === "partial").length ?? 0;

  return (
    <div className="space-y-1">
      {scribe && (
        <>
          <SectionLabel>Session</SectionLabel>
          <StatRow
            label="status"
            value={<StatusPill status={scribe.status} />}
          />
          <StatRow
            label="elapsed"
            value={
              elapsed > 0
                ? `${Math.floor(elapsed / 60)
                    .toString()
                    .padStart(2, "0")}:${(elapsed % 60)
                    .toString()
                    .padStart(2, "0")}`
                : "—"
            }
            valueClass="text-orange-300"
          />
          <StatRow
            label="turns"
            value={`${turns}${partialTurns ? ` (${partialTurns} partial)` : ""}`}
          />
          <StatRow
            label="ai filled"
            value={
              <>
                <span className="text-emerald-400">{aiFields}</span>
                <span className="text-zinc-600"> / </span>
                <span className="text-amber-400">{editedFields}</span>
                <span className="text-zinc-600"> edited</span>
              </>
            }
          />
        </>
      )}

      <SectionLabel>Cost</SectionLabel>
      <div className="grid grid-cols-2 gap-x-3">
        <CostBlock title="session" summary={session} />
        <CostBlock title="account" summary={account} />
      </div>
    </div>
  );
}

function CostBlock({
  title,
  summary,
}: {
  title: string;
  summary: UsageSummary;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 mb-1">
        {title}
      </div>
      <StatRow
        label="cost"
        value={formatUsd(summary.costUsd)}
        valueClass="text-orange-300 font-semibold"
      />
      <StatRow label="calls" value={`${summary.requests}`} />
      <StatRow
        label="tokens"
        value={
          <>
            <span className="text-emerald-400">
              {formatTokens(summary.promptTokens)}
            </span>
            <span className="text-zinc-600"> / </span>
            <span className="text-cyan-400">
              {formatTokens(summary.completionTokens)}
            </span>
          </>
        }
      />
      <StatRow label="audio" value={formatSeconds(summary.audioInputSeconds)} />
      <div className="mt-1 pt-1 border-t border-dashed border-zinc-800/80 space-y-0.5">
        {(
          ["realtime", "translate", "diarize", "form_fill"] as UsageSource[]
        ).map((src) => {
          const b: UsageBucket | undefined = summary.bySource[src];
          if (!b || b.requests === 0) return null;
          return (
            <div
              key={src}
              className="flex items-center justify-between gap-1 text-[10px] font-mono"
            >
              <span className={cn("truncate", SOURCE_COLOR[src])}>
                {SOURCE_LABEL[src]}
              </span>
              <span className="tabular-nums text-zinc-400 shrink-0">
                {formatUsd(b.costUsd)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CallsTab({ calls }: { calls: UsageRecord[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const reversed = [...calls].reverse(); // newest first

  if (calls.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-zinc-500 font-mono">
        no calls yet — start a session
      </div>
    );
  }

  return (
    <div className="font-mono text-[11px]">
      <div className="grid grid-cols-[8ch_8ch_1fr_5ch_6ch_6ch] gap-2 px-1 py-1 text-[10px] uppercase tracking-wider text-zinc-600 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <span>time</span>
        <span>source</span>
        <span>model · preview</span>
        <span className="text-right">lat</span>
        <span className="text-right">tok</span>
        <span className="text-right">cost</span>
      </div>
      <div>
        {reversed.map((call, idx) => {
          const isOpen = expanded === idx;
          return (
            <div
              key={`${call.ts}-${idx}`}
              className={cn(
                "border-t border-zinc-800/70 hover:bg-zinc-900/60 transition-colors",
                isOpen && "bg-zinc-900/80",
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : idx)}
                className="w-full grid grid-cols-[8ch_8ch_1fr_5ch_6ch_6ch] gap-2 px-1 py-1 text-left items-center"
              >
                <span className="text-zinc-500 tabular-nums">
                  {formatTime(call.ts).slice(0, 8)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    SOURCE_COLOR[call.source],
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      STATUS_DOT[call.status],
                    )}
                  />
                  <span className="truncate">{SOURCE_LABEL[call.source]}</span>
                </span>
                <span className="truncate text-zinc-300">
                  <span className="text-zinc-500">{call.model}</span>
                  {call.preview?.input && (
                    <span className="text-zinc-400">
                      {" · "}
                      {call.preview.input}
                    </span>
                  )}
                </span>
                <span className="text-right tabular-nums text-zinc-400">
                  {formatLatency(call.latencyMs)}
                </span>
                <span className="text-right tabular-nums">
                  {call.promptTokens || call.completionTokens ? (
                    <>
                      <span className="text-emerald-400">
                        {formatTokens(call.promptTokens)}
                      </span>
                      <span className="text-zinc-700">/</span>
                      <span className="text-cyan-400">
                        {formatTokens(call.completionTokens)}
                      </span>
                    </>
                  ) : call.audioInputSeconds ? (
                    <span className="text-orange-300">
                      {formatSeconds(call.audioInputSeconds)}
                    </span>
                  ) : (
                    <span className="text-zinc-700">—</span>
                  )}
                </span>
                <span className="text-right tabular-nums text-orange-300">
                  {formatUsd(call.costUsd)}
                </span>
              </button>
              {isOpen && (
                <div className="px-3 py-2 text-[10px] text-zinc-400 border-t border-zinc-800/60 space-y-1">
                  {call.errorMessage && (
                    <div className="text-red-400">
                      <span className="text-zinc-600">error: </span>
                      {call.errorMessage}
                    </div>
                  )}
                  {call.preview?.input && (
                    <div>
                      <div className="text-zinc-600 mb-0.5">input</div>
                      <div className="whitespace-pre-wrap wrap-break-word text-zinc-300 bg-zinc-900 rounded px-2 py-1">
                        {call.preview.input}
                      </div>
                    </div>
                  )}
                  {call.preview?.output && (
                    <div>
                      <div className="text-zinc-600 mb-0.5">output</div>
                      <div className="whitespace-pre-wrap wrap-break-word text-zinc-300 bg-zinc-900 rounded px-2 py-1">
                        {call.preview.output}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LogsTab({ logs }: { logs: LogEntry[] }) {
  const reversed = [...logs].reverse();

  if (logs.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-zinc-500 font-mono">
        no logs yet
      </div>
    );
  }

  return (
    <div className="font-mono text-[11px] space-y-0.5">
      {reversed.map((log, idx) => (
        <div
          key={`${log.ts}-${idx}`}
          className="grid grid-cols-[10ch_3ch_10ch_1fr] gap-2 px-1 py-0.5 hover:bg-zinc-900/60 rounded"
        >
          <span className="text-zinc-600 tabular-nums">
            {formatTime(log.ts).slice(0, 12)}
          </span>
          <span className={cn("text-[10px]", LEVEL_COLOR[log.level])}>
            {LEVEL_TAG[log.level]}
          </span>
          <span className="text-zinc-500 truncate">{log.source}</span>
          <span className={cn("wrap-break-word", LEVEL_COLOR[log.level])}>
            {log.message}
          </span>
        </div>
      ))}
    </div>
  );
}

function AudioTab({ scribe }: { scribe?: ScribeHandle }) {
  useTick(200);

  if (!scribe) {
    return (
      <div className="py-6 text-center text-xs text-zinc-500 font-mono">
        no scribe handle in scope
      </div>
    );
  }

  const m = scribe.audioMetrics;
  const isLive = scribe.status === "listening";

  // Compute simple level metrics from the live waveform array.
  const wave = scribe.waveform;
  const peak = wave.length ? Math.max(...wave) : 0;
  const rms = wave.length
    ? Math.sqrt(wave.reduce((s, v) => s + v * v, 0) / wave.length)
    : 0;
  const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

  return (
    <div className="space-y-2">
      <SectionLabel>Live level</SectionLabel>
      <div className="space-y-1">
        <LevelBar label="peak" value={peak} db={peakDb} active={isLive} />
        <LevelBar label="rms" value={rms} db={rmsDb} active={isLive} />
      </div>

      <SectionLabel>Mic stream</SectionLabel>
      <StatRow
        label="device"
        value={m.deviceLabel || (m.sampleRate ? "default" : "—")}
        valueClass="text-zinc-300 truncate max-w-[14rem]"
      />
      <StatRow
        label="sample rate"
        value={m.sampleRate ? `${m.sampleRate.toLocaleString()} Hz` : "—"}
      />
      <StatRow label="channels" value={m.channelCount || "—"} />
      <StatRow label="bit depth" value={`${m.bitDepth}-bit PCM`} />
      <StatRow
        label="fft size"
        value={m.fftSize ? `${m.fftSize} (bins ${m.fftSize / 2})` : "—"}
      />
      {m.trackSettings && (
        <>
          <SectionLabel>Track settings</SectionLabel>
          <StatRow
            label="echo cancel."
            value={String(m.trackSettings.echoCancellation ?? "—")}
          />
          <StatRow
            label="noise sup."
            value={String(m.trackSettings.noiseSuppression ?? "—")}
          />
          <StatRow
            label="auto gain"
            value={String(m.trackSettings.autoGainControl ?? "—")}
          />
        </>
      )}
    </div>
  );
}

function LevelBar({
  label,
  value,
  db,
  active,
}: {
  label: string;
  value: number;
  db: number;
  active: boolean;
}) {
  const pct = clamp(value * 100, 0, 100);
  return (
    <div className="font-mono text-[10px]">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-zinc-500 uppercase tracking-wider">{label}</span>
        <span className="text-zinc-400 tabular-nums">
          {Number.isFinite(db) ? `${db.toFixed(1)} dB` : "−∞ dB"}
        </span>
      </div>
      <div className="relative h-1.5 rounded bg-zinc-900 ring-1 ring-zinc-800 overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-[width] duration-150",
            active
              ? "bg-linear-to-r from-orange-500 via-orange-400 to-amber-300"
              : "bg-zinc-700",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ----------------------------- root ----------------------------------------

interface ScribeDebugToolbarProps {
  scribe?: ScribeHandle;
}

/**
 * Floating dev-only console for the Ambient Scribe POC. Returns `null`
 * outside of `import.meta.env.DEV` so production bundles tree-shake it
 * away. The styling intentionally breaks from the app's design system —
 * dark slate + orange accents, monospace, tabular numbers — so it reads
 * as a developer surface, not a user-facing feature.
 */
export function ScribeDebugToolbar({ scribe }: ScribeDebugToolbarProps) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const usage = useUsage();

  if (!import.meta.env.DEV) return null;

  const callsCount = usage.recentCalls.length;
  const logsCount = usage.logs.length;
  const errorCount =
    usage.recentCalls.filter((c) => c.status === "error").length +
    usage.logs.filter((l) => l.level === "error").length;

  const sessionCost = usage.session.costUsd;
  const sessionTokens =
    usage.session.promptTokens + usage.session.completionTokens;

  return (
    <div className="fixed bottom-3 right-3 z-50 pointer-events-none font-mono">
      <div
        className={cn(
          "pointer-events-auto rounded-lg border border-zinc-800",
          "bg-zinc-950/95 backdrop-blur shadow-2xl shadow-black/40",
          "ring-1 ring-orange-500/10",
          "text-zinc-200 transition-all",
          expanded ? "w-[520px]" : "w-auto",
        )}
      >
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex items-center justify-between gap-3 w-full px-2.5 py-1.5",
            "text-left hover:bg-zinc-900/80 transition-colors rounded-t-lg",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-5 rounded bg-linear-to-br from-orange-500 to-amber-600 text-zinc-950 shadow-sm">
              <Sparkles className="size-3" strokeWidth={2.5} />
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-300">
              SCRIBE_DEBUG
            </span>
            {scribe && <StatusPill status={scribe.status} />}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <CircleDot className="size-3 text-orange-400" />
              <span className="tabular-nums text-orange-300 font-semibold">
                {formatUsd(sessionCost)}
              </span>
            </span>
            <span className="text-zinc-600">·</span>
            <span className="tabular-nums text-zinc-400">
              {formatTokens(sessionTokens)}t
            </span>
            {errorCount > 0 && (
              <>
                <span className="text-zinc-600">·</span>
                <span className="text-red-400 font-semibold">
                  {errorCount} err
                </span>
              </>
            )}
            {expanded ? (
              <ChevronDown className="size-3 text-zinc-500" />
            ) : (
              <ChevronUp className="size-3 text-zinc-500" />
            )}
          </div>
        </button>

        {expanded && (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-px px-1.5 border-t border-zinc-800 bg-zinc-900/40">
              <TabButton
                active={tab === "overview"}
                onClick={() => setTab("overview")}
                icon={<Activity className="size-3" />}
                label="overview"
              />
              <TabButton
                active={tab === "calls"}
                onClick={() => setTab("calls")}
                icon={<Zap className="size-3" />}
                label="calls"
                count={callsCount}
              />
              <TabButton
                active={tab === "logs"}
                onClick={() => setTab("logs")}
                icon={<ScrollText className="size-3" />}
                label="logs"
                count={logsCount}
              />
              <TabButton
                active={tab === "audio"}
                onClick={() => setTab("audio")}
                icon={<AudioLines className="size-3" />}
                label="audio"
              />
              <span className="flex-1" />
              <ToolbarIconButton
                title="reset session counters"
                onClick={resetSession}
              >
                <RotateCcw className="size-3" />
              </ToolbarIconButton>
              {tab === "logs" && (
                <ToolbarIconButton title="clear logs" onClick={clearLogs}>
                  <ListTree className="size-3" />
                </ToolbarIconButton>
              )}
              <ToolbarIconButton
                title="clear persisted account totals"
                onClick={clearAccount}
              >
                <Trash2 className="size-3" />
              </ToolbarIconButton>
            </div>

            {/* Body */}
            <div className="px-2.5 py-2 max-h-[440px] overflow-y-auto">
              {tab === "overview" && (
                <OverviewTab
                  scribe={scribe}
                  session={usage.session}
                  account={usage.account}
                />
              )}
              {tab === "calls" && <CallsTab calls={usage.recentCalls} />}
              {tab === "logs" && <LogsTab logs={usage.logs} />}
              {tab === "audio" && <AudioTab scribe={scribe} />}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 px-2.5 py-1 border-t border-zinc-800 bg-zinc-900/40 text-[10px] text-zinc-600">
              <span className="inline-flex items-center gap-1">
                <Radio className="size-2.5 text-orange-500" />
                tokens shown as <span className="text-emerald-400">in</span>
                <span className="text-zinc-700">/</span>
                <span className="text-cyan-400">out</span>
              </span>
              <span>dev only · not localized</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider",
        "transition-colors rounded-t",
        active
          ? "text-orange-300 bg-zinc-950 border-b border-orange-500/60"
          : "text-zinc-500 hover:text-zinc-300 border-b border-transparent",
      )}
    >
      {icon}
      <span>{label}</span>
      {typeof count === "number" && count > 0 && (
        <span
          className={cn(
            "ml-0.5 tabular-nums",
            active ? "text-zinc-400" : "text-zinc-600",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ToolbarIconButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="p-1 text-zinc-500 hover:text-orange-300 hover:bg-zinc-800/60 rounded transition-colors"
    >
      {children}
    </button>
  );
}
