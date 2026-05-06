import { Code } from "@/types/base/code/code";

const SNOMED_SYSTEM = "http://snomed.info/sct";

export type BodyShape =
  | { kind: "sphere"; radius: number }
  | { kind: "box"; size: [number, number, number] }
  | {
      kind: "cylinder";
      radiusTop: number;
      radiusBottom: number;
      height: number;
    }
  | { kind: "capsule"; radius: number; length: number };

export interface BodyRegion {
  id: string;
  code: Code;
  shape: BodyShape;
  position: [number, number, number];
  rotation?: [number, number, number];
  side?: "left" | "right" | "center";
}

const snomed = (code: string, display: string): Code => ({
  system: SNOMED_SYSTEM,
  code,
  display,
});

export const BODY_REGIONS: BodyRegion[] = [
  {
    id: "head",
    code: snomed("69536005", "Head"),
    shape: { kind: "sphere", radius: 0.45 },
    position: [0, 3.45, 0],
    side: "center",
  },
  {
    id: "neck",
    code: snomed("45048000", "Neck"),
    shape: {
      kind: "cylinder",
      radiusTop: 0.18,
      radiusBottom: 0.2,
      height: 0.3,
    },
    position: [0, 2.85, 0],
    side: "center",
  },
  {
    id: "chest",
    code: snomed("51185008", "Thoracic structure"),
    shape: { kind: "box", size: [1.4, 1.0, 0.6] },
    position: [0, 2.2, 0],
    side: "center",
  },
  {
    id: "abdomen",
    code: snomed("113345001", "Abdominal structure"),
    shape: { kind: "box", size: [1.2, 0.7, 0.55] },
    position: [0, 1.35, 0],
    side: "center",
  },
  {
    id: "pelvis",
    code: snomed("12921003", "Pelvis"),
    shape: { kind: "box", size: [1.25, 0.55, 0.6] },
    position: [0, 0.75, 0],
    side: "center",
  },
  {
    id: "shoulder-right",
    code: snomed("16982005", "Shoulder region of right upper limb"),
    shape: { kind: "sphere", radius: 0.27 },
    position: [-0.85, 2.55, 0],
    side: "right",
  },
  {
    id: "shoulder-left",
    code: snomed("16982005", "Shoulder region of left upper limb"),
    shape: { kind: "sphere", radius: 0.27 },
    position: [0.85, 2.55, 0],
    side: "left",
  },
  {
    id: "upper-arm-right",
    code: snomed("40983000", "Upper arm structure"),
    shape: { kind: "capsule", radius: 0.18, length: 0.7 },
    position: [-1.0, 1.85, 0],
    side: "right",
  },
  {
    id: "upper-arm-left",
    code: snomed("40983000", "Upper arm structure"),
    shape: { kind: "capsule", radius: 0.18, length: 0.7 },
    position: [1.0, 1.85, 0],
    side: "left",
  },
  {
    id: "elbow-right",
    code: snomed("16953009", "Elbow region structure"),
    shape: { kind: "sphere", radius: 0.18 },
    position: [-1.05, 1.25, 0],
    side: "right",
  },
  {
    id: "elbow-left",
    code: snomed("16953009", "Elbow region structure"),
    shape: { kind: "sphere", radius: 0.18 },
    position: [1.05, 1.25, 0],
    side: "left",
  },
  {
    id: "forearm-right",
    code: snomed("66480008", "Forearm structure"),
    shape: { kind: "capsule", radius: 0.16, length: 0.7 },
    position: [-1.1, 0.65, 0],
    side: "right",
  },
  {
    id: "forearm-left",
    code: snomed("66480008", "Forearm structure"),
    shape: { kind: "capsule", radius: 0.16, length: 0.7 },
    position: [1.1, 0.65, 0],
    side: "left",
  },
  {
    id: "hand-right",
    code: snomed("85562004", "Hand structure"),
    shape: { kind: "box", size: [0.22, 0.32, 0.1] },
    position: [-1.1, 0.0, 0],
    side: "right",
  },
  {
    id: "hand-left",
    code: snomed("85562004", "Hand structure"),
    shape: { kind: "box", size: [0.22, 0.32, 0.1] },
    position: [1.1, 0.0, 0],
    side: "left",
  },
  {
    id: "thigh-right",
    code: snomed("68367000", "Thigh structure"),
    shape: { kind: "capsule", radius: 0.22, length: 0.85 },
    position: [-0.32, 0.0, 0],
    side: "right",
  },
  {
    id: "thigh-left",
    code: snomed("68367000", "Thigh structure"),
    shape: { kind: "capsule", radius: 0.22, length: 0.85 },
    position: [0.32, 0.0, 0],
    side: "left",
  },
  {
    id: "knee-right",
    code: snomed("72696002", "Knee region structure"),
    shape: { kind: "sphere", radius: 0.22 },
    position: [-0.32, -0.85, 0],
    side: "right",
  },
  {
    id: "knee-left",
    code: snomed("72696002", "Knee region structure"),
    shape: { kind: "sphere", radius: 0.22 },
    position: [0.32, -0.85, 0],
    side: "left",
  },
  {
    id: "lower-leg-right",
    code: snomed("30021000", "Lower leg structure"),
    shape: { kind: "capsule", radius: 0.18, length: 0.85 },
    position: [-0.32, -1.55, 0],
    side: "right",
  },
  {
    id: "lower-leg-left",
    code: snomed("30021000", "Lower leg structure"),
    shape: { kind: "capsule", radius: 0.18, length: 0.85 },
    position: [0.32, -1.55, 0],
    side: "left",
  },
  {
    id: "foot-right",
    code: snomed("56459004", "Foot structure"),
    shape: { kind: "box", size: [0.28, 0.18, 0.55] },
    position: [-0.32, -2.45, 0.15],
    side: "right",
  },
  {
    id: "foot-left",
    code: snomed("56459004", "Foot structure"),
    shape: { kind: "box", size: [0.28, 0.18, 0.55] },
    position: [0.32, -2.45, 0.15],
    side: "left",
  },
];

export function findRegionByCode(code?: Code | null): BodyRegion | undefined {
  if (!code) return undefined;
  return BODY_REGIONS.find(
    (r) => r.code.code === code.code && r.code.system === code.system,
  );
}
