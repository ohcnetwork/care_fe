import { expect, test } from "@playwright/test";
import { createInstance } from "i18next";

import { questionLabel } from "../../../../src/components/QuestionnaireV2/builder/actions/labels";
import type { Question } from "../../../../src/types/questionnaire/question";
import { hasMarkdownContent } from "../../../../src/Utils/markdown";

test("duplicate question titles keep distinct labels without numbered prefixes", async () => {
  const i18n = createInstance();
  await i18n.init({ lng: "en", resources: {} });
  const questions: Question[] = ["first", "second"].map((id) => ({
    id,
    link_id: id,
    text: "Shared title",
    type: "string",
  }));
  expect(questionLabel(questions[0], i18n.t, questions)).toBe(
    "Shared title (first)",
  );
  expect(questionLabel(questions[1], i18n.t, questions)).toBe(
    "Shared title (second)",
  );
  expect(questionLabel(questions[0], i18n.t, [questions[0]])).toBe(
    "Shared title",
  );
});

test("appointment note validation rejects formatting-only rich text", () => {
  for (const note of ["", " ", "# ", "- ", "> ", "---", "- [ ]"]) {
    expect(hasMarkdownContent(note), JSON.stringify(note)).toBe(false);
  }
  expect(hasMarkdownContent("**Patient requested another date**")).toBe(true);
});
