import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const encounterClasses = [
  "Inpatient",
  "Ambulatory",
  "Observation",
  "Emergency",
  "Virtual",
  "Home Health",
];

const encounterStatuses = ["In Progress", "Planned", "On Hold"];

const encounterPriorities = [
  "Stat",
  "ASAP",
  "Emergency",
  "Urgent",
  "Routine",
  "Elective",
  "Rush reporting",
  "Timing critical",
  "Callback results",
  "Callback for scheduling",
  "Pre-op",
  "As needed",
  "Use as directed",
];

test.describe("Create an Encounter", () => {
  let randomEncounterClass: string;
  let randomEncounterStatus: string;
  let randomEncounterPriority: string;

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Select random values for this test run
    randomEncounterClass = faker.helpers.arrayElement(encounterClasses);
    randomEncounterStatus = faker.helpers.arrayElement(encounterStatuses);
    randomEncounterPriority = faker.helpers.arrayElement(encounterPriorities);

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    );
  });

  test("through patient home", async ({ page }) => {
    // Wait for page load after navigation
    await page.getByRole("link", { name: "Patient Home" }).first().click();

    await expect(
      page.getByRole("button", { name: "Create Encounter" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Create Encounter" }).click();

    // Use the random encounter type selected in beforeEach
    await page.getByRole("button", { name: randomEncounterClass }).click();

    await page.getByRole("button", { name: "Create Encounter" }).click();

    // Wait for success message and verify on encounter page
    await expect(
      page.getByText("Encounter created successfully"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: randomEncounterClass }),
    ).toBeVisible();

    //verify encounter details on the details tab
    await page.getByRole("tab", { name: "Details" }).click();
    await page.getByRole("link", { name: "Update Encounter" }).click();

    // Verify encounter status, class, and priority are displayed correctly
    await expect(
      page.getByRole("combobox").filter({ hasText: randomEncounterClass }),
    ).toBeVisible();
  });

  test("through phone number + year", async ({ page }) => {
    // Wait for the first patient entry to be visible and click
    await page.getByRole("link", { name: "Patient Home" }).first().click();

    // Click the first patient profile button and view profile
    await page
      .locator('[data-slot="patient-info-hover-card-trigger"]:visible')
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
    // To do: make it country code agnostic
    const cleanPhoneNumber = phoneNumber?.replace(/\D/g, "").slice(2);
    expect(cleanPhoneNumber).toMatch(/^\d+$/);
    const yearOfBirth = dobText?.match(/\d{4}/)?.[0];

    // Navigate to encounter creation using phone number and year of birth
    await page.goto(`/facility/${getFacilityId()}/patients`);
    await page
      .getByRole("textbox", { name: "Search by Patient Phone Number" })
      .fill(cleanPhoneNumber || "");

    //select the first result - wait for table body and click the first row
    const firstRow = page.locator('tbody[data-slot="table-body"] tr').first();
    await firstRow.waitFor({ state: "visible" });
    await firstRow.click();

    await page
      .getByRole("textbox", { name: "Year of Birth (YYYY)" })
      .fill(yearOfBirth || "");

    await page.getByRole("button", { name: "Verify" }).click();

    await expect(
      page.getByRole("button", { name: "Create Encounter" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Create Encounter" }).click();

    // Use the random encounter type selected in beforeEach
    await page.getByRole("button", { name: randomEncounterClass }).click();

    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: randomEncounterStatus }).click();
    await page.getByRole("combobox", { name: "Priority" }).click();
    await page.getByRole("option", { name: randomEncounterPriority }).click();
    await page.getByRole("button", { name: "Create Encounter" }).click();
    //wait for success message
    await expect(
      page.getByText("Encounter created successfully"),
    ).toBeVisible();

    //verify on encounter page
    await expect(
      page.getByRole("heading", { name: randomEncounterClass }),
    ).toBeVisible();

    //verify encounter details on the details tab
    await page.getByRole("tab", { name: "Details" }).click();
    await page.getByRole("link", { name: "Update Encounter" }).click();

    // Verify encounter status, class, and priority are displayed correctly
    await expect(
      page.getByRole("combobox").filter({ hasText: randomEncounterStatus }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox").filter({ hasText: randomEncounterClass }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox").filter({ hasText: randomEncounterPriority }),
    ).toBeVisible();
  });
});
