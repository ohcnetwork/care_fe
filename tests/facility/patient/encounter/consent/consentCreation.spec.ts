import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { addDays, format, subDays } from "date-fns";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

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

/** Locate a datetime-local input by its form label (robust to field reordering) */
function dateInputByLabel(page: Page, label: string) {
  return page.locator(
    `label:text-is("${label}") + input[type="datetime-local"]`,
  );
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

    // Verify card appears on list
    await expect(page.getByText("TREATMENT").first()).toBeVisible();
    await expect(page.getByText("Permitted").first()).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();
  });

  test("create consent → See Details → sidebar shows correct fields", async ({
    page,
  }) => {
    await goToConsentsTab(page);
    await openAddConsentSheet(page);

    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Click See Details on the first card
    await page.getByRole("button", { name: "See Details" }).first().click();

    // Verify detail sidebar shows all fields
    await expect(page.getByText("Consent Details")).toBeVisible();
    await expect(page.getByText("Category")).toBeVisible();
    await expect(page.getByText("Treatment")).toBeVisible();
    await expect(page.getByText("Consent Given On")).toBeVisible();
    await expect(page.getByText("Decision")).toBeVisible();
    await expect(page.getByText("Permitted")).toBeVisible();
    await expect(page.getByText("Status")).toBeVisible();
    await expect(page.getByText("Active")).toBeVisible();
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

    // Verify card shows Denied
    await expect(page.getByText("Denied").first()).toBeVisible();
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

      // Verify badge
      await expect(page.getByText(badge).first()).toBeVisible();
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
    const validFromInput = dateInputByLabel(page, "Consent Valid From");
    await validFromInput.fill(format(validFrom, "yyyy-MM-dd'T'HH:mm"));

    // Fill Valid Until
    const validUntilInput = dateInputByLabel(page, "Consent Valid Until");
    await validUntilInput.fill(format(validUntil, "yyyy-MM-dd'T'HH:mm"));

    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Go to detail page and verify dates
    await page.getByRole("button", { name: "See Details" }).first().click();

    await expect(page.getByText("Valid Period")).toBeVisible();
    // Dates should not show N/A
    const validPeriodSection = page
      .locator("div")
      .filter({ hasText: /valid period/i })
      .last();
    await expect(validPeriodSection).not.toContainText("N/A");
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
    const validFromInput = dateInputByLabel(page, "Consent Valid From");
    await validFromInput.fill(format(validFrom, "yyyy-MM-dd'T'HH:mm"));

    // Fill Valid Until (before Valid From)
    const validUntilInput = dateInputByLabel(page, "Consent Valid Until");
    await validUntilInput.fill(format(validUntil, "yyyy-MM-dd'T'HH:mm"));

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
    const validFromInput = dateInputByLabel(page, "Consent Valid From");
    await validFromInput.fill(format(validFrom, "yyyy-MM-dd'T'HH:mm"));

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

  test("edit status to inactive → badge updates on detail and card", async ({
    page,
  }) => {
    await goToConsentsTab(page);
    await openAddConsentSheet(page);
    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Navigate to detail
    await page.getByRole("button", { name: "See Details" }).first().click();
    await expect(page.getByText("Consent Details")).toBeVisible();

    // Click Edit
    await page.getByRole("button", { name: "Edit" }).click();
    const editSheet = page.getByRole("dialog");

    // Change status to Inactive
    await editSheet
      .getByRole("combobox")
      .filter({ hasText: /active/i })
      .click();
    await page.getByRole("option", { name: "Inactive" }).first().click();

    await clickSave(page);
    await expectToast(page, /consent updated successfully/i);

    // Sheet closes after save; verify status updated on the detail page
    await expect(editSheet).toBeHidden();
    await expect(page.getByText("Inactive").first()).toBeVisible();
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

  test("edit status to each value → each saves correctly", async ({ page }) => {
    const statuses = [
      { name: "Inactive", display: "Inactive" },
      { name: "Draft", display: "Draft" },
      { name: "Not Done", display: "Not Done" },
      { name: "Entered in Error", display: "Entered in Error" },
    ];

    await goToConsentsTab(page);
    await openAddConsentSheet(page);
    await clickSave(page);
    await expectToast(page, /consent created successfully/i);

    // Navigate to detail
    await page.getByRole("button", { name: "See Details" }).first().click();
    await expect(page.getByText("Consent Details")).toBeVisible();

    for (const status of statuses) {
      // Click Edit
      await page.getByRole("button", { name: "Edit" }).click();
      const editSheet = page.getByRole("dialog");

      // Change status
      await editSheet.getByRole("combobox").first().click();
      await page
        .getByRole("option", { name: status.name, exact: true })
        .first()
        .click();

      await clickSave(page);
      await expectToast(page, /consent updated successfully/i);

      // Sheet closes after save; verify status on the detail page
      await expect(editSheet).toBeHidden();
      await expect(page.getByText(status.display).first()).toBeVisible();

      // Wait for the success toast to clear so the next iteration's toast
      // doesn't stack and break the strict-match toast assertion
      await expect(
        page
          .locator(".toaster.group")
          .getByText(/consent updated successfully/i),
      ).toHaveCount(0);
    }
  });
});
