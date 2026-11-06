import { expect, Locator, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

function quickLinksGrid(page: Page): Locator {
  return page
    .getByRole("heading", { name: /^quick links$/i })
    .locator("xpath=following-sibling::div[1]");
}

function pinnedLinksGrid(page: Page): Locator {
  return page
    .getByRole("heading", { name: /^pinned links$/i })
    .locator("xpath=../following-sibling::div[1]");
}

test.describe("Facility Overview", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/overview`);
    await expect(
      page.getByRole("heading", { name: /^quick links$/i }),
    ).toBeVisible();
  });

  test("should navigate to appointments page when appointments card is clicked", async ({
    page,
  }) => {
    await quickLinksGrid(page)
      .getByRole("link", { name: /go to appointments/i })
      .click();

    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/appointments`),
    );
  });

  test("should navigate to encounters page when encounters card is clicked", async ({
    page,
  }) => {
    await quickLinksGrid(page)
      .getByRole("link", { name: /go to all encounters/i })
      .click();

    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/encounters/patients/`),
    );
  });

  test("should navigate to services page when services card is clicked", async ({
    page,
  }) => {
    await quickLinksGrid(page)
      .getByRole("link", { name: /go to services/i })
      .click();

    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/services/?$`),
    );
  });

  test("should show a pinned page under Pinned Links and navigate to it", async ({
    page,
  }) => {
    const pinnedTitle = "Admin Availability";
    const pinnedPath = `/facility/${facilityId}/users/admin/availability`;

    await test.step("Pin the user availability page", async () => {
      await page.goto(pinnedPath);
      await expect(page).toHaveURL(new RegExp(`${pinnedPath}/?$`));
      await expect(
        page.locator("[data-shortcut-id='pin-page']"),
      ).toBeAttached();

      await page.keyboard.press("Shift+B");

      const pinDialog = page.getByRole("dialog");
      await expect(pinDialog).toBeVisible();
      await expect(
        pinDialog.getByRole("heading", { name: /pin\/add to overview/i }),
      ).toBeVisible();

      await pinDialog.getByLabel(/^title$/i).fill(pinnedTitle);
      await pinDialog.getByRole("button", { name: /bookmark page/i }).click();
      await expect(pinDialog).toBeHidden();
    });

    await test.step("Open pinned link from overview", async () => {
      await page.goto(`/facility/${facilityId}/overview`);

      await expect(
        page.getByRole("heading", { name: /^pinned links$/i }),
      ).toBeVisible();

      await pinnedLinksGrid(page)
        .locator('[data-slot="card"]')
        .filter({ hasText: pinnedTitle })
        .click();

      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/users/admin/availability/?$`),
      );
    });
  });
});
