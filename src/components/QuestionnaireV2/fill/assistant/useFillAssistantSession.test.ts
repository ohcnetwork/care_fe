/**
 * Wiring pin for the assistant handle itself. Every sibling spec here
 * targets a pure helper, which leaves the part that can actually break
 * untested: that BOTH write methods pass the submit-freeze gate, that the
 * phase is read off the session ref at CALL time (a handle that captured
 * it at creation would freeze the assistant for the rest of the mount and
 * still pass a pure-helper test), and that a server row is addressable at
 * all.
 *
 * `structured/registry` is replaced in the module cache below: the real
 * one pulls every structured editor — and through them `@careConfig`,
 * which reads `import.meta.env` and is undefined outside Vite — into a
 * `node --test` process. Nothing else about the hook is stubbed; the edit
 * log, projection and jotai store are the real ones.
 *
 * The jsdom bootstrap must stay the FIRST import, before anything that
 * transitively loads `react-dom`.
 */
import "@/components/QuestionnaireV2/structured/core/jsdomTestEnv";

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { createStore } from "jotai";
import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { z } from "zod";

import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";

import {
  dom,
  flushTurns,
} from "@/components/QuestionnaireV2/structured/core/jsdomTestEnv";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import type { FillFormEntry } from "@/components/QuestionnaireV2/fill/formSession";
import type { FillSubject } from "@/components/QuestionnaireV2/fill/subject";

import type { FillSessionPhase } from "./sessionPhase";
import type { FillAssistantHandle } from "./types";
import type { UseFillAssistantSessionArgs } from "./useFillAssistantSession";

const require = createRequire(import.meta.url);

const ROW_SCHEMA = z
  .object({ id: z.string().optional(), dose: z.string() })
  .strict();

const DEFINITION = {
  type: "medication_request",
  contract: 2,
  rowSchema: ROW_SCHEMA,
};

const STUBBED_TYPES = ["medication_request", "encounter"];

/** `structuredDataAny` and `projectionResponseValues` mirror the real
 *  module's own behavior — they are pure helpers there, and the handle's
 *  projection and row addressing are exactly what this file exercises. */
const registryStub = {
  __esModule: true,
  resolveStructuredType: (type: string) =>
    STUBBED_TYPES.includes(type) ? DEFINITION : undefined,
  resolveStructuredSlotState: () => ({
    kind: "ready" as const,
    definition: DEFINITION,
  }),
  structuredDataAny: (response: QuestionnaireResponse | undefined) => {
    const raw = response?.values?.[0]?.value;
    return Array.isArray(raw) ? raw : [];
  },
  projectionResponseValues: (type: string, rows: readonly unknown[]) =>
    rows.length === 0 ? [] : [{ type, value: rows }],
};

const registryPath = fileURLToPath(
  new URL("../../structured/registry.ts", import.meta.url),
);
require.cache[registryPath] = {
  id: registryPath,
  filename: registryPath,
  loaded: true,
  exports: registryStub,
} as unknown as NodeJS.Module;

const QUESTIONS: Question[] = [
  { id: "qid-note", link_id: "note", text: "Clinical note", type: "text" },
  {
    id: "qid-meds",
    link_id: "meds",
    text: "Medications",
    type: "structured",
    structured_type: "medication_request",
  },
  {
    id: "qid-encounter",
    link_id: "encounter",
    text: "Encounter",
    type: "structured",
    structured_type: "encounter",
  },
];

/** Only the fields the handle reads; the rest of `QuestionnaireRead` is
 *  server metadata no code path here touches. */
const QUESTIONNAIRE = {
  id: "form-1",
  title: "Test questionnaire",
  subject_type: "encounter",
  questions: QUESTIONS,
} as unknown as QuestionnaireRead;

const FORMS: FillFormEntry[] = [
  { key: "form-1", questionnaire: QUESTIONNAIRE, isPrimary: true },
];

const SUBJECT: FillSubject = {
  type: "encounter",
  facilityId: "fac-1",
  patientId: "pat-1",
  encounterId: "enc-1",
};

/** One medication already on the server: `toBaselineRows` keys its row by
 *  the server id and `toMedicationRow` echoes that id into the content, so
 *  this is what the projection holds for a fetched row. */
