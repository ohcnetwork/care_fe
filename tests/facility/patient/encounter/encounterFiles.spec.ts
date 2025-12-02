import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Files - Drawing Upload Functionality", () => {
  // Constants
  const fileUploadSuccessToast = "File Uploaded Successfully";
  const drawingSavedSuccessToast = "Drawing saved successfully";

  // Test fixture files
  const textFileName = "sample_text.txt";
  const imageFileName = "sample_img1.png";

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
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Navigate to Files tab
    await page.getByRole("tab", { name: "Files" }).click();
  });

  test("Create a new drawing and verify it appears in the files list", async ({
    page,
  }) => {
    const drawingName = `Test Drawing ${faker.string.alphanumeric(8)}`;

    // Navigate to Drawings sub-tab
    await page.getByRole("tab", { name: "Drawings" }).click();

    // Click on "New Drawing" button
    await page.getByRole("button", { name: /new drawing/i }).click();

    // Wait for the drawing editor to load
    await expect(page.getByPlaceholder(/enter drawing name/i)).toBeVisible();

    // Enter drawing name
    await page.getByPlaceholder(/enter drawing name/i).fill(drawingName);

    // Wait for the Excalidraw canvas to be ready
    await page.waitForTimeout(1000);

    // Simulate drawing by clicking on the canvas area
    // Find the Excalidraw canvas element
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // Draw something on the canvas (simulate a simple line)
    const box = await canvas.boundingBox();
    if (box) {
      // Click and drag to draw a line
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
    }

    // Wait a moment for the drawing to register
    await page.waitForTimeout(500);

    // Save the drawing
    await page.getByRole("button", { name: /save/i }).click();

    // Verify success message
    await expect(page.getByText(drawingSavedSuccessToast)).toBeVisible();

    // Verify we're back at the drawings list
    await expect(
      page.getByRole("button", { name: /new drawing/i }),
    ).toBeVisible();

    // Verify the drawing appears in the list
    await expect(page.getByText(drawingName)).toBeVisible();
  });

  test("Update an existing drawing and verify changes are saved", async ({
    page,
  }) => {
    const drawingName = `Test Drawing Update ${faker.string.alphanumeric(8)}`;

    // Navigate to Drawings sub-tab
    await page.getByRole("tab", { name: "Drawings" }).click();

    // Create a new drawing first
    await page.getByRole("button", { name: /new drawing/i }).click();
    await expect(page.getByPlaceholder(/enter drawing name/i)).toBeVisible();
    await page.getByPlaceholder(/enter drawing name/i).fill(drawingName);

    // Wait for canvas and draw something
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.up();
    }
    await page.waitForTimeout(500);

    // Save the drawing
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(drawingSavedSuccessToast)).toBeVisible();

    // Wait for the list to update
    await page.waitForTimeout(1000);

    // Re-open the same drawing by clicking on it
    await page.getByText(drawingName).click();

    // Wait for the drawing editor to load
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible();

    // Draw something else on the canvas
    const canvasUpdate = page.locator("canvas").first();
    await expect(canvasUpdate).toBeVisible();
    const boxUpdate = await canvasUpdate.boundingBox();
    if (boxUpdate) {
      await page.mouse.move(boxUpdate.x + 250, boxUpdate.y + 50);
      await page.mouse.down();
      await page.mouse.move(boxUpdate.x + 350, boxUpdate.y + 150);
      await page.mouse.up();
    }
    await page.waitForTimeout(500);

    // Save the updated drawing
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(drawingSavedSuccessToast)).toBeVisible();

    // Verify we're back at the drawings list
    await expect(
      page.getByRole("button", { name: /new drawing/i }),
    ).toBeVisible();

    // Verify the drawing still appears in the list
    await expect(page.getByText(drawingName)).toBeVisible();
  });

  test("Upload text file and verify it appears in the files list", async ({
    page,
  }) => {
    const fileDisplayName = `Test Text File ${faker.string.alphanumeric(8)}`;

    // Should already be on the "Files" tab from beforeEach
    // Click on "Add Files" button
    await page.getByRole("button", { name: "Add Files" }).click();

    // Upload the text file
    await page
      .locator('input[type="file"]')
      .setInputFiles(`tests/fixtures/${textFileName}`);

    // Fill in the file name
    await page
      .getByRole("textbox", { name: "File Name" })
      .first()
      .fill(fileDisplayName);

    // Set up API response interceptor
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

    // Verify success message
    await expect(page.getByText(fileUploadSuccessToast)).toBeVisible();

    // Verify the file appears in the list
    await expect(page.getByText(fileDisplayName)).toBeVisible();
  });

  test("Upload image file and verify it appears in the files list", async ({
    page,
  }) => {
    const fileDisplayName = `Test Image File ${faker.string.alphanumeric(8)}`;

    // Should already be on the "Files" tab from beforeEach
    // Click on "Add Files" button
    await page.getByRole("button", { name: "Add Files" }).click();

    // Upload the image file
    await page
      .locator('input[type="file"]')
      .setInputFiles(`tests/fixtures/images/${imageFileName}`);

    // Fill in the file name
    await page
      .getByRole("textbox", { name: "File Name" })
      .first()
      .fill(fileDisplayName);

    // Set up API response interceptor
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

    // Verify success message
    await expect(page.getByText(fileUploadSuccessToast)).toBeVisible();

    // Verify the file appears in the list
    await expect(page.getByText(fileDisplayName)).toBeVisible();
  });

  test("Upload multiple file types and verify all appear correctly", async ({
    page,
  }) => {
    const textFileDisplayName = `Multi-Test Text ${faker.string.alphanumeric(6)}`;
    const imageFileDisplayName = `Multi-Test Image ${faker.string.alphanumeric(6)}`;

    // Upload text file first
    await page.getByRole("button", { name: "Add Files" }).click();
    await page
      .locator('input[type="file"]')
      .setInputFiles(`tests/fixtures/${textFileName}`);
    await page
      .getByRole("textbox", { name: "File Name" })
      .first()
      .fill(textFileDisplayName);

    let uploadPromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/files/") &&
        response.request().method() === "POST",
    );

    await page.getByRole("button", { name: "Upload" }).click();
    let response = await uploadPromise;
    expect(response.status()).toBe(200);
    await expect(page.getByText(fileUploadSuccessToast)).toBeVisible();

    // Upload image file
    await page.getByRole("button", { name: "Add Files" }).click();
    await page
      .locator('input[type="file"]')
      .setInputFiles(`tests/fixtures/images/${imageFileName}`);
    await page
      .getByRole("textbox", { name: "File Name" })
      .first()
      .fill(imageFileDisplayName);

    uploadPromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/files/") &&
        response.request().method() === "POST",
    );

    await page.getByRole("button", { name: "Upload" }).click();
    response = await uploadPromise;
    expect(response.status()).toBe(200);
    await expect(page.getByText(fileUploadSuccessToast)).toBeVisible();

    // Verify both files appear in the list
    await expect(page.getByText(textFileDisplayName)).toBeVisible();
    await expect(page.getByText(imageFileDisplayName)).toBeVisible();
  });

  test("Verify drawing editor loads correctly", async ({ page }) => {
    // Navigate to Drawings sub-tab
    await page.getByRole("tab", { name: "Drawings" }).click();

    // Click on "New Drawing" button
    await page.getByRole("button", { name: /new drawing/i }).click();

    // Verify the drawing editor elements are present
    await expect(page.getByPlaceholder(/enter drawing name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible();

    // Verify the Excalidraw canvas is loaded
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
  });

  test("Navigate between Files and Drawings tabs", async ({ page }) => {
    // Should start on Files tab (from beforeEach)
    await expect(page.getByRole("button", { name: "Add Files" })).toBeVisible();

    // Navigate to Drawings tab
    await page.getByRole("tab", { name: "Drawings" }).click();
    await expect(
      page.getByRole("button", { name: /new drawing/i }),
    ).toBeVisible();

    // Navigate back to Files tab
    await page.getByRole("tab", { name: "Files" }).click();
    await expect(page.getByRole("button", { name: "Add Files" })).toBeVisible();
  });
});
