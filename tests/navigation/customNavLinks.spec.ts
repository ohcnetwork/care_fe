import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const raw = process.env.REACT_CUSTOM_NAV_LINKS;

type CustomNavLink = {
  name: string;
  url: string;
  openInNewTab?: boolean;
  placement?: string[];
};

const links: CustomNavLink[] = raw ? JSON.parse(raw) : [];

const isExternal = (url: string) => /^https?:\/\//i.test(url);
const isInternal = (url: string) =>
  url.startsWith("/") && !url.startsWith("//");
const showsOn = (link: CustomNavLink, scope: string) =>
  (link.placement ?? ["all"]).some((p) => p === scope || p === "all");
// Mirrors the app: external URLs default to new-tab, internal to same-tab,
// unless openInNewTab overrides it.
const opensInNewTab = (link: CustomNavLink) =>
  link.openInNewTab ?? isExternal(link.url);

// Links visible in the facility sidebar (placement includes "facility" or "all").
const externalNewTab = links.find(
  (l) =>
    isExternal(l.url) && l.openInNewTab !== false && showsOn(l, "facility"),
);
// A same-tab internal link (internal URLs are same-tab unless openInNewTab: true).
const internal = links.find(
  (l) => isInternal(l.url) && !opensInNewTab(l) && showsOn(l, "facility"),
);
// An external link explicitly forced to open in the same tab (openInNewTab: false).
const externalSameTab = links.find(
  (l) => isExternal(l.url) && l.openInNewTab === false,
);

const customLink = (page: Page, url: string) =>
  page
    .locator('[data-sidebar="footer"] [data-sidebar="group"]')
    .locator(`a[href="${url}"]`);

test.describe("Custom sidebar nav links (env)", () => {
  test.beforeEach(() => {
    test.skip(!raw, "REACT_CUSTOM_NAV_LINKS was not set for this build");
  });

  test("opens an external link in a new tab", async ({ page, context }) => {
    test.skip(
      !externalNewTab,
      "no facility-scoped external custom nav link configured",
    );
    await page.goto(`/facility/${getFacilityId()}/overview`);

    const link = customLink(page, externalNewTab!.url);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");

    const [newTab] = await Promise.all([
      context.waitForEvent("page"),
      link.click(),
    ]);
    expect(context.pages()).toHaveLength(2);
    await newTab.close();
  });

  test("opens an internal link in the same tab", async ({ page, context }) => {
    test.skip(
      !internal,
      "no facility-scoped internal custom nav link configured",
    );
    await page.goto(`/facility/${getFacilityId()}/overview`);

    const link = customLink(page, internal!.url);
    await expect(link).toBeVisible();
    await expect(link).not.toHaveAttribute("target", "_blank");

    await link.click();
    await expect(page).toHaveURL(new RegExp(`${internal!.url}(/|$)`));
    expect(context.pages()).toHaveLength(1);
  });

  test("opens an external link in the same tab when openInNewTab is false", async ({
    page,
  }) => {
    test.skip(
      !externalSameTab || !showsOn(externalSameTab, "admin"),
      "no admin-scoped same-tab external custom nav link configured",
    );
    await page.goto("/admin/questionnaire");

    const link = customLink(page, externalSameTab!.url);
    await expect(link).toBeVisible();
    await expect(link).not.toHaveAttribute("target", "_blank");
    await expect(link).not.toHaveAttribute("rel", "noopener noreferrer");

    await link.click();
    await expect(page).toHaveURL(
      new RegExp(new URL(externalSameTab!.url).host.replace(/\./g, "\\.")),
    );
  });

  test("hides a link outside its placement scopes", async ({ page }) => {
    test.skip(
      !externalSameTab || showsOn(externalSameTab, "facility"),
      "no scope-restricted custom nav link configured",
    );
    await page.goto(`/facility/${getFacilityId()}/overview`);

    const present = externalNewTab ?? internal;
    if (present) {
      await expect(customLink(page, present.url)).toBeVisible();
    }
    await expect(customLink(page, externalSameTab!.url)).toHaveCount(0);
  });
});
