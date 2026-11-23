import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { addDays, format, subDays } from "date-fns";
import {
  consentCards,
  createConsentEncounter,
  createConsentViaUi,
  goToConsentsTab,
  openAddConsentSheet,
} from "tests/helper/consent";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// Set per test in beforeEach. Playwright isolates by worker and a worker runs
// one test at a time, so this module state is never shared between tests.
let facilityId: string;
let patientId: string;
let encounterId: string;
let consentsUrl: string;

test.beforeEach(async () => {
  // Own patient + encounter per test, so the consent a test creates is the
  // only one on its Consents tab (no "newest card" races between tests).
  facilityId = getFacilityId();
  ({ patientId, encounterId, consentsUrl } =
    await createConsentEncounter("Consent Creation"));
});

/**
 * The detail card renders each field as a heading followed by its value
 * paragraph. Return that value paragraph so assertions target the actual value
 * (e.g. Status → "Active"), not any matching text elsewhere on the page.
 */
function detailFieldValue(page: Page, heading: string) {
  return page
    .getByRole("heading", { name: heading, exact: true })
    .locator("xpath=following-sibling::p");
}

/**
 * The consents list is newest-first, so a just-created consent is the first
 * consent card (cards with a "See Details" action; other cards on the page
 * also use data-slot="card").
 */
function firstConsentCard(page: Page) {
  return consentCards(page).first();
}

/**
 * Saving shows its toast before the invalidated consents list has refetched.
 * Reload the tab to read the list fresh, then open the newest consent.
 */
async function openNewestConsentDetails(page: Page) {
  await goToConsentsTab(page, consentsUrl);
  await page.getByRole("button", { name: "See Details" }).first().click();
}

/** Click Save button in the consent form sheet */
async function clickSave(page: Page) {
  await page.getByRole("button", { name: "Save" }).click();
}

