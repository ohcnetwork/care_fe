import { validatePhoneNumberLength } from "libphonenumber-js";
import {
  Country,
  isValidPhoneNumber,
  parsePhoneNumber,
} from "react-phone-number-input";

import { PatientIdentifierConfig } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import careConfig from "@careConfig";

/**
 * What the All Encounters search applies its text to. `auto` offers every
 * field that fits; the others come from the field selector or a prefix.
 */
export type SearchField = "auto" | "name" | "visit" | `identifier:${string}`;

export const identifierField = (config: PatientIdentifierConfig) =>
  `identifier:${config.id}` as const;

export const configOfField = (
  field: SearchField,
  configs: PatientIdentifierConfig[],
) =>
  field.startsWith("identifier:")
    ? configs.find((config) => identifierField(config) === field)
    : undefined;

export const isPhoneConfig = (config: PatientIdentifierConfig) =>
  config.config.system === careConfig.phoneNumberConfigSystem;

/**
 * Prefixes for identifier configs the frontend knows. Other configs get no
 * prefix: that needs a backend alias. A prefix applies only when the facility
 * has a matching config.
 */
const IDENTIFIER_PREFIXES: {
  prefix: string;
  matches: (config: PatientIdentifierConfig) => boolean;
}[] = [
  { prefix: "phone", matches: isPhoneConfig },
  { prefix: "abha", matches: (config) => /abha/i.test(config.config.system) },
  {
    prefix: "hid",
    matches: (config) =>
      /(^|[^a-z])(hid|health[-_]?id)([^a-z]|$)/i.test(config.config.system),
  },
];

/** Reads a leading `name:`, `visit:` or known identifier prefix. */
export function parseFieldPrefix(
  text: string,
  configs: PatientIdentifierConfig[],
): { field: SearchField; rest: string } | null {
  const match = /^\s*([a-z]+):\s?(.*)$/is.exec(text);
  if (!match) return null;
  const prefix = match[1].toLowerCase();
  const rest = match[2];
  if (prefix === "name") return { field: "name", rest };
  if (prefix === "visit") return { field: "visit", rest };
  const known = IDENTIFIER_PREFIXES.find((entry) => entry.prefix === prefix);
  const config = known && configs.find(known.matches);
  return config ? { field: identifierField(config), rest } : null;
}

/** Digits, with the spaces, dashes and leading `+` of a typed number. */
export const isNumericText = (text: string) =>
  /^\+?[\d\s()-]+$/.test(text) && /\d/.test(text);

/** Drops what a phone number never holds, keeping digits, `+`, spaces, `()-`. */
export const sanitizePhoneInput = (text: string) =>
  text.replace(/[^\d\s()+-]/g, "");

/** Whether `text` has more digits than any number of `country` has. */
export function isPhoneTooLong(text: string, country: Country): boolean {
  const trimmed = text.trim();
  if (!isNumericText(trimmed)) return false;
  try {
    return validatePhoneNumberLength(trimmed, country) === "TOO_LONG";
  } catch {
    return false;
  }
}

const fullMatch = (regex: string) => {
  try {
    return new RegExp(`^(?:${regex})$`);
  } catch {
    return null;
  }
};

export interface IdentifierCheck {
  /** `complete` values may be looked up; `incomplete` ones show a hint. */
  status: "complete" | "incomplete" | "unlikely";
  /** The value sent to the patient search, e.g. a phone number in E.164. */
  value: string;
  /** The value as shown, e.g. a phone number with its country code. */
  display: string;
  /** The format, not just the absence of a rule, matched this config. */
  detected: boolean;
}

/**
 * Whether `text` is a complete value for an identifier config. Phone numbers
 * must be valid in `country`, unless they start with their own `+` code; other
 * configs follow their regex when they have one. Only orders and enables rows:
 * it never starts a search.
 */
export function checkIdentifier(
  config: PatientIdentifierConfig,
  text: string,
  country: Country = careConfig.defaultCountry.code,
): IdentifierCheck {
  const trimmed = text.trim();
  const plain = { value: trimmed, display: trimmed, detected: false };
  if (isPhoneConfig(config)) {
    if (!isNumericText(trimmed)) return { status: "unlikely", ...plain };
    if (!isValidPhoneNumber(trimmed, country))
      return { status: "incomplete", ...plain };
    const phone = parsePhoneNumber(trimmed, country);
    return {
      status: "complete",
      value: phone?.number ?? trimmed,
      display: phone?.formatInternational() ?? trimmed,
      detected: true,
    };
  }
  const regex = config.config.regex ? fullMatch(config.config.regex) : null;
  if (!regex) return { status: "complete", ...plain };
  if (regex.test(trimmed))
    return { status: "complete", ...plain, detected: true };
  // A partly typed number for a numeric identifier, such as ABHA.
  const numericRule = /\\d|\[0-9\]/.test(config.config.regex);
  return {
    status: numericRule && isNumericText(trimmed) ? "incomplete" : "unlikely",
    ...plain,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The patient id in a scanned code: a UUID, or JSON with a `uuid`, as the
 * patient QR scan dialog reads it. `null` when it doesn't look like one.
 */
export function scannedPatientId(text: string): string | null {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.uuid === "string") return parsed.uuid;
  } catch {
    // Not JSON.
  }
  return UUID.test(trimmed) ? trimmed : null;
}
