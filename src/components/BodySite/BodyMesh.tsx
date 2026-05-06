import { ThreeEvent } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";

import { BodyRegion } from "@/components/BodySite/bodySiteRegions";

interface BodyMeshProps {
  region: BodyRegion;
  selected: boolean;
  onSelect: (region: BodyRegion) => void;
}

const BASE_COLOR = "#d8b4a0";
const HOVER_COLOR = "#f59e0b";
const SELECTED_COLOR = "#0ea5e9";

export function BodyMesh({ region, selected, onSelect }: BodyMeshProps) {
  const [hovered, setHovered] = useState(false);

  const color = selected ? SELECTED_COLOR : hovered ? HOVER_COLOR : BASE_COLOR;

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
        return <sphereGeometry args={[region.shape.radius, 32, 32]} />;
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

  return (
    <mesh
      position={region.position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      castShadow
      receiveShadow
    >
      {geometry}
      <meshStandardMaterial
        color={color}
        roughness={0.6}
        metalness={0.05}
        emissive={selected ? SELECTED_COLOR : "#000000"}
        emissiveIntensity={selected ? 0.3 : 0}
      />
    </mesh>
  );
}
