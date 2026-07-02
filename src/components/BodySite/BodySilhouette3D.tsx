import { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import { buildBodyGeometry } from "@/components/BodySite/bodyGeometry";
import { BODY_SILHOUETTE_PATH } from "@/components/BodySite/bodySilhouette";

interface Props {
  onPointerMove?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

/**
 * Single seamless 3D body mesh, extruded from the same SVG silhouette path
 * the 2D chart uses. No external assets, no Lego seams.
 *
 * The body is the only clickable thing in the scene — pointer events
 * bubble up to the parent which raycasts the hit point against the 2D
 * region layout to find the nearest region. This keeps the body surface
 * uncluttered (no permanent marker spheres).
 */
export default function BodySilhouette3D({
  onPointerMove,
  onPointerOut,
  onClick,
}: Props) {
  const geometry = useMemo(() => buildBodyGeometry(BODY_SILHOUETTE_PATH), []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f0c9ad", // warmer, lighter skin tone
        roughness: 0.55,
        metalness: 0.04,
        envMapIntensity: 0.4,
      }),
    [],
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
      onClick={onClick}
    />
  );
}
