import type { TFunction } from "i18next";

import dayjs from "@/Utils/dayjs";
import { TagConfig, TagExpiryOffset } from "@/types/emr/tagConfig/tagConfig";

export const TAG_EXPIRY_OFFSET_UNITS = [
  "days",
  "hours",
  "minutes",
  "seconds",
] as const;

/** Units offered for editing; `seconds` is kept but only settable via the API. */
export const TAG_EXPIRY_OFFSET_INPUT_UNITS = [
  "days",
  "hours",
  "minutes",
] as const;

/**
 * Reads the expiry of a tag set on a resource. The backend writes it with
 * Python's `str(datetime)` ("YYYY-MM-DD HH:MM:SS.ffffff+HH:MM"), which not every
 * browser's Date parser accepts, so it is normalised to ISO 8601 first.
 */
export function getTagExpiry(tag: TagConfig) {
  if (!tag.expiry) return undefined;
  const expiry = dayjs(
    tag.expiry.replace(" ", "T").replace(/(\.\d{3})\d+/, "$1"),
  );
  return expiry.isValid() ? expiry : undefined;
}

export function isTagExpired(tag: TagConfig) {
  return !!tag.expired || !!getTagExpiry(tag)?.isBefore(dayjs());
}

export function hasExpiryOffset(offset?: TagExpiryOffset) {
  return TAG_EXPIRY_OFFSET_UNITS.some((unit) => (offset?.[unit] ?? 0) > 0);
}

const SECONDS_PER_UNIT = {
  days: 86400,
  hours: 3600,
  minutes: 60,
  seconds: 1,
} as const;

/** Longest accepted expiry; far longer offsets overflow the backend's date math. */
export const MAX_TAG_EXPIRY_DAYS = 3650;

export function isExpiryOffsetTooLong(offset?: TagExpiryOffset) {
  const totalSeconds = TAG_EXPIRY_OFFSET_UNITS.reduce(
    (sum, unit) => sum + (offset?.[unit] ?? 0) * SECONDS_PER_UNIT[unit],
    0,
  );
  return totalSeconds > MAX_TAG_EXPIRY_DAYS * SECONDS_PER_UNIT.days;
}

/** Drops empty units so the payload only carries what the user entered. */
export function compactExpiryOffset(offset: TagExpiryOffset) {
  const compact: TagExpiryOffset = {};
  for (const unit of TAG_EXPIRY_OFFSET_UNITS) {
    if (offset[unit]) compact[unit] = offset[unit];
  }
  return compact;
}

export function formatExpiryOffset(offset: TagExpiryOffset, t: TFunction) {
  return TAG_EXPIRY_OFFSET_UNITS.filter((unit) => offset[unit])
    .map((unit) => t(`duration_${unit}`, { count: offset[unit] }))
    .join(" ");
}
