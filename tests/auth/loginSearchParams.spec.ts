import { expect, test, type Page } from "@playwright/test";

// The sign-in page reads `mode` with `loginPageSearch`
// (`src/lib/router/search/auth.ts`), and every page reads `debug` with
// `appSearch` (`src/lib/router/search/app.ts`).

const signInTab = (page: Page, name: "Staff sign-in" | "Patient sign-in") =>
  page.getByRole("tab", { name, exact: true });

test.describe("Sign-in search params", () => {
  test(
    "opens the tab in mode",
    { tag: ["@atomic", "@cap:auth.login"] },
    async ({ page }) => {
      await page.goto("/login?mode=patient");

      await expect(signInTab(page, "Patient sign-in")).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  );

  test(
    "writes the selected tab to mode",
    { tag: ["@atomic", "@cap:auth.login"] },
    async ({ page }) => {
      await page.goto("/login");
      await expect(signInTab(page, "Staff sign-in")).toHaveAttribute(
        "aria-selected",
        "true",
      );

      await signInTab(page, "Patient sign-in").click();

      await expect(page).toHaveURL(/\/login\?mode=patient$/);
      await expect(signInTab(page, "Patient sign-in")).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  );

  test(
    "opens the staff tab for an invalid mode",
    { tag: ["@atomic", "@cap:auth.login"] },
    async ({ page }) => {
      await page.goto("/login?mode=bogus");

      await expect(signInTab(page, "Staff sign-in")).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  );

  test(
    "turns on developer mode with debug=true",
    { tag: ["@atomic", "@cap:nav.developer-mode.toggle"] },
    async ({ page }) => {
      await page.goto("/login?debug=true");

      await expect(
        page.getByText(
          "WARNING: You are on PRODUCTION! Be careful with write operations.",
        ),
      ).toBeVisible();
    },
  );

  test(
    "leaves developer mode off for another debug value",
    { tag: ["@atomic", "@cap:nav.developer-mode.toggle"] },
    async ({ page }) => {
      await page.goto("/login?debug=yes");
      await expect(signInTab(page, "Staff sign-in")).toBeVisible();

      await expect(
        page.getByText(
          "WARNING: You are on PRODUCTION! Be careful with write operations.",
        ),
      ).toBeHidden();
    },
  );
});
