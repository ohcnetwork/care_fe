import { BodyView } from "@/components/BodySite/bodySiteRegions";

export type CameraView = "front" | "back" | "left" | "right";

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: Record<CameraView, CameraPreset> = {
  front: { position: [0, 1.2, 8.5], target: [0, 0.8, 0] },
  back: { position: [0, 1.2, -8.5], target: [0, 0.8, 0] },
  left: { position: [8.5, 1.2, 0], target: [0, 0.8, 0] },
  right: { position: [-8.5, 1.2, 0], target: [0, 0.8, 0] },
};

export function viewMatchesRegion(
  view: CameraView,
  regionView: BodyView,
): boolean {
  if (regionView === "any") return true;
  if (view === "front") return regionView === "front";
  if (view === "back") return regionView === "back";
  return true;
}
