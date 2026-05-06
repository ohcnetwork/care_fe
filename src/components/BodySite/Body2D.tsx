import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
  Body2DRegionLayout,
  Body2DView,
  layoutsForView,
} from "@/components/BodySite/body2DLayout";
import {
  AnnotationType,
  BodyAnnotation,
  annotationColor,
  makeAnnotationId,
} from "@/components/BodySite/bodyAnnotation";
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
  /** Annotation mode — if set, clicks place an annotation of this type
   *  instead of selecting a region. */
  annotationTool?: AnnotationType | null;
  annotations?: BodyAnnotation[];
  onAnnotationsChange?: (annotations: BodyAnnotation[]) => void;
  onAnnotationFocus?: (annotation: BodyAnnotation) => void;
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

const BACK_BODY_PATH = FRONT_BODY_PATH;

const SELECTED_COLOR = "#0ea5e9";
const HIGHLIGHTED_COLOR = "#34d399";
const HOVER_COLOR = "#f59e0b";
const FOCUSED_COLOR = "#a78bfa";

function nearestRegion(
  layouts: Body2DRegionLayout[],
  cx: number,
  cy: number,
): Body2DRegionLayout | undefined {
  let best: Body2DRegionLayout | undefined;
  let bestDist = Infinity;
  for (const l of layouts) {
    const dx = l.cx - cx;
    const dy = l.cy - cy;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = l;
    }
  }
  return best;
}

export default function Body2D({
  view,
  selectedIds,
  highlightedIds,
  focusedId,
  regionFilter,
  onSelect,
  annotationTool,
  annotations = [],
  onAnnotationsChange,
  onAnnotationFocus,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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

  const handleRegionClick = (layout: Body2DRegionLayout) => {
    const region = BODY_REGIONS.find((r) => r.id === layout.id);
    if (region) onSelect(region);
  };

  const handleSilhouetteClick = (event: React.MouseEvent<SVGElement>) => {
    if (!annotationTool || !onAnnotationsChange || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());

    const nearest = nearestRegion(layouts, local.x, local.y);
    const region = nearest
      ? BODY_REGIONS.find((r) => r.id === nearest.id)
      : undefined;

    const anno: BodyAnnotation = {
      id: makeAnnotationId(),
      view,
      cx: local.x,
      cy: local.y,
      type: annotationTool,
      associatedRegion: region
        ? { id: region.id, code: region.code }
        : undefined,
      createdAt: new Date().toISOString(),
    };
    onAnnotationsChange([...annotations, anno]);
  };

  const handleAnnotationClick = (
    event: React.MouseEvent,
    anno: BodyAnnotation,
  ) => {
    event.stopPropagation();
    if (onAnnotationFocus) onAnnotationFocus(anno);
  };

  const annotationsForView = annotations.filter((a) => a.view === view);
  const placeMode = !!annotationTool;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 500"
      preserveAspectRatio="xMidYMid meet"
      className={cn(
        "block h-full w-full select-none",
        placeMode && "cursor-crosshair",
      )}
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
        onClick={handleSilhouetteClick}
        style={{ cursor: placeMode ? "crosshair" : "default" }}
      />

      <line
        x1="100"
        y1="80"
        x2="100"
        y2="220"
        stroke="#c9a896"
        strokeWidth="0.3"
        strokeDasharray="2 3"
        opacity="0.4"
        pointerEvents="none"
      />

      {/* Region hit-areas (disabled in annotation mode) */}
      {!placeMode &&
        layouts.map((layout) => {
          const color = colorFor(layout.id);
          const region = BODY_REGIONS.find((r) => r.id === layout.id);
          const isActive = !!color;
          return (
            <g
              key={`${view}-${layout.id}`}
              onClick={() => handleRegionClick(layout)}
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
                  handleRegionClick(layout);
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
                style={{
                  transition: "fill-opacity 120ms, stroke-opacity 120ms",
                }}
              />
            </g>
          );
        })}

      {/* Annotations */}
      {annotationsForView.map((anno) => {
        const color = annotationColor(anno.type);
        const r = anno.severity ? 3 + anno.severity * 0.6 : 4;
        return (
          <g
            key={anno.id}
            onClick={(e) => handleAnnotationClick(e, anno)}
            className="cursor-pointer"
            tabIndex={0}
            role="button"
            aria-label={`${anno.type}${anno.label ? ` — ${anno.label}` : ""}`}
          >
            <circle
              cx={anno.cx}
              cy={anno.cy}
              r={r + 2}
              fill={color}
              fillOpacity="0.25"
            />
            <circle
              cx={anno.cx}
              cy={anno.cy}
              r={r}
              fill={color}
              stroke="#fff"
              strokeWidth="1"
            />
            {anno.label && (
              <text
                x={anno.cx + r + 2}
                y={anno.cy + 2}
                fontSize="6"
                fill="#1f2937"
                style={{ pointerEvents: "none" }}
              >
                {anno.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Hover label for region */}
      {!placeMode &&
        hoveredId &&
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
