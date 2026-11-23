import { expect, test } from "@playwright/test";
import { format, subDays, subHours } from "date-fns";
import {
  ConsentEncounter,
  consentCards,
  createConsentEncounter,
  createConsentWithFiles,
  createTestConsent,
  goToConsentsTab,
} from "tests/helper/consent";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

// Must match CONSENTS_PER_PAGE in src/pages/Encounters/tabs/consents.tsx.
const CONSENTS_PER_PAGE = 12;

const PDF = "tests/fixtures/sample.pdf";
const PNG = "tests/fixtures/images/sample_img1.png";
const BLOOD_REPORT = "blood_report.pdf";
const XRAY = "xray_chest.png";

/** datetime-local value for the consent sheet's date inputs. */
function dateTimeLocal(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

let encounter: ConsentEncounter;

test.beforeEach(async ({ page }) => {
  // Own patient + encounter per test, so only this test's consents are listed.
  encounter = await createConsentEncounter("Consent List");
  await goToConsentsTab(page, encounter.consentsUrl);
});

test.describe("Consent list", () => {
  test(
    'create consent with Valid Until in the past → card shows "Expired" badge alongside other badges',
    { tag: ["@atomic", "@cap:encounter.consent.list"] },
    async ({ page }) => {
      const now = new Date();

      await test.step("Create a consent whose validity ended yesterday", async () => {
        await page.getByRole("button", { name: /add.*consent/i }).click();
        const sheet = page.getByRole("dialog", { name: "Add Consent" });
        await expect(sheet).toBeVisible();

        // Valid From may not precede Consent Given On, so move both back first.
        await sheet
          .getByLabel(/Consent Given On/)
          .fill(dateTimeLocal(subDays(now, 10)));
        await sheet
          .getByLabel("Consent Valid From", { exact: true })
          .fill(dateTimeLocal(subDays(now, 9)));
        await sheet
          .getByLabel("Consent Valid Until", { exact: true })
          .fill(dateTimeLocal(subHours(subDays(now, 1), 1)));

        await sheet.getByRole("button", { name: "Save" }).click();
        await expectToast(page, /consent created successfully/i);
      });

      await test.step("Verify the card shows Expired with its other badges", async () => {
        const card = consentCards(page);
        await expect(card).toHaveCount(1);
        await expect(card.getByText("Expired", { exact: true })).toBeVisible();
        await expect(
          card.getByText("TREATMENT", { exact: true }),
        ).toBeVisible();
        await expect(
          card.getByText("Permitted", { exact: true }),
        ).toBeVisible();
        await expect(card.getByText("Active", { exact: true })).toBeVisible();
      });
    },
  );

  test(
    "more consents than one page → pagination appears and the next page shows the rest",
    { tag: ["@atomic", "@cap:encounter.consent.list"] },
    async ({ page }) => {
      const total = CONSENTS_PER_PAGE + 1;

      await test.step(`Create ${total} consents`, async () => {
        // Setup only (pagination is under test), so create them via the API.
        for (let i = 0; i < total; i++) {
          await createTestConsent(encounter);
        }
        await goToConsentsTab(page, encounter.consentsUrl);
      });

      await test.step("Verify the first page is full and pagination is shown", async () => {
        await expect(consentCards(page)).toHaveCount(CONSENTS_PER_PAGE);
        await expect(
          page.getByRole("button", { name: "Go to page 2" }),
        ).toBeVisible();
      });

      await test.step("Go to the next page and verify the remaining consent", async () => {
        await page
          .getByRole("button", { name: "Go to next page" })
          .filter({ visible: true })
          .click();
        await expect(consentCards(page)).toHaveCount(total - CONSENTS_PER_PAGE);
      });
    },
  );

  test.describe("search by file name", () => {
    test.beforeEach(async ({ page }) => {
      await createConsentWithFiles(page, [{ path: PDF, name: BLOOD_REPORT }]);
      await createConsentWithFiles(page, [{ path: PNG, name: XRAY }]);
      await expect(consentCards(page)).toHaveCount(2);
    });

    test(
      'type "blood" → only the consent with blood_report.pdf is shown',
      { tag: ["@atomic", "@cap:encounter.consent.search"] },
      async ({ page }) => {
        await test.step('Search for "blood"', async () => {
          await page.getByPlaceholder("Search existing consent").fill("blood");
        });

        await test.step("Verify only the matching consent is listed", async () => {
          const cards = consentCards(page);
          await expect(cards).toHaveCount(1);
          await expect(cards.getByText(BLOOD_REPORT)).toBeVisible();
          await expect(page.getByText(XRAY)).toHaveCount(0);
        });
      },
    );

    test(
      "type a file name that doesn't exist → empty state, no consent cards",
      { tag: ["@atomic", "@cap:encounter.consent.search"] },
      async ({ page }) => {
        await test.step("Search for a non-existent file name", async () => {
          await page
            .getByPlaceholder("Search existing consent")
            .fill("no_such_file_xyz");
        });

        await test.step("Verify the empty state is shown", async () => {
          await expect(page.getByText("No Consents found")).toBeVisible();
          await expect(consentCards(page)).toHaveCount(0);
        });
      },
    );

    test(
      "search, then clear the input → full list restores",
      { tag: ["@atomic", "@cap:encounter.consent.search"] },
      async ({ page }) => {
        const search = page.getByPlaceholder("Search existing consent");

        await test.step('Search for "blood"', async () => {
          await search.fill("blood");
          await expect(consentCards(page)).toHaveCount(1);
        });

        await test.step("Clear the search and verify both consents return", async () => {
          await search.clear();
          const cards = consentCards(page);
          await expect(cards).toHaveCount(2);
          await expect(cards.getByText(BLOOD_REPORT)).toBeVisible();
          await expect(cards.getByText(XRAY)).toBeVisible();
        });
      },
    );

    test(
      'search "BLOOD" → matches blood_report.pdf (case-insensitive)',
      { tag: ["@atomic", "@cap:encounter.consent.search"] },
      async ({ page }) => {
        await test.step('Search for "BLOOD"', async () => {
          await page.getByPlaceholder("Search existing consent").fill("BLOOD");
        });

        await test.step("Verify the lowercase file name still matches", async () => {
          const cards = consentCards(page);
          await expect(cards).toHaveCount(1);
          await expect(cards.getByText(BLOOD_REPORT)).toBeVisible();
        });
      },
    );
  });
});
