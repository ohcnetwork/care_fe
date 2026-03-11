import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });
test.describe.configure({ mode: "serial" });

class ScheduleExceptionPage {
  constructor(private readonly page: Page) {}

  async gotoAvailability(facilityId: string): Promise<void> {
    await this.page.goto(`/facility/${facilityId}/users/admin`);
    await this.page.getByRole("link", { name: "Availability" }).click();
    await expect(
      this.page.getByRole("button", { name: "Exceptions" }),
    ).toBeVisible({ timeout: 10000 });
    await this.page.getByRole("button", { name: "Exceptions" }).click();
    await expect(
      this.page.getByRole("button", { name: "Add Exception" }),
    ).toBeVisible({ timeout: 10000 });
  }

  async selectMidMonthDate(
    datePickerIndex: "first" | "second",
    monthsToNavigate: number,
  ): Promise<void> {
    const pickerButton =
      datePickerIndex === "first"
        ? this.page.getByRole("button", { name: "Pick a date" }).first()
        : this.page
            .locator('label:has-text("Valid Till")')
            .locator("..")
            .locator('button[data-slot="popover-trigger"]');

    await pickerButton.click();

    const nextMonthBtn = this.page.getByRole("button", {
      name: "Go to the Next Month",
    });
    await expect(nextMonthBtn).toBeVisible();

    for (let i = 0; i < monthsToNavigate; i++) {
      await nextMonthBtn.click({ force: true });
    }

    await this.page
      .getByRole("gridcell")
      .filter({ hasText: /^15$/ })
      .getByRole("button")
      .click();
  }

  getNotifications() {
    return this.page.getByRole("region", { name: "Notifications alt+T" });
  }

  async expectToast(message: string): Promise<void> {
    await expect(
      this.getNotifications()
        .getByRole("listitem")
        .filter({ hasText: message }),
    ).toBeVisible({ timeout: 10000 });
  }

  getExceptionItem(reason: string) {
    return this.page.getByRole("listitem").filter({ hasText: reason });
  }

  async moveToNextMonth(): Promise<void> {
    const nextMonthButton = this.page.getByRole("button", {
      name: "Next Month",
    });
    await expect(nextMonthButton).toBeVisible();
    await nextMonthButton.click();
  }

  async createException(reason: string): Promise<void> {
    await this.page.getByRole("button", { name: "Add Exception" }).click();
    await expect(
      this.page.getByRole("heading", { name: "Add Schedule Exceptions" }),
    ).toBeVisible();

    await this.page.getByRole("textbox", { name: "Reason" }).fill(reason);
    await this.selectMidMonthDate("first", 1);
    await this.selectMidMonthDate("second", 1);
    await this.page
      .getByRole("checkbox", { name: "Full Day Unavailable" })
      .check();
    await this.page
      .getByRole("button", { name: "Confirm Unavailability" })
      .click();

    await this.expectToast("Exception created successfully");
    await this.moveToNextMonth();
    await expect(this.getExceptionItem(reason)).toBeVisible();
  }

  async deleteException(reason: string): Promise<void> {
    const exceptionItem = this.getExceptionItem(reason);
    await expect(exceptionItem).toBeVisible();
    await exceptionItem.getByRole("button", { name: "Remove" }).click();

    await expect(this.page.getByText("Are you sure?")).toBeVisible();
    await expect(
      this.page.getByText(
        "This will permanently remove the exception and cannot be undone",
      ),
    ).toBeVisible();

    await this.page.getByRole("button", { name: "Delete" }).click();

    await this.expectToast("Exception deleted");
    await expect(exceptionItem).not.toBeVisible();
  }
}

test.describe("Schedule Exception Flow", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const scheduleExceptionPage = new ScheduleExceptionPage(page);
    await scheduleExceptionPage.gotoAvailability(facilityId);
  });

  test("should create a schedule exception", async ({ page }) => {
    const reason = faker.lorem.words(3);
    const scheduleExceptionPage = new ScheduleExceptionPage(page);

    try {
      await scheduleExceptionPage.createException(reason);
    } finally {
      if (await scheduleExceptionPage.getExceptionItem(reason).count()) {
        await scheduleExceptionPage.deleteException(reason);
      }
    }
  });

  test("should delete a created schedule exception", async ({ page }) => {
    const reason = faker.lorem.words(3);
    const scheduleExceptionPage = new ScheduleExceptionPage(page);

    await scheduleExceptionPage.createException(reason);
    await scheduleExceptionPage.deleteException(reason);
  });
});
