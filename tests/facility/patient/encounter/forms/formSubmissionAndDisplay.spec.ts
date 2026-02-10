import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Form Submission and Display in Encounter Overview", () => {
  /**
   * Helper function to interact with form fields by their label text
   */
  async function fillFormField(
    page: Page,
    labelText: string,
    action: "radio" | "input" | "textarea",
    value: string,
  ) {
    // Find the label and navigate to its question container
    const labelLocator = page.getByText(labelText, { exact: true });
    await labelLocator.scrollIntoViewIfNeeded();

    if (action === "radio") {
      // For radio buttons, find the parent container and then the specific radio option
      const questionContainer = labelLocator.locator(
        "xpath=ancestor::div[contains(@id, 'question')]",
      );
      await questionContainer.locator(`label[for="${value}"]`).click();
    } else if (action === "input") {
      // For number inputs, find the parent container
      const questionContainer = labelLocator.locator(
        "xpath=ancestor::div[contains(@id, 'question')]",
      );
      const input = questionContainer.locator('input[type="number"]').first();
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
    } else if (action === "textarea") {
      // For textareas
      const questionContainer = labelLocator.locator(
        "xpath=ancestor::div[contains(@class, 'space-y-1')]",
      );
      const textarea = questionContainer.locator(
        'textarea[data-slot="textarea"]',
      );
      await textarea.scrollIntoViewIfNeeded();
      await textarea.fill(value);
    }
  }

  test("should submit form from encounter page and verify values display in overview", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to encounters list
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Click on first encounter (random encounter)
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Wait for the encounter page to load
    await page.waitForURL(/\/encounter\/[^/]+\/updates/);

    // Scroll to Forms section in the overview
    const formsSection = page.getByText("Forms").first();
    await formsSection.scrollIntoViewIfNeeded();

    await page.getByRole("button", { name: "Forms" }).click();

    // Wait for the command input to appear
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });

    // Search for Respiratory Status form
    await page.locator("[cmdk-input]").fill("Respiratory Status");

    // Click on Respiratory Status form
    const formOption = page.getByRole("option", {
      name: /respiratory status/i,
    });
    await formOption.waitFor({ state: "visible", timeout: 5000 });
    await formOption.click();

    // Wait for navigation to the questionnaire form page
    await page.waitForURL(/\/questionnaire\//, { timeout: 10000 });

    // Wait for the form to load by waiting for a key form field to be visible
    await expect(
      page.getByText("Is bilateral air entry present?").nth(0),
    ).toBeVisible({ timeout: 10000 });

    // Generate random values for form inputs
    const bilateralAirEntry = "yes";
    const modality = "oxygen_support";
    const oxygenSupportDevice = "nasal_prongs";
    const ventilatorMode = "cpap_psv";
    const oxygenFlowRate = faker.number.int({ min: 1, max: 15 }).toString();
    const peep = faker.number.int({ min: 5, max: 15 }).toString();
    const pip = faker.number.int({ min: 15, max: 30 }).toString();
    const map = faker.number.int({ min: 8, max: 20 }).toString();
    const ventilatorRR = faker.number.int({ min: 12, max: 25 }).toString();
    const pressureSupport = faker.number.int({ min: 5, max: 20 }).toString();
    const tidalVolume = faker.number.int({ min: 300, max: 600 }).toString();
    const fio2 = faker.number.int({ min: 21, max: 100 }).toString();
    const airEntryNote = faker.lorem.sentence();

    // Section 1: Bilateral Air Entry
    await fillFormField(
      page,
      "Is bilateral air entry present?",
      "radio",
      bilateralAirEntry,
    );
    await fillFormField(
      page,
      "Note on Bilateral Air Entry",
      "textarea",
      airEntryNote,
    );

    // Section 2: Respiratory Support
    await fillFormField(page, "Select Modality", "radio", modality);
    await fillFormField(
      page,
      "Select Oxygen Support Device",
      "radio",
      oxygenSupportDevice,
    );
    await fillFormField(
      page,
      "Oxygen Flow Rate (L/min)",
      "input",
      oxygenFlowRate,
    );
    await fillFormField(
      page,
      "Select Ventilator Mode (Non-invasive)",
      "radio",
      ventilatorMode,
    );

    // Section 3: Ventilation Parameters
    await fillFormField(page, "PEEP (cm H2O)", "input", peep);
    await fillFormField(page, "PIP (cm H2O)", "input", pip);
    await fillFormField(page, "MAP (cm H2O)", "input", map);
    await fillFormField(
      page,
      "Ventilator RR (breaths per minute)",
      "input",
      ventilatorRR,
    );
    await fillFormField(
      page,
      "Pressure Support (cm H2O)",
      "input",
      pressureSupport,
    );
    await fillFormField(page, "Tidal Volume (mL)", "input", tidalVolume);
    await fillFormField(page, "FiO2 (%)", "input", fio2);

    // Submit the form
    const submitButton = page.getByRole("button", { name: "Submit" });
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();

    // Wait for success toast
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire submitted successfully"),
    ).toBeVisible({ timeout: 15000 });

    // Wait for navigation back to encounter page
    await page.waitForURL(/\/encounter\/[^/]+/, { timeout: 10000 });

    // Wait for the first expected value to be visible, indicating the page is loaded
    await expect(
      page.getByText(bilateralAirEntry, { exact: true }).first(),
    ).toBeVisible({ timeout: 10000 });

    // Verify radio button selections with scrolling
    const bilateralAirEntryValue = page
      .getByText(bilateralAirEntry, { exact: true })
      .first();
    await bilateralAirEntryValue.scrollIntoViewIfNeeded();
    await expect(bilateralAirEntryValue).toBeVisible();

    const modalityValue = page.getByText(modality, { exact: true }).first();
    await modalityValue.scrollIntoViewIfNeeded();
    await expect(modalityValue).toBeVisible();

    const oxygenSupportDeviceValue = page
      .getByText(oxygenSupportDevice, { exact: true })
      .first();
    await oxygenSupportDeviceValue.scrollIntoViewIfNeeded();
    await expect(oxygenSupportDeviceValue).toBeVisible();

    const ventilatorModeValue = page
      .getByText(ventilatorMode, { exact: true })
      .first();
    await ventilatorModeValue.scrollIntoViewIfNeeded();
    await expect(ventilatorModeValue).toBeVisible();

    // Verify numerical values with scrolling
    const oxygenFlowRateValue = page
      .getByText(oxygenFlowRate, { exact: true })
      .first();
    await oxygenFlowRateValue.scrollIntoViewIfNeeded();
    await expect(oxygenFlowRateValue).toBeVisible();

    const peepValue = page.getByText(peep, { exact: true }).first();
    await peepValue.scrollIntoViewIfNeeded();
    await expect(peepValue).toBeVisible();

    const pipValue = page.getByText(pip, { exact: true }).first();
    await pipValue.scrollIntoViewIfNeeded();
    await expect(pipValue).toBeVisible();

    const mapValue = page.getByText(map, { exact: true }).first();
    await mapValue.scrollIntoViewIfNeeded();
    await expect(mapValue).toBeVisible();

    const ventilatorRRValue = page
      .getByText(ventilatorRR, { exact: true })
      .first();
    await ventilatorRRValue.scrollIntoViewIfNeeded();
    await expect(ventilatorRRValue).toBeVisible();

    const pressureSupportValue = page
      .getByText(pressureSupport, { exact: true })
      .first();
    await pressureSupportValue.scrollIntoViewIfNeeded();
    await expect(pressureSupportValue).toBeVisible();

    const tidalVolumeValue = page
      .getByText(tidalVolume, { exact: true })
      .first();
    await tidalVolumeValue.scrollIntoViewIfNeeded();
    await expect(tidalVolumeValue).toBeVisible();

    const fio2Value = page.getByText(fio2, { exact: true }).first();
    await fio2Value.scrollIntoViewIfNeeded();
    await expect(fio2Value).toBeVisible();

    // Verify textarea note with scrolling
    const airEntryNoteValue = page
      .getByText(airEntryNote, { exact: true })
      .first();
    await airEntryNoteValue.scrollIntoViewIfNeeded();
    await expect(airEntryNoteValue).toBeVisible();
  });
});
