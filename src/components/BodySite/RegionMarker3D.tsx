import { Html } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { useState } from "react";

import { Body2DRegionLayout } from "@/components/BodySite/body2DLayout";
import { SCALE, viewBoxTo3D } from "@/components/BodySite/bodyGeometry";
import { BodyRegion } from "@/components/BodySite/bodySiteRegions";

interface Props {
  layout: Body2DRegionLayout;
  region: BodyRegion;
  selected: boolean;
  highlighted: boolean;
  focused: boolean;
  onSelect: (region: BodyRegion) => void;
}

const BASE_COLOR = "#a07c63";
const HOVER_COLOR = "#f59e0b";
const SELECTED_COLOR = "#0ea5e9";
const HIGHLIGHTED_COLOR = "#34d399";
const FOCUSED_COLOR = "#a78bfa";

export default function RegionMarker3D({
  layout,
  region,
  selected,
  highlighted,
  focused,
  onSelect,
}: Props) {
  const [hovered, setHovered] = useState(false);

  const isActive = selected || focused || hovered || highlighted;
  const color = selected
    ? SELECTED_COLOR
    : focused
      ? FOCUSED_COLOR
      : hovered
        ? HOVER_COLOR
        : highlighted
          ? HIGHLIGHTED_COLOR
          : BASE_COLOR;

  const position = viewBoxTo3D(layout.cx, layout.cy, layout.view);
  const radius = layout.r * SCALE * (hovered || focused ? 1.35 : 1);

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

  return (
    <mesh
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      userData={{ regionId: region.id }}
    >
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.1}
        emissive={isActive ? color : "#000000"}
        emissiveIntensity={selected ? 0.5 : isActive ? 0.3 : 0}
        transparent={!isActive}
        opacity={isActive ? 1 : 0.55}
      />
      {(hovered || focused) && (
        <Html center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <div className="rounded bg-black/85 px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-lg">
            <div className="font-medium">{region.code.display}</div>
            <div className="text-[9px] opacity-70">{region.code.code}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
}
