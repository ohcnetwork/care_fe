import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { addDays, format, subDays } from "date-fns";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

// Every test here creates consents in one shared fixture encounter, so "newest
// consent" is only well-defined if they don't run concurrently. Opt out of the
// project's fullyParallel setting: run this file's tests sequentially on a
// single worker (failures stay independent, unlike serial mode).
test.describe.configure({ mode: "default" });

// Set once in beforeAll from deterministic fixture ids (tests/support/*) and
// only read afterwards. Playwright isolates by worker, so this module state is
// not shared across parallel workers — safe to keep at module scope.
let facilityId: string;
let patientId: string;
let encounterId: string;

test.beforeAll(() => {
  facilityId = getFacilityId();
  patientId = getPatientId();
  encounterId = getEncounterId();
});

/** Navigate to the Consents tab for the test encounter */
async function goToConsentsTab(page: Page) {
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/consents`,
  );
  // Wait for a specific ready signal instead of the flaky networkidle
  await expect(
    page.getByRole("button", { name: /add.*consent/i }),
  ).toBeVisible();
}

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
 * consent card. Filter to cards that carry a "See Details" action (other cards
 * on the page also use data-slot="card"), then take the newest. Scoping here
 * avoids an unscoped page-wide getByText matching consents accumulated by
 * earlier tests in this shared encounter.
 */
function firstConsentCard(page: Page) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("button", { name: "See Details" }) })
    .first();
}

/** Open the "Add Consent" sheet */
async function openAddConsentSheet(page: Page) {
  await page.getByRole("button", { name: /add.*consent/i }).click();
  await expect(
    page.getByRole("heading", { name: "Add Consent" }),
  ).toBeVisible();
}

/** Click Save button in the consent form sheet */
async function clickSave(page: Page) {
  await page.getByRole("button", { name: "Save" }).click();
}

test.describe("Consent Creation", () => {
  test("create consent with defaults → card shows active, treatment, permit", async ({
    page,
  }) => {
    await goToConsentsTab(page);
    await openAddConsentSheet(page);

    // Just click save with defaults (permit, treatment, active)
    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Verify the newly created card shows its default badges
    const card = firstConsentCard(page);
    await expect(card.getByText("TREATMENT")).toBeVisible();
    await expect(card.getByText("Permitted")).toBeVisible();
    await expect(card.getByText("Active")).toBeVisible();
  });

  test("create consent → See Details → sidebar shows correct fields", async ({
    page,
  }) => {
    await goToConsentsTab(page);
    await openAddConsentSheet(page);

    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Click See Details on the newest card
    await page.getByRole("button", { name: "See Details" }).first().click();

    // Verify each field renders its expected value (not merely that the text
    // appears somewhere on the page)
    await expect(
      page.getByRole("heading", { name: "Consent Details" }),
    ).toBeVisible();
    await expect(detailFieldValue(page, "Category")).toHaveText("Treatment");
    await expect(detailFieldValue(page, "Consent Given On")).not.toBeEmpty();
    await expect(detailFieldValue(page, "Decision")).toHaveText("Permitted");
    await expect(detailFieldValue(page, "Status")).toHaveText("Active");
  });

  test("create consent with Deny decision → card shows Denied badge", async ({
    page,
  }) => {
    await goToConsentsTab(page);
    await openAddConsentSheet(page);

    // Select Deny decision
    await page.getByRole("radio", { name: "Deny" }).click();

    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Verify the newly created card shows Denied
    await expect(firstConsentCard(page).getByText("Denied")).toBeVisible();
  });

  const consentCategories = [
    { value: "Research", badge: "RESEARCH" },
    { value: "Privacy Consent", badge: "PRIVACY CONSENT" },
    { value: "Do Not Resuscitate", badge: "DO NOT RESUSCITATE" },
    { value: "Advance Directive", badge: "ADVANCE DIRECTIVE" },
    { value: "Advance Care Directive", badge: "ADVANCE CARE DIRECTIVE" },
  ];

  // One test per category so failures are individually reportable
  for (const { value, badge } of consentCategories) {
    test(`create consent with ${value} category → ${badge} badge on card`, async ({
      page,
    }) => {
      await goToConsentsTab(page);
      await openAddConsentSheet(page);

      // Open category dropdown and select
      await page
        .getByRole("combobox")
        .filter({ hasText: /treatment/i })
        .click();
      await page
        .getByRole("option", { name: new RegExp(`^${value}`, "i") })
        .first()
        .click();

      await clickSave(page);
      await expectToast(page, /consent created successfully/i);

      // Verify the newly created card shows the category badge
      await expect(firstConsentCard(page).getByText(badge)).toBeVisible();
    });
  }

  test("create consent with note → See Details → note visible", async ({
    page,
  }) => {
    const noteText = `Test note ${faker.string.alphanumeric(10)}`;

    await goToConsentsTab(page);
    await openAddConsentSheet(page);

    // Fill note
    await page.getByLabel("Note", { exact: true }).fill(noteText);

    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Navigate to detail page
    await page.getByRole("button", { name: "See Details" }).first().click();

    // Verify note is visible
    await expect(page.getByText(noteText)).toBeVisible();
  });

  test("create consent without note → See Details → no note section", async ({
    page,
  }) => {
    await goToConsentsTab(page);
    await openAddConsentSheet(page);

    // Leave note empty, just save
    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Navigate to detail page
    await page.getByRole("button", { name: "See Details" }).first().click();

    // The Note heading should not be visible (it only shows when note exists)
    await expect(page.getByRole("heading", { name: "Note" })).not.toBeVisible();
  });

  test("create consent with custom Valid From and Valid Until → dates on card and detail", async ({
    page,
  }) => {
    const validFrom = addDays(new Date(), 1);
    const validUntil = addDays(new Date(), 30);

    await goToConsentsTab(page);
    await openAddConsentSheet(page);

    // Fill Valid From
    await page
      .getByLabel("Consent Valid From", { exact: true })
      .fill(format(validFrom, "yyyy-MM-dd'T'HH:mm"));

    // Fill Valid Until
    await page
      .getByLabel("Consent Valid Until", { exact: true })
      .fill(format(validUntil, "yyyy-MM-dd'T'HH:mm"));

    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Go to detail page and verify both dates saved (rendered, not N/A)
    await page.getByRole("button", { name: "See Details" }).first().click();

    const validPeriod = detailFieldValue(page, "Valid Period");
    await expect(validPeriod).toContainText(format(validFrom, "MMMM d, yyyy"));
    await expect(validPeriod).toContainText(format(validUntil, "MMMM d, yyyy"));
  });

  test("set Valid Until before Valid From → validation error", async ({
    page,
  }) => {
    const now = new Date();
    const validFrom = addDays(now, 10);
    const validUntil = addDays(now, 1); // Before Valid From

    await goToConsentsTab(page);
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
  });

  test("set Valid From before Consent Given On → validation error", async ({
    page,
  }) => {
    const consentDate = new Date();
    const validFrom = subDays(consentDate, 5); // Before consent given on

    await goToConsentsTab(page);
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
  });
});

test.describe("Consent Editing", () => {
  test("create consent → See Details → Edit → only Status and Note visible", async ({
    page,
  }) => {
    await goToConsentsTab(page);
    await openAddConsentSheet(page);
    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Navigate to detail page
    await page.getByRole("button", { name: "See Details" }).first().click();
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
    ).not.toBeVisible();
    await expect(
      editSheet.getByText("Consent Decision", { exact: true }),
    ).not.toBeVisible();
  });

  test("edit note → save → updated note on detail page", async ({ page }) => {
    const originalNote = `Original ${faker.string.alphanumeric(8)}`;
    const updatedNote = `Updated ${faker.string.alphanumeric(8)}`;

    await goToConsentsTab(page);
    await openAddConsentSheet(page);

    // Create with original note
    await page.getByLabel("Note", { exact: true }).fill(originalNote);
    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Navigate to detail
    await page.getByRole("button", { name: "See Details" }).first().click();
    await expect(page.getByText(originalNote)).toBeVisible();

    // Edit
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Note", { exact: true }).fill(updatedNote);
    await clickSave(page);
    await expectToast(page, /consent updated successfully/i);

    // Sheet closes after save; verify updated note on the detail page
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText(updatedNote)).toBeVisible();
    await expect(page.getByText(originalNote)).not.toBeVisible();
  });

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
    test(`edit status to ${status} → saves and shows on detail`, async ({
      page,
    }) => {
      await goToConsentsTab(page);
      await openAddConsentSheet(page);
      await clickSave(page);
      await expectToast(page, /consent created successfully/i);

      // Navigate to detail
      await page.getByRole("button", { name: "See Details" }).first().click();
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
    });
  }
});
