import * as THREE from "three";

import { VIEWBOX_H, VIEWBOX_W } from "@/components/BodySite/bodySilhouette";

/**
 * Build a single seamless 3D body mesh by extruding the SVG silhouette path.
 * This is the trick that lets us produce a non-Lego-looking 3D body without
 * shipping any external 3D assets — the same artwork drives both the 2D
 * chart and the 3D model.
 */

const TARGET_HEIGHT = 6.0; // 3D world units (head at +3, feet at -3)
export const BODY_DEPTH = 0.7; // 3D world units thickness
export const SCALE = TARGET_HEIGHT / VIEWBOX_H; // viewBox → 3D units

export function buildBodyGeometry(pathD: string): THREE.ExtrudeGeometry {
  const shape = pathToShape(pathD);
  const depthInViewBox = BODY_DEPTH / SCALE;

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depthInViewBox,
    bevelEnabled: true,
    bevelSize: 8,
    bevelThickness: 8,
    bevelSegments: 6,
    curveSegments: 32,
  });

  // Centre the geometry around origin, then flip y so head is at +y
  // (SVG y points down — large y values are the feet) and apply final scale.
  geometry.center();
  geometry.scale(SCALE, -SCALE, SCALE);
  return geometry;
}

/**
 * Convert a 2D viewBox coordinate (used by both the 2D chart and the marker
 * layout) into a 3D world position on the front or back surface of the
 * extruded body, slightly poking out so the marker isn't z-fighting.
 */
export function viewBoxTo3D(
  cx: number,
  cy: number,
  view: "front" | "back",
): [number, number, number] {
  const x = (cx - VIEWBOX_W / 2) * SCALE;
  const y = (cy - VIEWBOX_H / 2) * -SCALE; // flip y to match the geometry
  const halfDepth = BODY_DEPTH / 2 + 0.04; // slight protrusion above the bevel
  const z = view === "front" ? halfDepth : -halfDepth;
  return [x, y, z];
}

/**
 * Inverse of viewBoxTo3D: given a 3D world point on the body surface
 * (e.g. from a raycaster hit), return the corresponding 2D viewBox
 * coordinates and which face was hit.
 */
export function pointToViewBox(point: { x: number; y: number; z: number }): {
  cx: number;
  cy: number;
  view: "front" | "back";
} {
  const cx = point.x / SCALE + VIEWBOX_W / 2;
  const cy = -point.y / SCALE + VIEWBOX_H / 2;
  const view = point.z >= 0 ? "front" : "back";
  return { cx, cy, view };
}

function pathToShape(d: string): THREE.Shape {
  const shape = new THREE.Shape();
  // Tokenise path commands. Supports M, L, C, Z (sufficient for our path).
  const re = /([MLCZ])([^MLCZ]*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(d)) !== null) {
    const cmd = match[1];
    const args = match[2]
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    switch (cmd) {
      case "M":
        shape.moveTo(args[0], args[1]);
        break;
      case "L":
        shape.lineTo(args[0], args[1]);
        break;
      case "C":
        shape.bezierCurveTo(
          args[0],
          args[1],
          args[2],
          args[3],
          args[4],
          args[5],
        );
        break;
      // Z is implicit when extruded; THREE.Shape treats it as a closed shape
    }
  }
  return shape;
}
