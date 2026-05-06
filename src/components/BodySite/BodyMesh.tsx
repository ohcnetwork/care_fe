import { Html } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { forwardRef, useState } from "react";
import * as THREE from "three";

import { BodyRegion } from "@/components/BodySite/bodySiteRegions";

interface BodyMeshProps {
  region: BodyRegion;
  selected: boolean;
  highlighted: boolean;
  focused: boolean;
  onSelect: (region: BodyRegion) => void;
}

const BASE_COLOR = "#e6c2ad";
const HOVER_COLOR = "#f59e0b";
const SELECTED_COLOR = "#0ea5e9";
const HIGHLIGHTED_COLOR = "#34d399";
const FOCUSED_COLOR = "#a78bfa";

export const BodyMesh = forwardRef<THREE.Mesh, BodyMeshProps>(function BodyMesh(
  { region, selected, highlighted, focused, onSelect },
  ref,
) {
  const [hovered, setHovered] = useState(false);

  const color = selected
    ? SELECTED_COLOR
    : focused
      ? FOCUSED_COLOR
      : hovered
        ? HOVER_COLOR
        : highlighted
          ? HIGHLIGHTED_COLOR
          : BASE_COLOR;

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(region);
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = "";
  };

  const rotation = new THREE.Euler(
    region.rotation?.[0] ?? 0,
    region.rotation?.[1] ?? 0,
    region.rotation?.[2] ?? 0,
  );

  const geometry = (() => {
    switch (region.shape.kind) {
      case "sphere":
        return (
          <sphereGeometry
            args={[region.shape.radius, region.shape.widthSegments ?? 32, 32]}
          />
        );
      case "box":
        return <boxGeometry args={region.shape.size} />;
      case "cylinder":
        return (
          <cylinderGeometry
            args={[
              region.shape.radiusTop,
              region.shape.radiusBottom,
              region.shape.height,
              32,
            ]}
          />
        );
      case "capsule":
        return (
          <capsuleGeometry
            args={[region.shape.radius, region.shape.length, 8, 16]}
          />
        );
    }
  })();

  const showLabel = hovered || focused;

  return (
    <mesh
      ref={ref}
      position={region.position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      castShadow
      receiveShadow
      userData={{ regionId: region.id }}
    >
      {geometry}
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        metalness={0.05}
        emissive={selected || highlighted || focused ? color : "#000000"}
        emissiveIntensity={selected ? 0.35 : highlighted || focused ? 0.2 : 0}
        transparent={highlighted && !selected}
        opacity={highlighted && !selected ? 0.95 : 1}
      />
      {showLabel && (
        <Html
          position={[0, 0, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded bg-black/80 px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-lg">
            <div className="font-medium">{region.code.display}</div>
            <div className="text-[9px] opacity-70">{region.code.code}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
});
