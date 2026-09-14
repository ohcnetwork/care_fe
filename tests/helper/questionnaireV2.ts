import { expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

import { expectToast } from "./ui";

/** Deterministic backend fixtures loaded by the care repo's E2E fixture
 *  script (present in the Playwright DB snapshot, so restores keep them). */
export const KITCHEN_SINK_FACILITY_SLUG = "e2e-kitchen-sink-facility";
export const KITCHEN_SINK_INSTANCE_SLUG = "e2e-kitchen-sink-instance";
export const VERSIONED_SLUG = "e2e-versioned";
/** 18 records named `E2E Pagination 001..018`, facility-scoped, active. */
export const PAGINATION_TITLE_PREFIX = "E2E Pagination";
export const PAGINATION_FIXTURE_COUNT = 18;

/** Reads the admin bearer token captured by tests/setup/auth.setup.ts. */
export function adminApiHeaders(): Record<string, string> {
  const authFile = path.resolve("tests/.auth/user.json");
  const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  const localStorage: { name: string; value: string }[] =
    storageState.origins?.[0]?.localStorage ?? [];
  const token = localStorage.find(
    (item) => item.name === "care_access_token",
  )?.value;
  if (!token) {
    throw new Error("No access token in tests/.auth/user.json — run setup");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function apiBaseUrl(): string {
  return process.env.REACT_CARE_API_URL || "http://localhost:9000";
}

const slugCache = new Map<string, string>();

/**
 * Resolves a fixture questionnaire's id from its slug. The detail endpoint
 * looks up by external_id only (slug lookup is not supported) and the list
 * has no slug filter, so this lists broadly and matches client-side.
 */
export async function getQuestionnaireIdBySlug(slug: string): Promise<string> {
  const cached = slugCache.get(slug);
  if (cached) return cached;

  const limit = 100;
  let offset = 0;

  while (true) {
    const res = await fetch(
      `${apiBaseUrl()}/api/v1/questionnaire/?limit=${limit}&offset=${offset}`,
      {
        headers: adminApiHeaders(),
      },
    );
    if (!res.ok) {
      throw new Error(`Failed to list questionnaires: ${res.status}`);
    }
    const data = (await res.json()) as {
      results: { id: string; slug: string }[];
    };

    // Cache and check all results on this page
    for (const entry of data.results) {
      slugCache.set(entry.slug, entry.id);
      if (entry.slug === slug) {
        return entry.id;
      }
    }

    // If we got fewer results than the limit, we've reached the end
    if (data.results.length < limit) {
      break;
    }

    offset += limit;
  }

  throw new Error(
    `Fixture questionnaire "${slug}" not found — reload backend E2E fixtures`,
  );
}

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
  await page.getByRole("button", { name: "Save Questionnaire" }).click();
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

/**
 * Picks a valueset in the builder's SelectOrCreateValueset autocomplete.
 * The search MUST be scoped to the opened popover/dialog — a bare
 * `[data-slot="command-input"]` first() can resolve to a different cmdk
 * input on the builder page and leave the list unfiltered (flake).
 */
export async function pickValuesetFromAutocomplete(
  page: Page,
  { search, optionName }: { search: string; optionName: string },
): Promise<void> {
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select a value set" })
    .click();
  const dialog = page.getByRole("dialog").last();
  const scope = (await dialog.isVisible().catch(() => false))
    ? dialog
    : page.locator("[data-radix-popper-content-wrapper]").last();
  await scope.locator('[data-slot="command-input"]').first().fill(search);
  await scope.getByRole("option", { name: optionName }).click();
  await expect(
    page.getByRole("combobox").filter({ hasText: optionName }),
  ).toBeVisible();
}

/**
 * The canvas block for one LEAF question on the one-scroll form renderer,
 * anchored on the `data-question-id` attribute the renderer stamps and the
 * question's exact label text. The whole questionnaire renders on one
 * scroll, so bare role queries (`spinbutton`, `Add note`, `textarea`) match
 * every question at once — scope them through this instead.
 *
 * Leaf blocks only (the `hasNot` filter drops enclosing section cards,
 * which would also satisfy `has:` through their children) and exact label
 * matching, so strict mode stays armed: two questions sharing a label fail
 * loudly instead of silently resolving to whichever renders last. Assert
 * the block visible (or use `expectQuestionBlock`) before building any
 * negative assertion on it — a zero-match locator passes `.not.` checks
 * vacuously.
 */
export function questionBlock(page: Page, label: string) {
  return page
    .locator("[data-question-id]")
    .filter({ hasNot: page.locator("[data-question-id]") })
    .filter({
      has: page.locator(
        `xpath=.//label[normalize-space(.)=${JSON.stringify(label)}]`,
      ),
    });
}

/** questionBlock + a count assertion — use before any `.not.` assertion,
 *  where a zero-match locator would otherwise pass vacuously. */
export async function expectQuestionBlock(page: Page, label: string) {
  const block = questionBlock(page, label);
  await expect(block).toHaveCount(1);
  return block;
}

/**
 * Appends a top-level question and types its title. On an empty form the
 * canvas shows "Add First Question"; once questions exist, several controls
 * carry the "Add new question" name (outline separators and footer, the
 * canvas append zone, the mobile button) — the canvas zone is addressed via
 * the labeled "Form canvas" region instead of a DOM-order-dependent
 * `.last()`.
 */
export async function addTopLevelQuestion(
  page: Page,
  title: string,
): Promise<void> {
  const addFirst = page.getByRole("button", { name: "Add First Question" });
  if (await addFirst.isVisible().catch(() => false)) {
    await addFirst.click();
  } else {
    await page
      .getByRole("region", { name: "Form canvas" })
      .getByRole("button", { name: "Add new question" })
      .click();
  }
  await page
    .getByRole("textbox", { name: "Question Title" })
    .pressSequentially(title);
}
