import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

async function createQueue(page: Page, queueName: string) {
  await page.getByRole("button", { name: /create queue/i }).click();
  await page.getByRole("textbox", { name: /queue name/i }).fill(queueName);
  await page.getByRole("button", { name: /create queue/i }).click();
  await expectToast(page, /queue created successfully/i);
}

async function openQueueEditMenu(page: Page, queueName: string) {
  const row = page.getByRole("row").filter({ hasText: queueName });
  await row.getByRole("button").last().click();
  await page.getByRole("menuitem", { name: /edit queue name/i }).click();
}

test.describe("Queue Creation & Editing", () => {
  let facilityId: string;
  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/queues`);
  });

  test("should create a new queue", async ({ page }) => {
    const uniqueQueueName = faker.lorem.words(3);
    await createQueue(page, uniqueQueueName);
  });

  test("should edit queue name", async ({ page }) => {
    const uniqueQueueName = faker.lorem.words(3);
    const modifiedQueueName = faker.lorem.words(4);
    await createQueue(page, uniqueQueueName);
    await openQueueEditMenu(page, uniqueQueueName);
    await page
      .getByRole("textbox", { name: /queue name/i })
      .fill(modifiedQueueName);
    await page.getByRole("button", { name: /update queue/i }).click();
    await expectToast(page, /queue updated successfully/i);
  });

  test("should not allow creating a queue without a name", async ({ page }) => {
    await page.getByRole("button", { name: /create queue/i }).click();
    const createButton = page.getByRole("button", { name: /create queue/i });
    await expect(createButton).toBeDisabled();
  });

  test("should not allow editing queue name when no changes made", async ({
    page,
  }) => {
    const uniqueQueueName = faker.lorem.words(3);
    await createQueue(page, uniqueQueueName);
    await openQueueEditMenu(page, uniqueQueueName);
    const updateButton = page.getByRole("button", { name: /update queue/i });
    await expect(updateButton).toBeDisabled();
  });

  test("should not allow editing queue name when invalid", async ({ page }) => {
    const uniqueQueueName = faker.lorem.words(3);
    await createQueue(page, uniqueQueueName);
    await openQueueEditMenu(page, uniqueQueueName);
    await page.getByRole("textbox", { name: /queue name/i }).fill("");
    await page.getByRole("button", { name: /update queue/i }).click();
    await expect(page.getByText(/queue name is required/i)).toBeVisible();
  });
});
