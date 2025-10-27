import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Create an Encounter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();
  });

  test("through patient home", async ({ page }) => {
    await test.step("open the encounter", async () => {
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();
      await page.getByRole("button", { name: "Patients", exact: true }).click();
      await page.getByRole("link", { name: "All Encounters" }).click();

      await page.getByText("Date").click();
      await page.getByRole("button", { name: "Last 6 months" }).click();

      await page.keyboard.press("Escape");

      // Wait for the first patient entry to be visible and click
      await page.getByRole("link", { name: "Patient Home" }).first().click();

      // Wait for patient details to load
      await expect(
        page.getByRole("button", { name: "Create Encounter" }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Create Encounter" }).click();
      await page.getByRole("button", { name: "Home Health" }).click();
      await page.getByRole("button", { name: "Create Encounter" }).click();
      //wait for success message
      await expect(
        page.getByText("Encounter created successfully"),
      ).toBeVisible();
    });

    //mark encounter as complete
    await test.step("mark that encounter as complete", async () => {
      await page.getByRole("tab", { name: "Actions" }).click();
      await page.getByRole("button", { name: "Mark as Completed" }).click();
      await page.getByRole("button", { name: "Mark as Complete" }).click();
    });
  });

  test("through phone number + year", async ({ page }) => {
    await test.step("open the encounter", async () => {
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();
      await page.getByRole("button", { name: "Patients", exact: true }).click();
      await page.getByRole("link", { name: "All Encounters" }).click();

      // Wait for page load after navigation
      await page.getByText("Date").click();
      await page.getByRole("button", { name: "Last 6 months" }).click();
      await page.keyboard.press("Escape");

      // Wait for the first patient entry to be visible and click
      await page.getByRole("link", { name: "Patient Home" }).first().click();

      // Click the first patient profile button and view profile
      await page
        .getByRole("button", { name: /.*\d+\s*Y,/ })
        .first()
        .click();
      await page.getByRole("link", { name: "View Profile" }).click();

      //find phone number and year of birth
      const phoneNumber = await page
        .locator('a[href^="tel:"]')
        .first()
        .textContent();
      const dobLabel = await page.getByText("Date of Birth");
      const dobText = await dobLabel
        .locator("xpath=following-sibling::*[1]")
        .textContent();

      // Store the phone number for future use (remove any whitespace and special characters)
      const cleanPhoneNumber = phoneNumber?.replace(/\D/g, "");
      expect(cleanPhoneNumber).toMatch(/^\d+$/);
      const yearOfBirth = dobText?.match(/\d{4}/)?.[0];

      // Navigate to encounter creation using phone number and year of birth
      await page.getByRole("link", { name: "Search patients" }).click();
      await page
        .getByRole("textbox", { name: "Search by Patient Phone Number" })
        .fill(cleanPhoneNumber || "");

      //select the first result
      await page
        .getByRole("cell", {
          name: new RegExp(cleanPhoneNumber?.slice(-4) || ""),
        })
        .first()
        .click();
      await page
        .getByRole("textbox", { name: "Year of Birth (YYYY)" })
        .fill(yearOfBirth || "");

      await page.getByRole("button", { name: "Verify" }).click();

      await expect(
        page.getByRole("button", { name: "Create Encounter" }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Create Encounter" }).click();
      await page.getByRole("button", { name: "Home Health" }).click();
      await page.getByRole("combobox", { name: "Status" }).click();
      await page.getByRole("option", { name: "In Progress" }).click();
      await page.getByRole("combobox", { name: "Priority" }).click();
      await page.getByRole("option", { name: "ASAP" }).click();
      await page.getByRole("button", { name: "Create Encounter" }).click();
      //wait for success message
      await expect(
        page.getByText("Encounter created successfully"),
      ).toBeVisible();
    });

    //edit encounter to planned status
    await test.step("edit that encounter to planned status", async () => {
      await page.getByRole("tab", { name: "Details" }).click();
      await page.getByRole("link", { name: "Update Encounter" }).click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "In Progress" })
        .click();
      await page.getByRole("option", { name: "Discharged" }).click();
      await page.getByRole("button", { name: "Submit" }).click();
      await page.getByRole("tab", { name: "Actions" }).click();
      await page.getByRole("button", { name: "Mark as Completed" }).click();
      await page.getByRole("button", { name: "Mark as Complete" }).click();

      //wait for success message
      await expect(page.getByText("Encounter completed")).toBeVisible();
    });
  });
});
