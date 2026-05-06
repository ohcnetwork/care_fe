import { useMemo } from "react";
import * as THREE from "three";

import { buildBodyGeometry } from "@/components/BodySite/bodyGeometry";
import { BODY_SILHOUETTE_PATH } from "@/components/BodySite/bodySilhouette";

/**
 * Single seamless 3D body mesh, extruded from the same SVG silhouette path
 * the 2D chart uses. No external assets, no Lego seams.
 */
export default function BodySilhouette3D() {
  const geometry = useMemo(() => buildBodyGeometry(BODY_SILHOUETTE_PATH), []);

  // Skin gradient using vertex colours so the body has subtle shading
  // without requiring a texture asset.
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#e6c2ad",
      roughness: 0.65,
      metalness: 0.05,
    });
    return mat;
  }, []);

  return (
    <mesh geometry={geometry} material={material} castShadow receiveShadow />
  );
}
