import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import aiWidgetsApi from "@/components/AIWidgets/api";
import { CitedSummaryWidget } from "@/components/AIWidgets/renderers/CitedSummaryWidget";
import { MarkdownWidget } from "@/components/AIWidgets/renderers/MarkdownWidget";
import { RankedListWidget } from "@/components/AIWidgets/renderers/RankedListWidget";
import { ScoreWidget } from "@/components/AIWidgets/renderers/ScoreWidget";
import { SCHEMAS } from "@/components/AIWidgets/schemas";
import { outputToText } from "@/components/AIWidgets/summarize";
import {
  AskResponse,
  CitedSummaryOutput,
  MarkdownOutput,
  RankedListOutput,
  ScoreOutput,
  Widget,
} from "@/components/AIWidgets/types";

import { callApi } from "@/Utils/request/query";

interface Props {
  widget: Widget;
  encounterId: string;
}

export function WidgetRunner({ widget, encounterId }: Props) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const query = useQuery<AskResponse>({
    queryKey: [
      "ai-widget",
      widget.id,
      encounterId,
      widget.prompt,
      widget.model,
      widget.type,
    ],
    queryFn: ({ signal }) =>
      callApi(aiWidgetsApi.ask, {
        pathParams: { encounterId },
        body: {
          prompt: widget.prompt,
          model: widget.model,
          response_schema: SCHEMAS[widget.type],
        },
        signal,
      }),
    enabled: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });

  const hasResult = query.isSuccess && query.data;
  const errorMsg = errorToString(query.error);

  return (
    <section className="rounded-md border border-gray-200 bg-white">
      <header className="flex items-center justify-between gap-2 px-2.5 py-1.5">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded text-left hover:text-gray-900"
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          )}
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            aria-hidden
          />
          <h3 className="truncate text-xs font-medium text-gray-800">
            {widget.name}
          </h3>
          <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-amber-700">
            AI
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-gray-500">
          {hasResult && !query.isFetching && !collapsed && (
            <span className="hidden sm:inline">
              {t("ai_widgets__duration_seconds", {
                seconds: (query.data!.duration_ms / 1000).toFixed(1),
              })}
              {" · "}
              {query.data!.tool_calls.length} {t("ai_widgets__tool_calls")}
            </span>
          )}
          {!hasResult && !query.isFetching && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[11px]"
              onClick={() => query.refetch()}
            >
              <Play className="h-3 w-3" />
              {t("ai_widgets__run")}
            </Button>
          )}
          {hasResult && !query.isFetching && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[11px] text-gray-600 hover:text-gray-900"
              onClick={() => query.refetch()}
            >
              <RefreshCw className="h-3 w-3" />
              {t("ai_widgets__rerun")}
            </Button>
          )}
          {query.isFetching && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("ai_widgets__thinking")}
            </span>
          )}
        </div>
      </header>
      {!collapsed && (
        <div className="border-t border-gray-100 px-3 py-2.5">
          {query.isFetching && !hasResult && (
            <p className="text-xs text-gray-500">{t("ai_widgets__thinking")}</p>
          )}
          {!query.isFetching && errorMsg && <ErrorState message={errorMsg} />}
          {!query.isFetching && !hasResult && !errorMsg && (
            <p className="text-xs text-gray-500">
              {t("ai_widgets__not_run_yet")}
            </p>
          )}
          {hasResult && (
            <RenderedOutput widget={widget} response={query.data!} />
          )}
        </div>
      )}
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="rounded border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-900">
      <div className="font-medium">{t("ai_widgets__error")}</div>
      <p className="mt-0.5 text-[11px]">{message}</p>
    </div>
  );
}

function RenderedOutput({
  widget,
  response,
}: {
  widget: Widget;
  response: AskResponse;
}) {
  const { t } = useTranslation();

  const body = (() => {
    if (widget.type === "markdown") {
      return <MarkdownWidget output={response.output as MarkdownOutput} />;
    }
    if (widget.type === "cited-summary") {
      return (
        <CitedSummaryWidget output={response.output as CitedSummaryOutput} />
      );
    }
    if (widget.type === "ranked-list") {
      return <RankedListWidget output={response.output as RankedListOutput} />;
    }
    if (widget.type === "score") {
      return <ScoreWidget output={response.output as ScoreOutput} />;
    }
    return null;
  })();

  return (
    <div className="flex flex-col gap-2">
      {body}
      <div className="flex items-center justify-end pt-1 text-[11px] text-gray-400">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-gray-100 hover:text-gray-700"
          onClick={() => {
            void navigator.clipboard.writeText(
              outputToText(widget, response.output),
            );
            toast.success(t("ai_widgets__copied"));
          }}
        >
          <Copy className="h-3 w-3" />
          {t("ai_widgets__copy")}
        </button>
      </div>
    </div>
  );
}

function errorToString(err: unknown): string | null {
  if (!err) return null;
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}
