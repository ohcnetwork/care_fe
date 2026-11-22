import { expect, test } from "@playwright/test";

import type {
  QuestionnaireResponse,
  ResponsePath,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

// Uses Vite module imports to exercise the real core validator and plugin
// registry. No backend fixtures are needed. playwright.config.ts runs this spec
// in the `vite-modules` project, whose baseURL is a Vite dev server.

test.beforeEach(async ({ page, baseURL }) => {
  const url = new URL("/__group-validation", baseURL).href;
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
