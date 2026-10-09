import assert from "node:assert/strict";
import { test } from "node:test";

import { createStore } from "jotai";

import {
  errorsAtom,
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { Question } from "@/types/questionnaire/question";

import type { FillFormEntry } from "./formSession";
import { applySetResponse } from "./useFillActions";

function temporalForm(type: "date" | "dateTime" | "time") {
  const question: Question = {
    id: "temporal",
    link_id: "temporal",
    text: "Recorded at",
    type,
    repeats: true,
  };
  const forms: FillFormEntry[] = [
    {
      key: "form",
      isPrimary: true,
      questionnaire: {
        id: "form",
        slug: "form",
        title: "Clinical note",
        version: "1",
        status: "active",
        subject_type: "encounter",
        questions: [question],
      },
    },
  ];
  const store = createStore();
  store.set(responsesAtom, initializeResponses([question]));
  return {
    store,
    fill(values: (string | number | boolean)[]) {
      return applySetResponse(
        { link_id: question.link_id, values },
        forms,
        () => store,
      );
    },
  };
}

test("date answers preserve the local calendar day on both sides of UTC", async () => {
  const previousTimezone = process.env.TZ;
  try {
    for (const timezone of ["America/Los_Angeles", "Asia/Kolkata"]) {
      process.env.TZ = timezone;
      const { store, fill } = temporalForm("date");
      assert.deepEqual(await fill(["2024-02-29"]), { ok: true });
      const entry = store.get(responsesAtom).temporal.values[0];
      assert.equal(entry.type, "date");
      assert.ok(entry.value instanceof Date);
      assert.deepEqual(
        [
          entry.value.getFullYear(),
          entry.value.getMonth(),
          entry.value.getDate(),
          entry.value.getHours(),
          entry.value.getMinutes(),
        ],
        [2024, 1, 29, 0, 0],
        timezone,
      );
    }
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test("date answers reject impossible, ambiguous, and datetime values atomically", async () => {
  const { store, fill } = temporalForm("date");
  assert.deepEqual(await fill(["2026-09-08"]), { ok: true });
  const responses = store.get(responsesAtom);
  const errors = [{ question_id: "temporal", error: "Previous error" }];
  store.set(errorsAtom, errors);

  for (const invalid of [
    "2026-02-29",
    "2026-02-30",
    "2026-04-31",
    "2026-13-01",
    "2026-09-08T10:30:00Z",
    "09/08/2026",
    "2026",
    1,
  ]) {
    assert.equal(
      (await fill(["2026-09-09", invalid])).ok,
      false,
      String(invalid),
    );
    assert.equal(store.get(responsesAtom), responses);
    assert.equal(store.get(errorsAtom), errors);
  }
});

test("datetime answers retain explicit offsets and interpret unzoned input locally", async () => {
  const previousTimezone = process.env.TZ;
  try {
    process.env.TZ = "Asia/Kolkata";
    const { store, fill } = temporalForm("dateTime");
    assert.deepEqual(
      await fill([
        "2026-09-08T10:30",
        "2026-09-08T10:30:45+05:30",
        "2026-09-08T05:00:45.125Z",
      ]),
      { ok: true },
    );
    assert.deepEqual(
      store.get(responsesAtom).temporal.values.map((entry) => {
        assert.equal(entry.type, "dateTime");
        assert.ok(entry.value instanceof Date);
        return entry.value.toISOString();
      }),
      [
        "2026-09-08T05:00:00.000Z",
        "2026-09-08T05:00:45.000Z",
        "2026-09-08T05:00:45.125Z",
      ],
    );
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test("datetime answers require both a valid date and a valid time", async () => {
  const { store, fill } = temporalForm("dateTime");
  assert.deepEqual(await fill(["2026-09-08T10:30:00Z"]), { ok: true });
  const responses = store.get(responsesAtom);
  for (const invalid of [
    "2026-09-08",
    "10:30",
    "2026-02-30T10:30:00Z",
    "2026-02-29T10:30:00+05:30",
    "2026-09-08T24:00:00Z",
    "2026-09-08T10:60:00Z",
    "2026-09-08T10:30:00+25:00",
    1,
  ]) {
    assert.equal((await fill([invalid])).ok, false, String(invalid));
    assert.equal(store.get(responsesAtom), responses);
  }
});

test("time answers stay clock strings with optional seconds", async () => {
  const { store, fill } = temporalForm("time");
  const values = ["00:00", "10:30", "23:59:59"];
  assert.deepEqual(await fill(values), { ok: true });
  assert.deepEqual(
    store.get(responsesAtom).temporal.values,
    values.map((value) => ({ type: "time", value })),
  );

  const responses = store.get(responsesAtom);
  for (const invalid of [
    "24:00",
    "12:60",
    "12:30:60",
    "9:30",
    "10:30 PM",
    "2026-09-08T10:30:00Z",
    "2026-09-08",
  ]) {
    assert.equal((await fill([invalid])).ok, false, invalid);
    assert.equal(store.get(responsesAtom), responses);
  }
});
