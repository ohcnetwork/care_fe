import type { RendererSubject } from "@/components/QuestionnaireV2/form/engine/types";

/**
 * The renderer's modes. `preview` is interactive without persistence
 * (studio canvas, detail preview); `readonly` renders recorded/disabled
 * fields (revision view, the encounter drafts card); `fill` is the real
 * submission mode `fill/` mounts — the validation seam (`validation.ts`)
 * and the structured slot's questionnaire id/slug pass-through are live
 * only there.
 */
export type FormMode = "preview" | "readonly" | "fill";

export type { RendererSubject };
