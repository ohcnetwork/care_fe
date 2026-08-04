import { faker } from "@faker-js/faker";
import { type Locator, type Page, expect, test } from "@playwright/test";
import { submitForm } from "tests/helper/questionnaire";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import {
  STRUCTURED_FIXTURES,
  structuredFixtureUrl,
} from "tests/helper/structuredFixtures";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * The responsive proof for `StructuredList` (Task 11 Step 3) — the
 * coverage gap `annexes/p1-primitives.md` §6 names directly:
 * `questionnaireMobile.spec.ts:9-10` is builder-only, and there was no
 * structured-question mobile coverage anywhere in the suite before this
 * file. `charge_item` is the fixture throughout, purely as a real consumer
 * of the primitive — nothing here is charge_item-specific; every assertion
 * is about `StructuredList`/`StructuredListRow` (`structured/core/
 * StructuredList.tsx`) itself, which every future list-shaped port renders
 * through unchanged.
 *
 * The one breakpoint rule (`p1-primitives.md` §1.2): layout differences are
 * CSS (`lg:`-prefixed classes), behaviour differences are JavaScript — this
 * component contains zero `useBreakpoints` calls. That is exactly why a
 * plain `page.setViewportSize`/`test.use({ viewport })` is enough to drive
 * both halves of this file; no JS-side breakpoint mocking is involved.
 */

const fixture = STRUCTURED_FIXTURES.charge_item;

/** Every body row inside `block` — excludes the header row, which also
 *  carries `role="row"` but no `data-structured-row` (mirrors
 *  `chargeItemV2.spec.ts`'s identical helper for the same primitive). */
function rows(block: Locator): Locator {
  return block.locator('[role="row"][data-structured-row]');
}

async function pickChargeItemDefinition(
  page: Page,
  block: Locator,
  title: string,
): Promise<void> {
  await block.getByRole("combobox").filter({ hasText: "Add charges" }).click();
  const search = page.getByPlaceholder("Search charge item definitions");
  await search.fill(title);
  await page.getByRole("option").filter({ hasText: title }).click();
}

/** The mobile disclosure button. `aria-expanded` alone is not unique
 *  within a row — the performer picker's combobox trigger and the price
 *  breakdown popover trigger both carry it too once opened/closed at
 *  least once (Radix state attributes) — but `aria-controls` (pointing at
 *  the row's body id) is unique to the mobile chrome toggle
 *  (`StructuredListRow`'s `bodyId`). */
function disclosureButton(row: Locator): Locator {
  return row.locator("button[aria-controls]");
}

test.describe("StructuredList mobile card (375x812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the collapsed card shows the row title, and expanding it reveals an editable field", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const title = "Amoxicillin 500mg Capsule";
    await pickChargeItemDefinition(page, block, title);
    const row = rows(block).filter({ hasText: title });
    const toggle = disclosureButton(row);

    // Every fresh row starts collapsed (`StructuredListRow`'s
    // `useState(false)`), and the collapsed card shows the row's title in
    // its own disclosure button.
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toContainText(title);

    // The quantity field lives in a `display:none` subtree until expanded.
    const quantityCell = row.locator('[data-column="quantity"]');
    await expect(quantityCell).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(quantityCell).toBeVisible();
    // The mobile-only caption (`lg:hidden`) restates the column header
    // beside the now-visible field.
    await expect(quantityCell).toContainText("Quantity");

    const quantityInput = quantityCell.getByRole("spinbutton");
    await quantityInput.fill("4");
    await expect(quantityInput).toHaveValue("4");
  });

  test("a row carrying a validation error forces itself expanded, even after being manually collapsed", async ({
    page,
  }) => {
    // REGRESSION GUARD (Task 6, Critical 1): a collapsed card used to be a
    // literal `display:none` subtree, so a row a blocking `validate()`
    // error was bound to could hide that error entirely — Save hard-blocks
    // on any `QuestionValidationError`, so a clinician on a phone saw a
    // bare failure toast with no row indicating why. This pins the fix:
    // the row re-expands itself regardless of what the clinician last did
    // with the toggle.
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const title = "Paracetamol 500mg Tablet";
    await pickChargeItemDefinition(page, block, title);
    const row = rows(block).filter({ hasText: title });
    const toggle = disclosureButton(row);
    const quantityCell = row.locator('[data-column="quantity"]');

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await quantityCell.getByRole("spinbutton").fill("0");

    // Manually collapse again — nothing stops this yet, no error exists.
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(quantityCell).toBeHidden();

    await questionBlock(page, "Plain note")
      .getByRole("textbox")
      .fill(faker.lorem.words(3));
    await submitForm(page);

    // Forced back open — not merely re-openable, ALREADY open — and the
    // error itself is in a visible subtree, not display:none.
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(quantityCell).toBeVisible();
    await expect(quantityCell.getByRole("alert")).toContainText(
      "Enter a quantity of 1 or more",
    );
    // The toggle is disabled while pinned open — a live control that could
    // never actually collapse anything would be a dead, misleading affordance.
    await expect(toggle).toBeDisabled();
  });
});

test.describe("StructuredList desktop grid (1280x720)", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("a row's cells map 1:1 onto the declared columns plus the actions cell", async ({
    page,
  }) => {
    // The `lg:contents` proof Task 6 Step 4 asked for, kept permanently:
    // below `lg` the row's body wrapper is a normal block (the mobile
    // card), and at `lg`+ it MUST behave as if it weren't there at all —
    // `display:contents` — so the row's cells sit directly on the grid as
    // siblings of the row div, one per declared column, in DOM order, plus
    // exactly one for row actions. Any drift here (a duplicated or
    // swallowed cell) breaks the shared `--structured-cols` track
    // alignment between the header row and every body row.
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const title = "Ibuprofen 400mg Tablet";
    await pickChargeItemDefinition(page, block, title);
    const row = rows(block).filter({ hasText: title });
    await expect(row).toBeVisible();

    // charge_item declares 4 columns (item, quantity, price, performer);
    // the actions cell also carries `role="cell"` (`StructuredList.tsx`'s
    // own review-fixed decision to keep row removal reachable at every
    // width) — 5 in total, never more, never fewer.
    await expect(row.getByRole("cell")).toHaveCount(5);
  });
});
