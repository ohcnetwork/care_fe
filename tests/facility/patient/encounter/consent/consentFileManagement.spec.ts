import { faker } from "@faker-js/faker";
import { expect, Locator, Page, test } from "@playwright/test";
import {
  consentCards,
  consentUploadDialog,
  createConsentEncounter,
  createConsentWithFiles,
  goToConsentsTab,
  pickConsentFileOnDetail,
  uploadConsentFileViaUi,
} from "tests/helper/consent";

test.use({ storageState: "tests/.auth/user.json" });

const PNG = "tests/fixtures/images/sample_img1.png";
const PNG2 = "tests/fixtures/images/sample_img2.png";
const JPG = "tests/fixtures/images/test-image.jpg";
const PDF = "tests/fixtures/sample.pdf";

/** A unique, extension-free display name so a specific file row is locatable. */
function uniqueName(prefix: string) {
  return `${prefix}-${faker.string.alphanumeric(8)}`;
}

let consentsUrl: string;

/** Open the consent's detail page from its card. */
async function openConsentDetail(page: Page) {
  await consentCards(page).getByRole("button", { name: "See Details" }).click();
  await expect(
    page.getByRole("heading", { name: "Consent Details" }),
  ).toBeVisible();
}

/** Attachment rows on the detail page's Supporting Documents card. */
function detailFileRows(page: Page): Locator {
  return page.locator("div.py-2").filter({
    has: page.getByRole("button", { name: "Download" }),
  });
}

/** A file's row on the detail page, scoped by its display name. */
function detailFileRow(page: Page, displayName: string): Locator {
  return detailFileRows(page).filter({
    has: page.getByText(displayName, { exact: true }),
  });
}

/** Assert a detail-page row carries the green "Uploaded" badge. */
async function expectUploadedBadge(page: Page, displayName: string) {
  const badge = detailFileRow(page, displayName).locator(
    '[data-slot="badge"]',
    { hasText: "Uploaded" },
  );
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute("data-variant", "green");
}

