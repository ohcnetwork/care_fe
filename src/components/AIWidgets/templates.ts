import { WidgetType } from "@/components/AIWidgets/types";

export interface WidgetTemplate {
  name: string;
  type: WidgetType;
  prompt: string;
  model: string;
  description: string;
}

export const TEMPLATES: WidgetTemplate[] = [
  {
    name: "Encounter brief",
    type: "cited-summary",
    model: "gpt-4.1-mini",
    description: "Patient-at-a-glance summary with sourced tools.",
    prompt:
      "Write a 3-5 sentence brief of this encounter for a clinician glancing at the chart. Be specific; include only what's clinically relevant. After the summary, list the tools you used to ground the brief as citations.",
  },
  {
    name: "Active risks",
    type: "ranked-list",
    model: "gpt-4.1-mini",
    description: "Ranked clinical risks with reasoning and severity scores.",
    prompt:
      "Identify the top clinical risks for this patient based on their current encounter, conditions, recent observations, and medications. Rank them most-important first. For each, provide a name, a one-sentence rationale, a 0-100 score, and a score_label of Low/Mod/High.",
  },
  {
    name: "Discharge education",
    type: "markdown",
    model: "gpt-4.1-mini",
    description: "Plain-language post-discharge guidance for the patient.",
    prompt:
      "Write plain-language discharge education for this patient. Use sections: 'What's normal', 'What to watch for' (mark this section as a warning callout), 'Activity', and 'Follow-up'. Use markdown bullets, bold key items, and keep sentences short. Tailor to this patient's encounter.",
  },
  {
    name: "Open questions",
    type: "markdown",
    model: "gpt-4.1-mini",
    description: "Unanswered clinical questions worth asking.",
    prompt:
      "Based on the documented encounter, list 3-5 specific clinical questions that aren't yet answered. Use sections: a 'Questions' section listing each as a bullet with the question in bold and a 'why it matters' note underneath, and a 'Suggested next steps' section.",
  },
];
