import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Queue Creation & Editing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: "View facility details" })
      .first()
      .click();
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("link", { name: "Queues" }).click();
  });

  test("should create a new queue", async ({ page }) => {
    const uniqueQueueName = `Test Queue ${Date.now()}`;
    await page.getByRole("button", { name: "Create Queue" }).click();
    await page
      .getByRole("textbox", { name: "Queue Name" })
      .fill(uniqueQueueName);
    await page.getByRole("button", { name: "Create Queue" }).click();
    await expect(page.getByText(uniqueQueueName)).toBeVisible();
  });

  test("should edit queue name", async ({ page }) => {
    const uniqueQueueName = `Test Queue ${Date.now()}`;
    const modifiedQueueName = `Modified Queue ${Date.now()}`;
    await page.getByRole("button", { name: "Create Queue" }).click();
    await page
      .getByRole("textbox", { name: "Queue Name" })
      .fill(uniqueQueueName);
    await page.getByRole("button", { name: "Create Queue" }).click();
    await expect(
      page.getByRole("cell", { name: uniqueQueueName }),
    ).toBeVisible();
    const row = page.getByRole("row", {
      name: new RegExp(`\\b${uniqueQueueName}\\b`),
    });
    await row.locator("td").last().getByRole("button").click();
    await page.getByRole("menuitem", { name: "Edit queue name" }).click();
    await page
      .getByRole("textbox", { name: "Queue Name" })
      .fill(modifiedQueueName);
    await page.getByRole("button", { name: "Update Queue" }).click();
    await expect(page.getByText(modifiedQueueName)).toBeVisible();
  });

  test("should not allow creating a queue without a name", async ({ page }) => {
    await page.getByRole("button", { name: "Create Queue" }).click();
    const createButton = page.getByRole("button", { name: "Create Queue" });
    await expect(createButton).toBeDisabled();
  });

  test("should not allow editing queue name when no changes made", async ({
    page,
  }) => {
    const uniqueQueueName = `Test Queue ${Date.now()}`;
    await page.getByRole("button", { name: "Create Queue" }).click();
    await page
      .getByRole("textbox", { name: "Queue Name" })
      .fill(uniqueQueueName);
    await page.getByRole("button", { name: "Create Queue" }).click();
    await expect(
      page.getByRole("cell", { name: uniqueQueueName }),
    ).toBeVisible();
    const row = page.getByRole("row", {
      name: new RegExp(`\\b${uniqueQueueName}\\b`),
    });
    await row.locator("td").last().getByRole("button").click();
    await page.getByRole("menuitem", { name: "Edit queue name" }).click();
    const updateButton = page.getByRole("button", { name: "Update Queue" });
    await expect(updateButton).toBeDisabled();
  });

  test("should not allow editing queue name when invalid", async ({ page }) => {
    const uniqueQueueName = `Test Queue ${Date.now()}`;
    await page.getByRole("button", { name: "Create Queue" }).click();
    await page
      .getByRole("textbox", { name: "Queue Name" })
      .fill(uniqueQueueName);
    await page.getByRole("button", { name: "Create Queue" }).click();
    await expect(
      page.getByRole("cell", { name: uniqueQueueName }),
    ).toBeVisible();
    const row = page.getByRole("row", {
      name: new RegExp(`\\b${uniqueQueueName}\\b`),
    });
    await row.locator("td").last().getByRole("button").click();
    await page.getByRole("menuitem", { name: "Edit queue name" }).click();
    await page.getByRole("textbox", { name: "Queue Name" }).fill("");
    await page.getByRole("button", { name: "Update Queue" }).click();
    await expect(page.getByText("Queue name is required")).toBeVisible();
  });
});
