import { expect, test } from "@playwright/test";

import type {
  QuestionnaireResponse,
  ResponsePath,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

// Uses Vite module imports to exercise the real core validator and plugin registry.
// No backend fixtures are needed. Set CARE_GROUP_VALIDATION_URL to a local dev host.
test.skip(!process.env.CARE_GROUP_VALIDATION_URL, "Requires a local Vite host");

test.beforeEach(async ({ page }) => {
  const url = new URL(
    "/__group-validation",
    process.env.CARE_GROUP_VALIDATION_URL,
  ).href;
  await page.route(url, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Group validation</title>",
    }),
  );
  await page.goto(url);
  await page.evaluate(async () => {
    const refreshPath = "/@react-refresh";
    const { default: refresh } = await import(refreshPath);
    refresh.injectIntoGlobalHook(window);
    Object.assign(window, {
      $RefreshReg$: () => {},
      $RefreshSig$: () => (type: unknown) => type,
      __vite_plugin_react_preamble_installed__: true,
    });
  });
});

test("core invokes the registered group validator and retains child validation", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const load = (path: string) =>
      import(`/src/components/QuestionnaireV2/${path}`);
    const { registerQuestionGroup } = await load("groups/registry.ts");
    const { instantiateGroupQuestions } = await load("groups/schema.ts");
    const { initializeResponses } = await load("form/engine/store.ts");
    const { collectQuestionErrors } = await load("form/validation.ts");
    let calls = 0;
    const definition = {
      type: "validation_browser.chart",
      label: "Chart",
      subjects: ["patient"],
      repeats: true,
      schema: [
        { link_id: "axis", text: "Axis", type: "integer", required: true },
      ],
      builder: () => null,
      component: () => null,
      validate: (
        question: Question,
        responses: Record<string, QuestionnaireResponse>,
        path: ResponsePath,
      ) => {
        calls++;
        return [
          {
            question_id: responses[question.id].sub_results![0][0].question_id,
            response_path: [...path, { questionId: question.id, rowIndex: 0 }],
            error: "Check axis",
          },
        ];
      },
    };
    const group = {
      id: "chart",
      link_id: "chart",
      text: "Chart",
      type: "group",
      repeats: true,
      structured_type: definition.type,
      questions: [] as { id: string }[],
    };
    group.questions = instantiateGroupQuestions(group, definition.schema);
    const questions = [group];
    const responses = initializeResponses(questions);
    responses.chart.sub_results = [
      Object.values(initializeResponses(group.questions)),
    ];
    const unregister = registerQuestionGroup(definition, "validation_browser");
    try {
      return {
        errors: collectQuestionErrors(
          questions,
          responses,
          (key: string) => key,
          {
            questionnaire: { subject_type: "patient", questions },
            subject: {},
            renderFailed: new Set(),
          },
        ),
        childId: group.questions[0].id,
        calls,
      };
    } finally {
      unregister();
    }
  });
  expect(result.calls).toBe(1);
  expect(result.errors).toEqual([
    {
      question_id: result.childId,
      response_path: [{ questionId: "chart", rowIndex: 0 }],
      error: "Check axis",
    },
    {
      question_id: result.childId,
      response_path: [{ questionId: "chart", rowIndex: 0 }],
      error: "field_required",
    },
  ]);
});

test("Dental and Vision manifests expose working core validation callbacks", async ({
  page,
}) => {
  const results = await page.evaluate(async () => {
    const load = (path: string) =>
      import(`/src/components/QuestionnaireV2/${path}`);
    const { registerQuestionGroup } = await load("groups/registry.ts");
    const { instantiateGroupQuestions } = await load("groups/schema.ts");
    const { initializeResponses } = await load("form/engine/store.ts");
    const { collectQuestionErrors } = await load("form/validation.ts");
    const cases = [
      {
        slug: "care_dental_fe",
        index: 0,
        invalid: [
          { tooth: "16", type: "caries" },
          { tooth: "16", type: "caries" },
        ],
        valid: [
          { tooth: "16", type: "caries" },
          { tooth: "16", type: "mobile" },
        ],
      },
      {
        slug: "care_vision_prescription_fe",
        index: 1,
        invalid: [{ product: "lens", eye: "right", sphere: 0, cylinder: -1 }],
        valid: [
          { product: "lens", eye: "right", sphere: 0, cylinder: -1, axis: 90 },
        ],
      },
      {
        slug: "care_vision_prescription_fe",
        index: 0,
        invalid: [{ status: "active", dateWritten: new Date("2999-01-01") }],
        valid: [{ status: "active", dateWritten: new Date("2020-01-01") }],
      },
    ];
    const results = [];
    for (const entry of cases) {
      const { default: manifest } = await import(
        `/apps/${entry.slug}/src/manifest.tsx`
      );
      const definition = manifest.registeredQuestionGroups[entry.index];
      const question = {
        id: "group",
        link_id: "group",
        type: "group",
        text: "Chart",
        structured_type: definition.type,
        repeats: definition.repeats,
        questions: [],
      };
      question.questions = instantiateGroupQuestions(
        question,
        definition.schema,
      );
      const validate = (values: Record<string, unknown>[]) => {
        const responses = initializeResponses([question]);
        const rows = values.map((values) => {
          const row = initializeResponses(question.questions);
          for (const child of question.questions as Question[]) {
            const value = values[child.link_id.slice("group__".length)];
            row[child.id].values =
              value === undefined ? [] : [{ type: child.type, value }];
          }
          return row;
        });
        if (question.repeats)
          responses.group.sub_results = rows.map(Object.values);
        else Object.assign(responses, rows[0]);
        return collectQuestionErrors(
          [question],
          responses,
          (key: string) => key,
          {
            questionnaire: { subject_type: "encounter", questions: [question] },
            subject: {},
            renderFailed: new Set(),
          },
        );
      };
      const unregister = registerQuestionGroup(definition, manifest.plugin);
      try {
        results.push({
          type: definition.type,
          invalid: validate(entry.invalid),
          valid: validate(entry.valid),
        });
      } finally {
        unregister();
      }
    }
    return results;
  });
  for (const result of results) {
    expect(result.invalid.length, result.type).toBeGreaterThan(0);
    expect(
      result.invalid.some(
        (error: { error: string }) =>
          error.error === "registered_group_validation_failed",
      ),
      result.type,
    ).toBe(false);
    expect(result.valid, result.type).toEqual([]);
  }
});
