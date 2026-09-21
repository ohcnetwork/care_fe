import assert from "node:assert/strict";
import { before, test } from "node:test";

import i18next from "i18next";

import {
  dateQueryString,
  dateTimeQueryString,
  formatDateTime,
  formatPatientAge,
  formatPatientAgeBreakdown,
  isUserOnline,
  isValidDate,
  parseDate,
  parseLocalDate,
  relativeDate,
  relativeTime,
} from "@/Utils/date";
import { formatDateTime as commonFormatDateTime } from "@/common/utils";
import type { PatientRead } from "@/types/emr/patient/patient";

before(async () => {
  await i18next.init({
    lng: "en",
    resources: {
      en: {
        translation: {
          today: "Today",
          age_years: "{{count}} years",
          age_months: "{{count}} months",
          age_weeks: "{{count}} weeks",
          age_days: "{{count}} days",
          age_years_short: "{{count}}Y",
          age_months_short: "{{count}}M",
        },
      },
    },
  });
});

const patient = (birth: string | undefined, end: string) =>
  ({
    date_of_birth: birth,
    year_of_birth: 2000,
    deceased_datetime: end,
  }) as PatientRead;

test("date-only inputs remain local calendar dates", () => {
  const date = parseDate("2024-02-29");
  assert.equal(date.getFullYear(), 2024);
  assert.equal(date.getMonth(), 1);
  assert.equal(date.getDate(), 29);
  assert.equal(date.getHours(), 0);
  assert.equal(dateQueryString(date), "2024-02-29");
  assert.equal(parseLocalDate("2024-02-29")?.getTime(), date.getTime());
  assert.equal(parseLocalDate(), undefined);
});

test("offset timestamps retain their instant and Date inputs are cloned", () => {
  const date = parseDate("2024-03-01T00:30:00+05:30");
  assert.equal(date.toISOString(), "2024-02-29T19:00:00.000Z");
  assert.notEqual(parseDate(date), date);
  assert.equal(parseDate(date.getTime()).getTime(), date.getTime());
  assert.equal(parseDate(date.toString()).getTime(), date.getTime());
});

test("formatters preserve midnight, time, literal and meridiem formatting", () => {
  assert.equal(formatDateTime("2024-02-29"), "29/02/2024");
  assert.equal(formatDateTime("2024-02-29T13:05:00"), "01:05 PM; 29/02/2024");
  assert.equal(commonFormatDateTime("2024-02-29"), "Feb 29, 2024");
  assert.equal(
    commonFormatDateTime("2024-02-29T13:05:00"),
    "Feb 29, 2024, 01:05 PM",
  );
  assert.equal(
    formatDateTime("2024-02-29T13:05:00", "MMMM d, yyyy 'at' h:mm a"),
    "February 29, 2024 at 1:05 PM",
  );
  assert.equal(formatDateTime("2024-02-29T13:05:00", "hh:mm aaa"), "01:05 pm");
});

test("invalid or absent query values do not throw or produce filter dates", () => {
  for (const value of [undefined, null, "", "not-a-date", new Date(NaN)]) {
    assert.equal(dateQueryString(value), "");
    assert.equal(dateTimeQueryString(value), "");
  }
  assert.equal(formatDateTime("not-a-date"), "Invalid Date");
  assert.equal(commonFormatDateTime(null), "Invalid Date");
  assert.equal(relativeDate("not-a-date"), "Invalid Date");
  assert.equal(relativeTime(null), "Invalid Date");
});

test("date filters use next local midnight, including both DST transitions", () => {
  for (const [year, month, day] of [
    [2024, 2, 10],
    [2024, 10, 3],
    [2024, 11, 31],
  ]) {
    const date = new Date(year, month, day, 14, 30);
    const original = date.getTime();
    assert.equal(
      dateTimeQueryString(date),
      new Date(year, month, day).toISOString(),
    );
    assert.equal(
      dateTimeQueryString(date, true),
      new Date(year, month, day + 1).toISOString(),
    );
    assert.equal(date.getTime(), original);
  }
});

