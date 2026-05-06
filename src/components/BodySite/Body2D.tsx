import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  Body2DRegionLayout,
  Body2DView,
  layoutsForView,
} from "@/components/BodySite/body2DLayout";
import {
  BODY_REGIONS,
  BodyRegion,
} from "@/components/BodySite/bodySiteRegions";

interface Props {
  view: Body2DView;
  selectedIds: Set<string>;
  highlightedIds: Set<string>;
  focusedId?: string;
  regionFilter?: (region: BodyRegion) => boolean;
  onSelect: (region: BodyRegion) => void;
}

const FRONT_BODY_PATH = `
  M 100,15
  C 125,15 125,55 122,65
  L 125,75
  L 145,82
  C 158,86 165,95 168,108
  L 168,140
  L 165,225
  L 162,250
  L 168,255
  L 162,260
  L 155,255
  L 145,220
  L 138,200
  L 132,225
  L 125,260
  L 122,300
  L 120,350
  L 118,420
  L 120,470
  L 124,485
  L 105,488
  L 102,440
  L 100,360
  L 98,440
  L 95,488
  L 76,485
  L 80,470
  L 82,420
  L 80,350
  L 78,300
  L 75,260
  L 68,225
  L 62,200
  L 55,220
  L 45,255
  L 38,260
  L 32,255
  L 38,250
  L 32,225
  L 32,140
  L 35,108
  C 38,95 45,86 58,82
  L 78,75
  L 81,65
  C 78,55 78,15 100,15
  Z
`
  .replace(/\s+/g, " ")
  .trim();

const BACK_BODY_PATH = FRONT_BODY_PATH; // mirrored silhouette is identical

const SELECTED_COLOR = "#0ea5e9";
const HIGHLIGHTED_COLOR = "#34d399";
const HOVER_COLOR = "#f59e0b";
const FOCUSED_COLOR = "#a78bfa";

export default function Body2D({
  view,
  selectedIds,
  highlightedIds,
  focusedId,
  regionFilter,
  onSelect,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const layouts = layoutsForView(view).filter((l) => {
    if (!regionFilter) return true;
    const region = BODY_REGIONS.find((r) => r.id === l.id);
    return region ? regionFilter(region) : false;
  });

  const colorFor = (id: string): string | undefined => {
    if (selectedIds.has(id)) return SELECTED_COLOR;
    if (focusedId === id) return FOCUSED_COLOR;
    if (hoveredId === id) return HOVER_COLOR;
    if (highlightedIds.has(id)) return HIGHLIGHTED_COLOR;
    return undefined;
  };

  const handleClick = (layout: Body2DRegionLayout) => {
    const region = BODY_REGIONS.find((r) => r.id === layout.id);
    if (region) onSelect(region);
  };

  return (
    <svg
      viewBox="0 0 200 500"
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full select-none"
      role="img"
      aria-label={view === "front" ? "Body front view" : "Body back view"}
    >
      <defs>
        <linearGradient id="skinGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4d4c0" />
          <stop offset="100%" stopColor="#e6c2ad" />
        </linearGradient>
        <filter id="bodyShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="1" dy="2" result="offsetBlur" />
          <feMerge>
            <feMergeNode in="offsetBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Body silhouette */}
      <path
        d={view === "front" ? FRONT_BODY_PATH : BACK_BODY_PATH}
        fill="url(#skinGradient)"
        stroke="#a07c63"
        strokeWidth="0.8"
        filter="url(#bodyShadow)"
      />

      {/* Centerline reference (very subtle) */}
      <line
        x1="100"
        y1="80"
        x2="100"
        y2="220"
        stroke="#c9a896"
        strokeWidth="0.3"
        strokeDasharray="2 3"
        opacity="0.4"
      />

      {/* Region hit-areas */}
      {layouts.map((layout) => {
        const color = colorFor(layout.id);
        const region = BODY_REGIONS.find((r) => r.id === layout.id);
        const isActive = !!color;
        return (
          <g
            key={`${view}-${layout.id}`}
            onClick={() => handleClick(layout)}
            onMouseEnter={() => setHoveredId(layout.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(layout.id)}
            onBlur={() => setHoveredId(null)}
            tabIndex={0}
            role="button"
            aria-label={region?.code.display}
            aria-pressed={selectedIds.has(layout.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick(layout);
              }
            }}
            className={cn(
              "cursor-pointer outline-hidden",
              "focus-visible:[&>circle]:stroke-2",
            )}
            style={{ pointerEvents: "all" }}
          >
            <circle
              cx={layout.cx}
              cy={layout.cy}
              r={layout.r}
              fill={color ?? "transparent"}
              fillOpacity={isActive ? 0.65 : 0}
              stroke={color ?? "#8b6f5e"}
              strokeOpacity={isActive ? 1 : 0.25}
              strokeWidth={isActive ? 1.2 : 0.6}
              style={{ transition: "fill-opacity 120ms, stroke-opacity 120ms" }}
            />
          </g>
        );
      })}

      {/* Hover label */}
      {hoveredId &&
        (() => {
          const layout = layouts.find((l) => l.id === hoveredId);
          const region = BODY_REGIONS.find((r) => r.id === hoveredId);
          if (!layout || !region) return null;
          const labelY = layout.cy - layout.r - 8;
          return (
            <g pointerEvents="none">
              <rect
                x={layout.cx - 40}
                y={labelY - 14}
                width={80}
                height={18}
                rx={3}
                ry={3}
                fill="rgba(0,0,0,0.85)"
              />
              <text
                x={layout.cx}
                y={labelY - 2}
                textAnchor="middle"
                fontSize="8"
                fill="#fff"
              >
                {region.code.display}
              </text>
            </g>
          );
        })()}
    </svg>
  );
}
