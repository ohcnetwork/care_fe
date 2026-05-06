import { Search, X } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  BODY_REGIONS,
  BodyRegion,
  findRegionByCode,
  searchRegions,
} from "@/components/BodySite/bodySiteRegions";
import { useWebGLSupport } from "@/components/BodySite/useWebGLSupport";
import { CameraView } from "@/components/BodySite/views";

import { Code } from "@/types/base/code/code";

const BodyScene = lazy(() => import("@/components/BodySite/BodyScene"));

interface Props {
  value?: Code | null;
  onSelect: (code: Code) => void;
  className?: string;
  height?: number | string;
  /** Optional list of SNOMED codes to restrict the picker to. */
  allowedCodes?: string[];
}

export default function BodySiteSelector3D({
  value,
  onSelect,
  className,
  height = 520,
  allowedCodes,
}: Props) {
  const { t } = useTranslation();
  const webglSupported = useWebGLSupport();

  const [view, setView] = useState<CameraView>("front");
  const [search, setSearch] = useState("");
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const regions = useMemo(
    () =>
      allowedCodes
        ? BODY_REGIONS.filter((r) => allowedCodes.includes(r.code.code))
        : BODY_REGIONS,
    [allowedCodes],
  );

  const searchMatches = useMemo(() => {
    if (!search.trim()) return [];
    return searchRegions(search).filter((id) =>
      regions.some((r) => r.id === id),
    );
  }, [search, regions]);

  const highlightedIds = useMemo(() => new Set(searchMatches), [searchMatches]);

  const selected = findRegionByCode(value);
  const focusedRegion = focusedIdx != null ? regions[focusedIdx] : undefined;

  // When a search match exists, swing the camera to a view that shows it.
  useEffect(() => {
    if (searchMatches.length === 0) return;
    const first = regions.find((r) => r.id === searchMatches[0]);
    if (!first) return;
    if (first.view === "back" && view === "front") setView("back");
    if (first.view === "front" && view === "back") setView("front");
  }, [searchMatches, regions, view]);

  const handleSelect = (region: BodyRegion) => {
    onSelect(region.code);
    setSearch("");
  };

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

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={t("body_site_3d_aria_label")}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative w-full rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden focus:outline-hidden focus:ring-2 focus:ring-primary-500",
        className,
      )}
      style={{ height }}
    >
      {/* Top toolbar: search + view controls */}
      <div className="absolute top-2 left-2 right-2 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto relative flex-1 min-w-[180px] max-w-md">
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("body_site_search_placeholder")}
            className="pl-8 pr-8 h-9 bg-white/95 shadow-sm"
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
        <div
          className="pointer-events-auto flex items-center gap-1 rounded-md bg-white/95 p-1 shadow-sm"
          role="group"
          aria-label={t("body_site_view_controls")}
        >
          {(["front", "back", "left", "right"] as CameraView[]).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={view === v ? "primary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setView(v)}
              aria-pressed={view === v}
            >
              {t(`body_site_view_${v}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Search results dropdown */}
      {search.trim() && (
        <div className="absolute top-12 left-2 z-20 w-full max-w-md pointer-events-auto">
          <div className="rounded-md border border-gray-200 bg-white shadow-lg max-h-64 overflow-auto">
            {searchMatches.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">
                {t("no_results_found")}
              </div>
            ) : (
              searchMatches.slice(0, 10).map((id) => {
                const r = regions.find((x) => x.id === id);
                if (!r) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span>{r.code.display}</span>
                    <span className="text-xs text-gray-400">{r.code.code}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3D scene */}
      {webglSupported ? (
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              {t("loading")}
            </div>
          }
        >
          <BodyScene
            selectedId={selected?.id}
            highlightedIds={highlightedIds}
            focusedId={focusedRegion?.id}
            view={view}
            onSelect={handleSelect}
          />
        </Suspense>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium text-gray-700">
            {t("body_site_webgl_unavailable_title")}
          </p>
          <p className="text-xs text-gray-500 max-w-md">
            {t("body_site_webgl_unavailable_description")}
          </p>
        </div>
      )}

      {/* Bottom status bar */}
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="rounded-md bg-white/90 px-3 py-1.5 text-xs text-gray-700 shadow-sm">
          {selected ? (
            <span>
              <span className="font-medium">{t("selected")}:</span>{" "}
              {selected.code.display}{" "}
              <span className="text-gray-400">({selected.code.code})</span>
            </span>
          ) : (
            <span className="text-gray-500">{t("body_site_3d_hint")}</span>
          )}
        </div>
        <div className="rounded-md bg-white/90 px-3 py-1.5 text-xs text-gray-500 shadow-sm">
          {t("body_site_3d_drag_hint")}
        </div>
      </div>
    </div>
  );
}
