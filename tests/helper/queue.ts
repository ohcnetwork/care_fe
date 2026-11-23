import { expect, test, type Page } from "@playwright/test";

import { expectToast } from "tests/helper/ui";

/** Creates a queue for the list's date from the facility queue list (opened first when `facilityId` is given). */
export async function createQueueViaUi(
  page: Page,
  { facilityId, queueName }: { facilityId?: string; queueName: string },
): Promise<{ queueId: string; queueName: string }> {
  return test.step(
    "queue.create",
    async () => {
      if (facilityId) await page.goto(`/facility/${facilityId}/queues`);
      await page.getByRole("button", { name: /create queue/i }).click();
      await page.getByRole("textbox", { name: /queue name/i }).fill(queueName);
      const created = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          /\/api\/v1\/facility\/[^/]+\/token\/queue\/$/.test(
            new URL(response.url()).pathname,
          ),
      );
      await page.getByRole("button", { name: /create queue/i }).click();
      const response = await created;
      expect(response.ok(), await response.text()).toBe(true);
      await expectToast(page, /queue created successfully/i);
      const queueId = ((await response.json()) as { id: string }).id;
      return { queueId, queueName };
    },
    { box: true },
  );
}

/** Opens the "Edit queue name" form of a queue row in the queue list. */
export async function openQueueEditMenu(page: Page, queueName: string) {
  const row = page.getByRole("row").filter({ hasText: queueName });
  await row.getByRole("button").last().click();
  await page.getByRole("menuitem", { name: /edit queue name/i }).click();
}

/** Renames a queue from the queue list. */
export async function renameQueueViaUi(
  page: Page,
  { queueName, newQueueName }: { queueName: string; newQueueName: string },
): Promise<{ queueName: string }> {
  return test.step(
    "queue.edit",
    async () => {
      await openQueueEditMenu(page, queueName);
      const name = page.getByRole("textbox", { name: /queue name/i });
      await name.clear();
      await name.pressSequentially(newQueueName);
      await expect(name).toHaveValue(newQueueName);
      await page.getByRole("button", { name: /update queue/i }).click();
      await expectToast(page, /queue updated successfully/i);
      return { queueName: newQueueName };
    },
    { box: true },
  );
}
