import { useQuery } from "@tanstack/react-query";
import { Box, Search, X } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";

import AnnotationEditor from "@/components/BodySite/AnnotationEditor";
import Body2D from "@/components/BodySite/Body2D";
import { Body2DView } from "@/components/BodySite/body2DLayout";
import {
  ANNOTATION_TYPES,
  AnnotationType,
  BodyAnnotation,
} from "@/components/BodySite/bodyAnnotation";
import {
  BODY_REGIONS,
  BodyRegion,
  ClinicalUseCase,
  findRegionByCode,
  searchRegions,
} from "@/components/BodySite/bodySiteRegions";
import { useWebGLSupport } from "@/components/BodySite/useWebGLSupport";
import { CameraView } from "@/components/BodySite/views";

import { Code } from "@/types/base/code/code";

const BodyScene = lazy(() => import("@/components/BodySite/BodyScene"));

export type BodySiteRenderMode = "2d" | "3d";

interface SingleProps {
  multiple?: false;
  value?: Code | null;
  onSelect: (code: Code) => void;
}

interface MultiProps {
  multiple: true;
  value?: Code[] | null;
  onSelect: (codes: Code[]) => void;
}

type Props = (SingleProps | MultiProps) & {
  className?: string;
  height?: number | string;
  /** Restrict to a list of SNOMED codes. */
  allowedCodes?: string[];
  /** Restrict to regions relevant for a clinical workflow. */
  useCase?: ClinicalUseCase;
  /** Initial render mode. Defaults to 2d (more accessible / lower-end devices). */
  defaultMode?: BodySiteRenderMode;
  /** Persist mode preference to localStorage under this key. */
  modePreferenceKey?: string;
  /** Enable free-form annotation mode (wound/burn/pain markers placed at
   *  arbitrary points on the 2D body). */
  annotations?: BodyAnnotation[];
  onAnnotationsChange?: (annotations: BodyAnnotation[]) => void;
  /** Backend value set slug to search via the SNOMED API. The local taxonomy
   *  remains the primary source; API results expand the search beyond the
   *  curated regions, so any concept in the value set is selectable. */
  valueSetSlug?: string;
  /** Disable backend-augmented search (e.g. for offline / preview use). */
  apiSearchDisabled?: boolean;
};

const STORAGE_KEY_DEFAULT = "body-site-render-mode";

function readPreferredMode(
  key: string,
  fallback: BodySiteRenderMode,
): BodySiteRenderMode {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  if (stored === "2d" || stored === "3d") return stored;
  return fallback;
}

