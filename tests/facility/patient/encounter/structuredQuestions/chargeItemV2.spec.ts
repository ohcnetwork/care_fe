import { faker } from "@faker-js/faker";
import { type Locator, type Page, expect, test } from "@playwright/test";
import { submitForm } from "tests/helper/questionnaire";
import {
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import {
  STRUCTURED_FIXTURES,
  structuredFixtureUrl,
} from "tests/helper/structuredFixtures";
import { expectToast } from "tests/helper/ui";
import { getAccountId } from "tests/support/accountId";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Per-type matrix (spec §10) for `charge_item` — Task 11 Step 1. The
 * response-backed claim is the point: under v1, `ChargeItemQuestion.tsx`
 * kept every row's display object (definition title/price, performer name)
 * in a component `useState` no reload or draft restore could ever repaint
 * (`:207-283`) — only the bare wire fields (`charge_item_definition` slug,
 * `quantity`) ever reached the response, so a restored draft showed nothing
 * a clinician could recognise. `ChargeItemRow` (`structured/types/
 * chargeItem/model.ts`) now carries `charge_item_definition_object` ON the
 * row itself, so the SAME projection that paints the live list is what a
 * draft restore repaints from — the "draft" test below is the one that
 * could not exist before this port.
 *
 * CATALOG FIXTURES: "Amoxicillin 500mg Capsule", "Paracetamol 500mg
 * Tablet", "Ibuprofen 400mg Tablet" and "Registration Fee" are stable,
 * facility-scoped `charge_item_definition` catalog entries the backend E2E
 * fixture script seeds (verified directly against the running DB — Task 1
 * Step 3's own house rule) — the same catalog `chargeItem.spec.ts`'s
 * `MedicationsList` already depends on. Titles are constant across a
 * restore; only each definition's `slug` embeds the current facility id.
 *
 * ROW LOCATION: both the header row (`role="row"` over the columnheader
 * cells) and every body row share `role="row"` — `StructuredList.tsx`'s
 * `data-structured-row={row.rowId}` attribute is what actually
 * distinguishes a body row, so every row lookup below scopes through it
 * rather than a bare `getByRole("row")`, which would silently include the
 * header.
 */

const fixture = STRUCTURED_FIXTURES.charge_item;

/** Every body row inside `block` — excludes the header row, which also
 *  carries `role="row"` but no `data-structured-row`. */
function rows(block: Locator): Locator {
  return block.locator('[role="row"][data-structured-row]');
}

function rowByTitle(block: Locator, title: string): Locator {
  return rows(block).filter({ hasText: title });
}

/** Opens the "Add charges" picker and searches straight to `title` — the
 *  root level always renders the search input (`renderSearchInput`), so
 *  typing skips category navigation entirely. */
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

async function removeRow(page: Page, row: Locator): Promise<void> {
  await row.getByRole("button", { name: "Row actions" }).click();
  await page.getByRole("menuitem", { name: "Remove", exact: true }).click();
}

function trackBatchRequests(page: Page): { url: string; body: string }[] {
  const seen: { url: string; body: string }[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/batch_requests/")
    ) {
      seen.push({ url: request.url(), body: request.postData() ?? "{}" });
    }
  });
  return seen;
}

