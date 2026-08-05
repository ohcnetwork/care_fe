import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { describe, it } from "node:test";

import { formatCalendarDate } from "./calendarDate";

describe("formatCalendarDate", () => {
  it("renders a missing or unparseable value as an empty string", () => {
    assert.equal(formatCalendarDate(undefined, "d MMM, yyyy"), "");
    assert.equal(formatCalendarDate(null, "d MMM, yyyy"), "");
    assert.equal(formatCalendarDate("", "d MMM, yyyy"), "");
    assert.equal(formatCalendarDate("not-a-date", "d MMM, yyyy"), "");
  });

  it("renders the calendar day the value names, on every clock", () => {
    // The two shapes a date-only row value takes — the bare date the native
    // `<input type="date">` writes, and the UTC-midnight instant the wire
    // carries for the same day — must both render as that day next to the
    // input showing it. Pin the timezone in a CHILD process: `TZ` is read
    // once at process start, so it cannot be set from inside this one.
    // Kiritimati (+14) and New York (-5) straddle UTC, so a value resolved
    // on the browser's clock lands on a different day in one of them.
    const moduleUrl = new URL("./calendarDate.ts", import.meta.url).href;
    const script = `
      const assert = (await import("node:assert/strict")).default;
      const { formatCalendarDate } = await import(${JSON.stringify(moduleUrl)});
      for (const value of ["2026-08-01", "2026-08-01T00:00:00.000Z", "2026-08-01T00:00:00+05:30"]) {
        assert.equal(formatCalendarDate(value, "MMM d, yyyy"), "Aug 1, 2026");
        assert.equal(formatCalendarDate(value, "dd MMM yyyy"), "01 Aug 2026");
      }
      assert.equal(formatCalendarDate("2027-01-01", "d MMM, yyyy"), "1 Jan, 2027");
      assert.equal(formatCalendarDate("2026-03-15T23:59:59.000Z", "d MMM, yyyy"), "15 Mar, 2026");
    `;
    for (const tz of ["America/New_York", "Pacific/Kiritimati", "UTC"]) {
      execFileSync(
        process.execPath,
        ["--import", "tsx", "--input-type=module", "-e", script],
        { env: { ...process.env, TZ: tz }, stdio: "pipe" },
      );
    }
  });
});
