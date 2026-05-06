import { ContactShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { BODY_2D_LAYOUT } from "@/components/BodySite/body2DLayout";
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

export default function BodyScene({
  selectedId,
  highlightedIds,
  focusedId,
  view,
  regionFilter,
  onSelect,
}: Props) {
  return (
    <Canvas shadows camera={{ position: [0, 0.3, 8.5], fov: 35 }} dpr={[1, 2]}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.55} />
        <hemisphereLight args={["#ffffff", "#665544", 0.4]} />
        <directionalLight
          position={[5, 8, 6]}
          intensity={1.0}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.1}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <directionalLight position={[-6, 5, -4]} intensity={0.35} />
        <pointLight position={[0, 2, 6]} intensity={0.25} />

        <BodySilhouette3D />

        {BODY_2D_LAYOUT.map((layout) => {
          const region = BODY_REGIONS.find((r) => r.id === layout.id);
          if (!region) return null;
          if (regionFilter && !regionFilter(region)) return null;
          return (
            <RegionMarker3D
              key={`${layout.view}-${layout.id}`}
              layout={layout}
              region={region}
              selected={selectedId === region.id}
              highlighted={highlightedIds.has(region.id)}
              focused={focusedId === region.id}
              onSelect={onSelect}
            />
          );
        })}

        {/* Soft contact shadow under the figure */}
        <ContactShadows
          position={[0, -3.1, 0]}
          opacity={0.4}
          scale={6}
          blur={2.5}
          far={3}
        />

        <CameraRig view={view} />
      </Suspense>
    </Canvas>
  );
}
