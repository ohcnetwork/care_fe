import type { TFunction } from "i18next";

/** `send_sms` → "Send sms": registry slugs and field names are code
 *  identifiers with no display strings of their own. */
export function humanize(identifier: string): string {
  const words = identifier.replace(/[_-]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : identifier;
}

/** Plain-language names for registry instructions the UI knows about;
 *  anything else falls back to its humanized slug (never the raw slug). */
const INSTRUCTION_LABEL_KEYS: Record<string, string> = {
  logging: "action_instruction_logging",
  show_message: "action_instruction_show_message",
  set_encounter_priority: "action_instruction_set_encounter_priority",
  tag_encounter: "action_instruction_tag_encounter",
  tag_patient: "action_instruction_tag_patient",
};

export function instructionLabel(slug: string, t: TFunction): string {
  const key = INSTRUCTION_LABEL_KEYS[slug];
  return key ? t(key) : humanize(slug);
}

const INSTRUCTION_TYPE_KEYS: Record<string, string> = {
  NOTIFY: "action_type_notify",
  TEXT: "action_type_text",
  PERFORMED: "action_type_performed",
  VALIDATE: "action_type_validate",
  REDIRECT: "action_type_redirect",
};

export function instructionTypeLabel(type: string, t: TFunction): string {
  const key = INSTRUCTION_TYPE_KEYS[type];
  return key ? t(key) : humanize(type.toLowerCase());
}
