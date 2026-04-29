import { WidgetType } from "@/components/AIWidgets/types";

export const SCHEMAS: Record<WidgetType, Record<string, unknown>> = {
  markdown: {
    type: "object",
    properties: {
      title: { type: "string" },
      intro: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            heading: { type: "string" },
            callout: { type: "string" },
            markdown: { type: "string" },
          },
          required: ["heading", "markdown"],
        },
      },
      footer_note: { type: "string" },
      language: { type: "string" },
    },
    required: ["title", "sections"],
  },
  "cited-summary": {
    type: "object",
    properties: {
      summary: { type: "string" },
      citations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            tag: { type: "string" },
            tool: { type: "string" },
          },
          required: ["tag", "tool"],
        },
      },
      grounded_count: { type: "integer" },
    },
    required: ["summary", "citations"],
  },
  score: {
    type: "object",
    properties: {
      title: { type: "string" },
      score: { type: "number" },
      scale: { type: "string" },
      severity: { type: "string" },
      interpretation: { type: "string" },
      components: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" },
            contribution: { type: "number" },
          },
          required: ["name", "value", "contribution"],
        },
      },
      source_note: { type: "string" },
    },
    required: ["title", "score"],
  },
  "ranked-list": {
    type: "object",
    properties: {
      title: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            why: { type: "string" },
            score: { type: "number" },
            score_label: { type: "string" },
          },
          required: ["name", "why", "score", "score_label"],
        },
      },
      disclaimer: { type: "string" },
      source_note: { type: "string" },
    },
    required: ["title", "items"],
  },
};

export const TYPE_HINTS: Record<WidgetType, string> = {
  markdown:
    "Return JSON matching the schema with a clear title, optional intro, and sections (heading + markdown body, plus an optional callout: 'warning' or 'info'). Use markdown bullets, bold, and short paragraphs inside section bodies.",
  "cited-summary":
    "Return a concise narrative summary (3-5 sentences) and a list of citations naming the tools that grounded the summary (each citation has a short human-readable 'tag' and the underlying 'tool' name).",
  "ranked-list":
    "Return a ranked list of items, most important first. For each item: name, a one-sentence 'why' rationale, a numeric score 0-100, and a score_label of 'Low' | 'Mod' | 'High'.",
  score:
    "Return a clinical score: a title (e.g., 'NEWS2 Score'), the numeric score, optional scale (e.g., '/ 21'), severity ('low' | 'moderate' | 'high' | 'critical'), a one-sentence interpretation, and optional components (each with name, the human-readable value used, and the points it contributed).",
};
