import { expect, test } from "@playwright/test";

// The Docker image writes REACT_* env vars to /runtime-env.js on container
// start; care.config.ts lets them override the values from the build.
test.describe("Runtime env overrides", () => {
  // page.route() can't intercept requests a service worker answers.
  test.use({ serviceWorkers: "block" });

  test("uses the build's values when runtime-env.js is empty", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: /patient sign-in/i }),
    ).toBeVisible();
  });

  test("values in runtime-env.js override the build's values", async ({
    page,
  }) => {
    await page.route("**/runtime-env.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: 'window.__CARE_RUNTIME_ENV__ = { REACT_DISABLE_PATIENT_LOGIN: "true" };',
      }),
    );

    await page.goto("/");

    // With patient login disabled, "/" goes straight to the staff sign-in form.
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("textbox", { name: /username/i }),
    ).toBeVisible();
    await expect(page.getByText(/patient sign-in/i)).toHaveCount(0);
  });
});
