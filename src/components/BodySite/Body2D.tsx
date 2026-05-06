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
  /** Called when an existing annotation is clicked. Receives the annotation
   *  and its container-relative pixel coords for anchoring an editor popover. */
  onAnnotationClick?: (
    annotation: BodyAnnotation,
    anchor: { x: number; y: number },
  ) => void;
}

// Body silhouette and landmarks live in a shared module so the 2D chart and
// the extruded 3D body use the exact same artwork.
import {
  BACK_LANDMARKS,
  BODY_SILHOUETTE_PATH,
  FRONT_LANDMARKS,
} from "@/components/BodySite/bodySilhouette";

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
  onAnnotationClick,
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
    if (!onAnnotationClick || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    onAnnotationClick(anno, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
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
          <stop offset="0%" stopColor="#fadcc6" />
          <stop offset="50%" stopColor="#f0c9ad" />
          <stop offset="100%" stopColor="#e3b495" />
        </linearGradient>
        <filter id="bodyShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
          <feOffset dx="0.8" dy="1.5" result="offsetBlur" />
          <feMerge>
            <feMergeNode in="offsetBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Body silhouette */}
      <path
        d={BODY_SILHOUETTE_PATH}
        fill="url(#skinGradient)"
        stroke="#a07c63"
        strokeWidth="0.8"
        filter="url(#bodyShadow)"
        onClick={handleSilhouetteClick}
        style={{ cursor: placeMode ? "crosshair" : "default" }}
      />

      {/* Anatomical landmarks (decorative reference lines) */}
      {(view === "front" ? FRONT_LANDMARKS : BACK_LANDMARKS).map((lm, i) => (
        <path
          key={i}
          d={lm.d}
          fill="none"
          stroke="#a07c63"
          strokeWidth="0.5"
          strokeLinecap="round"
          opacity={lm.opacity ?? 0.3}
          pointerEvents="none"
        />
      ))}
      {/* Soft ground shadow */}
      <ellipse
        cx="100"
        cy="490"
        rx="40"
        ry="3"
        fill="rgba(0,0,0,0.08)"
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
