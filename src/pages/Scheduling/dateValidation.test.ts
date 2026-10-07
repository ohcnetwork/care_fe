import assert from "node:assert/strict";
import { test } from "node:test";

import { format, isBefore, parseISO, startOfDay } from "date-fns";

import {
  isScheduleStartTimeInFutureInZone,
  isScheduleTimeBefore,
} from "./dateValidation";

test("a day before the clinic day is not a future start time", () => {
  const now = new Date("2026-10-07T04:30:00Z");
  assert.equal(
    isScheduleStartTimeInFutureInZone(
      parseISO("2026-10-06"),
      "09:00",
      "Asia/Kolkata",
      now,
    ),
    false,
  );
});

test("clinic start time uses the zone clock during a viewer DST gap", () => {
  const originalTimezone = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    const now = new Date("2026-03-07T21:00:00Z");
    const selected = parseISO("2026-03-08");
    assert.equal(
      isScheduleStartTimeInFutureInZone(selected, "03:00", "Asia/Kolkata", now),
      true,
    );
    assert.equal(
      isScheduleStartTimeInFutureInZone(selected, "02:30", "Asia/Kolkata", now),
      false,
    );
    assert.equal(
      isScheduleStartTimeInFutureInZone(
        selected,
        "invalid",
        "Asia/Kolkata",
        now,
      ),
      false,
    );
  } finally {
    if (originalTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimezone;
    }
  }
});

for (const timezone of ["UTC", "America/New_York", "Asia/Kolkata"]) {
  test(`schedule validation uses local days and wall-clock times in ${timezone}`, (context) => {
    const originalTimezone = process.env.TZ;
    process.env.TZ = timezone;

    try {
      assert.equal(isScheduleTimeBefore("00:00", "23:59"), true);
      assert.equal(isScheduleTimeBefore("09:00", "10:00"), true);
      assert.equal(isScheduleTimeBefore("09:00", "09:00"), false);
      assert.equal(isScheduleTimeBefore("23:59", "00:00"), false);
      assert.equal(isScheduleTimeBefore(undefined, "10:00"), false);
      assert.equal(isScheduleTimeBefore("09:00", undefined), false);
      assert.equal(isScheduleTimeBefore("", "10:00"), false);
      assert.equal(isScheduleTimeBefore("invalid", "10:00"), false);
      assert.equal(isScheduleTimeBefore("24:00", "10:00"), false);

      // Include US spring-forward/fall-back dates and a year boundary.
      for (const date of ["2026-03-08", "2026-11-01", "2026-12-31"]) {
        const selectedDate = parseISO(date);
        const now = parseISO(`${date}T09:30:30`);
        assert.equal(format(selectedDate, "yyyy-MM-dd"), date);
        assert.equal(selectedDate.getHours(), 0);
        assert.equal(
          isBefore(startOfDay(selectedDate), startOfDay(now)),
          false,
        );

        assert.equal(
          isScheduleStartTimeInFutureInZone(
            selectedDate,
            "09:30",
            timezone,
            now,
          ),
          false,
        );
        assert.equal(
          isScheduleStartTimeInFutureInZone(
            selectedDate,
            "09:31",
            timezone,
            now,
          ),
          true,
        );
        assert.equal(
          isScheduleStartTimeInFutureInZone(
            selectedDate,
            "invalid",
            timezone,
            now,
          ),
          false,
        );
        assert.equal(
          isScheduleStartTimeInFutureInZone(
            selectedDate,
            "09:30",
            timezone,
            parseISO(`${date}T09:30:00`),
          ),
          false,
        );
      }

      context.mock.timers.enable({
        apis: ["Date"],
        now: parseISO("2026-03-08T01:00:00"),
      });
      assert.equal(isScheduleTimeBefore("02:30", "03:00"), true);
      assert.equal(
        isScheduleStartTimeInFutureInZone(
          parseISO("2026-03-08"),
          "01:01",
          timezone,
          new Date(),
        ),
        true,
      );
      context.mock.timers.reset();

      const now = parseISO("2026-03-08T23:59:59");
      assert.equal(
        isScheduleStartTimeInFutureInZone(
          parseISO("2026-03-07"),
          "09:00",
          timezone,
          now,
        ),
        false,
      );
      assert.equal(
        isScheduleStartTimeInFutureInZone(
          parseISO("2026-03-09"),
          "00:00",
          timezone,
          now,
        ),
        true,
      );
      assert.equal(
        isBefore(startOfDay(parseISO("2026-03-07")), startOfDay(now)),
        true,
      );
    } finally {
      if (originalTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimezone;
      }
    }
  });
}
