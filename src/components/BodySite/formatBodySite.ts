import {
  ANNOTATION_TYPES,
  BodyAnnotation,
} from "@/components/BodySite/bodyAnnotation";

import { Code } from "@/types/base/code/code";

/**
 * Render a human-readable summary of a body-site selection. Suitable for
 * patient records, FHIR Observation.valueString, audit logs, etc.
 *
 * Examples:
 *   formatBodySiteSummary({ code: "91775009", display: "Right shoulder region" })
 *   → "Right shoulder region"
 *
 *   formatBodySiteSummary([codeA, codeB])
 *   → "Right shoulder region, Left elbow region"
 *
 *   formatBodySiteSummary(undefined)
 *   → ""
 */
export function formatBodySiteSummary(
  value: Code | Code[] | null | undefined,
): string {
  if (!value) return "";
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((c) => c.display)
    .filter(Boolean)
    .join(", ");
}

/**
 * Render a clinically-readable summary of a set of annotations. Group by
 * type, count repeats, include the associated region when present.
 *
 * Example:
 *   "2 wounds (Right hand, Left forearm), 1 burn (Anterior thorax)"
 */
export function formatAnnotationSummary(
  annotations: BodyAnnotation[] | null | undefined,
): string {
  if (!annotations || annotations.length === 0) return "";

  // Group by type preserving the canonical order from ANNOTATION_TYPES
  const byType = new Map<string, BodyAnnotation[]>();
  for (const meta of ANNOTATION_TYPES) {
    byType.set(meta.type, []);
  }
  for (const a of annotations) {
    const list = byType.get(a.type);
    if (list) list.push(a);
  }

  const parts: string[] = [];
  for (const [type, list] of byType) {
    if (list.length === 0) continue;
    const meta = ANNOTATION_TYPES.find((m) => m.type === type);
    const label = meta?.type ?? type;
    const sites = list
      .map((a) => a.associatedRegion?.code.display)
      .filter((s): s is string => !!s);
    const uniqueSites = Array.from(new Set(sites));
    const sitesText =
      uniqueSites.length > 0 ? ` (${uniqueSites.join(", ")})` : "";
    parts.push(
      `${list.length} ${label}${list.length > 1 ? "s" : ""}${sitesText}`,
    );
  }

  return parts.join(", ");
}
