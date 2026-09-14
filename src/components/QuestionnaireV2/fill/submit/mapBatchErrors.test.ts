import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";

import { mapBatchErrors } from "./mapBatchErrors";

/**
 * The seam that routes a failed batch sub-request back to the question that
 * produced it. `structuredReferenceId` (structured/types.ts) is the writer
 * of the reference-id format this parser reads.
 */

type BatchResults = Parameters<typeof mapBatchErrors>[0];

const FALLBACK = "Validation failed";

describe("mapBatchErrors", () => {
  it("succeeded sub-requests contribute nothing — an atomic batch reports every result, not just the failures", () => {
    const results: BatchResults = [
      { reference_id: "qn-1", status_code: 200, data: undefined },
      {
        reference_id: structuredReferenceId("symptom", "q1"),
        status_code: 200,
        data: undefined,
      },
    ];

    assert.deepEqual(mapBatchErrors(results, FALLBACK), {
      serverErrors: [],
      questionErrors: [],
    });
  });

  it("a structured failure pins to the question id carried inside its reference_id", () => {
    const results: BatchResults = [
      {
        reference_id: structuredReferenceId("symptom", "q1"),
        status_code: 400,
        data: { errors: [{ msg: "Clinical status is required" }] },
      },
    ];

    const mapped = mapBatchErrors(results, FALLBACK);

    assert.deepEqual(mapped.questionErrors, [
      {
        question_id: "q1",
        error: "Clinical status is required",
        type: "server_error",
      },
    ]);
    assert.deepEqual(mapped.serverErrors, [
      {
        reference_id: "structured:symptom:q1",
        message: "Clinical status is required",
        status_code: 400,
      },
    ]);
  });

  it("a plugin type id's dot survives the parse — only the colons delimit", () => {
    // Written out rather than built through `structuredReferenceId`, whose
    // parameter is the CORE type union; a plugin type's id is a runtime
    // string namespaced `{plugin_slug}.{type_name}`.
    const results: BatchResults = [
      {
        reference_id: "structured:plugin_abc.widget:q42",
        status_code: 400,
        data: undefined,
      },
    ];

    const mapped = mapBatchErrors(results, FALLBACK);

    assert.equal(mapped.questionErrors.length, 1);
    assert.equal(mapped.questionErrors[0].question_id, "q42");
  });

  it("a structured reference_id with no question id yields a panel entry but pins to nothing", () => {
    const results: BatchResults = [
      {
        reference_id: "structured:symptom:",
        status_code: 400,
        data: undefined,
      },
    ];

    const mapped = mapBatchErrors(results, FALLBACK);

    assert.equal(mapped.serverErrors.length, 1);
    assert.deepEqual(mapped.questionErrors, []);
  });

  it("array-shaped data (per-row structured errors) joins EVERY error, each with its loc path", () => {
    const results: BatchResults = [
      {
        reference_id: structuredReferenceId("medication_request", "q7"),
        status_code: 400,
        data: [
          {
            errors: [
              { type: "missing", loc: ["dosage", "0"], msg: "Field required" },
              { type: "value_error", loc: ["route"], msg: "Invalid route" },
            ],
          },
          {
            errors: [
              { type: "missing", loc: ["medication"], msg: "Field required" },
            ],
          },
        ],
      },
    ];

    const mapped = mapBatchErrors(results, FALLBACK);

    assert.equal(
      mapped.serverErrors[0].message,
      "dosage > 0: Field required, route: Invalid route, medication: Field required",
    );
    assert.equal(
      mapped.questionErrors[0].error,
      mapped.serverErrors[0].message,
    );
  });

  it("an array-shaped payload carrying no errors falls back", () => {
    const results: BatchResults = [
      {
        reference_id: structuredReferenceId("symptom", "q1"),
        status_code: 500,
        data: [],
      },
    ];

    assert.equal(
      mapBatchErrors(results, FALLBACK).serverErrors[0].message,
      FALLBACK,
    );
  });

  it("object-shaped data reads the FIRST error only for the panel message, loc path included", () => {
    const results: BatchResults = [
      {
        reference_id: "qn-1",
        status_code: 400,
        data: {
          errors: [
            { loc: ["results", "0", "values"], msg: "Field required" },
            { loc: ["results", "1"], msg: "Ignored for the panel message" },
          ],
        },
      },
    ];

    assert.equal(
      mapBatchErrors(results, FALLBACK).serverErrors[0].message,
      "results > 0 > values: Field required",
    );
  });

  it("without a loc, `msg` wins, then `error`, then the fallback", () => {
    const results: BatchResults = [
      {
        reference_id: "qn-1",
        status_code: 400,
        data: { errors: [{ msg: "msg wins", error: "not this" }] },
      },
      {
        reference_id: "qn-2",
        status_code: 400,
        data: { errors: [{ error: "error is the runner-up" }] },
      },
      { reference_id: "qn-3", status_code: 400, data: { errors: [{}] } },
    ];

    assert.deepEqual(
      mapBatchErrors(results, FALLBACK).serverErrors.map((e) => e.message),
      ["msg wins", "error is the runner-up", FALLBACK],
    );
  });

  it("the submit entry's pydantic errors pin by their own question_id — reference_id stays authoritative across forms", () => {
    const results: BatchResults = [
      {
        reference_id: "qn-1",
        status_code: 400,
        data: {
          errors: [
            {
              question_id: "q1",
              msg: "Value out of range",
              type: "value_error",
            },
            { question_id: "q2", error: "Unsupported code" },
            { msg: "Not attributable to any question" },
          ],
        },
      },
    ];

    const mapped = mapBatchErrors(results, FALLBACK);

    assert.deepEqual(mapped.questionErrors, [
      { question_id: "q1", error: "Value out of range", type: "value_error" },
      { question_id: "q2", error: "Unsupported code", type: "server_error" },
    ]);
    assert.equal(mapped.serverErrors.length, 1);
  });

  it("a failure with no payload at all still reaches the panel, with the fallback message", () => {
    const results: BatchResults = [
      { reference_id: "qn-1", status_code: 500, data: undefined },
    ];

    assert.deepEqual(mapBatchErrors(results, FALLBACK), {
      serverErrors: [
        { reference_id: "qn-1", message: FALLBACK, status_code: 500 },
      ],
      questionErrors: [],
    });
  });

  it("a missing reference_id degrades to an empty string rather than dropping the failure", () => {
    const results: BatchResults = [
      { reference_id: "", status_code: 400, data: undefined },
    ];

    assert.deepEqual(mapBatchErrors(results, FALLBACK).serverErrors, [
      { reference_id: "", message: FALLBACK, status_code: 400 },
    ]);
  });
});
