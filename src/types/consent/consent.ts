import { FileRead } from "@/types/files/file";
import { UserReadMinimal } from "@/types/user/user";

export const CONSENT_CATEGORIES = [
  "research",
  "patient_privacy",
  "treatment",
  "dnr",
  "acd",
  "adr",
] as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export const CONSENT_STATUSES = [
  "active",
  "inactive",
  "draft",
  "not_done",
  "entered_in_error",
] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export const VERIFICATION_TYPES = ["family", "validation"] as const;

export type VerificationType = (typeof VERIFICATION_TYPES)[number];

export const CONSENT_DECISIONS = ["permit", "deny"] as const;

export type ConsentDecision = (typeof CONSENT_DECISIONS)[number];

export interface ConsentPeriod {
  start: Date | null;
  end: Date | null;
}

export interface ConsentVerification {
  verified: boolean;
  verified_by: UserReadMinimal;
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
  source_attachments: FileRead[];
  verification_details: ConsentVerification[];
  note?: string;
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
