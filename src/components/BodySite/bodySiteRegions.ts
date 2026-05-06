import { Code } from "@/types/base/code/code";

/**
 * SNOMED CT body site catalogue.
 *
 * Codes follow the SNOMED CT International Edition. Where SNOMED provides
 * laterality-specific concepts (e.g. "right shoulder region"), those are used
 * directly. For regions without lateralised concepts, the same parent code is
 * used and laterality is communicated via the `side` field — callers wanting
 * full FHIR BodySite semantics should attach a SNOMED laterality qualifier
 * (left = 7771000, right = 24028007) downstream.
 *
 * The list is curated to match common clinical workflows (medication
 * administration, examination, wound assessment) and is not exhaustive — the
 * SNOMED body structure hierarchy contains thousands of concepts. Codes should
 * be re-verified against the latest SNOMED CT release before production use.
 */

const SNOMED_SYSTEM = "http://snomed.info/sct";

export type BodyShape =
  | { kind: "sphere"; radius: number; widthSegments?: number }
  | { kind: "box"; size: [number, number, number] }
  | {
      kind: "cylinder";
      radiusTop: number;
      radiusBottom: number;
      height: number;
    }
  | { kind: "capsule"; radius: number; length: number };

export type BodySide = "left" | "right" | "center";
export type BodyView = "front" | "back" | "any";
export type BodyGroup =
  | "head"
  | "neck"
  | "torso"
  | "back"
  | "arm-left"
  | "arm-right"
  | "leg-left"
  | "leg-right";

export type ClinicalUseCase =
  | "im-injection"
  | "iv-cannulation"
  | "subcut-injection"
  | "auscultation"
  | "wound";

export interface BodyRegion {
  id: string;
  code: Code;
  shape: BodyShape;
  position: [number, number, number];
  rotation?: [number, number, number];
  side: BodySide;
  view: BodyView;
  group: BodyGroup;
  /** Searchable aliases / common names */
  aliases?: string[];
  /** Whether this is a small / detail region (used for level-of-detail rendering) */
  detail?: boolean;
  /** Clinical workflows where this region is commonly selected */
  useCases?: ClinicalUseCase[];
}

const snomed = (code: string, display: string): Code => ({
  system: SNOMED_SYSTEM,
  code,
  display,
});

// Body proportions (units roughly correspond to the head height)
const HEAD_Y = 3.55;
const NECK_Y = 2.95;
const SHOULDER_Y = 2.65;
const CHEST_Y = 2.15;
const ABDOMEN_Y = 1.35;
const PELVIS_Y = 0.7;
const HIP_Y = 0.45;
const KNEE_Y = -0.95;
const ANKLE_Y = -2.4;

const ARM_OFFSET = 0.95;
const LEG_OFFSET = 0.32;

