import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Queue Practitioner Search", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/queues`);
  });

  test("should open practitioner selector with search", async ({ page }) => {
    await page.getByRole("combobox").click();

    const dialog = page.locator("[role='dialog']").last();
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByPlaceholder(/search departments and/i),
    ).toBeVisible();
  });

  test("should search and select practitioner by name", async ({
    page,
    request,
  }) => {
    const response = await request.get(
      `${getApiUrl()}/api/v1/facility/${facilityId}/appointments/available_users/`,
      { headers: getApiHeaders() },
    );
    expect(response.ok()).toBe(true);
    const { users } = (await response.json()) as {
      users: {
        id: string;
        username: string;
        first_name: string;
        last_name: string;
      }[];
    };
    const practitioner = users.find((user) => user.username === "care-doctor");
    expect(
      practitioner,
      "The scheduled care-doctor fixture must be available",
    ).toBeDefined();

    await page.getByRole("combobox").click();

    const dialog = page.locator("[role='dialog']").last();
    const searchInput = dialog.getByPlaceholder(/search departments and/i);
    await dialog.getByRole("button", { name: "My Dept.", exact: true }).click();
    await searchInput.fill(practitioner!.first_name);
    const option = dialog
      .getByRole("option")
      .filter({ hasText: practitioner!.first_name })
      .filter({ hasText: practitioner!.last_name });
    await expect(option).toBeVisible();
    const queueResponse = page.waitForResponse((result) => {
      const url = new URL(result.url());
      return (
        url.pathname === `/api/v1/facility/${facilityId}/token/queue/` &&
        url.searchParams.get("resource_id") === practitioner!.id
      );
    });
    await option.click();
    expect((await queueResponse).ok()).toBe(true);
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("resource_id") === practitioner!.id,
    );
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("combobox")).toContainText(
      practitioner!.first_name,
    );
    await expect(page.getByRole("combobox")).toContainText(
      practitioner!.last_name,
    );
  });

  test("should navigate through departments", async ({ page }) => {
    await page.getByRole("combobox").click();

    const dialog = page.locator("[role='dialog']").last();
    await dialog.getByRole("button", { name: "My Dept.", exact: true }).click();
    const department = dialog.getByRole("option", {
      name: "Administration",
      exact: true,
    });
    await department.click();
    await expect(
      dialog.getByPlaceholder(/search departments and/i),
    ).toHaveCount(0);
    await expect(
      dialog.getByText("Administration", { exact: true }),
    ).toBeVisible();

    const backButton = dialog.getByRole("button").filter({
      has: page.locator("svg.lucide-arrow-left"),
    });
    await expect(backButton).toBeVisible();
    await backButton.click();
    await expect(
      dialog.getByPlaceholder(/search departments and/i),
    ).toBeVisible();
    await expect(department).toBeVisible();
  });

  test("should close on escape key", async ({ page }) => {
    await page.getByRole("combobox").click();

    const dialog = page.locator("[role='dialog']").last();
    await dialog.waitFor({ state: "visible" });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
