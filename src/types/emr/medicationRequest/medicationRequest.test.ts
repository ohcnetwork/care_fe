import { describe, expect, it } from "vitest";

import {
  BoundsDuration,
  getMedicationActiveWindow,
  getTimingBounds,
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
  PeriodSpec,
  TimingRange,
} from "@/types/emr/medicationRequest/medicationRequest";

type ActiveWindowFixture = Pick<
  MedicationRequestRead,
  "authored_on" | "modified_date" | "status" | "dosage_instruction"
>;

function makeInstruction(bounds?: {
  bounds_duration?: BoundsDuration;
  bounds_range?: TimingRange;
  bounds_period?: PeriodSpec;
}): MedicationRequestDosageInstruction {
  return {
    as_needed_boolean: false,
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "d",
        ...bounds,
      },
    },
  };
}

describe("getTimingBounds", () => {
  it("prefers bounds_range over bounds_period and bounds_duration", () => {
    const range: TimingRange = {
      low: { value: "3", unit: "d" },
      high: { value: "7", unit: "d" },
    };
    const bounds = getTimingBounds({
      bounds_range: range,
      bounds_period: { start: "2026-01-10T00:00:00Z" },
      bounds_duration: { value: "5", unit: "d" },
    });
    expect(bounds).toEqual({ type: "range", value: range });
  });

  it("prefers bounds_period over bounds_duration when there is no bounds_range", () => {
    const period: PeriodSpec = { start: "2026-01-10T00:00:00Z" };
    const bounds = getTimingBounds({
      bounds_period: period,
      bounds_duration: { value: "5", unit: "d" },
    });
    expect(bounds).toEqual({ type: "period", value: period });
  });

  it("falls back to bounds_duration when it is the only bound set", () => {
    const duration: BoundsDuration = { value: "5", unit: "d" };
    const bounds = getTimingBounds({ bounds_duration: duration });
    expect(bounds).toEqual({ type: "duration", value: duration });
  });

  it("treats a bounds_duration of value '0' as no bound", () => {
    const bounds = getTimingBounds({
      bounds_duration: { value: "0", unit: "d" },
    });
    expect(bounds).toBeUndefined();
  });

  it("returns undefined when no bounds are set", () => {
    expect(getTimingBounds({})).toBeUndefined();
    expect(getTimingBounds(undefined)).toBeUndefined();
  });
});