export default function BodySiteSelector3D(props: Props) {
  const {
    className,
    height = 560,
    allowedCodes,
    useCase,
    defaultMode = "2d",
    modePreferenceKey = STORAGE_KEY_DEFAULT,
    annotations,
    onAnnotationsChange,
    valueSetSlug = "system-body-site",
    apiSearchDisabled = false,
  } = props;

  const annotationsEnabled = !!onAnnotationsChange;

  const { t } = useTranslation();
  const webglSupported = useWebGLSupport();

  const [mode, setMode] = useState<BodySiteRenderMode>(() =>
    readPreferredMode(modePreferenceKey, defaultMode),
  );
  const [view2D, setView2D] = useState<Body2DView>("front");
  const [view3D, setView3D] = useState<CameraView>("front");
  const [search, setSearch] = useState("");
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [annotationTool, setAnnotationTool] = useState<AnnotationType | null>(
    null,
  );
  const [editingAnnotation, setEditingAnnotation] = useState<{
    annotation: BodyAnnotation;
    anchor: { x: number; y: number };
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyAreaRef = useRef<HTMLDivElement>(null);

  // Annotation mode forces 2D
  useEffect(() => {
    if (annotationTool && mode !== "2d") setMode("2d");
  }, [annotationTool, mode]);

  // Persist mode preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(modePreferenceKey, mode);
  }, [mode, modePreferenceKey]);

  // Force 2D when WebGL is unavailable
  useEffect(() => {
    if (!webglSupported && mode === "3d") setMode("2d");
  }, [webglSupported, mode]);

  const regions = useMemo(() => {
    let result = BODY_REGIONS;
    if (allowedCodes) {
      result = result.filter((r) => allowedCodes.includes(r.code.code));
    }
    if (useCase) {
      result = result.filter((r) => r.useCases?.includes(useCase));
    }
    return result;
  }, [allowedCodes, useCase]);

  const allowedRegionIds = useMemo(
    () => new Set(regions.map((r) => r.id)),
    [regions],
  );
  const regionFilter = useMemo(
    () => (region: BodyRegion) => allowedRegionIds.has(region.id),
    [allowedRegionIds],
  );

  const searchMatches = useMemo(() => {
    if (!search.trim()) return [];
    return searchRegions(search).filter((id) => allowedRegionIds.has(id));
  }, [search, allowedRegionIds]);

  const highlightedIds = useMemo(() => new Set(searchMatches), [searchMatches]);

  // Backend-augmented SNOMED search. The local taxonomy is still primary —
  // we just append API-only matches below local hits so the picker isn't
  // capped at the curated 50 regions. Errors fail silently so offline/preview
  // contexts still work with local search alone.
  const apiSearchEnabled = !apiSearchDisabled && search.trim().length >= 2;
  const apiSearch = useQuery({
    queryKey: ["body-site-search", valueSetSlug, search],
    queryFn: query.debounced(valueSetApi.expand, {
      pathParams: { slug: valueSetSlug },
      body: { count: 15, search },
      silent: true,
    }),
    enabled: apiSearchEnabled,
    staleTime: 30_000,
    retry: false,
  });
  const apiResults: Code[] = useMemo(() => {
    const results = apiSearch.data?.results ?? [];
    const localCodes = new Set(
      searchMatches
        .map((id) => regions.find((r) => r.id === id)?.code.code)
        .filter((c): c is string => !!c),
    );
    return results
      .filter((r) => r.code && r.display && !localCodes.has(r.code))
      .map((r) => ({
        system: r.system,
        code: r.code,
        display: r.display,
      }));
  }, [apiSearch.data, searchMatches, regions]);

  // Selection state
  const selectedRegions = useMemo(() => {
    if (props.multiple) {
      return (props.value ?? [])
        .map((code) => findRegionByCode(code))
        .filter((r): r is BodyRegion => !!r);
    }
    const single = findRegionByCode(props.value ?? undefined);
    return single ? [single] : [];
  }, [props]);

  const selectedIds = useMemo(
    () => new Set(selectedRegions.map((r) => r.id)),
    [selectedRegions],
  );

  // The full list of currently-selected codes — including ones that don't
  // correspond to a body region we have a layout for (e.g. obscure SNOMED
  // concepts pulled in via the API search). Used to render the status bar
  // and the multi-select chip count.
  const selectedCodes: Code[] = useMemo(() => {
    if (props.multiple) return props.value ?? [];
    return props.value ? [props.value] : [];
  }, [props]);

  const focusedRegion = focusedIdx != null ? regions[focusedIdx] : undefined;

  // Auto-rotate to relevant view when searching
  useEffect(() => {
    if (searchMatches.length === 0) return;
    const first = regions.find((r) => r.id === searchMatches[0]);
    if (!first) return;
    if (mode === "2d") {
      if (first.view === "back" && view2D === "front") setView2D("back");
      if (first.view === "front" && view2D === "back") setView2D("front");
    } else {
      if (first.view === "back" && view3D === "front") setView3D("back");
      if (first.view === "front" && view3D === "back") setView3D("front");
    }
  }, [searchMatches, regions, view2D, view3D, mode]);

  const handleSelectCode = (code: Code) => {
    if (props.multiple) {
      const current = props.value ?? [];
      const exists = current.find(
        (c) => c.code === code.code && c.system === code.system,
      );
      if (exists) {
        props.onSelect(
          current.filter(
            (c) => !(c.code === code.code && c.system === code.system),
          ),
        );
      } else {
        props.onSelect([...current, code]);
      }
    } else {
      props.onSelect(code);
    }
    setSearch("");
  };

  const handleSelect = (region: BodyRegion) => handleSelectCode(region.code);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (regions.length === 0) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIdx((idx) => ((idx ?? -1) + 1) % regions.length);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIdx(
        (idx) => ((idx ?? 0) - 1 + regions.length) % regions.length,
      );
    } else if (event.key === "Enter" && focusedRegion) {
      event.preventDefault();
      handleSelect(focusedRegion);
    } else if (event.key === "Escape") {
      setFocusedIdx(null);
      setSearch("");
    }
  };

  const view2DButtons: Body2DView[] = ["front", "back"];
  const view3DButtons: CameraView[] = ["front", "back", "left", "right"];

  const selectedSummary = selectedCodes
    .map((c) => c.display)
    .filter(Boolean)
    .join(", ");

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={t("body_site_3d_aria_label")}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative flex w-full flex-col rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden focus:outline-hidden focus:ring-2 focus:ring-primary-500",
        className,
      )}
      style={{ height }}
    >
      {/* Top toolbar: search + view + mode */}
      <div className="z-10 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white/95 p-2">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("body_site_search_placeholder")}
            className="pl-8 pr-8 h-9"
            aria-label={t("body_site_search_placeholder")}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={t("clear")}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* View buttons */}
        <div
          className="flex items-center gap-1 rounded-md bg-gray-50 p-1"
          role="group"
          aria-label={t("body_site_view_controls")}
        >
          {mode === "2d"
            ? view2DButtons.map((v) => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant={view2D === v ? "primary" : "ghost"}
                  className="h-7 px-2 text-xs"
                  onClick={() => setView2D(v)}
                  aria-pressed={view2D === v}
                >
                  {t(`body_site_view_${v}`)}
                </Button>
              ))
            : view3DButtons.map((v) => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant={view3D === v ? "primary" : "ghost"}
                  className="h-7 px-2 text-xs"
                  onClick={() => setView3D(v)}
                  aria-pressed={view3D === v}
                >
                  {t(`body_site_view_${v}`)}
                </Button>
              ))}
        </div>

        {/* 2D / 3D mode toggle */}
        {webglSupported && (
          <div
            className="flex items-center gap-1 rounded-md bg-gray-50 p-1"
            role="group"
            aria-label={t("body_site_mode_toggle")}
          >
            <Button
              type="button"
              size="sm"
              variant={mode === "2d" ? "primary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setMode("2d")}
              aria-pressed={mode === "2d"}
            >
              {t("body_site_mode_2d")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "3d" ? "primary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setMode("3d")}
              aria-pressed={mode === "3d"}
            >
              <Box className="size-3 mr-1" aria-hidden />
              {t("body_site_mode_3d")}
            </Button>
          </div>
        )}
      </div>

      {/* Search results dropdown */}
      {search.trim() && (
        <div className="absolute top-14 left-2 z-20 w-full max-w-md">
          <div className="rounded-md border border-gray-200 bg-white shadow-lg max-h-72 overflow-auto">
            {searchMatches.length === 0 &&
            apiResults.length === 0 &&
            !apiSearch.isFetching ? (
              <div className="p-3 text-sm text-gray-500">
                {t("no_results_found")}
              </div>
            ) : (
              <>
                {searchMatches.length > 0 && (
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-gray-400">
                    {t("body_site_search_local")}
                  </div>
                )}
                {searchMatches.slice(0, 10).map((id) => {
                  const r = regions.find((x) => x.id === id);
                  if (!r) return null;
                  const isSelected = selectedIds.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelect(r)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50",
                        isSelected && "bg-sky-50",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {isSelected && <span className="text-sky-600">●</span>}
                        {r.code.display}
                      </span>
                      <span className="text-xs text-gray-400">
                        {r.code.code}
                      </span>
                    </button>
                  );
                })}

                {apiResults.length > 0 && (
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-gray-400 border-t border-gray-100 mt-1">
                    {t("body_site_search_snomed")}
                  </div>
                )}
                {apiResults.map((code) => {
                  const isSelected = props.multiple
                    ? (props.value ?? []).some(
                        (c) => c.code === code.code && c.system === code.system,
                      )
                    : props.value?.code === code.code;
                  return (
                    <button
                      key={`api-${code.code}`}
                      type="button"
                      onClick={() => handleSelectCode(code)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50",
                        isSelected && "bg-sky-50",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {isSelected && <span className="text-sky-600">●</span>}
                        {code.display}
                      </span>
                      <span className="text-xs text-gray-400">{code.code}</span>
                    </button>
                  );
                })}

                {apiSearch.isFetching && (
                  <div className="px-3 py-2 text-xs text-gray-400">
                    {t("searching")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Annotation tool palette (only when annotations are enabled) */}
      {annotationsEnabled && mode === "2d" && (
        <div
          className="z-10 flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-2 py-1.5"
          role="toolbar"
          aria-label={t("body_site_annotation_toolbar")}
        >
          <span className="text-xs text-gray-500 mr-2">
            {t("body_site_annotation_label")}:
          </span>
          <Button
            type="button"
            size="sm"
            variant={annotationTool === null ? "primary" : "ghost"}
            className="h-7 px-2 text-xs"
            onClick={() => setAnnotationTool(null)}
            aria-pressed={annotationTool === null}
          >
            {t("body_site_annotation_select")}
          </Button>
          {ANNOTATION_TYPES.map((meta) => (
            <Button
              key={meta.type}
              type="button"
              size="sm"
              variant={annotationTool === meta.type ? "primary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setAnnotationTool(meta.type)}
              aria-pressed={annotationTool === meta.type}
              style={
                annotationTool === meta.type
                  ? { backgroundColor: meta.color, borderColor: meta.color }
                  : undefined
              }
            >
              <span
                className="inline-block size-2 rounded-full mr-1"
                style={{ backgroundColor: meta.color }}
                aria-hidden
              />
              {t(meta.labelKey)}
            </Button>
          ))}
          {annotations && annotations.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs ml-auto text-red-600"
              onClick={() => onAnnotationsChange?.([])}
            >
              {t("body_site_annotation_clear", { count: annotations.length })}
            </Button>
          )}
        </div>
      )}

      {/* Body view */}
      <div ref={bodyAreaRef} className="relative flex-1 overflow-hidden">
        {mode === "2d" ? (
          <Body2D
            view={view2D}
            selectedIds={selectedIds}
            highlightedIds={highlightedIds}
            focusedId={focusedRegion?.id}
            regionFilter={regionFilter}
            onSelect={handleSelect}
            annotationTool={annotationsEnabled ? annotationTool : null}
            annotations={annotations}
            onAnnotationsChange={onAnnotationsChange}
            onAnnotationClick={(anno, anchor) =>
              setEditingAnnotation({ annotation: anno, anchor })
            }
          />
        ) : (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                {t("loading")}
              </div>
            }
          >
            <BodyScene
              selectedId={selectedRegions[0]?.id}
              highlightedIds={highlightedIds}
              focusedId={focusedRegion?.id}
              view={view3D}
              onSelect={handleSelect}
            />
          </Suspense>
        )}

        {/* Annotation editor popover */}
        {editingAnnotation && bodyAreaRef.current && (
          <AnnotationEditor
            annotation={editingAnnotation.annotation}
            anchor={editingAnnotation.anchor}
            containerWidth={bodyAreaRef.current.clientWidth}
            containerHeight={bodyAreaRef.current.clientHeight}
            onSave={(updated) => {
              if (onAnnotationsChange && annotations) {
                onAnnotationsChange(
                  annotations.map((a) => (a.id === updated.id ? updated : a)),
                );
              }
            }}
            onDelete={() => {
              if (onAnnotationsChange && annotations) {
                onAnnotationsChange(
                  annotations.filter(
                    (a) => a.id !== editingAnnotation.annotation.id,
                  ),
                );
              }
            }}
            onClose={() => setEditingAnnotation(null)}
          />
        )}
      </div>

      {/* Bottom status bar */}
      <div className="border-t border-gray-200 bg-white/95 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-gray-700">
            {selectedCodes.length === 0 ? (
              <span className="text-gray-500">{t("body_site_3d_hint")}</span>
            ) : props.multiple ? (
              <span>
                <span className="font-medium">
                  {t("selected_count", { count: selectedCodes.length })}:
                </span>{" "}
                <span className="text-gray-600">{selectedSummary}</span>
              </span>
            ) : (
              <span>
                <span className="font-medium">{t("selected")}:</span>{" "}
                {selectedCodes[0].display}{" "}
                <span className="text-gray-400">({selectedCodes[0].code})</span>
              </span>
            )}
          </div>
          {props.multiple && selectedCodes.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => props.onSelect([])}
            >
              {t("clear_all")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
