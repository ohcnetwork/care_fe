import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Drawing Management", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 180), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to encounters list
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
  });

  async function navigateToEncounterDrawings(page: Page) {
    // Open the first available encounter
    await page.getByRole("button", { name: "View Encounter" }).first().click();

    // Navigate to Files tab and then Drawings tab
    await page.getByRole("tab", { name: "Files" }).click();
    await page.getByRole("tab", { name: "Drawings" }).click();
  }

  test("should create and save a new drawing in an encounter", async ({
    page,
  }) => {
    await navigateToEncounterDrawings(page);

    // Click New Drawing button to open the drawing editor
    await page.getByRole("button", { name: "New Drawing" }).click();

    // Wait for the Excalidraw editor to fully load
    await page.waitForLoadState("networkidle");

    // Wait for the canvas to be visible
    const canvas = page.locator("canvas.excalidraw__canvas.interactive");
    await canvas.waitFor({ state: "visible" });

    // Click on the canvas to focus it
    await canvas.click();

    // Press "8" to activate the text tool (keyboard shortcut)
    await page.keyboard.press("8");

    // Click on the canvas to place the text element
    await canvas.click({ position: { x: 300, y: 250 } });

    // Type some text
    await page.keyboard.type("Test annotation for patient");

    // Press Escape to finish text editing
    await page.keyboard.press("Escape");

    // Enter a name for the drawing
    const drawingName = faker.word.noun();
    await page.getByPlaceholder("Enter name for the drawing").fill(drawingName);

    // Click the Save button - should be enabled after drawing
    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for navigation back to the files page
    await page.waitForURL(/\/encounter\/[^/]+\/files/);

    // Verify we're back on the drawings tab
    await page.getByRole("tab", { name: "Drawings" }).click();

    // Search for the newly created drawing
    await page.getByPlaceholder("Search drawings...").fill(drawingName);

    // The newly created drawing should appear in the list
    await expect(page.getByText(drawingName)).toBeVisible();
  });

  test("should have save button disabled when initially opening new drawing", async ({
    page,
  }) => {
    await navigateToEncounterDrawings(page);

    // Click New Drawing button to open the drawing editor
    await page.getByRole("button", { name: "New Drawing" }).click();

    // Wait for the Excalidraw editor to fully load
    await page.waitForLoadState("networkidle");

    // Wait for the canvas to be visible
    const canvas = page.locator("canvas.excalidraw__canvas.interactive");
    await canvas.waitFor({ state: "visible" });

    // Verify the Save button is disabled initially
    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeDisabled();
  });
});
