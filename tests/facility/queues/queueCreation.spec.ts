import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

async function createQueue(page: Page, queueName: string) {
  await page.getByRole("button", { name: /create queue/i }).click();
  await page.getByRole("textbox", { name: /queue name/i }).fill(queueName);
  await page.getByRole("button", { name: /create queue/i }).click();
  await expect(
    page
      .locator("li[data-sonner-toast]")
      .getByText(/queue created successfully/i),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(queueName)).toBeVisible();
}

test.describe("Queue Creation & Editing", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    await page.goto(`/facility/${facilityId}/queues`);
  });

  test("should create a new queue", async ({ page }) => {
    const queueName = faker.lorem.word();

    await createQueue(page, queueName);
  });

  test("should edit queue name", async ({ page }) => {
    const queueName = faker.lorem.word();
    const updatedQueueName = faker.lorem.word();
    await createQueue(page, queueName);
    await test.step("Open queue edit menu", async () => {
      const row = page.getByRole("row", {
        name: new RegExp(`\\b${queueName}\\b`),
      });
      await row.locator("td").last().getByRole("button").click();
      await page.getByRole("menuitem", { name: /edit queue name/i }).click();
    });

    await test.step("Update queue name", async () => {
      await page
        .getByRole("textbox", { name: /queue name/i })
        .fill(updatedQueueName);
      await page.getByRole("button", { name: /update queue/i }).click();
    });

    await test.step("Verify queue name updated", async () => {
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(/queue updated successfully/i),
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(updatedQueueName)).toBeVisible();
      await expect(page.getByText(queueName)).not.toBeVisible();
    });
  });

  test("should not allow editing queue name when no changes made", async ({
    page,
  }) => {
    const queueName = faker.lorem.word();
    await createQueue(page, queueName);
    await test.step("Open queue edit menu", async () => {
      const row = page.getByRole("row", {
        name: new RegExp(`\\b${queueName}\\b`),
      });
      await row.locator("td").last().getByRole("button").click();
      await page.getByRole("menuitem", { name: /edit queue name/i }).click();
    });

    await test.step("Verify update button is disabled", async () => {
      await expect(
        page.getByRole("button", { name: /update queue/i }),
      ).toBeDisabled();
    });
  });

  test("should not allow editing queue name when invalid", async ({ page }) => {
    const queueName = faker.lorem.word();
    await createQueue(page, queueName);

    await test.step("Open queue edit menu", async () => {
      const row = page.getByRole("row", {
        name: new RegExp(`\\b${queueName}\\b`),
      });
      await row.locator("td").last().getByRole("button").click();
      await page.getByRole("menuitem", { name: /edit queue name/i }).click();
    });

    await test.step("Clear queue name field and attempt update", async () => {
      await page.getByRole("textbox", { name: /queue name/i }).fill("");
      await page.getByRole("button", { name: /update queue/i }).click();
    });

    await test.step("Verify error message appears", async () => {
      await expect(page.getByText(/queue name is required/i)).toBeVisible();
    });
  });
});
