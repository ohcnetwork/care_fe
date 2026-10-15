import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

const MAX_PINNED_LINKS = 10;

test.use({ storageState: "tests/.auth/user.json" });

interface PinnedLink {
  link: string;
  title: string;
  facilityId?: string;
}

function buildLinks(facilityId: string, count: number): PinnedLink[] {
  return Array.from({ length: count }, (_, i) => ({
    link: `/facility/${facilityId}/users?seed=${i}`,
    title: `Seeded ${faker.string.alphanumeric(8)}`,
    facilityId,
  }));
}

async function setPinnedLinks(links: PinnedLink[]) {
  const res = await fetch(`${getApiUrl()}/api/v1/users/set_preferences/`, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify({
      version: "0.0.1",
      preference: "facility_quick_links",
      value: { custom_links: links, blacklist: [] },
    }),
  });
  expect(res.ok).toBeTruthy();
}

async function getPinnedLinks(): Promise<PinnedLink[]> {
  const res = await fetch(`${getApiUrl()}/api/v1/users/getcurrentuser/`, {
    headers: getApiHeaders(),
  });
  expect(res.ok).toBeTruthy();
  const user = await res.json();
  return user.preferences?.facility_quick_links?.custom_links ?? [];
}

async function openPinDialog(page: Page) {
  await expect(
    page.getByRole("button", { name: "Pin page", exact: true }),
  ).toBeAttached();
  await page.keyboard.press("Shift+B");
  const dialog = page.getByRole("dialog", { name: "Pin/Add to Overview" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("Pinned links limit per facility", () => {
  let facilityId: string;
  let otherFacilityId: string;
  let otherFacilityLinks: PinnedLink[];
  let facilityLinks: PinnedLink[];

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    // The limit is counted from the saved preferences, so another facility's
    // links only need a different facilityId.
    otherFacilityId = faker.string.uuid();
    otherFacilityLinks = buildLinks(otherFacilityId, MAX_PINNED_LINKS);
    facilityLinks = buildLinks(facilityId, MAX_PINNED_LINKS - 1);
    await setPinnedLinks([...otherFacilityLinks, ...facilityLinks]);
  });

  test("allows pinning up to the limit in each facility", async ({ page }) => {
    const title = `Pinned ${faker.string.alphanumeric(8)}`;

    await test.step("Overview shows only this facility's links", async () => {
      await page.goto(`/facility/${facilityId}/overview`);

      await expect(
        page.getByRole("heading", { name: "Pinned Links" }),
      ).toBeVisible();
      for (const link of facilityLinks) {
        await expect(
          page.getByRole("link", { name: link.title }),
        ).toBeVisible();
      }
      await expect(
        page.getByRole("link", { name: otherFacilityLinks[0].title }),
      ).toHaveCount(0);
    });

    await test.step("Pin a page although another facility is full", async () => {
      await page.goto(`/facility/${facilityId}/users`);
      const dialog = await openPinDialog(page);

      await dialog.getByRole("textbox", { name: "Title" }).fill(title);
      await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes("/api/v1/users/set_preferences/") && res.ok(),
        ),
        dialog.getByRole("button", { name: "Bookmark Page" }).click(),
      ]);
      await expect(dialog).toBeHidden();
    });

    await test.step("Block pinning once this facility is full", async () => {
      await page.goto(`/facility/${facilityId}/encounters`);
      const dialog = await openPinDialog(page);

      await expect(
        dialog.getByText(
          `You have reached the maximum of ${MAX_PINNED_LINKS} pinned links for this facility.`,
        ),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Bookmark Page" }),
      ).toBeDisabled();
      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step("Reset clears only this facility's links", async () => {
      await page.goto(`/facility/${facilityId}/overview`);

      const pinnedHeading = page.getByRole("heading", { name: "Pinned Links" });
      await expect(pinnedHeading).toBeVisible();
      await pinnedHeading.locator("..").getByRole("button").click();
      await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes("/api/v1/users/set_preferences/") && res.ok(),
        ),
        page.getByRole("menuitem", { name: "Reset Pinned Links" }).click(),
      ]);

      await expect(pinnedHeading).toBeHidden();
      await expect(page.getByRole("link", { name: title })).toHaveCount(0);

      const remaining = await getPinnedLinks();
      expect(remaining.map((link) => link.link).sort()).toEqual(
        otherFacilityLinks.map((link) => link.link).sort(),
      );
    });
  });
});
