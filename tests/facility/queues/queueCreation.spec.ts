import { faker } from "@faker-js/faker";
import type { Locator } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Queue Creation & Editing", () => {
  let facilityId: string;
  let queueName: string;
  let updatedQueueName: string;
  let row: Locator;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    await page.goto(`/facility/${facilityId}/queues`);
  });

  test("should create a new queue", async ({ page }) => {
    queueName = faker.lorem.word();

    await page.getByRole("button", { name: /create queue/i }).click();
    await page.getByRole("textbox", { name: /queue name/i }).fill(queueName);
    await page.getByRole("button", { name: /create queue/i }).click();
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Queue created successfully"),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(queueName)).toBeVisible();
  });

  test("should edit queue name", async ({ page }) => {
    updatedQueueName = faker.lorem.word();

    await test.step("Open queue edit menu", async () => {
      row = page.getByRole("row", {
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
          .getByText("Queue updated successfully"),
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(updatedQueueName)).toBeVisible();
      await expect(page.getByText(queueName)).not.toBeVisible();
    });
  });

  test("should not allow editing queue name when no changes made", async ({
    page,
  }) => {
    await test.step("Open queue edit menu", async () => {
      row = page.getByRole("row", {
        name: new RegExp(`\\b${updatedQueueName}\\b`),
      });
      await row.locator("td").last().getByRole("button").click();
      await page.getByRole("menuitem", { name: "Edit queue name" }).click();
    });

    await test.step("Verify update button is disabled", async () => {
      await expect(
        page.getByRole("button", { name: /update queue/i }),
      ).toBeDisabled();
    });
  });

  test("should not allow editing queue name when invalid", async ({ page }) => {
    await test.step("Open queue edit menu", async () => {
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