export const BODY_REGIONS: BodyRegion[] = [
  // ── Head ────────────────────────────────────────────────────────────────
  {
    id: "head-cranium",
    code: snomed("69536005", "Head"),
    shape: { kind: "sphere", radius: 0.46 },
    position: [0, HEAD_Y, 0],
    side: "center",
    view: "any",
    group: "head",
    aliases: ["skull", "cranium"],
  },
  {
    id: "forehead",
    code: snomed("12377006", "Forehead"),
    shape: { kind: "sphere", radius: 0.16 },
    position: [0, HEAD_Y + 0.18, 0.36],
    side: "center",
    view: "front",
    group: "head",
    detail: true,
    aliases: ["brow"],
  },
  {
    id: "eye-right",
    code: snomed("18643000", "Right eye region"),
    shape: { kind: "sphere", radius: 0.07 },
    position: [-0.16, HEAD_Y + 0.05, 0.4],
    side: "right",
    view: "front",
    group: "head",
    detail: true,
    aliases: ["right eye"],
  },
  {
    id: "eye-left",
    code: snomed("11532001", "Left eye region"),
    shape: { kind: "sphere", radius: 0.07 },
    position: [0.16, HEAD_Y + 0.05, 0.4],
    side: "left",
    view: "front",
    group: "head",
    detail: true,
    aliases: ["left eye"],
  },
  {
    id: "nose",
    code: snomed("45206002", "Nose"),
    shape: { kind: "sphere", radius: 0.08 },
    position: [0, HEAD_Y - 0.05, 0.45],
    side: "center",
    view: "front",
    group: "head",
    detail: true,
  },
  {
    id: "ear-right",
    code: snomed("25577004", "Right ear"),
    shape: { kind: "box", size: [0.05, 0.16, 0.1] },
    position: [-0.46, HEAD_Y - 0.02, 0.0],
    side: "right",
    view: "any",
    group: "head",
    detail: true,
  },
  {
    id: "ear-left",
    code: snomed("60308005", "Left ear"),
    shape: { kind: "box", size: [0.05, 0.16, 0.1] },
    position: [0.46, HEAD_Y - 0.02, 0.0],
    side: "left",
    view: "any",
    group: "head",
    detail: true,
  },
  {
    id: "mouth",
    code: snomed("123851003", "Mouth"),
    shape: { kind: "box", size: [0.18, 0.04, 0.04] },
    position: [0, HEAD_Y - 0.22, 0.42],
    side: "center",
    view: "front",
    group: "head",
    detail: true,
    aliases: ["lips", "oral"],
  },
  {
    id: "mandible",
    code: snomed("91609006", "Mandible"),
    shape: { kind: "sphere", radius: 0.18 },
    position: [0, HEAD_Y - 0.32, 0.18],
    side: "center",
    view: "front",
    group: "head",
    detail: true,
    aliases: ["jaw", "chin"],
  },
  {
    id: "occiput",
    code: snomed("74262004", "Occipital region"),
    shape: { kind: "sphere", radius: 0.2 },
    position: [0, HEAD_Y - 0.05, -0.4],
    side: "center",
    view: "back",
    group: "head",
    detail: true,
    aliases: ["back of head"],
  },

  // ── Neck ────────────────────────────────────────────────────────────────
  {
    id: "neck-anterior",
    code: snomed("45048000", "Neck"),
    shape: {
      kind: "cylinder",
      radiusTop: 0.18,
      radiusBottom: 0.2,
      height: 0.3,
    },
    position: [0, NECK_Y, 0.05],
    side: "center",
    view: "front",
    group: "neck",
    aliases: ["throat"],
  },
  {
    id: "neck-posterior",
    code: snomed("66907004", "Posterior cervical region"),
    shape: { kind: "box", size: [0.32, 0.32, 0.18] },
    position: [0, NECK_Y, -0.15],
    side: "center",
    view: "back",
    group: "neck",
    aliases: ["nape", "cervical"],
  },

  // ── Anterior torso ─────────────────────────────────────────────────────
  {
    id: "shoulder-right",
    code: snomed("91775009", "Right shoulder region"),
    shape: { kind: "sphere", radius: 0.3 },
    position: [-0.85, SHOULDER_Y, 0],
    side: "right",
    view: "any",
    group: "arm-right",
  },
  {
    id: "shoulder-left",
    code: snomed("91774008", "Left shoulder region"),
    shape: { kind: "sphere", radius: 0.3 },
    position: [0.85, SHOULDER_Y, 0],
    side: "left",
    view: "any",
    group: "arm-left",
  },
  {
    id: "sternum",
    code: snomed("56873002", "Sternum"),
    shape: { kind: "box", size: [0.32, 0.6, 0.05] },
    position: [0, CHEST_Y + 0.05, 0.32],
    side: "center",
    view: "front",
    group: "torso",
    detail: true,
    aliases: ["breastbone"],
  },
  {
    id: "chest-right",
    code: snomed("78904004", "Right anterior thorax"),
    shape: { kind: "box", size: [0.5, 0.7, 0.3] },
    position: [-0.36, CHEST_Y, 0.18],
    side: "right",
    view: "front",
    group: "torso",
    aliases: ["right pectoral", "right breast"],
  },
  {
    id: "chest-left",
    code: snomed("66315002", "Left anterior thorax"),
    shape: { kind: "box", size: [0.5, 0.7, 0.3] },
    position: [0.36, CHEST_Y, 0.18],
    side: "left",
    view: "front",
    group: "torso",
    aliases: ["left pectoral", "left breast", "deltoid"],
  },
  {
    id: "epigastrium",
    code: snomed("27947004", "Epigastric region"),
    shape: { kind: "box", size: [0.6, 0.22, 0.18] },
    position: [0, ABDOMEN_Y + 0.32, 0.2],
    side: "center",
    view: "front",
    group: "torso",
  },
  {
    id: "abdomen-ruq",
    code: snomed("48311003", "Right upper quadrant of abdomen"),
    shape: { kind: "box", size: [0.5, 0.32, 0.22] },
    position: [-0.3, ABDOMEN_Y + 0.05, 0.2],
    side: "right",
    view: "front",
    group: "torso",
    aliases: ["RUQ", "liver"],
  },
  {
    id: "abdomen-luq",
    code: snomed("48544008", "Left upper quadrant of abdomen"),
    shape: { kind: "box", size: [0.5, 0.32, 0.22] },
    position: [0.3, ABDOMEN_Y + 0.05, 0.2],
    side: "left",
    view: "front",
    group: "torso",
    aliases: ["LUQ"],
  },
  {
    id: "abdomen-umbilical",
    code: snomed("82061003", "Umbilical region"),
    shape: { kind: "sphere", radius: 0.13 },
    position: [0, ABDOMEN_Y - 0.18, 0.32],
    side: "center",
    view: "front",
    group: "torso",
    aliases: ["belly button", "navel"],
  },
  {
    id: "abdomen-rlq",
    code: snomed("12999001", "Right lower quadrant of abdomen"),
    shape: { kind: "box", size: [0.5, 0.3, 0.22] },
    position: [-0.3, ABDOMEN_Y - 0.32, 0.2],
    side: "right",
    view: "front",
    group: "torso",
    aliases: ["RLQ", "appendix"],
  },
  {
    id: "abdomen-llq",
    code: snomed("85562000", "Left lower quadrant of abdomen"),
    shape: { kind: "box", size: [0.5, 0.3, 0.22] },
    position: [0.3, ABDOMEN_Y - 0.32, 0.2],
    side: "left",
    view: "front",
    group: "torso",
    aliases: ["LLQ"],
  },
  {
    id: "suprapubic",
    code: snomed("69876008", "Suprapubic region"),
    shape: { kind: "box", size: [0.5, 0.18, 0.18] },
    position: [0, PELVIS_Y + 0.18, 0.28],
    side: "center",
    view: "front",
    group: "torso",
    detail: true,
    aliases: ["hypogastric", "pubis"],
  },

  // ── Posterior torso ────────────────────────────────────────────────────
  {
    id: "scapula-right",
    code: snomed("79601000", "Right scapular region"),
    shape: { kind: "box", size: [0.42, 0.4, 0.08] },
    position: [-0.36, CHEST_Y + 0.1, -0.32],
    side: "right",
    view: "back",
    group: "back",
    aliases: ["right shoulder blade"],
  },
  {
    id: "scapula-left",
    code: snomed("69109000", "Left scapular region"),
    shape: { kind: "box", size: [0.42, 0.4, 0.08] },
    position: [0.36, CHEST_Y + 0.1, -0.32],
    side: "left",
    view: "back",
    group: "back",
    aliases: ["left shoulder blade"],
  },
  {
    id: "upper-back",
    code: snomed("123961009", "Upper back"),
    shape: { kind: "box", size: [0.7, 0.5, 0.08] },
    position: [0, CHEST_Y - 0.25, -0.32],
    side: "center",
    view: "back",
    group: "back",
    aliases: ["thoracic spine"],
  },
  {
    id: "lower-back",
    code: snomed("122496007", "Lumbar region"),
    shape: { kind: "box", size: [0.85, 0.45, 0.08] },
    position: [0, ABDOMEN_Y, -0.3],
    side: "center",
    view: "back",
    group: "back",
    aliases: ["lumbar", "lower back"],
  },
  {
    id: "sacral",
    code: snomed("54735007", "Sacral region"),
    shape: { kind: "box", size: [0.45, 0.25, 0.08] },
    position: [0, PELVIS_Y + 0.25, -0.32],
    side: "center",
    view: "back",
    group: "back",
    detail: true,
    aliases: ["sacrum"],
  },
  {
    id: "buttock-right",
    code: snomed("48979004", "Right buttock"),
    shape: { kind: "sphere", radius: 0.32 },
    position: [-0.3, PELVIS_Y - 0.05, -0.18],
    side: "right",
    view: "back",
    group: "leg-right",
    aliases: ["right gluteal"],
  },
  {
    id: "buttock-left",
    code: snomed("70468002", "Left buttock"),
    shape: { kind: "sphere", radius: 0.32 },
    position: [0.3, PELVIS_Y - 0.05, -0.18],
    side: "left",
    view: "back",
    group: "leg-left",
    aliases: ["left gluteal"],
  },

  // ── Pelvis (filler torso connection) ────────────────────────────────────
  {
    id: "pelvis",
    code: snomed("12921003", "Pelvis"),
    shape: { kind: "box", size: [1.05, 0.55, 0.55] },
    position: [0, PELVIS_Y, 0],
    side: "center",
    view: "any",
    group: "torso",
    aliases: ["hips"],
  },

  // ── Right arm ──────────────────────────────────────────────────────────
  {
    id: "upper-arm-right",
    code: snomed("3133003", "Right upper arm"),
    shape: { kind: "capsule", radius: 0.18, length: 0.7 },
    position: [-ARM_OFFSET - 0.05, 1.85, 0],
    side: "right",
    view: "any",
    group: "arm-right",
    aliases: ["right biceps", "right triceps"],
  },
  {
    id: "elbow-right",
    code: snomed("48979005", "Right elbow region"),
    shape: { kind: "sphere", radius: 0.19 },
    position: [-ARM_OFFSET - 0.1, 1.2, 0],
    side: "right",
    view: "any",
    group: "arm-right",
  },
  {
    id: "forearm-right",
    code: snomed("82027007", "Right forearm"),
    shape: { kind: "capsule", radius: 0.16, length: 0.7 },
    position: [-ARM_OFFSET - 0.15, 0.55, 0],
    side: "right",
    view: "any",
    group: "arm-right",
  },
  {
    id: "wrist-right",
    code: snomed("9736006", "Right wrist region"),
    shape: { kind: "sphere", radius: 0.14 },
    position: [-ARM_OFFSET - 0.18, -0.08, 0],
    side: "right",
    view: "any",
    group: "arm-right",
    detail: true,
  },
  {
    id: "hand-right",
    code: snomed("78791008", "Right hand"),
    shape: { kind: "box", size: [0.2, 0.32, 0.1] },
    position: [-ARM_OFFSET - 0.2, -0.4, 0],
    side: "right",
    view: "any",
    group: "arm-right",
    aliases: ["right palm"],
  },

  // ── Left arm ───────────────────────────────────────────────────────────
  {
    id: "upper-arm-left",
    code: snomed("368208006", "Left upper arm"),
    shape: { kind: "capsule", radius: 0.18, length: 0.7 },
    position: [ARM_OFFSET + 0.05, 1.85, 0],
    side: "left",
    view: "any",
    group: "arm-left",
    aliases: ["left biceps", "left triceps"],
  },
  {
    id: "elbow-left",
    code: snomed("368149004", "Left elbow region"),
    shape: { kind: "sphere", radius: 0.19 },
    position: [ARM_OFFSET + 0.1, 1.2, 0],
    side: "left",
    view: "any",
    group: "arm-left",
  },
  {
    id: "forearm-left",
    code: snomed("66480008", "Left forearm"),
    shape: { kind: "capsule", radius: 0.16, length: 0.7 },
    position: [ARM_OFFSET + 0.15, 0.55, 0],
    side: "left",
    view: "any",
    group: "arm-left",
  },
  {
    id: "wrist-left",
    code: snomed("5951000", "Left wrist region"),
    shape: { kind: "sphere", radius: 0.14 },
    position: [ARM_OFFSET + 0.18, -0.08, 0],
    side: "left",
    view: "any",
    group: "arm-left",
    detail: true,
  },
  {
    id: "hand-left",
    code: snomed("85151006", "Left hand"),
    shape: { kind: "box", size: [0.2, 0.32, 0.1] },
    position: [ARM_OFFSET + 0.2, -0.4, 0],
    side: "left",
    view: "any",
    group: "arm-left",
    aliases: ["left palm"],
  },

  // ── Right leg ──────────────────────────────────────────────────────────
  {
    id: "thigh-right",
    code: snomed("11207009", "Right thigh"),
    shape: { kind: "capsule", radius: 0.24, length: 0.85 },
    position: [-LEG_OFFSET, HIP_Y - 0.4, 0],
    side: "right",
    view: "any",
    group: "leg-right",
    aliases: ["right quadriceps", "right hamstring"],
  },
  {
    id: "knee-right",
    code: snomed("82169009", "Right knee region"),
    shape: { kind: "sphere", radius: 0.22 },
    position: [-LEG_OFFSET, KNEE_Y, 0],
    side: "right",
    view: "any",
    group: "leg-right",
  },
  {
    id: "lower-leg-right",
    code: snomed("32916005", "Right lower leg"),
    shape: { kind: "capsule", radius: 0.18, length: 0.85 },
    position: [-LEG_OFFSET, KNEE_Y - 0.7, 0],
    side: "right",
    view: "any",
    group: "leg-right",
    aliases: ["right shin", "right calf"],
  },
  {
    id: "ankle-right",
    code: snomed("6685009", "Right ankle"),
    shape: { kind: "sphere", radius: 0.15 },
    position: [-LEG_OFFSET, ANKLE_Y, 0],
    side: "right",
    view: "any",
    group: "leg-right",
    detail: true,
  },
  {
    id: "foot-right",
    code: snomed("22335008", "Right foot"),
    shape: { kind: "box", size: [0.26, 0.16, 0.55] },
    position: [-LEG_OFFSET, ANKLE_Y - 0.18, 0.18],
    side: "right",
    view: "any",
    group: "leg-right",
  },

  // ── Left leg ───────────────────────────────────────────────────────────
  {
    id: "thigh-left",
    code: snomed("61685007", "Left thigh"),
    shape: { kind: "capsule", radius: 0.24, length: 0.85 },
    position: [LEG_OFFSET, HIP_Y - 0.4, 0],
    side: "left",
    view: "any",
    group: "leg-left",
    aliases: ["left quadriceps", "left hamstring"],
  },
  {
    id: "knee-left",
    code: snomed("82169000", "Left knee region"),
    shape: { kind: "sphere", radius: 0.22 },
    position: [LEG_OFFSET, KNEE_Y, 0],
    side: "left",
    view: "any",
    group: "leg-left",
  },
  {
    id: "lower-leg-left",
    code: snomed("85151005", "Left lower leg"),
    shape: { kind: "capsule", radius: 0.18, length: 0.85 },
    position: [LEG_OFFSET, KNEE_Y - 0.7, 0],
    side: "left",
    view: "any",
    group: "leg-left",
    aliases: ["left shin", "left calf"],
  },
  {
    id: "ankle-left",
    code: snomed("51636004", "Left ankle"),
    shape: { kind: "sphere", radius: 0.15 },
    position: [LEG_OFFSET, ANKLE_Y, 0],
    side: "left",
    view: "any",
    group: "leg-left",
    detail: true,
  },
  {
    id: "foot-left",
    code: snomed("22335009", "Left foot"),
    shape: { kind: "box", size: [0.26, 0.16, 0.55] },
    position: [LEG_OFFSET, ANKLE_Y - 0.18, 0.18],
    side: "left",
    view: "any",
    group: "leg-left",
  },

  // ── Clinical injection / cannulation sub-sites ─────────────────────────
  {
    id: "deltoid-right",
    code: snomed("181468005", "Right deltoid"),
    shape: { kind: "sphere", radius: 0.14 },
    position: [-ARM_OFFSET - 0.05, SHOULDER_Y - 0.15, 0.18],
    side: "right",
    view: "front",
    group: "arm-right",
    detail: true,
    aliases: ["deltoid IM right", "right deltoid muscle"],
    useCases: ["im-injection"],
  },
  {
    id: "deltoid-left",
    code: snomed("181469002", "Left deltoid"),
    shape: { kind: "sphere", radius: 0.14 },
    position: [ARM_OFFSET + 0.05, SHOULDER_Y - 0.15, 0.18],
    side: "left",
    view: "front",
    group: "arm-left",
    detail: true,
    aliases: ["deltoid IM left", "left deltoid muscle"],
    useCases: ["im-injection"],
  },
  {
    id: "ventrogluteal-right",
    code: snomed("700013004", "Right ventrogluteal region"),
    shape: { kind: "sphere", radius: 0.14 },
    position: [-0.45, PELVIS_Y - 0.05, -0.05],
    side: "right",
    view: "any",
    group: "leg-right",
    detail: true,
    aliases: ["ventrogluteal IM right", "right hip injection"],
    useCases: ["im-injection"],
  },
  {
    id: "ventrogluteal-left",
    code: snomed("700014005", "Left ventrogluteal region"),
    shape: { kind: "sphere", radius: 0.14 },
    position: [0.45, PELVIS_Y - 0.05, -0.05],
    side: "left",
    view: "any",
    group: "leg-left",
    detail: true,
    aliases: ["ventrogluteal IM left", "left hip injection"],
    useCases: ["im-injection"],
  },
  {
    id: "vastus-lateralis-right",
    code: snomed("244310005", "Right vastus lateralis"),
    shape: { kind: "sphere", radius: 0.16 },
    position: [-LEG_OFFSET - 0.18, HIP_Y - 0.45, 0.18],
    side: "right",
    view: "front",
    group: "leg-right",
    detail: true,
    aliases: ["vastus lateralis IM right", "anterolateral thigh right"],
    useCases: ["im-injection"],
  },
  {
    id: "vastus-lateralis-left",
    code: snomed("244311009", "Left vastus lateralis"),
    shape: { kind: "sphere", radius: 0.16 },
    position: [LEG_OFFSET + 0.18, HIP_Y - 0.45, 0.18],
    side: "left",
    view: "front",
    group: "leg-left",
    detail: true,
    aliases: ["vastus lateralis IM left", "anterolateral thigh left"],
    useCases: ["im-injection"],
  },
  {
    id: "dorsogluteal-right",
    code: snomed("60066007", "Right gluteal region"),
    shape: { kind: "sphere", radius: 0.14 },
    position: [-0.3, PELVIS_Y, -0.32],
    side: "right",
    view: "back",
    group: "leg-right",
    detail: true,
    aliases: ["dorsogluteal IM right"],
    useCases: ["im-injection"],
  },
  {
    id: "dorsogluteal-left",
    code: snomed("36475000", "Left gluteal region"),
    shape: { kind: "sphere", radius: 0.14 },
    position: [0.3, PELVIS_Y, -0.32],
    side: "left",
    view: "back",
    group: "leg-left",
    detail: true,
    aliases: ["dorsogluteal IM left"],
    useCases: ["im-injection"],
  },
  {
    id: "antecubital-right",
    code: snomed("66480000", "Right antecubital fossa"),
    shape: { kind: "sphere", radius: 0.1 },
    position: [-ARM_OFFSET - 0.1, 1.2, 0.18],
    side: "right",
    view: "front",
    group: "arm-right",
    detail: true,
    aliases: ["right cubital fossa", "right IV site", "AC right"],
    useCases: ["iv-cannulation"],
  },
  {
    id: "antecubital-left",
    code: snomed("66480001", "Left antecubital fossa"),
    shape: { kind: "sphere", radius: 0.1 },
    position: [ARM_OFFSET + 0.1, 1.2, 0.18],
    side: "left",
    view: "front",
    group: "arm-left",
    detail: true,
    aliases: ["left cubital fossa", "left IV site", "AC left"],
    useCases: ["iv-cannulation"],
  },
  {
    id: "abdomen-sc-right",
    code: snomed("818983003", "Right side of abdomen"),
    shape: { kind: "sphere", radius: 0.1 },
    position: [-0.45, ABDOMEN_Y - 0.18, 0.32],
    side: "right",
    view: "front",
    group: "torso",
    detail: true,
    aliases: ["right abdomen SC", "right SC injection"],
    useCases: ["subcut-injection"],
  },
  {
    id: "abdomen-sc-left",
    code: snomed("818984009", "Left side of abdomen"),
    shape: { kind: "sphere", radius: 0.1 },
    position: [0.45, ABDOMEN_Y - 0.18, 0.32],
    side: "left",
    view: "front",
    group: "torso",
    detail: true,
    aliases: ["left abdomen SC", "left SC injection"],
    useCases: ["subcut-injection"],
  },
];

export function regionsForUseCase(useCase: ClinicalUseCase): BodyRegion[] {
  return BODY_REGIONS.filter((r) => r.useCases?.includes(useCase));
}

export function findRegionByCode(code?: Code | null): BodyRegion | undefined {
  if (!code) return undefined;
  return BODY_REGIONS.find(
    (r) => r.code.code === code.code && r.code.system === code.system,
  );
}

/**
 * Match a free-text query against region display names and aliases.
 * Returns matched region IDs ordered by match strength.
 */
export function searchRegions(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: Array<{ id: string; score: number }> = [];
  for (const r of BODY_REGIONS) {
    const haystack = [
      r.code.display.toLowerCase(),
      r.id.toLowerCase().replace(/-/g, " "),
      ...(r.aliases ?? []).map((a) => a.toLowerCase()),
    ];
    let score = 0;
    for (const term of haystack) {
      if (term === q) score = Math.max(score, 100);
      else if (term.startsWith(q)) score = Math.max(score, 50);
      else if (term.includes(q)) score = Math.max(score, 20);
    }
    if (score > 0) scored.push({ id: r.id, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.id);
}
