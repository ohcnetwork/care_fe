import { type Page } from "@playwright/test";

import { expectToast } from "./ui";

/** Matches the questionnaire v2 detail URL on both mounts
 *  (`/facility/{id}/settings/questionnaires/{uuid}` and
 *  `/admin/questionnaires/{uuid}`). */
export const QUESTIONNAIRE_DETAIL_URL = /\/questionnaires\/[0-9a-f-]+$/;

export interface CreateQuestionnaireOptions {
  /** Mount base path, e.g. `/facility/${facilityId}/settings/questionnaires`
   *  or `/admin/questionnaires`. */
  basePath: string;
  /** Generate unique titles per PLAYWRIGHT_GUIDE (faker/Date.now). */
  title: string;
  /** Status radio to pick before saving (display label); default Active. */
  status?: "Active" | "Draft" | "Retired";
}

/**
 * Drives the v2 create form end-to-end: open `${basePath}/new`, type the
 * title, submit, wait for the created toast and the detail-page redirect.
 * Returns the detail page URL.
 */
export async function createQuestionnaire(
  page: Page,
  { basePath, title, status }: CreateQuestionnaireOptions,
): Promise<string> {
  await page.goto(`${basePath}/new`);
  await page.getByRole("textbox", { name: "Title" }).pressSequentially(title);
  if (status) {
    await page
      .getByRole("radiogroup", { name: "Status" })
      .getByRole("radio", { name: status })
      .click();
  }
  await page.getByRole("button", { name: "Save Form" }).click();
  await expectToast(page, "Questionnaire created successfully");
  await page.waitForURL(QUESTIONNAIRE_DETAIL_URL);
  return page.url();
}

/** From the detail page, opens the question builder (`…/{id}/edit`). */
export async function openQuestionBuilder(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Edit Questions" }).click();
  await page.waitForURL(/\/edit$/);
}

/** createQuestionnaire + openQuestionBuilder; returns the detail page URL. */
export async function createQuestionnaireAndOpenBuilder(
  page: Page,
  options: CreateQuestionnaireOptions,
): Promise<string> {
  const detailUrl = await createQuestionnaire(page, options);
  await openQuestionBuilder(page);
  return detailUrl;
}
