/**
 * 2D coordinates for each body region on a stylised front/back silhouette.
 *
 * Coordinate system:
 *   viewBox = "0 0 200 500"  (taller than wide, centred at x=100)
 *   y grows downward; head crown ~ y=20, feet ~ y=490.
 *
 * Each region keeps the same id as in `bodySiteRegions.ts` so selection state
 * round-trips between 2D and 3D views.
 */

export type Body2DView = "front" | "back";

export interface Body2DRegionLayout {
  id: string;
  view: Body2DView;
  /** Centre x in viewBox units */
  cx: number;
  /** Centre y in viewBox units */
  cy: number;
  /** Hit-area radius. Use slightly larger for primary regions to ease tapping */
  r: number;
}

export const BODY_2D_LAYOUT: Body2DRegionLayout[] = [
  // ── Head (front) ─────────────────────────────────────────────────────
  { id: "head-cranium", view: "front", cx: 100, cy: 40, r: 22 },
  { id: "forehead", view: "front", cx: 100, cy: 32, r: 8 },
  { id: "eye-right", view: "front", cx: 92, cy: 42, r: 5 },
  { id: "eye-left", view: "front", cx: 108, cy: 42, r: 5 },
  { id: "nose", view: "front", cx: 100, cy: 48, r: 4 },
  { id: "ear-right", view: "front", cx: 78, cy: 45, r: 5 },
  { id: "ear-left", view: "front", cx: 122, cy: 45, r: 5 },
  { id: "mouth", view: "front", cx: 100, cy: 55, r: 4 },
  { id: "mandible", view: "front", cx: 100, cy: 62, r: 7 },
  { id: "neck-anterior", view: "front", cx: 100, cy: 75, r: 9 },

  // ── Torso (front) ─────────────────────────────────────────────────────
  { id: "shoulder-right", view: "front", cx: 70, cy: 92, r: 10 },
  { id: "shoulder-left", view: "front", cx: 130, cy: 92, r: 10 },
  { id: "deltoid-right", view: "front", cx: 64, cy: 105, r: 7 },
  { id: "deltoid-left", view: "front", cx: 136, cy: 105, r: 7 },
  { id: "sternum", view: "front", cx: 100, cy: 110, r: 7 },
  { id: "chest-right", view: "front", cx: 84, cy: 115, r: 12 },
  { id: "chest-left", view: "front", cx: 116, cy: 115, r: 12 },
  { id: "epigastrium", view: "front", cx: 100, cy: 145, r: 8 },
  { id: "abdomen-ruq", view: "front", cx: 86, cy: 160, r: 10 },
  { id: "abdomen-luq", view: "front", cx: 114, cy: 160, r: 10 },
  { id: "abdomen-umbilical", view: "front", cx: 100, cy: 175, r: 6 },
  { id: "abdomen-rlq", view: "front", cx: 86, cy: 192, r: 10 },
  { id: "abdomen-llq", view: "front", cx: 114, cy: 192, r: 10 },
  { id: "abdomen-sc-right", view: "front", cx: 78, cy: 180, r: 5 },
  { id: "abdomen-sc-left", view: "front", cx: 122, cy: 180, r: 5 },
  { id: "suprapubic", view: "front", cx: 100, cy: 215, r: 7 },

  // ── Right arm (front) ────────────────────────────────────────────────
  { id: "upper-arm-right", view: "front", cx: 60, cy: 130, r: 9 },
  { id: "elbow-right", view: "front", cx: 56, cy: 165, r: 8 },
  { id: "antecubital-right", view: "front", cx: 60, cy: 162, r: 5 },
  { id: "forearm-right", view: "front", cx: 50, cy: 195, r: 8 },
  { id: "wrist-right", view: "front", cx: 44, cy: 225, r: 6 },
  { id: "hand-right", view: "front", cx: 38, cy: 250, r: 9 },

  // ── Left arm (front) ─────────────────────────────────────────────────
  { id: "upper-arm-left", view: "front", cx: 140, cy: 130, r: 9 },
  { id: "elbow-left", view: "front", cx: 144, cy: 165, r: 8 },
  { id: "antecubital-left", view: "front", cx: 140, cy: 162, r: 5 },
  { id: "forearm-left", view: "front", cx: 150, cy: 195, r: 8 },
  { id: "wrist-left", view: "front", cx: 156, cy: 225, r: 6 },
  { id: "hand-left", view: "front", cx: 162, cy: 250, r: 9 },

  // ── Pelvis & legs (front) ────────────────────────────────────────────
  { id: "ventrogluteal-right", view: "front", cx: 80, cy: 230, r: 6 },
  { id: "ventrogluteal-left", view: "front", cx: 120, cy: 230, r: 6 },
  { id: "thigh-right", view: "front", cx: 86, cy: 275, r: 12 },
  { id: "thigh-left", view: "front", cx: 114, cy: 275, r: 12 },
  { id: "vastus-lateralis-right", view: "front", cx: 76, cy: 290, r: 7 },
  { id: "vastus-lateralis-left", view: "front", cx: 124, cy: 290, r: 7 },
  { id: "knee-right", view: "front", cx: 86, cy: 335, r: 10 },
  { id: "knee-left", view: "front", cx: 114, cy: 335, r: 10 },
  { id: "lower-leg-right", view: "front", cx: 86, cy: 380, r: 10 },
  { id: "lower-leg-left", view: "front", cx: 114, cy: 380, r: 10 },
  { id: "ankle-right", view: "front", cx: 86, cy: 430, r: 7 },
  { id: "ankle-left", view: "front", cx: 114, cy: 430, r: 7 },
  { id: "foot-right", view: "front", cx: 86, cy: 460, r: 10 },
  { id: "foot-left", view: "front", cx: 114, cy: 460, r: 10 },

  // ── Head (back) ─────────────────────────────────────────────────────
  { id: "head-cranium", view: "back", cx: 100, cy: 40, r: 22 },
  { id: "occiput", view: "back", cx: 100, cy: 45, r: 12 },
  { id: "neck-posterior", view: "back", cx: 100, cy: 75, r: 9 },

  // ── Torso (back) ─────────────────────────────────────────────────────
  { id: "shoulder-right", view: "back", cx: 130, cy: 92, r: 10 },
  { id: "shoulder-left", view: "back", cx: 70, cy: 92, r: 10 },
  { id: "scapula-right", view: "back", cx: 116, cy: 115, r: 11 },
  { id: "scapula-left", view: "back", cx: 84, cy: 115, r: 11 },
  { id: "upper-back", view: "back", cx: 100, cy: 130, r: 9 },
  { id: "lower-back", view: "back", cx: 100, cy: 170, r: 11 },
  { id: "sacral", view: "back", cx: 100, cy: 210, r: 7 },
  { id: "buttock-right", view: "back", cx: 116, cy: 235, r: 13 },
  { id: "buttock-left", view: "back", cx: 84, cy: 235, r: 13 },
  { id: "dorsogluteal-right", view: "back", cx: 122, cy: 230, r: 5 },
  { id: "dorsogluteal-left", view: "back", cx: 78, cy: 230, r: 5 },

  // ── Arms (back) - mirrored ──────────────────────────────────────────
  { id: "upper-arm-right", view: "back", cx: 140, cy: 130, r: 9 },
  { id: "upper-arm-left", view: "back", cx: 60, cy: 130, r: 9 },
  { id: "elbow-right", view: "back", cx: 144, cy: 165, r: 8 },
  { id: "elbow-left", view: "back", cx: 56, cy: 165, r: 8 },
  { id: "forearm-right", view: "back", cx: 150, cy: 195, r: 8 },
  { id: "forearm-left", view: "back", cx: 50, cy: 195, r: 8 },
  { id: "wrist-right", view: "back", cx: 156, cy: 225, r: 6 },
  { id: "wrist-left", view: "back", cx: 44, cy: 225, r: 6 },
  { id: "hand-right", view: "back", cx: 162, cy: 250, r: 9 },
  { id: "hand-left", view: "back", cx: 38, cy: 250, r: 9 },

  // ── Legs (back) - mirrored ──────────────────────────────────────────
  { id: "thigh-right", view: "back", cx: 114, cy: 275, r: 12 },
  { id: "thigh-left", view: "back", cx: 86, cy: 275, r: 12 },
  { id: "knee-right", view: "back", cx: 114, cy: 335, r: 10 },
  { id: "knee-left", view: "back", cx: 86, cy: 335, r: 10 },
  { id: "lower-leg-right", view: "back", cx: 114, cy: 380, r: 10 },
  { id: "lower-leg-left", view: "back", cx: 86, cy: 380, r: 10 },
  { id: "ankle-right", view: "back", cx: 114, cy: 430, r: 7 },
  { id: "ankle-left", view: "back", cx: 86, cy: 430, r: 7 },
  { id: "foot-right", view: "back", cx: 114, cy: 460, r: 10 },
  { id: "foot-left", view: "back", cx: 86, cy: 460, r: 10 },
];

export function layoutsForView(view: Body2DView): Body2DRegionLayout[] {
  return BODY_2D_LAYOUT.filter((l) => l.view === view);
}