function seedResponses(
  medicationRows: unknown[],
): Record<string, QuestionnaireResponse> {
  return {
    "qid-note": {
      question_id: "qid-note",
      structured_type: null,
      link_id: "note",
      values: [],
    },
    "qid-meds": {
      question_id: "qid-meds",
      structured_type: "medication_request",
      link_id: "meds",
      values: [
        { type: "medication_request", value: medicationRows } as ResponseValue,
      ],
      edits: [],
    },
    "qid-encounter": {
      question_id: "qid-encounter",
      structured_type: "encounter",
      link_id: "encounter",
      values: [],
      edits: [],
    },
  };
}

type UseFillAssistantSession = (
  args: UseFillAssistantSessionArgs,
) => FillAssistantHandle;

let useFillAssistantSession: UseFillAssistantSession;

before(async () => {
  ({ useFillAssistantSession } = await import("./useFillAssistantSession"));
});

const mounted: Root[] = [];

after(async () => {
  await act(async () => {
    mounted.forEach((root) => root.unmount());
  });
});

function mount(medicationRows: unknown[] = [{ id: "med-1", dose: "250mg" }]) {
  const store = createStore();
  store.set(responsesAtom, seedResponses(medicationRows));

  const handleRef: { current: FillAssistantHandle | undefined } = {
    current: undefined,
  };

  function Harness({ phase }: { phase: FillSessionPhase }) {
    handleRef.current = useFillAssistantSession({
      subject: SUBJECT,
      forms: FORMS,
      getStore: (key) => (key === "form-1" ? store : undefined),
      storesVersion: 0,
      phase,
    });
    return null;
  }

  const container = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push(root);

  const render = async (phase: FillSessionPhase) => {
    await act(async () => {
      root.render(
        createElement(StrictMode, null, createElement(Harness, { phase })),
      );
      await flushTurns(3);
    });
  };

  const handle = () => {
    assert.ok(handleRef.current, "handle was not built");
    return handleRef.current;
  };

  return { store, render, handle };
}

function medsDescriptor(handle: FillAssistantHandle) {
  const descriptor = handle
    .listQuestions()
    .find((question) => question.id === "meds");
  assert.ok(descriptor?.structured, "no structured descriptor for meds");
  return descriptor.structured;
}

describe("the assistant handle's submit freeze", () => {
  it("refuses BOTH writes while the session is submitting, and accepts them again after", async () => {
    const harness = mount();
    await harness.render("editing");
    const handle = harness.handle();

    await harness.render("submitting");
    // Same handle instance across the phase change — the freeze has to
    // reach a caller that grabbed the handle before submit started.
    assert.equal(harness.handle(), handle);

    const frozenPlain = handle.setValue(undefined, "note", ["afebrile"]);
    assert.equal(frozenPlain.ok, false);
    assert.match(
      frozenPlain.ok === false ? frozenPlain.error : "",
      /submitted/,
    );

    const frozenStructured = handle.applyStructuredEdit(undefined, "meds", {
      op: "add",
      patch: { dose: "500mg" },
    });
    assert.equal(frozenStructured.ok, false);

    // A failed submit returns the session to "editing"; the handle the
    // plugin is still holding has to come back with it.
    await harness.render("editing");
    assert.equal(harness.handle(), handle);
    assert.equal(handle.setValue(undefined, "note", ["afebrile"]).ok, true);
    assert.equal(
      handle.applyStructuredEdit(undefined, "meds", {
        op: "add",
        patch: { dose: "500mg" },
      }).ok,
      true,
    );
  });

  it("leaves the responses untouched by a frozen write", async () => {
    const harness = mount();
    await harness.render("submitting");
    harness.handle().setValue(undefined, "note", ["afebrile"]);
    assert.deepEqual(
      harness.store.get(responsesAtom)["qid-note"].values,
      [],
      "a refused write must not paint on screen",
    );
  });
});

