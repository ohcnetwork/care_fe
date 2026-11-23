import { type Page, expect, test } from "@playwright/test";
import { questionBlock } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * The files question checks each file against
 * `careConfig.maxFileUploadSizeInMB`, which must match the backend's
 * `MAX_FILE_UPLOAD_SIZE` (both default to 5 MB, and neither is overridden
 * for the E2E build or backend). The backend counts megabytes as
 * 1024 * 1024 bytes and rejects only sizes above the limit.
 */
const MAX_FILE_UPLOAD_SIZE_MB = Number(
  process.env.REACT_APP_MAX_FILE_UPLOAD_SIZE_MB || 5,
);
const MAX_FILE_UPLOAD_SIZE_BYTES = MAX_FILE_UPLOAD_SIZE_MB * 1024 * 1024;

/** Plain text, so the backend's MIME sniffing accepts it as text/plain. */
function textFile(name: string, size: number) {
  return { name, mimeType: "text/plain", buffer: Buffer.alloc(size, "a") };
}

function sizeError(fileName: string) {
  return `${fileName} is larger than the ${MAX_FILE_UPLOAD_SIZE_MB} MB limit`;
}

function trackBatchRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/batch_requests/")
    ) {
      urls.push(request.url());
    }
  });
  return urls;
}

async function openFilesQuestion(page: Page) {
  await page.goto(
    `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/files`,
  );
  const block = questionBlock(page, "Files");
  await expect(block).toBeVisible();
  return block;
}

test.describe("Files question size limit", () => {
  test("flags a file over the limit when it is picked and blocks submit without uploading", async ({
    page,
  }) => {
    const posts = trackBatchRequests(page);
    const block = await openFilesQuestion(page);
    const nameInputs = block.getByPlaceholder("File Name", { exact: true });
    const overLimitError = block.getByText(sizeError("over-limit.txt"), {
      exact: true,
    });

    await test.step("Attach one file just over the limit and one under it", async () => {
      await block
        .locator('input[type="file"]')
        .setInputFiles([
          textFile("over-limit.txt", MAX_FILE_UPLOAD_SIZE_BYTES + 1),
          textFile("under-limit.txt", 1024),
        ]);
      await expect(nameInputs).toHaveCount(2);
    });

    await test.step("Only the over-limit file is flagged", async () => {
      await expect(overLimitError).toBeVisible();
      await expect(nameInputs.nth(0)).toHaveAccessibleDescription(
        sizeError("over-limit.txt"),
      );
      await expect(nameInputs.nth(1)).toHaveAccessibleDescription("");
      await expect(
        block.getByText(sizeError("under-limit.txt"), { exact: true }),
      ).toHaveCount(0);
    });

    await test.step("Submit is blocked and the error is shown once", async () => {
      await nameInputs.nth(0).fill("Over limit");
      await nameInputs.nth(1).fill("Under limit");
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Validation failed");
      // The question lists its errors after a submit attempt; the inline
      // copy under the row is hidden then, so the message is not repeated.
      await expect(overLimitError).toHaveCount(1);
      expect(
        posts,
        "no /api/v1/batch_requests/ POST may fire while a file is over the limit",
      ).toHaveLength(0);
    });

    await test.step("Removing the over-limit file clears the error", async () => {
      await nameInputs.nth(0).locator("xpath=..").getByRole("button").click();
      await expect(nameInputs).toHaveCount(1);
      await expect(nameInputs.first()).toHaveValue("Under limit");
      await expect(overLimitError).toHaveCount(0);
    });
  });

  test("accepts a file exactly at the limit and submits it", async ({
    page,
  }) => {
    test.slow();
    const block = await openFilesQuestion(page);
    const nameInputs = block.getByPlaceholder("File Name", { exact: true });

    await block
      .locator('input[type="file"]')
      .setInputFiles(textFile("at-limit.txt", MAX_FILE_UPLOAD_SIZE_BYTES));
    await expect(nameInputs).toHaveCount(1);
    await expect(
      block.getByText(sizeError("at-limit.txt"), { exact: true }),
    ).toHaveCount(0);
    await expect(nameInputs.first()).toHaveAccessibleDescription("");

    await nameInputs.first().fill("At limit");
    const batchResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/batch_requests/") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();
    // The backend accepts the same boundary the frontend allows.
    expect((await batchResponse).ok()).toBe(true);
    await expectToast(page, "Questionnaire submitted successfully");
  });
});
