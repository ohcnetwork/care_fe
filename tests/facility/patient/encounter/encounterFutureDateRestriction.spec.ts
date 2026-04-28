import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

const encounterClasses = [
  "Inpatient",
  "Ambulatory",
  "Observation",
  "Emergency",
  "Virtual",
  "Home Health",
];

test.use({ storageState: "tests/.auth/user.json" });

async function openEncounterForm(page: import("@playwright/test").Page) {
  const facilityId = getFacilityId();
  const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const createdDateBefore = format(new Date(), "yyyy-MM-dd");

  await page.goto(
    `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
  );

  await page.getByRole("link", { name: "Patient Home" }).first().click();
  await expect(
    page.getByRole("button", { name: "Create Encounter" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create Encounter" }).click();
}

async function selectRandomEncounterClass(
  page: import("@playwright/test").Page,
) {
  const randomClass = faker.helpers.arrayElement(encounterClasses);
  await page.getByRole("button", { name: randomClass }).click();
}

async function selectFutureDateInCalendar(
  page: import("@playwright/test").Page,
) {
  await page
    .locator('[data-slot="form-item"]')
    .filter({ hasText: "Date and Time" })
    .locator('[data-slot="popover-trigger"]')
    .click();

  const nextMonthBtn = page.getByRole("button", {
    name: "Go to the Next Month",
  });
  await expect(nextMonthBtn).toBeVisible();
  await nextMonthBtn.click();

  return page
    .getByRole("gridcell")
    .filter({ hasText: /^15$/ })
    .getByRole("button");
}

test.describe("Encounter Future Date Restriction", () => {
  test("should disable future dates when status is In Progress", async ({
    page,
  }) => {
    await openEncounterForm(page);

    // Change status to In Progress
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "In Progress" }).click();

    const futureDayButton = await selectFutureDateInCalendar(page);
    await expect(futureDayButton).toBeDisabled();
  });

  test("should disable future dates when status is On Hold", async ({
    page,
  }) => {
    await openEncounterForm(page);

    // Change status to On Hold
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "On Hold" }).click();

    const futureDayButton = await selectFutureDateInCalendar(page);
    await expect(futureDayButton).toBeDisabled();
  });

  test("should allow future dates and create encounter when status is Planned", async ({
    page,
  }) => {
    await openEncounterForm(page);

    // Select a random encounter class
    await selectRandomEncounterClass(page);

    // Set status to Planned
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Planned" }).click();

    // Select a future date
    const futureDayButton = await selectFutureDateInCalendar(page);
    await expect(futureDayButton).toBeEnabled();
    await futureDayButton.click();

    // Submit the form
    await page.getByRole("button", { name: "Create Encounter" }).click();

    await expect(
      page.getByText("Encounter created successfully"),
    ).toBeVisible();
  });

  test("should show validation error when switching from Planned to In Progress with future date", async ({
    page,
  }) => {
    await openEncounterForm(page);

    // Select a random encounter class
    await selectRandomEncounterClass(page);

    // Set status to Planned first (allows future dates)
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Planned" }).click();

    // Select a future date while Planned
    const futureDayButton = await selectFutureDateInCalendar(page);
    await expect(futureDayButton).toBeEnabled();
    await futureDayButton.click();

    // Switch status to In Progress (future date now becomes invalid)
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "In Progress" }).click();

    // Try to submit — zod refine should block with validation error
    await page.getByRole("button", { name: "Create Encounter" }).click();

    await expect(
      page.getByText("Future date is only allowed for planned encounters"),
    ).toBeVisible();
  });
});
