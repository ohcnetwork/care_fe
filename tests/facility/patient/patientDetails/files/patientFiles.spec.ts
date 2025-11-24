import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Files", () => {
  // Constants
  const validationMessage = "Please give a name for the file";
  const fileUploadSuccessToast = "File Uploaded Successfully";
  const fileRenameSuccessToast = "File name changed successfully";
  const fileArchiveSuccessToast = "File archived successfully";

  // Test fixture files
  const fileName = "sample_img1.png";
  const fileNames = ["sample_img1.png", "sample_img2.png", "sample_file.xlsx"];

  // Helper function to upload a file with validation
  const uploadFile = async (
    page: Page,
    filePath: string,
    displayName: string,
  ) => {
    await page.getByRole("button", { name: "Add Files" }).click();
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page
      .getByRole("textbox", { name: "File Name" })
      .first()
      .fill(displayName);

    const uploadPromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/files/") &&
        response.request().method() === "POST",
    );

    await page.getByRole("button", { name: "Upload" }).click();
    const response = await uploadPromise;
    expect(response.status()).toBe(200);
    await expect(page.getByText(fileUploadSuccessToast)).toBeVisible();
    return response;
  };

  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to encounters page and open first in-progress encounter
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Open first encounter details
    await page.getByRole("link", { name: "view Encounter" }).first().click();

    // Navigate to patient details page (remove encounter path from URL)
    const currentUrl = page.url();
    const patientUrl = currentUrl.split("/encounter/")[0];
    await page.goto(patientUrl);

    await page.getByRole("tab", { name: "Files" }).click();
  });

  test("Add multiple patient files", async ({ page }) => {
    // Generate unique file names for this test run
    const inputFileNames = [
      faker.system.fileName(),
      faker.system.fileName(),
      faker.system.fileName(),
    ];

    // Click Add Files button and upload multiple files directly
    await page.getByRole("button", { name: "Add Files" }).click();

    // Upload multiple files directly to the file input (bypassing system dialog)
    await page
      .locator('input[type="file"]')
      .setInputFiles(
        fileNames.map((file) =>
          file.endsWith(".xlsx")
            ? `tests/fixtures/${file}`
            : `tests/fixtures/images/${file}`,
        ),
      );

    // Try to upload without names - should show validation error
    await page.getByRole("button", { name: "Upload" }).click();

    // Verify validation error is shown
    await expect(page.getByText(validationMessage).first()).toBeVisible();

    // Fill in file names for all files
    for (let i = 0; i < inputFileNames.length; i++) {
      await page
        .getByRole("textbox", { name: "File Name" })
        .nth(i)
        .fill(inputFileNames[i]);
    }

    // Setup API intercept for file upload
    const uploadPromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/files/") &&
        response.request().method() === "POST",
    );

    // Click upload button
    await page.getByRole("button", { name: "Upload" }).click();

    // Wait for API response
    const response = await uploadPromise;
    expect(response.status()).toBe(200);

    // Verify at least one success message is shown
    const successToast = page.locator(`text=${fileUploadSuccessToast}`).first();
    await expect(successToast).toBeVisible();
  });

  test("File Uploaded by one user is accessible to another user", async ({
    page,
    browser,
  }) => {
    const inputFileName1 = faker.system.fileName();

    // Upload file as first user (doctor)
    await uploadFile(page, `tests/fixtures/images/${fileName}`, inputFileName1);

    // View the uploaded file
    await page.getByRole("button", { name: /view/i }).first().click();
    await page.getByRole("button", { name: "Close" }).click();

    // Save current URL for navigation
    const currentUrl = page.url();

    // Create a new browser context with nurse authentication
    const nurseContext = await browser.newContext({
      storageState: "tests/.auth/nurse.json",
    });
    const nursePage = await nurseContext.newPage();

    // Navigate to the patient files page as nurse
    await nursePage.goto(currentUrl);

    // View the file as nurse
    await nursePage.getByRole("button", { name: /view/i }).first().click();

    // Clean up
    await nursePage.close();
    await nurseContext.close();
  });

  test("Add a new patient file and rename it", async ({ page }) => {
    const inputFileName1 = faker.system.fileName();
    const newFileName = faker.system.fileName();

    // Upload a single file using helper
    await uploadFile(page, `tests/fixtures/images/${fileName}`, inputFileName1);

    // Filter for active files
    await page.getByRole("button", { name: "Filter" }).click();
    await page.getByText("Active Files").click();

    // Wait for active files badge
    await expect(page.getByText("Active Files")).toBeVisible();

    await page
      .getByRole("row", { name: inputFileName1 })
      .getByLabel("actions")
      .click();

    await page.getByRole("menuitem", { name: /rename/i }).click();
    await page.locator("#edit-file-name").fill(newFileName);

    const renamePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/files/") &&
        response.request().method() === "PUT",
    );

    await page.getByRole("button", { name: "Proceed" }).click();

    const renameResponse = await renamePromise;
    expect(renameResponse.status()).toBe(200);

    await expect(page.getByText(fileRenameSuccessToast)).toBeVisible();
  });

  test("Add a new patient file and archive it", async ({ page }) => {
    const inputFileName1 = faker.system.fileName();
    const archiveReason = faker.lorem.sentence();

    // Upload a single file using helper
    await uploadFile(page, `tests/fixtures/images/${fileName}`, inputFileName1);

    // Filter for active files
    await page.getByRole("button", { name: "Filter" }).click();
    await page.getByText("Active Files").click();

    const filterPromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/files/") &&
        response.request().method() === "GET",
    );

    const filterResponse = await filterPromise;
    expect(filterResponse.status()).toBe(200);

    // Wait for active files badge
    await expect(page.getByText("Active Files")).toBeVisible();

    await page
      .getByRole("row", { name: inputFileName1 })
      .getByLabel("actions")
      .click();

    await page.getByRole("menuitem", { name: /archive/i }).click();
    await page.getByRole("textbox", { name: /reason/i }).fill(archiveReason);

    const archivePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/files/") &&
        response.request().method() === "POST",
    );

    // Click proceed button
    await page.getByRole("button", { name: "Proceed" }).click();

    const archiveResponse = await archivePromise;
    expect(archiveResponse.status()).toBe(200);

    await expect(page.getByText(fileArchiveSuccessToast)).toBeVisible();
  });
});
