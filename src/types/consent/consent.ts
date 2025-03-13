import { UserBase } from "@/types/user/user";

export const CONSENT_CATEGORY_TYPES = [
  {
    id: "research",
    label: "Research",
    desc: "Consent to participate in research protocol and information sharing",
  },
  {
    id: "patient_privacy",
    label: "Privacy Consent",
    desc: "Consent to collect, access, use or disclose (share) information",
  },
  {
    id: "treatment",
    label: "Treatment",
    desc: "Consent to undergo a specific treatment",
  },
  {
    id: "dnr",
    label: "Do Not Resuscitate",
    desc: "Consent to not receive CPR or resuscitation initiated in case of a cardiac event",
  },
  {
    id: "acd",
    label: "Advance Directive",
    desc: "Consent given in anticipation of a potential need for medical treatment",
  },
  {
    id: "adr",
    label: "Advance Care Directive",
    desc: "Consent for actions to be taken if they are no longer able to make decisions for themselves",
  },
] as const;

export type ConsentCategory = (typeof CONSENT_CATEGORY_TYPES)[number]["id"];

export const CONSENT_CATEGORIES = CONSENT_CATEGORY_TYPES.map(
  (category) => category.id,
) as [(typeof CONSENT_CATEGORY_TYPES)[number]["id"]];

export const CONSENT_STATUS_TYPES = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "draft", label: "Draft" },
  { id: "not_done", label: "Not Done" },
  { id: "entered_in_error", label: "Entered in Error" },
] as const;

export const CONSENT_STATUSES = CONSENT_STATUS_TYPES.map(
  (status) => status.id,
) as [(typeof CONSENT_STATUS_TYPES)[number]["id"]];

export type ConsentStatus = (typeof CONSENT_STATUS_TYPES)[number]["id"];

export const VERIFICATION_TYPE_TYPES = [
  { id: "family", label: "Family" },
  { id: "validation", label: "Validation" },
] as const;

export const VERIFICATION_TYPES = VERIFICATION_TYPE_TYPES.map(
  (type) => type.id,
) as [(typeof VERIFICATION_TYPE_TYPES)[number]["id"]];

export type VerificationType = (typeof VERIFICATION_TYPE_TYPES)[number]["id"];

export const CONSENT_DECISION_TYPES = [
  { id: "permit", label: "Permit" },
  { id: "deny", label: "Deny" },
] as const;

export const CONSENT_DECISIONS = CONSENT_DECISION_TYPES.map(
  (decision) => decision.id,
) as [(typeof CONSENT_DECISION_TYPES)[number]["id"]];

export type ConsentDecision = (typeof CONSENT_DECISION_TYPES)[number]["id"];

export interface ConsentPeriod {
  start?: Date;
  end?: Date;
}

export interface ConsentVerification {
  verified: boolean;
  verified_by: UserBase;
  verification_date: string;
  verification_type: VerificationType;
}

export interface ConsentModel {
  id: string;
  external_id: string;
  status: ConsentStatus;
  category: ConsentCategory;
  date: Date;
  period: ConsentPeriod;
  encounter: string;
  decision: ConsentDecision;
  source_attachments: File[];
  verification_details: ConsentVerification[];
}

export type CreateConsentRequest = Omit<ConsentModel, "id" | "external_id">;

export type UpdateConsentRequest = Partial<CreateConsentRequest>;

export type ConsentResponse = ConsentModel;

export interface ConsentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ConsentModel[];
}
