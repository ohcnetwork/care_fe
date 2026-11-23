import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  expectEscapeRestoresFocus,
  expectToast,
  openOverlayFromMenu,
} from "tests/helper/ui";
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
    await expect(
      page.getByRole("row").filter({ hasText: uniqueQueueName }),
    ).toBeVisible();
  });

  test("should edit queue name", async ({ page }) => {
    const uniqueQueueName = faker.lorem.words(3);
    const modifiedQueueName = faker.lorem.words(4);
    await createQueue(page, uniqueQueueName);
    await openQueueEditMenu(page, uniqueQueueName);
    const name = page.getByRole("textbox", { name: /queue name/i });
    await name.clear();
    await name.pressSequentially(modifiedQueueName);
    await expect(name).toHaveValue(modifiedQueueName);
    await page.getByRole("button", { name: /update queue/i }).click();
    await expectToast(page, /queue updated successfully/i);
    await expect(
      page.getByRole("row").filter({ hasText: modifiedQueueName }),
    ).toBeVisible();
  });

  test("should not allow creating a queue without a name", async ({ page }) => {
    await page.getByRole("button", { name: /create queue/i }).click();
    const createButton = page.getByRole("button", { name: /create queue/i });
    await expect(createButton).toBeDisabled();
  });

  test("should allow typing when editing from the queue board", async ({
    page,
  }) => {
    const queueName = faker.lorem.words(3);
    const modifiedQueueName = faker.lorem.words(4);
    await createQueue(page, queueName);
    const row = page.getByRole("row").filter({ hasText: queueName });
    await row.getByRole("link", { name: /^open$/i }).click();
    await page.getByRole("button", { name: /^settings$/i }).click();
    await page.getByRole("menuitem", { name: /edit queue name/i }).click();

    const name = page.getByRole("textbox", { name: /queue name/i });
    await expect(name).toHaveValue(queueName);
    await name.clear();
    await name.pressSequentially(modifiedQueueName);
    await expect(name).toHaveValue(modifiedQueueName);
    await expect(page.getByRole("menu")).toHaveCount(0);
    await name.press("Escape");
    await expect(name).toBeHidden();
    await page.getByRole("button", { name: /^settings$/i }).press("Enter");
    const editItem = page.getByRole("menuitem", { name: /edit queue name/i });
    await page.keyboard.press("e");
    await expect(editItem).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(name).toHaveValue(queueName);
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(name).toBeFocused();
    await name.clear();
    await name.pressSequentially(modifiedQueueName);
    await expect(name).toHaveValue(modifiedQueueName);
    await page.getByRole("button", { name: /update queue/i }).click();
    await expectToast(page, /queue updated successfully/i);
    await expect(name).toBeHidden();
    await page.getByRole("button", { name: /^settings$/i }).click();
    await page.getByRole("menuitem", { name: /edit queue name/i }).click();
    await expect(name).toHaveValue(modifiedQueueName);
    await expect(
      page.getByRole("button", { name: /update queue/i }),
    ).toBeDisabled();
  });

  test("should manage service points from the settings menu on the finished tab", async ({
    page,
  }) => {
    const queueName = faker.lorem.words(3);
    const servicePoint = {
      id: faker.string.uuid(),
      name: faker.lorem.words(2),
      status: "active",
    };
    await createQueue(page, queueName);
    const boardUrl = await page
      .getByRole("row")
      .filter({ hasText: queueName })
      .getByRole("link", { name: /^open$/i })
      .getAttribute("href");

    let releaseServicePoints = () => {};
    const servicePointsHeld = new Promise<void>((resolve) => {
      releaseServicePoints = resolve;
    });
    await page.route(
      `**/facility/${facilityId}/token/sub_queue/?*`,
      async (route) => {
        await servicePointsHeld;
        await route.fulfill({ json: { count: 1, results: [servicePoint] } });
      },
    );
    // The finished tab does not load service points, so the dialog must.
    await page.goto(boardUrl!.replace(/\/ongoing$/, "/completed"));

    const settings = page.getByRole("button", { name: /^settings$/i });
    const dialog = page.getByRole("dialog", {
      name: /assigned service points/i,
    });
    await test.step("Open the dialog while service points load", async () => {
      await openOverlayFromMenu(
        page,
        settings,
        /manage service points/i,
        dialog,
      );
      await expect(dialog.getByRole("checkbox")).toHaveCount(0);
    });

    await test.step("Toggle a service point with the keyboard", async () => {
      releaseServicePoints();
      await expect(dialog.getByText(servicePoint.name)).toBeVisible();
      const checkbox = dialog.getByRole("checkbox");
      await expect(checkbox).toBeChecked();
      await checkbox.press("Space");
      await expect(checkbox).not.toBeChecked();
    });

    await expectEscapeRestoresFocus(page, dialog, settings);
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
