import assert from "node:assert/strict";
import { test } from "node:test";

import { format, isSameDay } from "date-fns";

import { parseLocalDate } from "@/Utils/date";
import { isDateInRange } from "@/pages/Scheduling/utils";

import {
  clinicCalendarYmd,
  formatSchedulingDateTime,
  formatSchedulingTimeRange,
  getClinicShortDateRangeOptions,
  getClinicTodayYmd,
  getSchedulingTimeZoneAbbreviation,
  getSchedulingTimeZoneSuffix,
  shouldShowSchedulingTimeZoneHint,
  timeZonesMatchForInstant,
} from "./schedulingTimeZone";

const at = new Date("2026-09-30T09:40:00.000Z");

test("Kolkata and Calcutta aliases match for hint purposes", () => {
  assert.equal(
    timeZonesMatchForInstant(at, "Asia/Kolkata", "Asia/Calcutta"),
    true,
  );
  assert.equal(
    shouldShowSchedulingTimeZoneHint("Asia/Kolkata", "Asia/Calcutta", at),
    false,
  );
});

test("US viewer still sees hint against Kolkata scheduling zone", () => {
  assert.equal(
    shouldShowSchedulingTimeZoneHint("Asia/Kolkata", "America/Los_Angeles", at),
    true,
  );
});

test("timezone suffix is empty when viewer matches clinic zone", () => {
  assert.equal(
    getSchedulingTimeZoneSuffix(
      "Asia/Kolkata",
      new Date("2026-09-30T04:30:00.000Z"),
      "Asia/Kolkata",
    ),
    "",
  );
});

test("timezone suffix shows IST for remote viewers of Kolkata clinic", () => {
  assert.equal(
    getSchedulingTimeZoneSuffix(
      "Asia/Kolkata",
      new Date("2026-09-30T04:30:00.000Z"),
      "Pacific/Auckland",
    ),
    " IST",
  );
});

test("Kolkata abbreviation is IST", () => {
  assert.equal(
    getSchedulingTimeZoneAbbreviation(
      "Asia/Kolkata",
      new Date("2026-09-30T04:30:00.000Z"),
    ),
    "IST",
  );
});

test("formatSchedulingDateTime appends IST for remote viewers", () => {
  assert.equal(
    formatSchedulingDateTime(
      "2026-09-30T04:30:00.000Z",
      "HH:mm",
      "Asia/Kolkata",
      "Pacific/Auckland",
    ),
    "10:00 IST",
  );
});

test("formatSchedulingDateTime omits suffix when viewer matches clinic", () => {
  assert.equal(
    formatSchedulingDateTime(
      "2026-09-30T04:30:00.000Z",
      "HH:mm",
      "Asia/Kolkata",
      "Asia/Kolkata",
    ),
    "10:00",
  );
});

test("formatSchedulingTimeRange appends suffix once", () => {
  assert.equal(
    formatSchedulingTimeRange(
      "2026-09-30T04:30:00.000Z",
      "2026-09-30T04:50:00.000Z",
      "h:mm a",
      "Asia/Kolkata",
      "Pacific/Auckland",
    ),
    "10:00 AM - 10:20 AM IST",
  );
});

test("clinic today YMD follows scheduling zone not viewer clock", () => {
  // Wellington Oct 1 morning, India still Sep 30 evening
  const whenWellingtonIsAhead = new Date("2026-09-30T18:00:00.000Z");
  assert.equal(
    getClinicTodayYmd("Asia/Kolkata", whenWellingtonIsAhead),
    "2026-09-30",
  );
  assert.equal(
    getClinicTodayYmd("Pacific/Auckland", whenWellingtonIsAhead),
    "2026-10-01",
  );
});

test("clinic presets use India today while Wellington is already tomorrow", () => {
  // Wellington Oct 1 morning, India still Sep 30 evening
  const whenWellingtonIsAhead = new Date("2026-09-30T18:00:00.000Z");
  const options = getClinicShortDateRangeOptions(
    "Asia/Kolkata",
    whenWellingtonIsAhead,
  );
  const today = options.find((option) => option.label === "today")!;
  const tomorrow = options.find((option) => option.label === "tomorrow")!;

  assert.equal(format(today.getDateRange().from!, "yyyy-MM-dd"), "2026-09-30");
  assert.equal(
    format(tomorrow.getDateRange().from!, "yyyy-MM-dd"),
    "2026-10-01",
  );
  assert.equal(
    isSameDay(today.getDateRange().from!, parseLocalDate("2026-09-30")!),
    true,
  );
  assert.equal(
    isSameDay(tomorrow.getDateRange().from!, parseLocalDate("2026-10-01")!),
    true,
  );
});

test("date-only schedule bounds stay on that calendar day", () => {
  assert.equal(clinicCalendarYmd("2026-10-05", "Asia/Kolkata"), "2026-10-05");
  assert.equal(
    isDateInRange(
      parseLocalDate("2026-10-05")!,
      "2026-10-05",
      "2026-10-05",
      "Asia/Kolkata",
    ),
    true,
  );
});

test("a midnight IST instant counts as the clinic day, not the UTC day", () => {
  // 2026-10-05 00:00 IST
  const midnightIst = "2026-10-04T18:30:00Z";
  assert.equal(clinicCalendarYmd(midnightIst, "Asia/Kolkata"), "2026-10-05");
  assert.equal(
    isDateInRange(
      parseLocalDate("2026-10-05")!,
      midnightIst,
      midnightIst,
      "Asia/Kolkata",
    ),
    true,
  );
  assert.equal(
    isDateInRange(
      parseLocalDate("2026-10-04")!,
      midnightIst,
      midnightIst,
      "Asia/Kolkata",
    ),
    false,
  );
});