test.describe("Structured question: charge_item", () => {
  test("add: picking two definitions renders two rows with the expected titles", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const first = "Amoxicillin 500mg Capsule";
    const second = "Paracetamol 500mg Tablet";
    await pickChargeItemDefinition(page, block, first);
    await pickChargeItemDefinition(page, block, second);

    await expect(rows(block)).toHaveCount(2);
    await expect(rowByTitle(block, first)).toHaveCount(1);
    await expect(rowByTitle(block, second)).toHaveCount(1);
    // Every freshly-added row defaults to quantity "1" (`newChargeItemRow`).
    await expect(
      rowByTitle(block, first)
        .locator('[data-column="quantity"]')
        .getByRole("spinbutton"),
    ).toHaveValue("1");
  });

  test("edit: changing a quantity and a performer on the same row both stick", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const title = "Ibuprofen 400mg Tablet";
    await pickChargeItemDefinition(page, block, title);
    const row = rowByTitle(block, title);

    const quantityInput = row
      .locator('[data-column="quantity"]')
      .getByRole("spinbutton");
    await quantityInput.fill("3");
    await expect(quantityInput).toHaveValue("3");

    const performerTrigger = row.getByRole("combobox", { name: "Performer" });
    await expect(performerTrigger).toHaveText(/select performer/i);
    await performerTrigger.click();
    const firstOption = page.getByRole("option").first();
    await expect(firstOption).toBeVisible();
    // The option's own accessible name — read BEFORE clicking (the popover
    // closes on select) — is the stable oracle for what the trigger should
    // show afterwards. Only the first line (the bold display name; the
    // second line is the username) rather than the whole option's
    // `.innerText()`, which is not the same whitespace normalisation
    // `toHaveText()` applies to the trigger's own two-line layout (avatar
    // initials + name in separate block children).
    const performerName = (await firstOption.innerText()).split("\n")[0];
    await firstOption.click();

    await expect(performerTrigger).toContainText(performerName);

    // Both edits survive together — neither mutator clobbers the other's
    // row (Task 7's regression class, on this type's own two independent
    // columns).
    await expect(quantityInput).toHaveValue("3");
    await expect(performerTrigger).toContainText(performerName);
  });

  test("remove: removing one row through the row-actions menu leaves the other intact", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const first = "Amoxicillin 500mg Capsule";
    const second = "Paracetamol 500mg Tablet";
    await pickChargeItemDefinition(page, block, first);
    await pickChargeItemDefinition(page, block, second);
    await expect(rows(block)).toHaveCount(2);

    await removeRow(page, rowByTitle(block, first));

    await expect(rows(block)).toHaveCount(1);
    await expect(rowByTitle(block, first)).toHaveCount(0);
    await expect(rowByTitle(block, second)).toHaveCount(1);
  });

  test("validation: a quantity of 0 blocks Save and binds the error to that row's own quantity cell", async ({
    page,
  }) => {
    const posts = trackBatchRequests(page);
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const invalidTitle = "Amoxicillin 500mg Capsule";
    const validTitle = "Paracetamol 500mg Tablet";
    await pickChargeItemDefinition(page, block, invalidTitle);
    await pickChargeItemDefinition(page, block, validTitle);

    const invalidCell = rowByTitle(block, invalidTitle).locator(
      '[data-column="quantity"]',
    );
    const validCell = rowByTitle(block, validTitle).locator(
      '[data-column="quantity"]',
    );
    await invalidCell.getByRole("spinbutton").fill("0");

    await submitForm(page);

    // row_id binding — the exact assertion no legacy structured type could
    // make: the message renders in the OFFENDING row's own quantity cell
    // and nowhere near the untouched, still-valid sibling row.
    await expect(invalidCell.getByRole("alert")).toContainText(
      "Enter a quantity of 1 or more",
    );
    await expect(validCell.getByRole("alert")).toHaveCount(0);

    expect(
      posts,
      "client validation must block Save before any batch request is sent",
    ).toHaveLength(0);
  });

  test("draft: two added rows survive reload+restore with their titles and quantities intact", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    const fillUrl = structuredFixtureUrl(questionnaireId);
    await page.goto(fillUrl);

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const first = "Amoxicillin 500mg Capsule";
    const second = "Paracetamol 500mg Tablet";
    await pickChargeItemDefinition(page, block, first);
    await pickChargeItemDefinition(page, block, second);
    await rowByTitle(block, first)
      .locator('[data-column="quantity"]')
      .getByRole("spinbutton")
      .fill("2");
    await rowByTitle(block, second)
      .locator('[data-column="quantity"]')
      .getByRole("spinbutton")
      .fill("5");
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    await page.reload();
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    // Fresh mount, nothing restored yet: charge_item is create-only
    // (`NO_BASELINE`), so the section reads as zero rows before Resume —
    // not the pre-port state where a fresh reload had no draft to offer at
    // all (D2's predecessor excluded this type outright).
    await expect(rows(questionBlock(page, fixture.label))).toHaveCount(0);

    await page.getByRole("button", { name: /resume/i }).click();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();

    // THE ASSERTION THAT COULD NOT EXIST BEFORE THIS PORT: both rows come
    // back with their real titles (not a bare, unrecognisable slug) and
    // their quantities, repainted straight from the row's own carried
    // `charge_item_definition_object` (`model.ts`'s `newChargeItemRow`) —
    // the legacy widget's display objects lived only in a component
    // `useState` no restore could ever reach (`ChargeItemQuestion.tsx:207-283`).
    const restoredBlock = questionBlock(page, fixture.label);
    await expect(rows(restoredBlock)).toHaveCount(2);
    await expect(
      rowByTitle(restoredBlock, first)
        .locator('[data-column="quantity"]')
        .getByRole("spinbutton"),
    ).toHaveValue("2");
    await expect(
      rowByTitle(restoredBlock, second)
        .locator('[data-column="quantity"]')
        .getByRole("spinbutton"),
    ).toHaveValue("5");
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");
  });

  test("submit: saves the charge item and it appears on the encounter's billing surface", async ({
    page,
  }) => {
    test.slow();
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    // "Registration Fee" is the one catalog entry unlikely to appear
    // elsewhere in this test file's own runs; a randomised quantity is the
    // disambiguator against whatever earlier runs (this file's own
    // `add`/`edit` tests never submit, but `chargeItem.spec.ts`'s legacy
    // product-path test and earlier local runs of this very test do) may
    // have already applied against the same shared fixture encounter.
    const title = "Registration Fee";
    const quantity = String(faker.number.int({ min: 11, max: 89 }));
    await pickChargeItemDefinition(page, block, title);
    await rowByTitle(block, title)
      .locator('[data-column="quantity"]')
      .getByRole("spinbutton")
      .fill(quantity);

    await questionBlock(page, "Plain note")
      .getByRole("textbox")
      .fill(faker.lorem.words(3));

    await submitForm(page);
    await expectToast(page, /questionnaire submitted successfully/i);
    await page.waitForURL(/\/encounter\/[^/]+\/updates$/);

    const facilityId = getFacilityId();
    const encounterId = getEncounterId();
    const chargeItemsRes = await fetch(
      `${apiBaseUrl()}/api/v1/facility/${facilityId}/charge_item/?encounter=${encounterId}&title=${encodeURIComponent(title)}&limit=50`,
      { headers: adminApiHeaders() },
    );
    expect(chargeItemsRes.ok).toBe(true);
    const chargeItemsData = (await chargeItemsRes.json()) as {
      results: { id: string; title: string; quantity: string | number }[];
    };
    const created = chargeItemsData.results.find(
      // The wire quantity is accounting-precision decimal text (e.g.
      // "89.000000"), not the bare integer string the UI input took —
      // compare numerically rather than assuming a matching format.
      (item) => Number(item.quantity) === Number(quantity),
    );
    expect(
      created,
      "the just-applied charge item must be listed against this encounter",
    ).toBeTruthy();

    // On-page verify: the patient's default account for this facility is
    // exactly the account `apply_charge_item_definition` bills to when no
    // account is passed explicitly (`get_default_account`) — the same
    // account `patientAccount.setup.ts` creates/reuses for the shared
    // fixture patient.
    const accountId = getAccountId();
    await page.goto(
      `/facility/${facilityId}/billing/account/${accountId}/charge_items`,
    );
    await page.getByPlaceholder("Search by item").fill(title);
    await expect(
      page.getByRole("row").filter({ hasText: title }).filter({
        hasText: quantity,
      }),
    ).toBeVisible();
  });
});
