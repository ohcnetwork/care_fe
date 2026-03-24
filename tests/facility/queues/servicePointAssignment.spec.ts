import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

async function mockServicePoints(
  page: Page,
  results: Array<{ id: string; name: string; status: string }>,
) {
  await page.route(
    /\/api\/v1\/facility\/.+\/token\/sub_queue\/.*/,
    async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: results.length,
          next: null,
          previous: null,
          results,
        }),
      });
    },
  );
}

async function createQueue(page: Page, queueName: string) {
  await page.getByRole("button", { name: /create queue/i }).click();
  await page.getByRole("textbox", { name: /queue name/i }).fill(queueName);
  await page.getByRole("button", { name: /create queue/i }).click();
  await expectToast(page, /queue created successfully/i);
}

async function openQueueBoard(page: Page, queueName: string) {
  const row = page.getByRole("row").filter({ hasText: queueName });

  await Promise.all([
    page.waitForURL(/\/queues\/.+\/ongoing/),
    row.getByRole("link", { name: /open/i }).click(),
  ]);
}

test.describe("Queue Board Service Point Assignment", () => {
  let facilityId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  test("disables assignment and shows an empty state when no service points exist", async ({
    page,
  }) => {
    const queueName = faker.lorem.words(3);

    await mockServicePoints(page, []);
    await page.goto(`/facility/${facilityId}/queues`);
    await createQueue(page, queueName);
    await openQueueBoard(page, queueName);

    await expect(
      page.getByRole("button", { name: /assign service points/i }),
    ).toBeDisabled();
    await expect(page.getByText(/no service points available/i)).toBeVisible();

    await page.getByRole("button", { name: /^settings$/i }).click();
    await page
      .getByRole("menuitem", { name: /manage service points/i })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText(/no service points available/i),
    ).toBeVisible();
    await expect(
      dialog.getByText(/create your first service point to get started/i),
    ).toBeVisible();
  });

  test("keeps assignment available when service points exist", async ({
    page,
  }) => {
    const queueName = faker.lorem.words(3);

    await mockServicePoints(page, [
      { id: "sp-1", name: "Counter 1", status: "active" },
      { id: "sp-2", name: "Counter 2", status: "active" },
    ]);
    await page.goto(`/facility/${facilityId}/queues`);
    await createQueue(page, queueName);
    await openQueueBoard(page, queueName);

    const assignButton = page.getByRole("button", {
      name: /assign service points/i,
    });

    await expect(assignButton).toBeEnabled();
    await assignButton.click();

    const dropdownContent = page
      .locator("[data-slot='dropdown-menu-content']")
      .last();
    await expect(dropdownContent.getByText("Counter 1")).toBeVisible();
    await expect(dropdownContent.getByText("Counter 2")).toBeVisible();
    await expect(
      dropdownContent.getByText(/no service points available/i),
    ).toHaveCount(0);
  });
});
