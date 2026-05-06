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

// Clockwise from top of head, traced anatomically:
// head → right neck/shoulder → right arm → right hand → inner arm → armpit
// → right torso → right hip → outer right thigh → outer calf → right foot
// → inner right calf → inner thigh → crotch → inner left thigh →
// left foot → outer left calf → outer left thigh → left hip → left torso
// → left armpit → inner left arm → left hand → outer left arm → left
// shoulder/neck → left head → close.
//
// Each region of the path is a smooth bezier rather than a polyline so
// the extruded 3D mesh has rounded edges. Feet are explicit small
// rounded shapes below the ankles, not a long horizontal "puddle".
export const BODY_SILHOUETTE_PATH = `
  M 100,18
  C 122,18 130,32 130,46
  C 130,60 124,72 120,78
  L 117,84
  L 116,90
  C 130,92 144,98 152,108
  C 158,140 162,180 162,220
  L 164,242
  C 168,248 170,260 164,266
  C 158,272 154,272 152,266
  C 152,254 154,246 154,240
  L 152,220
  C 152,180 150,140 144,108
  L 144,114
  C 142,140 138,170 137,200
  C 138,220 142,232 145,242
  C 144,275 140,310 132,348
  L 130,358
  C 128,395 124,425 119,452
  L 117,460
  C 113,470 116,478 124,478
  L 132,478
  C 138,478 138,470 134,466
  L 124,458
  L 122,452
  C 118,425 114,395 110,358
  L 108,348
  C 105,310 102,275 102,250
  L 100,244
  L 98,250
  C 98,275 95,310 92,348
  L 90,358
  C 86,395 82,425 78,452
  L 76,458
  L 66,466
  C 62,470 62,478 68,478
  L 76,478
  C 84,478 87,470 83,460
  L 81,452
  C 76,425 72,395 70,358
  L 68,348
  C 60,310 56,275 55,242
  C 58,232 62,220 63,200
  C 62,170 58,140 56,114
  L 56,108
  C 50,140 48,180 48,220
  L 46,240
  C 46,246 46,254 48,266
  C 46,272 42,272 36,266
  C 30,260 32,248 36,242
  L 38,220
  C 38,180 42,140 48,108
  C 56,98 70,92 84,90
  L 83,84
  L 80,78
  C 76,72 70,60 70,46
  C 70,32 78,18 100,18
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
