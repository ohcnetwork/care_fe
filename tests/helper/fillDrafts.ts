import type { Page } from "@playwright/test";

/** The localStorage key prefix every persisted fill-session draft is written
 *  under — `FILL_DRAFT_PREFIX` in `fillDraftCache.ts`, applied by `draftKey()`
 *  in `fillDraftCore.ts`. Duplicated as a literal because specs run in the
 *  Playwright process and cannot import `@/` sources. */
const FILL_DRAFT_KEY_PREFIX = "care_qn_fill_draft--";

/** `useFillAutosave.ts`'s single shared debounce. */
export const AUTOSAVE_DEBOUNCE_MS = 1500;

/**
 * Waits past a pending autosave debounce.
 *
 * Required before any NEGATIVE storage assertion: `expect.poll` resolves
 * the moment its assertion first passes, so polling for "still nothing in
 * storage" on an already-empty origin returns instantly and can never
 * observe a debounced write that was on its way.
 */
export async function settleAutosaveDebounce(page: Page): Promise<void> {
  await page.waitForTimeout(AUTOSAVE_DEBOUNCE_MS * 2);
}

/** How many fill-session drafts this origin currently holds. */
export async function fillDraftCount(page: Page): Promise<number> {
  return page.evaluate(
    (prefix) =>
      Object.keys(localStorage).filter((key) => key.startsWith(prefix)).length,
    FILL_DRAFT_KEY_PREFIX,
  );
}

/**
 * How many forms the ONE persisted session draft currently holds.
 * Inspected directly because React flushes passive effects after the DOM
 * commit — a DOM-only assertion can win the race against the autosave
 * write, and these specs are precisely about what reaches storage.
 */
export async function draftFormCount(page: Page): Promise<number> {
  return page.evaluate((prefix) => {
    const key = Object.keys(localStorage).find((entry) =>
      entry.startsWith(prefix),
    );
    const raw = key ? localStorage.getItem(key) : null;
    if (!raw) return 0;
    return (JSON.parse(raw) as { forms?: unknown[] }).forms?.length ?? 0;
  }, FILL_DRAFT_KEY_PREFIX);
}

/**
 * The first non-empty string answer the persisted draft holds for ONE
 * form, read straight from storage. Unlike `draftFormCount`, this reads
 * past a `pagehide` flush (which persists whatever the live store holds
 * regardless of the debounced autosave's own change-detection) — it is
 * only ever satisfied by the DEBOUNCED write itself, which is what makes
 * it useful for pinning that a keystroke actually got recognised as an
 * edit rather than merely riding along on a reload's flush.
 */
export async function draftFormNoteText(
  page: Page,
  questionnaireId: string,
): Promise<string | undefined> {
  return page.evaluate(
    ({ prefix, qId }) => {
      const key = Object.keys(localStorage).find((entry) =>
        entry.startsWith(prefix),
      );
      const raw = key ? localStorage.getItem(key) : null;
      if (!raw) return undefined;
      const draft = JSON.parse(raw) as {
        forms?: {
          questionnaireId: string;
          responses: Record<string, { values?: { value?: unknown }[] }>;
        }[];
      };
      const form = draft.forms?.find((f) => f.questionnaireId === qId);
      if (!form) return undefined;
      for (const response of Object.values(form.responses ?? {})) {
        for (const value of response.values ?? []) {
          if (typeof value.value === "string" && value.value.length > 0) {
            return value.value;
          }
        }
      }
      return undefined;
    },
    { prefix: FILL_DRAFT_KEY_PREFIX, qId: questionnaireId },
  );
}
