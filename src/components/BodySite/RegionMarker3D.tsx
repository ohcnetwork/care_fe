import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { Body2DRegionLayout } from "@/components/BodySite/body2DLayout";
import { SCALE, viewBoxTo3D } from "@/components/BodySite/bodyGeometry";
import { BodyRegion } from "@/components/BodySite/bodySiteRegions";

interface Props {
  layout: Body2DRegionLayout;
  region: BodyRegion;
  state: "selected" | "highlighted" | "focused" | "hovered";
}

const COLORS = {
  selected: "#0ea5e9",
  hovered: "#f59e0b",
  highlighted: "#34d399",
  focused: "#a78bfa",
} as const;

/**
 * Visual-only marker for a body region. Rendered ONLY when the region is in
 * an active state (selected / hovered / focused / search-highlighted). When
 * inactive, no marker is drawn at all — the body surface stays clean.
 *
 * Hit-testing is handled by raycasting the body mesh itself in BodyScene
 * and finding the nearest layout point, so we don't need invisible
 * collision spheres scattered all over the body.
 */
export default function RegionMarker3D({ layout, region, state }: Props) {
  const ringRef = useRef<THREE.Mesh>(null);
  const dotRef = useRef<THREE.Mesh>(null);

  // Subtle pulse animation for selected and highlighted markers
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const pulse =
      state === "selected" || state === "highlighted"
        ? 1 + Math.sin(clock.elapsedTime * 3) * 0.12
        : 1;
    ringRef.current.scale.setScalar(pulse);
  });

  const color = COLORS[state];
  const position = viewBoxTo3D(layout.cx, layout.cy, layout.view);
  const baseRadius = layout.r * SCALE;

  // Markers face the camera plane perpendicular to the body surface.
  // For front markers, normal is +z; for back, -z. Discs lie flat on the
  // surface (rotated to face the same way).
  const facing: [number, number, number] =
    layout.view === "back" ? [0, Math.PI, 0] : [0, 0, 0];

  return (
    <group position={position} rotation={facing}>
      {/* Outer pulsing ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[baseRadius * 1.1, baseRadius * 1.5, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Solid dot */}
      <mesh ref={dotRef} position={[0, 0, 0.005]}>
        <circleGeometry args={[baseRadius * 0.9, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>
      {/* Label for hovered & focused (and selected for clarity) */}
      {(state === "hovered" || state === "focused" || state === "selected") && (
        <Html
          position={[0, baseRadius * 1.6, 0.01]}
          center
          distanceFactor={6}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded bg-black/85 px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-lg">
            <div className="font-medium">{region.code.display}</div>
            <div className="text-[9px] opacity-70">{region.code.code}</div>
          </div>
        </Html>
      )}
    </group>
  );
}
