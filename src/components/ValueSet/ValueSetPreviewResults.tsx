import { CircleAlert, LoaderCircle, RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import type { CodeConceptMinimal } from "@/types/base/code/code";
import { TERMINOLOGY_SYSTEMS } from "@/types/valueSet/valueSet";

interface ValueSetPreviewResultsProps {
  results: CodeConceptMinimal[];
  isFetching: boolean;
  isError: boolean;
  search: string;
  onRetry: () => void;
  onClearSearch: () => void;
}

export function ValueSetPreviewResults({
  results,
  isFetching,
  isError,
  search,
  onRetry,
  onClearSearch,
}: ValueSetPreviewResultsProps) {
  const { t } = useTranslation();
  return (
    <div>
      <p
        role="status"
        className="mb-3 flex min-h-5 items-center gap-2 text-sm text-gray-600"
      >
        {isFetching ? (
          <>
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
            {t("searching")}
          </>
        ) : (
          !isError &&
          t("valueset_preview_result_count", {
            count: results.length,
          })
        )}
      </p>

      {isError ? (
        <div
          role="alert"
          className="rounded-xl border border-gray-200 bg-gray-50 p-5"
        >
          <div className="flex items-start gap-3">
            <CircleAlert
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-gray-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t("valueset_preview_error")}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {t("valueset_preview_error_hint")}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={onRetry}
                disabled={isFetching}
              >
                <RefreshCw aria-hidden className="size-4" />
                {t("try_again")}
              </Button>
            </div>
          </div>
        </div>
      ) : results.length > 0 ? (
        <ul
          aria-busy={isFetching}
          className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          {results.map((concept) => {
            const systemName = Object.entries(TERMINOLOGY_SYSTEMS).find(
              ([, system]) => system === concept.system,
            )?.[0];

            return (
              <li
                key={`${concept.system}-${concept.code}`}
                className="space-y-2 p-4"
              >
                <p className="text-sm leading-relaxed font-medium break-words text-gray-950">
                  {concept.display || concept.code}
                </p>
                <dl className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                  <div className="flex min-w-0 items-baseline gap-1.5">
                    <dt className="text-gray-500">{t("code")}</dt>
                    <dd className="font-mono break-all text-gray-700">
                      {concept.code}
                    </dd>
                  </div>
                  {concept.system && (
                    <div className="flex min-w-0 items-baseline gap-1.5">
                      <dt className="text-gray-500">{t("system")}</dt>
                      <dd className="break-all text-gray-700">
                        {systemName || concept.system}
                      </dd>
                    </div>
                  )}
                </dl>
              </li>
            );
          })}
        </ul>
      ) : !isFetching ? (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-6 text-center">
          <Search aria-hidden className="mb-3 size-6 text-gray-400" />
          <p className="text-sm font-medium text-gray-800">
            {t("no_results_found")}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {search
              ? t("valueset_preview_no_search_results")
              : t("valueset_preview_no_definition_results")}
          </p>
          {search && (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={onClearSearch}
            >
              {t("clear_search")}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
