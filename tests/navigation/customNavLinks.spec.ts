import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

interface CustomNavLink {
  name: string;
  url: string;
  openInNewTab?: boolean;
  placement: string[];
}

const CUSTOM_NAV_LINKS: CustomNavLink[] = [
  {
    name: "Documentation",
    url: "https://docs.ohc.network",
    placement: ["all"],
  },
  {
    name: "Questionnaire",
    url: "/admin/questionnaire",
    placement: ["all"],
  },
  {
    name: "Landing",
    url: "https://ohc.network",
    openInNewTab: false,
    placement: ["admin", "organization"],
  },
];

const UNSAFE_NAV_LINKS: CustomNavLink[] = [
  {
    name: "Unsafe Javascript",
    url: "javascript:void(0)",
    placement: ["all"],
  },
  {
    name: "Unsafe Protocol Relative",
    url: "//evil.example.com/phish",
    placement: ["all"],
  },
];

const CUSTOM_NAV_LINKS_FIXTURE = [...CUSTOM_NAV_LINKS, ...UNSAFE_NAV_LINKS];

const isExternal = (url: string) => /^https?:\/\//i.test(url);
const isInternal = (url: string) =>
  url.startsWith("/") && !url.startsWith("//");
const showsOn = (link: CustomNavLink, scope: string) =>
  link.placement.some((p) => p === scope || p === "all");
// Mirrors the app: external URLs default to new-tab, internal to same-tab,
// unless openInNewTab overrides it.
const opensInNewTab = (link: CustomNavLink) =>
  link.openInNewTab ?? isExternal(link.url);

// Links visible in the facility sidebar (placement includes "facility" or "all").
const externalNewTab = CUSTOM_NAV_LINKS.find(
  (l) =>
    isExternal(l.url) && l.openInNewTab !== false && showsOn(l, "facility"),
);
// A same-tab internal link (internal URLs are same-tab unless openInNewTab: true).
const internal = CUSTOM_NAV_LINKS.find(
  (l) => isInternal(l.url) && !opensInNewTab(l) && showsOn(l, "facility"),
);
// An external link explicitly forced to open in the same tab (openInNewTab: false).
const externalSameTab = CUSTOM_NAV_LINKS.find(
  (l) => isExternal(l.url) && l.openInNewTab === false,
);

const customLink = (page: Page, url: string) =>
  page
    .locator('[data-sidebar="footer"] [data-sidebar="group"]')
    .locator(`a[href="${url}"]`);

test.describe("Custom sidebar nav links (env)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((fixture) => {
      let coreEnv: Record<string, unknown> | undefined;
      Object.defineProperty(window, "__CORE_ENV__", {
        configurable: true,
        get() {
          return coreEnv;
        },
        set(value) {
          coreEnv = value;
          if (value && typeof value === "object") {
            value.customNavLinks = fixture;
          }
        },
      });
    }, CUSTOM_NAV_LINKS_FIXTURE);
  });

  test("does not render unsafe custom nav link URLs", async ({ page }) => {
    test.skip(!externalNewTab || !internal, "safe fixture links required");
    await page.goto(`/facility/${getFacilityId()}/overview`);

    const footer = page.locator(
      '[data-sidebar="footer"] [data-sidebar="group"]',
    );

    await expect(customLink(page, externalNewTab!.url)).toBeVisible();
    await expect(customLink(page, internal!.url)).toBeVisible();

    for (const link of UNSAFE_NAV_LINKS) {
      await expect(footer.locator(`a[href="${link.url}"]`)).toHaveCount(0);
    }
    await expect(footer.locator('a[href^="javascript:"]')).toHaveCount(0);
    await expect(footer.locator('a[href^="//"]')).toHaveCount(0);
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
      new RegExp(
        new URL(externalSameTab!.url).host.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        ),
      ),
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
