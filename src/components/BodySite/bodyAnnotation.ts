import { Body2DView } from "@/components/BodySite/body2DLayout";

import { Code } from "@/types/base/code/code";

export type AnnotationType =
  | "marker"
  | "wound"
  | "burn"
  | "pain"
  | "scar"
  | "rash"
  | "lesion";

export interface BodyAnnotation {
  /** Stable client-side id */
  id: string;
  view: Body2DView;
  /** x in viewBox 0..200 */
  cx: number;
  /** y in viewBox 0..500 */
  cy: number;
  type: AnnotationType;
  label?: string;
  /** 1 = mild, 5 = severe */
  severity?: 1 | 2 | 3 | 4 | 5;
  /** SNOMED code of the nearest body region — derived at creation, used for
   *  attaching the annotation to a billable / structured site. */
  associatedRegion?: { id: string; code: Code };
  createdAt: string;
}

export interface AnnotationTypeMeta {
  type: AnnotationType;
  labelKey: string;
  color: string;
}

export const ANNOTATION_TYPES: AnnotationTypeMeta[] = [
  { type: "marker", labelKey: "annotation_marker", color: "#0ea5e9" },
  { type: "wound", labelKey: "annotation_wound", color: "#ef4444" },
  { type: "burn", labelKey: "annotation_burn", color: "#f97316" },
  { type: "pain", labelKey: "annotation_pain", color: "#dc2626" },
  { type: "scar", labelKey: "annotation_scar", color: "#a855f7" },
  { type: "rash", labelKey: "annotation_rash", color: "#ec4899" },
  { type: "lesion", labelKey: "annotation_lesion", color: "#84cc16" },
];

export function annotationColor(type: AnnotationType): string {
  return ANNOTATION_TYPES.find((t) => t.type === type)?.color ?? "#0ea5e9";
}

export function makeAnnotationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `anno-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