describe("addressing a structured row that came from the server", () => {
  it("lists the server row's id as addressable", async () => {
    const harness = mount();
    await harness.render("editing");
    assert.deepEqual(medsDescriptor(harness.handle()).rowIds, ["med-1"]);
  });

  it("accepts an update against it — the assistant's primary case", async () => {
    const harness = mount();
    await harness.render("editing");
    const result = harness.handle().applyStructuredEdit(undefined, "meds", {
      op: "update",
      rowId: "med-1",
      patch: { id: "med-1", dose: "500mg" },
    });
    assert.equal(result.ok, true);
    const edits = harness.store.get(responsesAtom)["qid-meds"].edits;
    assert.deepEqual(
      edits?.map((edit) => [edit.rowId, edit.op]),
      [["med-1", "update"]],
    );
  });

  it("accepts a remove against it — the only route to a soft delete", async () => {
    const harness = mount();
    await harness.render("editing");
    const result = harness.handle().applyStructuredEdit(undefined, "meds", {
      op: "remove",
      rowId: "med-1",
      patch: { id: "med-1", dose: "250mg" },
    });
    assert.equal(result.ok, true);
  });

  it("still refuses a rowId that is neither a server row nor a pending edit", async () => {
    const harness = mount();
    await harness.render("editing");
    const result = harness.handle().applyStructuredEdit(undefined, "meds", {
      op: "update",
      rowId: "med-does-not-exist",
      patch: { dose: "500mg" },
    });
    assert.equal(result.ok, false);
  });

  it("addresses a row this session added, once it has been added", async () => {
    const harness = mount([]);
    await harness.render("editing");
    const handle = harness.handle();
    assert.deepEqual(medsDescriptor(handle).rowIds, []);

    const added = handle.applyStructuredEdit(undefined, "meds", {
      op: "add",
      patch: { dose: "500mg" },
    });
    assert.equal(added.ok, true);
    const rowId = added.ok ? added.value.rowId : "";
    assert.ok(medsDescriptor(handle).rowIds.includes(rowId));
  });
});

describe("a question whose type compiles exactly one rowId", () => {
  it("refuses the singleton convention on an encounter, which submits nothing under it", async () => {
    const harness = mount();
    await harness.render("editing");
    const result = harness
      .handle()
      .applyStructuredEdit(undefined, "encounter", {
        op: "add",
        rowId: "singleton",
        patch: { dose: "irrelevant" },
      });
    assert.equal(result.ok, false);
    assert.match(result.ok === false ? result.error : "", /enc-1/);
    assert.deepEqual(
      harness.store.get(responsesAtom)["qid-encounter"].edits,
      [],
      "a refused write must not dirty the form",
    );
  });

  it("accepts the encounter id — the rowId its toRequests actually compiles", async () => {
    const harness = mount();
    await harness.render("editing");
    const result = harness
      .handle()
      .applyStructuredEdit(undefined, "encounter", {
        op: "update",
        rowId: "enc-1",
        patch: { dose: "irrelevant" },
      });
    assert.equal(result.ok, true);
  });

  it("refuses a remove under that same rowId — the op its toRequests drops", async () => {
    // `projectRows` skips a removed baseline row, so `EncounterEditor`
    // loses `single.row` and returns null: the whole section leaves the
    // form while `toRequests` submits nothing and the draft carries the
    // remove.
    const harness = mount();
    await harness.render("editing");
    const result = harness
      .handle()
      .applyStructuredEdit(undefined, "encounter", {
        op: "remove",
        rowId: "enc-1",
        patch: { dose: "irrelevant" },
      });
    assert.equal(result.ok, false);
    assert.deepEqual(
      harness.store.get(responsesAtom)["qid-encounter"].edits,
      [],
      "a refused write must not dirty the form",
    );
  });
});

describe("a row created this session", () => {
  it("refuses an add whose patch names a server record", async () => {
    // `id` is optional on every upsert row schema, so an LLM reading the
    // schema can supply one. It would be sent verbatim in the upsert
    // datapoint — rewriting whichever record holds that id.
    const harness = mount();
    await harness.render("editing");
    const result = harness.handle().applyStructuredEdit(undefined, "meds", {
      op: "add",
      patch: { id: "med-1", dose: "500mg" },
    });
    assert.equal(result.ok, false);
    assert.deepEqual(harness.store.get(responsesAtom)["qid-meds"].edits, []);
  });
});

describe("the projection handed to a caller", () => {
  it("is detached, so a caller cannot mutate a recorded row", async () => {
    const liveRow: Record<string, unknown> = { id: "med-1", dose: "250mg" };
    const harness = mount([liveRow]);
    await harness.render("editing");
    const [projected] = medsDescriptor(harness.handle()).projection;
    (projected as Record<string, unknown>).dose = "9000mg";
    assert.equal(liveRow.dose, "250mg");
  });

  it("drops an unclonable row rather than handing back the live reference", async () => {
    // One unclonable row (a `files` row carries real `File` objects) must
    // not downgrade the WHOLE projection to a shallow array copy whose
    // entries are the edit log's own objects.
    const liveRow: Record<string, unknown> = { id: "med-1", dose: "250mg" };
    const harness = mount([liveRow, { id: "med-2", notClonable: () => "x" }]);
    await harness.render("editing");
    const projection = medsDescriptor(harness.handle()).projection;
    assert.notEqual(projection[0], liveRow);
    assert.equal(projection[1], null);
  });
});
