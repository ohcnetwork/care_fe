export const ContactPointSystems = [
  "phone",
  "fax",
  "email",
  "pager",
  "url",
  "sms",
  "other",
] as const;

export type ContactPointSystem = (typeof ContactPointSystems)[number];

export const ContactPointUses = [
  "home",
  "work",
  "temp",
  "old",
  "mobile",
] as const;

export type ContactPointUse = (typeof ContactPointUses)[number];

export interface ContactPoint {
  system: ContactPointSystem;
  value: string;
  use: ContactPointUse;
}
