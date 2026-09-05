import { useQuery } from "@tanstack/react-query";
import {
  CircleAlert,
  CircleDotDashed,
  CircleMinus,
  CirclePlus,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { TERMINOLOGY_SYSTEMS, ValueSetBase } from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";

const PREVIEW_RESULT_LIMIT = 20;

interface ValueSetPreviewProps {
  valueset: ValueSetBase;
  trigger: React.ReactNode;
  definitionNotice?: string;
}

export function ValueSetPreview({
  valueset,
  trigger,
  definitionNotice,
}: ValueSetPreviewProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  // Preview validates slug uniqueness even though it never saves a value set.
  const [previewSlug] = useState(
    () => `preview-${crypto.randomUUID().replaceAll("-", "").slice(0, 17)}`,
  );
  const searchId = useId();
  const compose = {
    include: valueset.compose.include.map((rule) => ({
      ...rule,
      version: rule.version?.trim() || null,
    })),
    exclude: valueset.compose.exclude.map((rule) => ({
      ...rule,
      version: rule.version?.trim() || null,
    })),
  };
  const hasDefinition = [...compose.include, ...compose.exclude].some(
    (rule) => !!rule.system,
  );

  const {
    data: searchQuery,
    isFetching,
    isError,
    refetch,
  } = useQuery<typeof valueSetApi.previewSearch.TRes>({
    queryKey: ["valueset", "previewSearch", search, compose],
    queryFn: query.debounced(valueSetApi.previewSearch, {
      queryParams: { search, count: PREVIEW_RESULT_LIMIT },
      body: {
        ...valueset,
        name: valueset.name.trim() || "Preview",
        slug: previewSlug,
        compose,
      },
    }),
    // Keep the list stable while searching, but never show results from an
    // earlier definition after its include/exclude rules have changed.
    placeholderData: (previousData, previousQuery) =>
      JSON.stringify(previousQuery?.queryKey[3]) === JSON.stringify(compose)
        ? previousData
        : undefined,
    enabled: open && hasDefinition,
  });
  const results = searchQuery?.results.slice(0, PREVIEW_RESULT_LIMIT) ?? [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 space-y-1 border-b border-gray-200 bg-gray-50/80 p-5 pr-10 text-left sm:p-6 sm:pr-10">
          <SheetTitle className="text-xl font-semibold">
            {t("valueset_preview")}
          </SheetTitle>
          <SheetDescription>
            {t("valueset_preview_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {definitionNotice && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950">
              {definitionNotice}
            </p>
          )}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-950">
                  {valueset.name || t("value_set")}
                </p>
                {valueset.slug && (
                  <code className="mt-1 block truncate text-xs text-gray-500">
                    {valueset.slug}
                  </code>
                )}
              </div>
              <Badge variant="secondary">{t(valueset.status)}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-100/50 px-3 py-2 text-sm text-primary-900">
                <span className="flex items-center gap-2">
                  <CirclePlus aria-hidden className="size-4" />
                  {t("include_rules")}
                </span>
                <span className="font-semibold tabular-nums">
                  {valueset.compose.include.length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-100/80 px-3 py-2 text-sm text-gray-800">
                <span className="flex items-center gap-2">
                  <CircleMinus aria-hidden className="size-4" />
                  {t("exclude_rules")}
                </span>
                <span className="font-semibold tabular-nums">
                  {valueset.compose.exclude.length}
                </span>
              </div>
            </div>
          </div>

          {hasDefinition ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={searchId}>{t("search_concept")}</Label>
                <div className="relative">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500"
                  />
                  <Input
                    id={searchId}
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("valueset_preview_search_placeholder")}
                    aria-describedby={`${searchId}-hint`}
                    className="h-12 pr-11 pl-9 md:h-10"
                  />
                  {search && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-1 -translate-y-1/2"
                      onClick={() => setSearch("")}
                      aria-label={t("clear_search")}
                    >
                      <X aria-hidden className="size-4" />
                    </Button>
                  )}
                </div>
                <p
                  id={`${searchId}-hint`}
                  className="text-xs leading-relaxed text-gray-500"
                >
                  {t("valueset_preview_limit_hint", {
                    limit: PREVIEW_RESULT_LIMIT,
                  })}
                </p>
              </div>

              <div>
                <p
                  role="status"
                  className="mb-3 flex min-h-5 items-center gap-2 text-sm text-gray-600"
                >
                  {isFetching ? (
                    <>
                      <LoaderCircle
                        aria-hidden
                        className="size-4 animate-spin"
                      />
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
                          onClick={() => void refetch()}
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
                      const systemName = Object.entries(
                        TERMINOLOGY_SYSTEMS,
                      ).find(([, system]) => system === concept.system)?.[0];

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
                        onClick={() => setSearch("")}
                      >
                        {t("clear_search")}
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-6 text-center">
              <CircleDotDashed
                aria-hidden
                className="mb-3 size-6 text-gray-400"
              />
              <p className="text-sm font-medium text-gray-800">
                {t("no_data_found")}
              </p>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                {t("valueset_preview_empty")}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
