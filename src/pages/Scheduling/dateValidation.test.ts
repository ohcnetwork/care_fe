import assert from "node:assert/strict";
import { test } from "node:test";

import { format, isBefore, parseISO, startOfDay } from "date-fns";

import {
  isScheduleStartTimeInFuture,
  isScheduleTimeBefore,
} from "./dateValidation";

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
          isScheduleStartTimeInFuture(selectedDate, "09:30", now),
          false,
        );
        assert.equal(
          isScheduleStartTimeInFuture(selectedDate, "09:31", now),
          true,
        );
        assert.equal(
          isScheduleStartTimeInFuture(selectedDate, "invalid", now),
          false,
        );
        assert.equal(
          isScheduleStartTimeInFuture(
            selectedDate,
            "09:30",
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
        isScheduleStartTimeInFuture(parseISO("2026-03-08"), "01:01"),
        true,
      );
      context.mock.timers.reset();

      const now = parseISO("2026-03-08T23:59:59");
      assert.equal(
        isScheduleStartTimeInFuture(parseISO("2026-03-09"), "00:00", now),
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
