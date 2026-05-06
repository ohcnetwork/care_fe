/**
 * Anatomical body silhouette path, hand-tuned for a 200×500 viewBox.
 *
 * Single closed path traced clockwise from the top of the head, used by both
 * the 2D body chart and the 3D extruded mesh so the two views stay visually
 * consistent. Anatomical landmarks (clavicle, spine, etc.) are layered as
 * separate decorative paths inside the SVG so they don't affect hit-areas
 * or extrusion topology.
 */

export const VIEWBOX_W = 200;
export const VIEWBOX_H = 500;

// Clockwise from top of head: head → right side → right arm/hand →
// right armpit → right torso → right hip → right thigh/leg/foot →
// crotch → left foot/leg/thigh → left hip → left torso → left armpit →
// left arm/hand → left shoulder → left side of head → close.
//
// Bezier control points were tuned empirically to give smooth shoulder
// slopes, a slight waist, hip flare, and tapered limbs without producing
// the "Lego-figure" segmented look of stacked primitives.
export const BODY_SILHOUETTE_PATH = `
  M 100,15
  C 122,15 130,32 130,46
  C 130,58 126,68 122,75
  L 120,82
  C 134,84 148,88 156,96
  C 161,103 163,112 164,124
  C 166,150 167,176 168,200
  C 169,218 170,232 169,242
  C 173,246 174,256 168,262
  C 162,266 156,265 154,260
  C 152,252 152,244 152,236
  L 152,160
  C 152,140 150,124 148,115
  L 144,108
  C 142,135 140,160 138,182
  C 136,200 136,216 138,234
  C 142,238 144,238 146,240
  C 144,260 138,290 132,322
  C 130,335 128,346 126,355
  C 122,385 119,418 116,448
  L 114,462
  L 122,478
  L 105,478
  L 103,440
  L 102,360
  L 102,250
  L 100,244
  L 98,250
  L 98,360
  L 97,440
  L 95,478
  L 78,478
  L 86,462
  L 84,448
  C 81,418 78,385 74,355
  C 72,346 70,335 68,322
  C 62,290 56,260 54,240
  C 56,238 58,238 62,234
  C 64,216 64,200 62,182
  C 60,160 58,135 56,108
  L 52,115
  C 50,124 48,140 48,160
  L 48,236
  C 48,244 48,252 46,260
  C 44,265 38,266 32,262
  C 26,256 27,246 31,242
  C 30,232 31,218 32,200
  C 33,176 34,150 36,124
  C 37,112 39,103 44,96
  C 52,88 66,84 80,82
  L 78,75
  C 74,68 70,58 70,46
  C 70,32 78,15 100,15
  Z
`
  .replace(/\s+/g, " ")
  .trim();

/** Decorative anatomical landmark overlays for the front view. */
export const FRONT_LANDMARKS: Array<{ d: string; opacity?: number }> = [
  // Clavicle line
  { d: "M 80,90 Q 100,86 120,90", opacity: 0.4 },
  // Sternum / midline
  { d: "M 100,95 L 100,182", opacity: 0.25 },
  // Linea alba below navel
  { d: "M 100,184 L 100,228", opacity: 0.2 },
  // Iliac crest line
  { d: "M 80,225 Q 100,222 120,225", opacity: 0.25 },
  // Inguinal creases
  { d: "M 90,236 Q 100,250 110,236", opacity: 0.25 },
  // Subtle pectoral grooves
  { d: "M 88,118 Q 88,140 92,150", opacity: 0.18 },
  { d: "M 112,118 Q 112,140 108,150", opacity: 0.18 },
];

/** Decorative anatomical landmark overlays for the back view. */
export const BACK_LANDMARKS: Array<{ d: string; opacity?: number }> = [
  // Spine groove
  { d: "M 100,80 L 100,234", opacity: 0.4 },
  // Trapezius hint
  { d: "M 78,90 Q 100,80 122,90", opacity: 0.3 },
  // Scapula outlines
  { d: "M 78,105 Q 88,110 90,135", opacity: 0.22 },
  { d: "M 122,105 Q 112,110 110,135", opacity: 0.22 },
  // Iliac crest line
  { d: "M 78,225 Q 100,222 122,225", opacity: 0.3 },
  // Gluteal cleft
  { d: "M 100,238 L 100,288", opacity: 0.4 },
];
