import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createInstance } from "i18next";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";

import type { Code } from "@/types/base/code/code";
import type { Question } from "@/types/questionnaire/question";
import { QuestionnaireResponseStatus } from "@/types/questionnaire/questionnaireResponse";
import type { ResourceQuestionnaireResponse } from "@/types/questionnaire/resourceQuestionnaireResponseApi";

import ResourceResponseDetails from "./ResourceResponseDetails";
import { formatResponseValue, getResponsePreview } from "./response";

const i18n = createInstance();
void i18n.init({
  lng: "en",
  initAsync: false,
  resources: {
    en: { translation: { yes: "Yes", no: "No", note: "Note" } },
  },
});
const t = i18n.t;
const mg: Code = {
  system: "http://unitsofmeasure.org",
  code: "mg",
  display: "mg",
};
const question = (type: Question["type"]): Question => ({
  id: "answer",
  link_id: "answer",
  text: "Answer",
  type,
});

describe("formatResponseValue", () => {
  it("shows a quantity unit once when coding identifies the same unit", () => {
    assert.equal(
      formatResponseValue(
        { value: "5", unit: mg, coding: { ...mg, display: "milligram" } },
        question("quantity"),
        t,
      ),
      "5 mg",
    );
  });

  it("preserves a distinct coding alongside the numeric value and unit", () => {
    assert.equal(
      formatResponseValue(
        {
          value: "5",
          unit: mg,
          coding: {
            system: "https://example.com",
            code: "mg",
            display: "Dose",
          },
        },
        question("quantity"),
        t,
      ),
      "5 Dose mg",
    );
  });

  it("keeps zero, decimal values, and units without a separate coding", () => {
    assert.equal(
      formatResponseValue({ value: "0" }, question("integer"), t),
      "0",
    );
    assert.equal(
      formatResponseValue({ value: "2.5", unit: mg }, question("decimal"), t),
      "2.5 mg",
    );
    assert.equal(
      formatResponseValue(
        { value: "5", unit: { ...mg, display: "" } },
        question("quantity"),
        t,
      ),
      "5 mg",
    );
  });

  it("uses choice labels and supports coding-only answers", () => {
    const choice: Question = {
      ...question("choice"),
      answer_option: [{ value: "normal", display: "Normal" }],
    };
    assert.equal(formatResponseValue({ value: "normal" }, choice, t), "Normal");
    assert.equal(formatResponseValue({ value: "other" }, choice, t), "other");
    assert.equal(
      formatResponseValue(
        { coding: { ...mg, display: "Coded answer" } },
        choice,
        t,
      ),
      "Coded answer",
    );
    assert.equal(
      formatResponseValue({ coding: { ...mg, display: "" } }, choice, t),
      "mg",
    );
  });

  it("recognizes every boolean representation accepted by the API", () => {
    for (const value of ["true", "TRUE", "True", "1"]) {
      assert.equal(
        formatResponseValue({ value }, question("boolean"), t),
        "Yes",
      );
    }
    for (const value of ["false", "FALSE", "False", "0"]) {
      assert.equal(
        formatResponseValue({ value }, question("boolean"), t),
        "No",
      );
    }
    assert.equal(formatResponseValue({}, question("boolean"), t), "");
  });

  it("preserves date and local date-time formatting, including midnight", () => {
    assert.equal(
      formatResponseValue({ value: "2026-09-07" }, question("date"), t),
      "07/09/2026",
    );
    assert.equal(
      formatResponseValue(
        { value: new Date(2026, 8, 7, 14, 35).toISOString() },
        question("dateTime"),
        t,
      ),
      "02:35 PM; 07/09/2026",
    );
    assert.equal(
      formatResponseValue(
        { value: new Date(2026, 8, 7).toISOString() },
        question("dateTime"),
        t,
      ),
      "07/09/2026",
    );
  });
});

describe("resource responses with omitted default values", () => {
  const response: ResourceQuestionnaireResponse = {
    id: "response",
    subject_id: "location",
    status: QuestionnaireResponseStatus.Completed,
    created_by: null,
    created_date: null,
    questionnaire: {
      id: "form",
      slug: "form",
      title: "Form",
      subject_type: "location",
      status: "active",
      questions: [
        {
          id: "group",
          link_id: "group",
          text: "Group",
          type: "group",
          questions: [question("string")],
        },
      ],
    },
    responses: [
      {
        question_id: "group",
        sub_results: [[{ question_id: "answer", note: "Note-only answer" }]],
      },
    ],
  };

  it("previews a note-only answer without requiring an empty values array", () => {
    assert.equal(
      getResponsePreview(response, t),
      "Answer: Note: Note-only answer",
    );
  });

  it("renders note-only answers in the response viewer", () => {
    const html = renderToStaticMarkup(
      createElement(I18nextProvider, {
        i18n,
        children: createElement(ResourceResponseDetails, { response }),
      }),
    );
    assert.match(html, /Note-only answer/);
    assert.match(html, /Group/);
  });
});
