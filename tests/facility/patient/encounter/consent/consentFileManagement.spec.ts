import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

// These tests create consents in one shared fixture encounter, so "newest
// consent" is only well-defined if they don't run concurrently. Opt out of the
// project's fullyParallel setting and run this file's tests sequentially.
test.describe.configure({ mode: "default" });

// Set once in beforeAll from deterministic fixture ids (tests/support/*).
let facilityId: string;
let patientId: string;
let encounterId: string;

test.beforeAll(() => {
  facilityId = getFacilityId();
  patientId = getPatientId();
  encounterId = getEncounterId();
});

const PNG = "tests/fixtures/images/sample_img1.png";
const PNG2 = "tests/fixtures/images/sample_img2.png";
const JPG = "tests/fixtures/images/test-image.jpg";
const PDF = "tests/fixtures/sample.pdf";

/** A unique, extension-free display name so a specific file row is locatable. */
function uniqueName(prefix: string) {
  return `${prefix}-${faker.string.alphanumeric(8)}`;
}

/** Navigate to the Consents tab for the test encounter. */
async function goToConsentsTab(page: Page) {
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/consents`,
  );
  await expect(
    page.getByRole("button", { name: /add.*consent/i }),
  ).toBeVisible();
}

/** Open the "Add Consent" sheet. */
async function openAddConsentSheet(page: Page) {
  await page.getByRole("button", { name: /add.*consent/i }).click();
  await expect(
    page.getByRole("heading", { name: "Add Consent" }),
  ).toBeVisible();
}

/**
 * The consents list is newest-first, so a just-created consent is the first
 * card. Scope to cards carrying a "See Details" action (other cards on the page
 * also use data-slot="card").
 */
function firstConsentCard(page: Page) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("button", { name: "See Details" }) })
    .first();
}

/**
 * Attach files in the Add Consent sheet and give each a display name. The sheet
 * renders a hidden file input plus one inline "File Name" field per file
 * (names are required — no fallback to the original filename).
 */
async function attachFilesInForm(
  page: Page,
  files: { path: string; name: string }[],
) {
  await page
    .locator('input[type="file"]')
    .setInputFiles(files.map((f) => f.path));
  for (let i = 0; i < files.length; i++) {
    const nameField = page.getByRole("textbox", { name: "File Name" }).nth(i);
    await nameField.waitFor({ state: "visible" });
    await nameField.fill(files[i].name);
  }
}

/** Create a consent from the sheet with the given attached files. */
async function createConsentWithFiles(
  page: Page,
  files: { path: string; name: string }[],
) {
  await openAddConsentSheet(page);
  await attachFilesInForm(page, files);
  await page.getByRole("button", { name: "Save" }).click();
  await expectToast(page, /consent created successfully/i);
}

/** Open the detail page of the newest consent card. */
async function openNewestConsentDetail(page: Page) {
  await page.getByRole("button", { name: "See Details" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Consent Details" }),
  ).toBeVisible();
}

/**
 * Upload a file from the consent detail page. This path uses the shared
 * FileUploadDialog (Add Files → pick file → name → Upload), matching the
 * patient-files flow.
 */
async function uploadFileFromDetail(
  page: Page,
  filePath: string,
  displayName: string,
) {
  await page.getByRole("button", { name: "Add Files" }).click();
  await expect(page.locator('input[type="file"]')).toBeAttached({
    timeout: 5000,
  });
  await page.locator('input[type="file"]').setInputFiles(filePath);

  const nameField = page.getByRole("textbox", { name: "File Name" }).first();
  await expect(nameField).toBeVisible({ timeout: 5000 });
  await nameField.fill(displayName);

  const uploadPromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/files/") &&
      response.request().method() === "POST",
    { timeout: 15000 },
  );
  await page.getByRole("button", { name: "Upload" }).click();
  const response = await uploadPromise;
  expect(response.status()).toBe(200);
}

/** A file's row on the detail page, scoped by its display name. */
function detailFileRow(page: Page, displayName: string) {
  return page
    .locator("div")
    .filter({ has: page.getByText(displayName, { exact: true }) })
    .filter({ has: page.getByText("Uploaded") })
    .first();
}

test.describe("Consent file management", () => {
  test("create consent with a file attached → card shows the file name", async ({
    page,
  }) => {
    const fileName = uniqueName("single");
    await goToConsentsTab(page);
    await createConsentWithFiles(page, [{ path: PNG, name: fileName }]);

    await expect(firstConsentCard(page).getByText(fileName)).toBeVisible({
      timeout: 15000,
    });
  });

  test('create consent with multiple files → card shows primary name + "+N more"', async ({
    page,
  }) => {
    const first = uniqueName("multi-a");
    const second = uniqueName("multi-b");
    await goToConsentsTab(page);
    await createConsentWithFiles(page, [
      { path: PNG, name: first },
      { path: PNG2, name: second },
    ]);

    const card = firstConsentCard(page);
    // One name is the primary; the remainder collapse into "+N more file(s)".
    await expect(card.getByText(/more file/i)).toBeVisible({ timeout: 15000 });
    await expect(
      card.getByText(new RegExp(`${first}|${second}`)),
    ).toBeVisible();
  });

  test("create consent with file renamed before save → custom name on card and detail", async ({
    page,
  }) => {
    // Custom name deliberately unrelated to the fixture's real filename.
    const customName = uniqueName("renamed");
    await goToConsentsTab(page);
    await createConsentWithFiles(page, [{ path: PNG, name: customName }]);

    await expect(firstConsentCard(page).getByText(customName)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("sample_img1")).toHaveCount(0);

    await openNewestConsentDetail(page);
    await expect(page.getByText(customName)).toBeVisible();
  });

  test('create consent with file → See Details → file shows green "Uploaded" badge', async ({
    page,
  }) => {
    const fileName = uniqueName("badge");
    await goToConsentsTab(page);
    await createConsentWithFiles(page, [{ path: PNG, name: fileName }]);

    await openNewestConsentDetail(page);
    await expect(page.getByText(fileName)).toBeVisible({ timeout: 15000 });
    await expect(
      detailFileRow(page, fileName).getByText("Uploaded"),
    ).toBeVisible();
  });

  test("create consent → See Details → upload file from detail page → file appears with badge", async ({
    page,
  }) => {
    const fileName = uniqueName("detail-upload");
    await goToConsentsTab(page);
    await createConsentWithFiles(page, []);
    await openNewestConsentDetail(page);

    await uploadFileFromDetail(page, PNG, fileName);

    await expect(page.getByText(fileName)).toBeVisible({ timeout: 15000 });
    await expect(
      detailFileRow(page, fileName).getByText("Uploaded"),
    ).toBeVisible();
  });

  test("upload two files sequentially on the detail page → both listed", async ({
    page,
  }) => {
    const first = uniqueName("seq-a");
    const second = uniqueName("seq-b");
    await goToConsentsTab(page);
    await createConsentWithFiles(page, []);
    await openNewestConsentDetail(page);

    await uploadFileFromDetail(page, PNG, first);
    await expect(page.getByText(first)).toBeVisible({ timeout: 15000 });

    await uploadFileFromDetail(page, JPG, second);
    await expect(page.getByText(second)).toBeVisible({ timeout: 15000 });

    await expect(page.getByText(first)).toBeVisible();
    await expect(page.getByText(second)).toBeVisible();
  });

  test("start file upload on the detail page → cancel → list unchanged", async ({
    page,
  }) => {
    await goToConsentsTab(page);
    await createConsentWithFiles(page, []);
    await openNewestConsentDetail(page);

    // The empty state is shown when no files are attached.
    await expect(page.getByText("No files attached")).toBeVisible();

    await page.getByRole("button", { name: "Add Files" }).click();
    await expect(page.locator('input[type="file"]')).toBeAttached({
      timeout: 5000,
    });
    await page.locator('input[type="file"]').setInputFiles(PNG);

    // Dismiss the upload dialog without confirming.
    await expect(
      page.getByRole("textbox", { name: "File Name" }).first(),
    ).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");

    // Nothing was added; the empty state remains.
    await expect(page.getByText("No files attached")).toBeVisible();
  });

  test("upload jpg, png and pdf separately → each accepted and displayed", async ({
    page,
  }) => {
    const jpgName = uniqueName("type-jpg");
    const pngName = uniqueName("type-png");
    const pdfName = uniqueName("type-pdf");
    await goToConsentsTab(page);
    await createConsentWithFiles(page, []);
    await openNewestConsentDetail(page);

    await uploadFileFromDetail(page, JPG, jpgName);
    await expect(page.getByText(jpgName)).toBeVisible({ timeout: 15000 });

    await uploadFileFromDetail(page, PNG, pngName);
    await expect(page.getByText(pngName)).toBeVisible({ timeout: 15000 });

    await uploadFileFromDetail(page, PDF, pdfName);
    await expect(page.getByText(pdfName)).toBeVisible({ timeout: 15000 });
  });

  test("click View on an image attachment → preview opens", async ({
    page,
  }) => {
    const fileName = uniqueName("view");
    await goToConsentsTab(page);
    await createConsentWithFiles(page, [{ path: PNG, name: fileName }]);
    await openNewestConsentDetail(page);

    await expect(page.getByText(fileName)).toBeVisible({ timeout: 15000 });
    await detailFileRow(page, fileName)
      .getByRole("button", { name: "View" })
      .click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
  });

  test("click Download on an attachment → download initiates", async ({
    page,
  }) => {
    const fileName = uniqueName("download");
    await goToConsentsTab(page);
    await createConsentWithFiles(page, [{ path: PNG, name: fileName }]);
    await openNewestConsentDetail(page);

    await expect(page.getByText(fileName)).toBeVisible({ timeout: 15000 });

    const downloadPromise = page.waitForEvent("download", { timeout: 15000 });
    await detailFileRow(page, fileName)
      .getByRole("button", { name: "Download" })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('create consent without files → card shows "No files attached"', async ({
    page,
  }) => {
    await goToConsentsTab(page);
    await createConsentWithFiles(page, []);

    await expect(
      firstConsentCard(page).getByText("No files attached"),
    ).toBeVisible({ timeout: 15000 });
  });

  test("file uploaded from the detail page is reflected on the consent card", async ({
    page,
  }) => {
    const fileName = uniqueName("card-sync");
    await goToConsentsTab(page);
    await createConsentWithFiles(page, []);
    await openNewestConsentDetail(page);

    await uploadFileFromDetail(page, PNG, fileName);
    await expect(page.getByText(fileName)).toBeVisible({ timeout: 15000 });

    // Back on the list, the (still newest) consent card now shows the file.
    await goToConsentsTab(page);
    await expect(firstConsentCard(page).getByText(fileName)).toBeVisible({
      timeout: 15000,
    });
  });
});