test.describe("Consent file management", () => {
  test.beforeEach(async ({ page }) => {
    // Own patient + encounter per test, so its consent is the only one listed.
    ({ consentsUrl } = await createConsentEncounter("Consent Files"));
    await goToConsentsTab(page, consentsUrl);
  });

  test(
    "create consent with a file attached → card shows the file name",
    { tag: ["@atomic", "@cap:encounter.consent.create"] },
    async ({ page }) => {
      const fileName = uniqueName("single");

      await test.step("Create a consent with one attached file", async () => {
        await createConsentWithFiles(page, [{ path: PNG, name: fileName }]);
      });

      await test.step("Verify the card shows the file name", async () => {
        await expect(consentCards(page).getByText(fileName)).toBeVisible();
      });
    },
  );

  test(
    'create consent with multiple files → card shows primary name + "+N more"',
    { tag: ["@atomic", "@cap:encounter.consent.create"] },
    async ({ page }) => {
      const first = uniqueName("multi-a");
      const second = uniqueName("multi-b");

      await test.step("Create a consent with two attached files", async () => {
        await createConsentWithFiles(page, [
          { path: PNG, name: first },
          { path: PNG2, name: second },
        ]);
      });

      await test.step('Verify the card shows the first file and "+1 more file"', async () => {
        const card = consentCards(page);
        await expect(card.getByText(first)).toBeVisible();
        await expect(
          card.getByText("+1 more file", { exact: true }),
        ).toBeVisible();
        await expect(card.getByText(second)).toHaveCount(0);
      });
    },
  );

  test(
    "create consent with file renamed before save → custom name on card and detail",
    { tag: ["@atomic", "@cap:encounter.consent.create"] },
    async ({ page }) => {
      // Custom name deliberately unrelated to the fixture's real filename.
      const customName = uniqueName("renamed");

      await test.step("Create a consent with a renamed file", async () => {
        await createConsentWithFiles(page, [{ path: PNG, name: customName }]);
      });

      await test.step("Verify the card shows the custom name", async () => {
        const card = consentCards(page);
        await expect(card.getByText(customName)).toBeVisible();
        await expect(card.getByText(/sample_img1/)).toHaveCount(0);
      });

      await test.step("Verify the detail page shows the custom name", async () => {
        await openConsentDetail(page);
        await expect(detailFileRow(page, customName)).toBeVisible();
        await expect(page.getByText(/sample_img1/)).toHaveCount(0);
      });
    },
  );

  test(
    'create consent with file → See Details → file shows green "Uploaded" badge',
    { tag: ["@atomic", "@cap:encounter.consent.view"] },
    async ({ page }) => {
      const fileName = uniqueName("badge");

      await test.step("Create a consent with one attached file", async () => {
        await createConsentWithFiles(page, [{ path: PNG, name: fileName }]);
      });

      await test.step('Verify the detail page shows a green "Uploaded" badge', async () => {
        await openConsentDetail(page);
        await expectUploadedBadge(page, fileName);
      });
    },
  );

  test(
    "create consent → See Details → upload file from detail page → file appears with badge",
    { tag: ["@atomic", "@cap:encounter.consent.file.upload"] },
    async ({ page }) => {
      const fileName = uniqueName("detail-upload");

      await test.step("Create a consent without files and open it", async () => {
        await createConsentWithFiles(page, []);
        await openConsentDetail(page);
      });

      await test.step("Upload a file from the detail page", async () => {
        await uploadConsentFileViaUi(page, {
          filePath: PNG,
          displayName: fileName,
        });
      });

      await test.step('Verify the file is listed with an "Uploaded" badge', async () => {
        await expectUploadedBadge(page, fileName);
      });
    },
  );

  test(
    "upload two files sequentially on the detail page → both listed",
    { tag: ["@atomic", "@cap:encounter.consent.file.upload"] },
    async ({ page }) => {
      const first = uniqueName("seq-a");
      const second = uniqueName("seq-b");

      await test.step("Create a consent without files and open it", async () => {
        await createConsentWithFiles(page, []);
        await openConsentDetail(page);
      });

      await test.step("Upload the first file", async () => {
        await uploadConsentFileViaUi(page, {
          filePath: PNG,
          displayName: first,
        });
        await expect(detailFileRow(page, first)).toBeVisible();
      });

      await test.step("Upload the second file", async () => {
        await uploadConsentFileViaUi(page, {
          filePath: JPG,
          displayName: second,
        });
      });

      await test.step("Verify both files are listed", async () => {
        await expect(detailFileRows(page)).toHaveCount(2);
        await expectUploadedBadge(page, first);
        await expectUploadedBadge(page, second);
      });
    },
  );

  test(
    "start file upload on the detail page → discard → list unchanged",
    { tag: ["@atomic", "@cap:encounter.consent.file.upload"] },
    async ({ page }) => {
      await test.step("Create a consent without files and open it", async () => {
        await createConsentWithFiles(page, []);
        await openConsentDetail(page);
        await expect(page.getByText("No files attached")).toBeVisible();
      });

      await test.step("Pick a file and discard the upload", async () => {
        await pickConsentFileOnDetail(page, PNG);
        const dialog = consentUploadDialog(page);
        await dialog.getByRole("button", { name: "Discard" }).click();
        await expect(dialog).toBeHidden();
      });

      await test.step("Verify no file was added", async () => {
        await expect(page.getByText("No files attached")).toBeVisible();
        await expect(detailFileRows(page)).toHaveCount(0);
      });
    },
  );

  test(
    "upload jpg, png and pdf separately → each accepted and displayed",
    { tag: ["@atomic", "@cap:encounter.consent.file.upload"] },
    async ({ page }) => {
      const files = [
        { type: "jpg", path: JPG, name: uniqueName("type-jpg") },
        { type: "png", path: PNG, name: uniqueName("type-png") },
        { type: "pdf", path: PDF, name: uniqueName("type-pdf") },
      ];

      await test.step("Create a consent without files and open it", async () => {
        await createConsentWithFiles(page, []);
        await openConsentDetail(page);
      });

      for (const file of files) {
        await test.step(`Upload a ${file.type} file and verify it is listed`, async () => {
          await uploadConsentFileViaUi(page, {
            filePath: file.path,
            displayName: file.name,
          });
          await expectUploadedBadge(page, file.name);
        });
      }

      await test.step("Verify all three files are listed", async () => {
        await expect(detailFileRows(page)).toHaveCount(files.length);
      });
    },
  );

  test(
    "click View on an image attachment → preview opens",
    { tag: ["@atomic", "@cap:encounter.consent.file.view"] },
    async ({ page }) => {
      const fileName = uniqueName("view");

      await test.step("Create a consent with an image and open it", async () => {
        await createConsentWithFiles(page, [{ path: PNG, name: fileName }]);
        await openConsentDetail(page);
      });

      await test.step("Click View on the image", async () => {
        await detailFileRow(page, fileName)
          .getByRole("button", { name: "View" })
          .click();
      });

      await test.step("Verify the preview shows the loaded image", async () => {
        const preview = page.getByRole("dialog", { name: "File Preview" });
        await expect(preview).toBeVisible();
        const image = preview.locator("img");
        await expect(image).toBeVisible();
        await expect(image).toHaveAttribute("src", /.+/);
        // Visibility and src don't prove the image decoded; a broken image
        // reports naturalWidth 0.
        await expect
          .poll(() =>
            image.evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
            ),
          )
          .toBe(true);
      });
    },
  );

  test(
    "click Download on an attachment → download initiates",
    { tag: ["@atomic", "@cap:encounter.consent.file.download"] },
    async ({ page }) => {
      const fileName = uniqueName("download");

      await test.step("Create a consent with a file and open it", async () => {
        await createConsentWithFiles(page, [{ path: PNG, name: fileName }]);
        await openConsentDetail(page);
      });

      await test.step("Click Download and verify the download starts", async () => {
        const downloadPromise = page.waitForEvent("download");
        await detailFileRow(page, fileName)
          .getByRole("button", { name: "Download" })
          .click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain(fileName);
      });
    },
  );

  test(
    'create consent without files → card shows "No files attached"',
    { tag: ["@atomic", "@cap:encounter.consent.create"] },
    async ({ page }) => {
      await test.step("Create a consent without files", async () => {
        await createConsentWithFiles(page, []);
      });

      await test.step('Verify the card shows "No files attached"', async () => {
        await expect(
          consentCards(page).getByText("No files attached"),
        ).toBeVisible();
      });
    },
  );

  test(
    "file uploaded from the detail page is reflected on the consent card",
    { tag: ["@atomic", "@cap:encounter.consent.file.upload"] },
    async ({ page }) => {
      const fileName = uniqueName("card-sync");

      await test.step("Create a consent without files and open it", async () => {
        await createConsentWithFiles(page, []);
        await openConsentDetail(page);
      });

      await test.step("Upload a file from the detail page", async () => {
        await uploadConsentFileViaUi(page, {
          filePath: PNG,
          displayName: fileName,
        });
        await expect(detailFileRow(page, fileName)).toBeVisible();
      });

      await test.step("Verify the consent card shows the file", async () => {
        await goToConsentsTab(page, consentsUrl);
        await expect(consentCards(page).getByText(fileName)).toBeVisible();
      });
    },
  );
});