test.describe("Consent Creation", () => {
  test(
    "create consent with defaults → card shows active, treatment, permit",
    { tag: ["@atomic", "@cap:encounter.consent.create"] },
    async ({ page }) => {
      // Save with defaults (permit, treatment, active)
      await createConsentViaUi(page, { facilityId, patientId, encounterId });

      // Verify the newly created card shows its default badges
      const card = firstConsentCard(page);
      await expect(card.getByText("TREATMENT")).toBeVisible();
      await expect(card.getByText("Permitted")).toBeVisible();
      await expect(card.getByText("Active")).toBeVisible();
    },
  );

  test(
    "create consent → See Details → sidebar shows correct fields",
    { tag: ["@atomic", "@cap:encounter.consent.view"] },
    async ({ page }) => {
      await createConsentViaUi(page, { facilityId, patientId, encounterId });

      // Click See Details on the newest card
      await openNewestConsentDetails(page);

      // Verify each field renders its expected value (not merely that the text
      // appears somewhere on the page)
      await expect(
        page.getByRole("heading", { name: "Consent Details" }),
      ).toBeVisible();
      await expect(detailFieldValue(page, "Category")).toHaveText("Treatment");
      await expect(detailFieldValue(page, "Consent Given On")).not.toBeEmpty();
      await expect(detailFieldValue(page, "Decision")).toHaveText("Permitted");
      await expect(detailFieldValue(page, "Status")).toHaveText("Active");
    },
  );

  test(
    "create consent with Deny decision → card shows Denied badge",
    { tag: ["@atomic", "@cap:encounter.consent.create"] },
    async ({ page }) => {
      // Select Deny decision
      await createConsentViaUi(page, {
        facilityId,
        patientId,
        encounterId,
        decision: "Deny",
      });

      // Verify the newly created card shows Denied
      await expect(firstConsentCard(page).getByText("Denied")).toBeVisible();
    },
  );

  const consentCategories = [
    { value: "Research", badge: "RESEARCH" },
    { value: "Privacy Consent", badge: "PRIVACY CONSENT" },
    { value: "Do Not Resuscitate", badge: "DO NOT RESUSCITATE" },
    { value: "Advance Directive", badge: "ADVANCE DIRECTIVE" },
    { value: "Advance Care Directive", badge: "ADVANCE CARE DIRECTIVE" },
  ];

  // One test per category so failures are individually reportable
  for (const { value, badge } of consentCategories) {
    test(
      `create consent with ${value} category → ${badge} badge on card`,
      { tag: ["@atomic", "@cap:encounter.consent.create"] },
      async ({ page }) => {
        // Pick the category in the dropdown
        await createConsentViaUi(page, {
          facilityId,
          patientId,
          encounterId,
          category: value,
        });

        // Verify the newly created card shows the category badge
        await expect(firstConsentCard(page).getByText(badge)).toBeVisible();
      },
    );
  }

  test(
    "create consent with note → See Details → note visible",
    { tag: ["@atomic", "@cap:encounter.consent.create"] },
    async ({ page }) => {
      const noteText = `Test note ${faker.string.alphanumeric(10)}`;

      await createConsentViaUi(page, {
        facilityId,
        patientId,
        encounterId,
        note: noteText,
      });

      // Navigate to detail page
      await openNewestConsentDetails(page);

      // Verify note is visible
      await expect(page.getByText(noteText)).toBeVisible();
    },
  );

  test(
    "create consent without note → See Details → no note section",
    { tag: ["@atomic", "@cap:encounter.consent.view"] },
    async ({ page }) => {
      // Leave note empty, just save
      await createConsentViaUi(page, { facilityId, patientId, encounterId });

      // Navigate to detail page
      await openNewestConsentDetails(page);

      // The Note heading should not be visible (it only shows when note exists)
      await expect(page.getByRole("heading", { name: "Note" })).toBeHidden();
    },
  );

  test(
    "create consent with custom Valid From and Valid Until → dates on card and detail",
    { tag: ["@atomic", "@cap:encounter.consent.create"] },
    async ({ page }) => {
      const validFrom = addDays(new Date(), 1);
      const validUntil = addDays(new Date(), 30);

      await createConsentViaUi(page, {
        facilityId,
        patientId,
        encounterId,
        validFrom,
        validUntil,
      });

      // Go to detail page and verify both dates saved (rendered, not N/A)
      await openNewestConsentDetails(page);

      const validPeriod = detailFieldValue(page, "Valid Period");
      await expect(validPeriod).toContainText(
        format(validFrom, "MMMM d, yyyy"),
      );
      await expect(validPeriod).toContainText(
        format(validUntil, "MMMM d, yyyy"),
      );
    },
  );

  test(
    "set Valid Until before Valid From → validation error",
    { tag: ["@atomic", "@cap:encounter.consent.create"] },
    async ({ page }) => {
      const now = new Date();
      const validFrom = addDays(now, 10);
      const validUntil = addDays(now, 1); // Before Valid From

      await goToConsentsTab(page, consentsUrl);
      await openAddConsentSheet(page);

      // Fill Valid From (after consent date)
      await page
        .getByLabel("Consent Valid From", { exact: true })
        .fill(format(validFrom, "yyyy-MM-dd'T'HH:mm"));

      // Fill Valid Until (before Valid From)
      await page
        .getByLabel("Consent Valid Until", { exact: true })
        .fill(format(validUntil, "yyyy-MM-dd'T'HH:mm"));

      await clickSave(page);

      // Should show validation error. The product string is misspelled
      // ("Untill"); `untill?` tolerates a future correction to "until".
      await expect(
        page.getByText(/valid from must be before valid untill?/i),
      ).toBeVisible();
    },
  );

  test(
    "set Valid From before Consent Given On → validation error",
    { tag: ["@atomic", "@cap:encounter.consent.create"] },
    async ({ page }) => {
      const consentDate = new Date();
      const validFrom = subDays(consentDate, 5); // Before consent given on

      await goToConsentsTab(page, consentsUrl);
      await openAddConsentSheet(page);

      // Fill Valid From to a date before consent date
      await page
        .getByLabel("Consent Valid From", { exact: true })
        .fill(format(validFrom, "yyyy-MM-dd'T'HH:mm"));

      await clickSave(page);

      // Should show validation error
      await expect(
        page.getByText(/valid from date cannot be before/i),
      ).toBeVisible();
    },
  );
});

