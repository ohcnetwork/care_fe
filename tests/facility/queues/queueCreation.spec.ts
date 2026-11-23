import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createQueueViaUi,
  openQueueEditMenu,
  renameQueueViaUi,
} from "tests/helper/queue";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Queue Creation & Editing", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/queues`);
  });

  test(
    "should create a new queue",
    { tag: ["@atomic", "@cap:queue.create"] },
    async ({ page }) => {
      const uniqueQueueName = faker.lorem.words(3);
      await createQueueViaUi(page, { queueName: uniqueQueueName });
      await expect(
        page.getByRole("row").filter({ hasText: uniqueQueueName }),
      ).toBeVisible();
    },
  );

  test(
    "should edit queue name",
    { tag: ["@atomic", "@cap:queue.edit"] },
    async ({ page }) => {
      const uniqueQueueName = faker.lorem.words(3);
      const modifiedQueueName = faker.lorem.words(4);
      await createQueueViaUi(page, { queueName: uniqueQueueName });
      await renameQueueViaUi(page, {
        queueName: uniqueQueueName,
        newQueueName: modifiedQueueName,
      });
      await expect(
        page.getByRole("row").filter({ hasText: modifiedQueueName }),
      ).toBeVisible();
    },
  );

  test(
    "should not allow creating a queue without a name",
    { tag: ["@atomic", "@cap:queue.create"] },
    async ({ page }) => {
      await page.getByRole("button", { name: /create queue/i }).click();
      const createButton = page.getByRole("button", { name: /create queue/i });
      await expect(createButton).toBeDisabled();
    },
  );

  test(
    "should not allow editing queue name when no changes made",
    { tag: ["@atomic", "@cap:queue.edit"] },
    async ({ page }) => {
      const uniqueQueueName = faker.lorem.words(3);
      await createQueueViaUi(page, { queueName: uniqueQueueName });
      await openQueueEditMenu(page, uniqueQueueName);
      const updateButton = page.getByRole("button", { name: /update queue/i });
      await expect(updateButton).toBeDisabled();
    },
  );

  test(
    "should not allow editing queue name when invalid",
    { tag: ["@atomic", "@cap:queue.edit"] },
    async ({ page }) => {
      const uniqueQueueName = faker.lorem.words(3);
      await createQueueViaUi(page, { queueName: uniqueQueueName });
      await openQueueEditMenu(page, uniqueQueueName);
      await page.getByRole("textbox", { name: /queue name/i }).fill("");
      await page.getByRole("button", { name: /update queue/i }).click();
      await expect(page.getByText(/queue name is required/i)).toBeVisible();
    },
  );
});
