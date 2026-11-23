import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  ensureCurrentPageUnpinned,
  openPinPageDialog,
  savePinPageDialog,
  unpinCurrentPageViaUi,
} from "tests/helper/facility";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Pin Page Shortcut (Shift+B)", () => {
  let facilityId: string;
  let pageUrl: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    pageUrl = `/facility/${facilityId}/users`;
    await page.goto(pageUrl);

    // A failed earlier attempt (e.g. a CI retry) may have left this page pinned
    await ensureCurrentPageUnpinned(page);
  });

  test(
    "should pin and unpin a page to the facility overview",
    {
      tag: ["@coupled", "@cap:facility.pinned-link.create"],
      annotation: {
        type: "coupled",
        description:
          "Pins as admin; the overview spec also saves admin's pinned links, so parallel saves can overwrite each other",
      },
    },
    async ({ page }) => {
      const title = `Pinned ${faker.string.alphanumeric(8)}`;

      await test.step("Pin the current page using Shift+B", async () => {
        const dialog = await openPinPageDialog(page);
        await expect(dialog.getByText(pageUrl)).toBeVisible();

        await savePinPageDialog(page, dialog, { title });
      });

      await test.step("Verify pinned link appears on overview", async () => {
        await page.goto(`/facility/${facilityId}/overview`);

        await expect(
          page.getByRole("heading", { name: "Pinned Links" }),
        ).toBeVisible();
        const pinnedLink = page.getByRole("link", { name: title });
        await expect(pinnedLink).toBeVisible();
        await expect(pinnedLink).toHaveAttribute("href", pageUrl);

        await pinnedLink.click();
        await expect(page).toHaveURL(pageUrl);
      });

      await test.step("Unpin the page using Shift+B", async () => {
        await unpinCurrentPageViaUi(page);
      });

      await test.step("Verify pinned link is removed from overview", async () => {
        await page.goto(`/facility/${facilityId}/overview`);

        await expect(
          page.getByRole("heading", { name: "Quick links", exact: true }),
        ).toBeVisible();
        await expect(page.getByRole("link", { name: title })).toHaveCount(0);
      });
    },
  );
});
