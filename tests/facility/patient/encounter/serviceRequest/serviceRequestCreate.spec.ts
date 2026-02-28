import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Service Request Creation", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to encounters list filtered by in-progress status
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Click on the first encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );
  });

  test("should navigate to service requests tab and view it", async ({
    page,
  }) => {
    // Navigate to the Service Requests tab
    await page.getByRole("tab", { name: "Service Requests" }).click();

    // Verify the tab content is visible (either table or empty state)
    const tabContent = page.locator('[role="tabpanel"]');
    await expect(tabContent).toBeVisible();

    // The Create Service Request button should be visible
    await expect(
      page.getByRole("link", { name: /create service request/i }),
    ).toBeVisible();
  });

  test("should create a service request using activity definition picker", async ({
    page,
  }) => {
    // Navigate to the Service Requests tab
    await page.getByRole("tab", { name: "Service Requests" }).click();

    // Click "Create Service Request" button
    await page
      .getByRole("link", { name: /create service request/i })
      .click();

    // Wait for the questionnaire form page to load
    await page.waitForURL(/\/questionnaire\/service_request/);

    await test.step("Select an activity definition", async () => {
      // The ResourceDefinitionCategoryPicker is used to select activity definitions
      // It shows as a combobox/button with placeholder text
      const picker = page.getByRole("combobox").filter({
        hasText: /select activity definition|add service request/i,
      });

      // If picker is not a combobox, try button
      const pickerButton = picker.or(
        page.getByRole("button", {
          name: /select activity definition|add service request/i,
        }),
      );
      await pickerButton.first().waitFor({ state: "visible" });
      await pickerButton.first().click();

      // Wait for the picker popup/dialog to open
      const scope = page
        .getByRole("dialog")
        .last()
        .or(page.locator("[data-radix-popper-content-wrapper]").last());
      await scope.waitFor({ state: "visible" });

      // Look for activity definitions - fixtures create "Lab Tests" category
      // with: "Fasting Blood Glucose", "Complete Blood Count (CBC) Panel", "Lipid Panel", "Urinalysis"
      const options = scope.getByRole("option");
      await options.first().waitFor({ state: "visible" });

      // Click the first available option (may be a category or an activity)
      await options.first().click();

      // If we clicked a category, we may need to click again for the actual activity
      const innerOptions = scope.getByRole("option");
      const innerOptionsCount = await innerOptions.count().catch(() => 0);
      if (innerOptionsCount > 0) {
        await innerOptions.first().click();
      }
    });

    await test.step("Verify service request form appears", async () => {
      // After selecting an activity definition, a ServiceRequestForm card should appear
      // with the title of the selected activity
      await expect(
        page
          .locator(".rounded-lg.border")
          .filter({ hasText: /laboratory|lab/i })
          .first(),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Submit the service request", async () => {
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Questionnaire submitted successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify service request appears in list", async () => {
      // After submission, navigate to Service Requests tab
      await page.getByRole("tab", { name: "Service Requests" }).click();

      // Wait for the table to load
      await page.waitForLoadState("networkidle");

      // Verify there's at least one service request visible
      const tableOrContent = page.locator(
        '[data-slot="table-body"], [data-slot="card-content"]',
      );
      await expect(tableOrContent.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test("should create a service request via encounter actions command", async ({
    page,
  }) => {
    // Click the "Encounter Actions" button
    await page
      .getByRole("button", { name: /encounter actions/i })
      .first()
      .click();

    // Wait for the command dialog
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Search for "service request"
    const commandInput = dialog.locator(
      'input[data-slot="command-input"], input[cmdk-input]',
    );
    await commandInput.fill("service request");

    // Click the "Service Request" option
    await dialog
      .getByRole("option", { name: /service request/i })
      .first()
      .click();

    // Should navigate to the service request questionnaire
    await page.waitForURL(/\/questionnaire\/service_request/);

    // Verify the service request form page is loaded
    await expect(
      page.getByText(/select activity definition|add service request/i).first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
