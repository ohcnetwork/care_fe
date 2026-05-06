import { ContactShadows, Environment } from "@react-three/drei";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { Suspense, useMemo, useState } from "react";

import {
  BODY_2D_LAYOUT,
  Body2DRegionLayout,
} from "@/components/BodySite/body2DLayout";
import { pointToViewBox } from "@/components/BodySite/bodyGeometry";
import BodySilhouette3D from "@/components/BodySite/BodySilhouette3D";
import {
  BODY_REGIONS,
  BodyRegion,
} from "@/components/BodySite/bodySiteRegions";
import CameraRig from "@/components/BodySite/CameraRig";
import RegionMarker3D from "@/components/BodySite/RegionMarker3D";
import { CameraView } from "@/components/BodySite/views";

interface Props {
  selectedId?: string;
  highlightedIds: Set<string>;
  focusedId?: string;
  view: CameraView;
  regionFilter?: (region: BodyRegion) => boolean;
  onSelect: (region: BodyRegion) => void;
}

/** Find the region whose 2D layout point is closest to the hit. Restricted to
 *  the side of the body that was hit (front/back). Returns undefined if no
 *  region is within a reasonable click distance. */
function findNearestLayout(
  cx: number,
  cy: number,
  view: "front" | "back",
  filter?: (r: BodyRegion) => boolean,
): Body2DRegionLayout | undefined {
  let best: Body2DRegionLayout | undefined;
  let bestDist = Infinity;
  // Bias so "any-view" regions also count; treat as the same side as the hit
  for (const layout of BODY_2D_LAYOUT) {
    if (layout.view !== view) continue;
    const region = BODY_REGIONS.find((r) => r.id === layout.id);
    if (!region) continue;
    if (filter && !filter(region)) continue;
    const dx = layout.cx - cx;
    const dy = layout.cy - cy;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = layout;
    }
  }
  // Only return a hit if the user is reasonably close — prevents random
  // clicks far from any region from being "snapped" to a distant one.
  if (best && bestDist < 30 * 30) return best;
  return undefined;
}

export default function BodyScene({
  selectedId,
  highlightedIds,
  focusedId,
  view,
  regionFilter,
  onSelect,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | undefined>();

  const handleBodyMove = (event: ThreeEvent<PointerEvent>) => {
    if (!event.point) return;
    const { cx, cy, view: face } = pointToViewBox(event.point);
    const layout = findNearestLayout(cx, cy, face, regionFilter);
    if (layout && layout.id !== hoveredId) setHoveredId(layout.id);
    if (!layout && hoveredId) setHoveredId(undefined);
    document.body.style.cursor = layout ? "pointer" : "default";
  };

  const handleBodyOut = () => {
    setHoveredId(undefined);
    document.body.style.cursor = "default";
  };

  const handleBodyClick = (event: ThreeEvent<MouseEvent>) => {
    if (!event.point) return;
    event.stopPropagation();
    const { cx, cy, view: face } = pointToViewBox(event.point);
    const layout = findNearestLayout(cx, cy, face, regionFilter);
    if (!layout) return;
    const region = BODY_REGIONS.find((r) => r.id === layout.id);
    if (region) onSelect(region);
  };

  // Active markers: at most a handful are visible at any time —
  // selected + hovered + focused + search-highlighted matches.
  const activeMarkers = useMemo(() => {
    const markers: Array<{
      layout: Body2DRegionLayout;
      region: BodyRegion;
      state: "selected" | "highlighted" | "focused" | "hovered";
    }> = [];
    for (const layout of BODY_2D_LAYOUT) {
      const region = BODY_REGIONS.find((r) => r.id === layout.id);
      if (!region) continue;
      if (regionFilter && !regionFilter(region)) continue;

      // Priority: selected > focused > hovered > highlighted
      let state: "selected" | "highlighted" | "focused" | "hovered" | undefined;
      if (selectedId === layout.id) state = "selected";
      else if (focusedId === layout.id) state = "focused";
      else if (hoveredId === layout.id) state = "hovered";
      else if (highlightedIds.has(layout.id)) state = "highlighted";
      if (state) markers.push({ layout, region, state });
    }
    return markers;
  }, [selectedId, focusedId, hoveredId, highlightedIds, regionFilter]);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.3, 8.5], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#f3f4f6"]} />
      <Suspense fallback={null}>
        {/* Three-point lighting: warm key, cool fill, soft hemisphere */}
        <ambientLight intensity={0.4} />
        <hemisphereLight args={["#fff5ec", "#3d3144", 0.45]} />
        <directionalLight
          position={[4, 6, 5]}
          intensity={1.1}
          color="#fff8ee"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.1}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <directionalLight
          position={[-4, 3, -3]}
          intensity={0.4}
          color="#cfdcff"
        />
        <pointLight position={[0, 1, 4]} intensity={0.2} color="#ffffff" />

        <BodySilhouette3D
          onPointerMove={handleBodyMove}
          onPointerOut={handleBodyOut}
          onClick={handleBodyClick}
        />

        {activeMarkers.map(({ layout, region, state }) => (
          <RegionMarker3D
            key={`${layout.view}-${layout.id}`}
            layout={layout}
            region={region}
            state={state}
          />
        ))}

        {/* Soft contact shadow under the figure */}
        <ContactShadows
          position={[0, -3.15, 0]}
          opacity={0.45}
          scale={6}
          blur={2.8}
          far={3}
        />

        <Environment preset="studio" environmentIntensity={0.4} />

        <CameraRig view={view} />
      </Suspense>
    </Canvas>
  );
}
