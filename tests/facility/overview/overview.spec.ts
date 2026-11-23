import { faker } from "@faker-js/faker";
import { expect, Locator, Page, test } from "@playwright/test";
import {
  ensureCurrentPageUnpinned,
  pinCurrentPageViaUi,
} from "tests/helper/facility";
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

  test(
    "should navigate to appointments page when appointments card is clicked",
    { tag: ["@atomic", "@cap:facility.overview.navigate"] },
    async ({ page }) => {
      await quickLinksGrid(page)
        .getByRole("link", { name: /go to appointments/i })
        .click();

      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/appointments`),
      );
    },
  );

  test(
    "should navigate to encounters page when encounters card is clicked",
    { tag: ["@atomic", "@cap:facility.overview.navigate"] },
    async ({ page }) => {
      await quickLinksGrid(page)
        .getByRole("link", { name: /go to all encounters/i })
        .click();

      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/encounters/patients/`),
      );
    },
  );

  test(
    "should navigate to services page when services card is clicked",
    { tag: ["@atomic", "@cap:facility.overview.navigate"] },
    async ({ page }) => {
      await quickLinksGrid(page)
        .getByRole("link", { name: /go to services/i })
        .click();

      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/services/?$`),
      );
    },
  );

  test(
    "should show a pinned page under Pinned Links and navigate to it",
    {
      tag: ["@coupled", "@cap:facility.pinned-link.create"],
      annotation: {
        type: "coupled",
        description:
          "Pins as admin; pinPageShortcut also saves admin's pinned links, so parallel saves can overwrite each other",
      },
    },
    async ({ page }) => {
      const pinnedTitle = `Admin Availability ${faker.string.alphanumeric(6)}`;
      const pinnedPath = `/facility/${facilityId}/users/admin/availability`;

      try {
        await test.step("Pin the user availability page", async () => {
          await page.goto(pinnedPath);
          await expect(page).toHaveURL(new RegExp(`${pinnedPath}/?$`));
          // A failed earlier attempt (e.g. a CI retry) may have left this page pinned
          await ensureCurrentPageUnpinned(page);

          await pinCurrentPageViaUi(page, { title: pinnedTitle });
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
      } finally {
        // Leave admin's pinned links as they were, so a retry starts clean.
        await test.step("Unpin the user availability page", async () => {
          await page.goto(pinnedPath);
          await ensureCurrentPageUnpinned(page);
        });
      }
    },
  );
});
