import type { RendererSubject } from "@/components/QuestionnaireV2/form/engine/types";

/**
 * The full renderer's modes. `preview` is interactive without persistence
 * (builder canvas, detail preview); `readonly` renders recorded/disabled
 * fields; `fill` is the future real-submission mode — the validation seam
 * (`validation.ts`) and the structured slot's id/slug pass-through activate
 * there, while the encounter host and batch submission land in a follow-up.
 */
export type FormMode = "preview" | "readonly" | "fill";

export type { RendererSubject };
