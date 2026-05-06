import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { BodyMesh } from "@/components/BodySite/BodyMesh";
import {
  BODY_REGIONS,
  BodyRegion,
} from "@/components/BodySite/bodySiteRegions";
import CameraRig from "@/components/BodySite/CameraRig";
import { CameraView, viewMatchesRegion } from "@/components/BodySite/views";

interface Props {
  selectedId?: string;
  highlightedIds: Set<string>;
  focusedId?: string;
  view: CameraView;
  onSelect: (region: BodyRegion) => void;
}

export default function BodyScene({
  selectedId,
  highlightedIds,
  focusedId,
  view,
  onSelect,
}: Props) {
  return (
    <Canvas shadows camera={{ position: [0, 1.2, 8.5], fov: 35 }} dpr={[1, 2]}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[5, 10, 6]}
          intensity={1.0}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-6, 6, -4]} intensity={0.35} />
        <hemisphereLight args={["#ffffff", "#3a3a3a", 0.3]} />
        <group>
          {BODY_REGIONS.map((region) => {
            const visible = viewMatchesRegion(view, region.view);
            return (
              <BodyMesh
                key={region.id}
                region={region}
                selected={selectedId === region.id}
                highlighted={visible && highlightedIds.has(region.id)}
                focused={focusedId === region.id}
                onSelect={onSelect}
              />
            );
          })}
        </group>
        <CameraRig view={view} />
      </Suspense>
    </Canvas>
  );
}