test("date-field validation rejects incomplete, overflowing and non-leap dates", () => {
  assert.equal(isValidDate("2024", "02", "29"), true);
  assert.equal(isValidDate("2000", "02", "29"), true);
  for (const [year, month, day] of [
    ["2023", "02", "29"],
    ["1900", "02", "29"],
    ["2024", "04", "31"],
    ["2024", "13", "01"],
    ["2024", "00", "01"],
    ["2024", "01", "00"],
    ["2024", "2", "09"],
    ["2024", "02", "9"],
    ["24", "02", "09"],
    ["", "02", "09"],
  ]) {
    assert.equal(
      isValidDate(year, month, day),
      false,
      `${year}-${month}-${day}`,
    );
  }
});

test("relative dates preserve today, suffix control and future direction", (context) => {
  const now = new Date(2024, 5, 15, 12);
  context.mock.timers.enable({ apis: ["Date"], now });
  assert.equal(relativeDate(new Date(2024, 5, 15)), "Today");
  assert.equal(relativeTime(new Date(2024, 5, 15, 11, 50)), "10 minutes ago");
  assert.equal(relativeDate(new Date(2024, 5, 15, 11, 50), true), "10 minutes");
  assert.equal(relativeTime(new Date(2024, 5, 15, 12, 10)), "in 10 minutes");
  assert.equal(relativeTime(), "less than a minute ago");
});

test("online status keeps a strict five-minute cutoff", (context) => {
  const now = new Date(2024, 5, 15, 12);
  context.mock.timers.enable({ apis: ["Date"], now });
  assert.equal(
    isUserOnline({ last_login: new Date(now.getTime() - 299999) }),
    true,
  );
  assert.equal(
    isUserOnline({ last_login: new Date(now.getTime() - 300000) }),
    false,
  );
  assert.equal(isUserOnline({ last_login: undefined }), false);
  assert.equal(isUserOnline({ last_login: "invalid" }), false);
});

test("patient age retains neonatal, pediatric, adult and deceased boundaries", () => {
  for (const [birth, end, expected] of [
    ["2024-01-01", "2024-01-29", "28 days"],
    ["2024-01-01", "2024-01-30", "4 weeks 1 days"],
    ["2023-01-01", "2024-01-02", "12 months 1 days"],
    ["2022-01-01", "2024-01-01", "2 years"],
    ["2022-01-01", "2024-02-01", "2 years 1 months"],
    ["2006-01-01", "2024-01-01", "18 years"],
    ["2024-02-29", "2025-02-28", "12 months"],
    ["2023-01-30", "2024-02-28", "12 months 29 days"],
    ["2024-03-09", "2024-03-11", "2 days"],
  ]) {
    assert.equal(
      formatPatientAge(patient(birth, end)),
      expected,
      `${birth} to ${end}`,
    );
  }
  assert.equal(
    formatPatientAge(patient("2022-01-01", "2024-02-01"), true),
    "2Y 1M",
  );
  assert.equal(
    formatPatientAge(patient(undefined, "2024-02-01")),
    "2000 (24Y)",
  );
});

test("age breakdown clamps leap-day and month-end anniversaries", () => {
  assert.equal(
    formatPatientAgeBreakdown(patient("2024-02-29", "2025-02-28")),
    "1 years",
  );
  assert.equal(
    formatPatientAgeBreakdown(patient("2024-01-30", "2024-02-28")),
    "29 days",
  );
  assert.equal(
    formatPatientAgeBreakdown(patient("2024-01-31", "2024-02-29")),
    "1 months",
  );
  assert.equal(
    formatPatientAgeBreakdown(patient("2022-01-01", "2024-02-03")),
    "2 years, 1 months, 2 days",
  );
  assert.equal(
    formatPatientAgeBreakdown(patient(undefined, "2024-02-03")),
    null,
  );
});
