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
  {
    name: "NEWS2 score",
    type: "score",
    model: "gpt-4.1-mini",
    description: "Compute NEWS2 from latest vitals and submitted forms.",
    prompt:
      "Compute the NEWS2 score for this patient using the most recent vital signs (respiratory rate, oxygen saturation, supplemental oxygen, temperature, systolic BP, heart rate, level of consciousness). Pull values from recent observations and submitted form responses. Title 'NEWS2 Score'. Provide the total score, scale '/ 20', severity (low / moderate / high / critical) per RCP NEWS2 v2 thresholds, a one-sentence interpretation, and components for each parameter (name, value used, contribution). If a parameter is missing, state 'unknown' in the value and contribute 0. Add a source_note: 'RCP NEWS2 v2 thresholds'.",
  },
];