describe("getMedicationActiveWindow", () => {
  it("uses bounds_period.start/end as local midnight / local end-of-day (day-rollover regression test)", () => {
    const request: ActiveWindowFixture = {
      authored_on: "2026-01-01T00:00:00Z",
      modified_date: "2026-01-01T00:00:00Z",
      status: "active",
      dosage_instruction: [
        makeInstruction({
          bounds_period: {
            start: "2026-01-10T00:00:00Z",
            end: "2026-01-25T00:00:00Z",
          },
        }),
      ],
    };
    const { start, end } = getMedicationActiveWindow(request);

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(0); // January
    expect(start.getDate()).toBe(10);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);

    expect(end).toBeDefined();
    expect(end!.getFullYear()).toBe(2026);
    expect(end!.getMonth()).toBe(0); // January
    expect(end!.getDate()).toBe(25);
    // The regression this guards against: naively parsing the end date as UTC
    // midnight would roll over to day 26 for UTC+ local timezones. Anchoring
    // to LOCAL end-of-day keeps it on day 25 regardless of the runner's TZ.
    expect(end!.getHours()).toBe(23);
    expect(end!.getMinutes()).toBe(59);
    expect(end!.getSeconds()).toBe(59);
  });

  it("anchors a bounds_duration window to authored_on and adds the duration in hours", () => {
    const request: ActiveWindowFixture = {
      authored_on: "2026-01-10T08:00:00Z",
      modified_date: "2026-01-10T08:00:00Z",
      status: "active",
      dosage_instruction: [
        makeInstruction({ bounds_duration: { value: "5", unit: "d" } }),
      ],
    };
    const { start, end } = getMedicationActiveWindow(request);

    expect(start.getTime()).toBe(new Date("2026-01-10T08:00:00Z").getTime());
    expect(end).toBeDefined();
    expect(end!.getTime() - start.getTime()).toBe(120 * 3_600_000); // 5 days
  });

  it("uses the high end of a bounds_range for the window end", () => {
    const request: ActiveWindowFixture = {
      authored_on: "2026-01-10T08:00:00Z",
      modified_date: "2026-01-10T08:00:00Z",
      status: "active",
      dosage_instruction: [
        makeInstruction({
          bounds_range: {
            low: { value: "3", unit: "d" },
            high: { value: "7", unit: "d" },
          },
        }),
      ],
    };
    const { start, end } = getMedicationActiveWindow(request);

    expect(end).toBeDefined();
    expect(end!.getTime() - start.getTime()).toBe(7 * 24 * 3_600_000);
  });

  it("is open-ended (end undefined) when no bound is set", () => {
    const request: ActiveWindowFixture = {
      authored_on: "2026-01-10T08:00:00Z",
      modified_date: "2026-01-10T08:00:00Z",
      status: "active",
      dosage_instruction: [makeInstruction()],
    };
    const { end } = getMedicationActiveWindow(request);
    expect(end).toBeUndefined();
  });

  it("is open-ended when there is no dosage_instruction at all", () => {
    const request: ActiveWindowFixture = {
      authored_on: "2026-01-10T08:00:00Z",
      modified_date: "2026-01-10T08:00:00Z",
      status: "active",
      dosage_instruction: [],
    };
    const { end } = getMedicationActiveWindow(request);
    expect(end).toBeUndefined();
  });

  it("unions multiple dosage instructions to the earliest start and latest end", () => {
    const request: ActiveWindowFixture = {
      authored_on: "2026-01-01T00:00:00Z",
      modified_date: "2026-01-01T00:00:00Z",
      status: "active",
      dosage_instruction: [
        makeInstruction({
          bounds_period: {
            start: "2026-01-10T00:00:00Z",
            end: "2026-01-15T00:00:00Z",
          },
        }),
        makeInstruction({
          bounds_period: {
            start: "2026-01-12T00:00:00Z",
            end: "2026-01-20T00:00:00Z",
          },
        }),
      ],
    };
    const { start, end } = getMedicationActiveWindow(request);

    expect(start.getDate()).toBe(10);
    expect(end).toBeDefined();
    expect(end!.getDate()).toBe(20);
    expect(end!.getHours()).toBe(23);
  });

  it("is open-ended overall when any one instruction is open-ended, even if another is bounded", () => {
    const request: ActiveWindowFixture = {
      authored_on: "2026-01-01T00:00:00Z",
      modified_date: "2026-01-01T00:00:00Z",
      status: "active",
      dosage_instruction: [
        makeInstruction({
          bounds_period: {
            start: "2026-01-10T00:00:00Z",
            end: "2026-01-15T00:00:00Z",
          },
        }),
        makeInstruction(), // no bounds -> open-ended
      ],
    };
    const { end } = getMedicationActiveWindow(request);
    expect(end).toBeUndefined();
  });

  it("clamps the end to modified_date when an inactive request was stopped before its scheduled end", () => {
    const request: ActiveWindowFixture = {
      authored_on: "2026-01-01T00:00:00Z",
      modified_date: "2026-01-18T10:00:00Z",
      status: "ended",
      dosage_instruction: [
        makeInstruction({
          bounds_period: {
            start: "2026-01-01T00:00:00Z",
            end: "2026-01-25T00:00:00Z",
          },
        }),
      ],
    };
    const { end } = getMedicationActiveWindow(request);
    expect(end).toBeDefined();
    expect(end!.getTime()).toBe(new Date("2026-01-18T10:00:00Z").getTime());
  });

  it("does not extend the window when modified_date is after the scheduled end", () => {
    const request: ActiveWindowFixture = {
      authored_on: "2026-01-01T00:00:00Z",
      modified_date: "2026-01-20T10:00:00Z",
      status: "ended",
      dosage_instruction: [
        makeInstruction({
          bounds_period: {
            start: "2026-01-01T00:00:00Z",
            end: "2026-01-15T00:00:00Z",
          },
        }),
      ],
    };
    const { end } = getMedicationActiveWindow(request);
    expect(end).toBeDefined();
    // Still clamped to the scheduled end-of-day (Jan 15), not extended to the
    // later modified_date (Jan 20) — pins current behavior: modified_date
    // only ever shortens the window, never lengthens it.
    expect(end!.getDate()).toBe(15);
    expect(end!.getHours()).toBe(23);
  });
});
