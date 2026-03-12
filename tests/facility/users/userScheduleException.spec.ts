import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

async function gotoAvailability(page: Page, facilityId: string): Promise<void> {
  await page.goto(`/facility/${facilityId}/users/admin`);
  await page.getByRole("link", { name: "Availability" }).click();
  await expect(page.getByRole("button", { name: "Exceptions" })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: "Exceptions" }).click();
  await expect(page.getByRole("button", { name: "Add Exception" })).toBeVisible(
    { timeout: 10000 },
  );
}

async function selectMidMonthDate(
  page: Page,
  datePickerIndex: "first" | "second",
  monthsToNavigate: number,
): Promise<void> {
  const pickerButton =
    datePickerIndex === "first"
      ? page.getByRole("button", { name: "Pick a date" }).first()
      : page
          .locator('label:has-text("Valid Till")')
          .locator("..")
          .locator('button[data-slot="popover-trigger"]');

  await pickerButton.click();

  const nextMonthBtn = page.getByRole("button", {
    name: "Go to the Next Month",
  });
  await expect(nextMonthBtn).toBeVisible();

  for (let i = 0; i < monthsToNavigate; i++) {
    await nextMonthBtn.click({ force: true });
  }

  await page
    .getByRole("gridcell")
    .filter({ hasText: /^15$/ })
    .getByRole("button")
    .click();
}

function getNotifications(page: Page) {
  return page.getByRole("region", { name: "Notifications alt+T" });
}

async function expectToast(page: Page, message: string): Promise<void> {
  await expect(
    getNotifications(page).getByRole("listitem").filter({ hasText: message }),
  ).toBeVisible({ timeout: 10000 });
}

function getExceptionItem(page: Page, reason: string) {
  return page.getByRole("listitem").filter({ hasText: reason });
}

async function moveToNextMonth(page: Page): Promise<void> {
  const nextMonthButton = page.getByRole("button", { name: "Next Month" });
  await expect(nextMonthButton).toBeVisible();
  await nextMonthButton.click();
}

async function createException(page: Page, reason: string): Promise<void> {
  await page.getByRole("button", { name: "Add Exception" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Schedule Exceptions" }),
  ).toBeVisible();

  await page.getByRole("textbox", { name: "Reason" }).fill(reason);
  await selectMidMonthDate(page, "first", 1);
  await selectMidMonthDate(page, "second", 1);
  await page.getByRole("checkbox", { name: "Full Day Unavailable" }).check();
  await page.getByRole("button", { name: "Confirm Unavailability" }).click();

  await expectToast(page, "Exception created successfully");
  await moveToNextMonth(page);
  await expect(getExceptionItem(page, reason)).toBeVisible();
}

async function deleteException(page: Page, reason: string): Promise<void> {
  const exceptionItem = getExceptionItem(page, reason);
  await expect(exceptionItem).toBeVisible();
  await exceptionItem.getByRole("button", { name: "Remove" }).click();

  await expect(page.getByText("Are you sure?")).toBeVisible();
  await expect(
    page.getByText(
      "This will permanently remove the exception and cannot be undone",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).click();

  await expectToast(page, "Exception deleted");
  await expect(exceptionItem).not.toBeVisible();
}

test.describe("Schedule Exception Flow", () => {
  test.describe.configure({ mode: "serial" });

  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await gotoAvailability(page, facilityId);
  });

  test("should create a schedule exception", async ({ page }) => {
    const reason = `schedule-exception-${faker.string.uuid()}`;

    try {
      await createException(page, reason);
    } finally {
      if (await getExceptionItem(page, reason).count()) {
        await deleteException(page, reason);
      }
    }
  });

  test("should delete a created schedule exception", async ({ page }) => {
    const reason = `schedule-exception-${faker.string.uuid()}`;

    await createException(page, reason);
    await deleteException(page, reason);
  });
});