test.describe("Consent Editing", () => {
  test(
    "create consent → See Details → Edit → only Status and Note visible",
    { tag: ["@atomic", "@cap:encounter.consent.edit"] },
    async ({ page }) => {
      await createConsentViaUi(page, { facilityId, patientId, encounterId });

      // Navigate to detail page
      await openNewestConsentDetails(page);
      await expect(page.getByText("Consent Details")).toBeVisible();

      // Click Edit
      await page.getByRole("button", { name: "Edit" }).click();
      const editSheet = page.getByRole("dialog");
      await expect(editSheet.getByText("Edit Consent")).toBeVisible();

      // Status and Note should be visible within the edit sheet
      await expect(editSheet.getByText("Status")).toBeVisible();
      await expect(editSheet.getByText("Note")).toBeVisible();

      // Creation-only fields should NOT be present in the edit sheet.
      // (Scoped to the sheet: the detail page behind it still shows these.)
      await expect(
        editSheet.getByText("Consent Given On", { exact: true }),
      ).toBeHidden();
      await expect(
        editSheet.getByText("Consent Decision", { exact: true }),
      ).toBeHidden();
    },
  );

  test(
    "edit note → save → updated note on detail page",
    { tag: ["@atomic", "@cap:encounter.consent.edit"] },
    async ({ page }) => {
      const originalNote = `Original ${faker.string.alphanumeric(8)}`;
      const updatedNote = `Updated ${faker.string.alphanumeric(8)}`;

      // Create with original note
      await createConsentViaUi(page, {
        facilityId,
        patientId,
        encounterId,
        note: originalNote,
      });

      // Navigate to detail
      await openNewestConsentDetails(page);
      await expect(page.getByText(originalNote)).toBeVisible();

      // Edit
      await page.getByRole("button", { name: "Edit" }).click();
      await page.getByLabel("Note", { exact: true }).fill(updatedNote);
      await clickSave(page);
      await expectToast(page, /consent updated successfully/i);

      // Sheet closes after save; verify updated note on the detail page
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(page.getByText(updatedNote)).toBeVisible();
      await expect(page.getByText(originalNote)).toBeHidden();
    },
  );

  // One test per status (mirrors the split category tests): each creates its
  // own consent so the cases stay isolated and individually reportable, and
  // there's no toast stacking from repeated saves within a loop.
  const editableStatuses = [
    "Inactive",
    "Draft",
    "Not Done",
    "Entered in Error",
  ];
  for (const status of editableStatuses) {
    test(
      `edit status to ${status} → saves and shows on detail`,
      { tag: ["@atomic", "@cap:encounter.consent.edit"] },
      async ({ page }) => {
        await createConsentViaUi(page, { facilityId, patientId, encounterId });

        // Navigate to detail
        await openNewestConsentDetails(page);
        await expect(
          page.getByRole("heading", { name: "Consent Details" }),
        ).toBeVisible();

        // Edit status via the edit sheet's single combobox
        await page.getByRole("button", { name: "Edit" }).click();
        const editSheet = page.getByRole("dialog");
        await editSheet.getByRole("combobox").click();
        await page
          .getByRole("option", { name: status, exact: true })
          .first()
          .click();

        await clickSave(page);
        await expectToast(page, /consent updated successfully/i);

        // Sheet closes after save; the detail Status value reflects the change
        await expect(editSheet).toBeHidden();
        await expect(detailFieldValue(page, "Status")).toHaveText(status);
      },
    );
  }
});
