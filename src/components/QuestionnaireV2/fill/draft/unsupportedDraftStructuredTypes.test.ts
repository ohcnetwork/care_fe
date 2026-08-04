import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Question } from "@/types/questionnaire/question";
import type { StructuredTypeValue } from "@/types/questionnaire/structured";

import {
  unsupportedDraftStructuredTypes,
  type DraftResolvableStructuredType,
} from "./unsupportedDraftStructuredTypes";

/**
 * This file deliberately never imports `structured/registry.ts` — see the
 * module's own doc comment. Every test supplies its own fake `resolve`
 * function instead of the real `resolveStructuredType`.
 */

function structuredQuestion(
  id: string,
  structured_type?: StructuredTypeValue,
): Question {
  return {
    id,
    link_id: id,
    text: id,
    type: "structured",
    structured_type,
  };
}

function plainQuestion(id: string): Question {
  return { id, link_id: id, text: id, type: "string" };
}

function group(id: string, questions: Question[]): Question {
  return { id, link_id: id, text: id, type: "group", questions };
}

const v2Serialize: DraftResolvableStructuredType = {
  contract: 2,
  draftPolicy: "serialize",
};
const v2Exclude: DraftResolvableStructuredType = {
  contract: 2,
  draftPolicy: "exclude",
};
const v1: DraftResolvableStructuredType = {
  contract: 1,
  draftPolicy: "serialize",
};

describe("unsupportedDraftStructuredTypes", () => {
  it("REGRESSION (review): a structured question with NO structured_type blocks — matches the pre-Task-8 hasStructuredQuestion behavior, which matched on `type` alone", () => {
    let resolveCalled = false;
    const resolve = () => {
      resolveCalled = true;
      return v2Serialize;
    };

    const result = unsupportedDraftStructuredTypes(
      [structuredQuestion("q1", undefined)],
      resolve,
    );

    assert.deepEqual(result, ["<untyped>"]);
    assert.equal(
      resolveCalled,
      false,
      "resolve must never be called when there is no type string to resolve",
    );
  });

  it("a contract-v2 type with draftPolicy serialize does NOT block", () => {
    const result = unsupportedDraftStructuredTypes(
      [structuredQuestion("q1", "symptom")],
      () => v2Serialize,
    );
    assert.deepEqual(result, []);
  });

  it("a contract-v1 type blocks, named by its structured_type", () => {
    const result = unsupportedDraftStructuredTypes(
      [structuredQuestion("q1", "diagnosis")],
      () => v1,
    );
    assert.deepEqual(result, ["diagnosis"]);
  });

  it("a contract-v2 type with draftPolicy exclude (files-style) blocks", () => {
    const result = unsupportedDraftStructuredTypes(
      [structuredQuestion("q1", "files")],
      () => v2Exclude,
    );
    assert.deepEqual(result, ["files"]);
  });

  it("an unresolvable type (plugin not loaded) blocks", () => {
    const result = unsupportedDraftStructuredTypes(
      [structuredQuestion("q1", "plugin_x.widget")],
      () => undefined,
    );
    assert.deepEqual(result, ["plugin_x.widget"]);
  });

  it("a plain (non-structured) question is never blocking, regardless of resolve", () => {
    const result = unsupportedDraftStructuredTypes(
      [plainQuestion("q1")],
      () => {
        throw new Error(
          "resolve must not be called for a non-structured question",
        );
      },
    );
    assert.deepEqual(result, []);
  });

  it("walks into groups and collects every blocking structured_type in document order", () => {
    const questions = [
      plainQuestion("plain-1"),
      group("g1", [
        structuredQuestion("q1", "diagnosis"),
        structuredQuestion("q2", "symptom"),
      ]),
      structuredQuestion("q3", undefined),
    ];
    const resolve = (type: string) => (type === "symptom" ? v2Serialize : v1);

    const result = unsupportedDraftStructuredTypes(questions, resolve);

    assert.deepEqual(result, ["diagnosis", "<untyped>"]);
  });
});
