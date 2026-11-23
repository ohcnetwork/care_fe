import { expect, test } from "@playwright/test";

// A deployment can serve its own /runtime-env.js; care.config.ts lets its
// REACT_* values override the values from the build.
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

  test("stops with an error when runtime-env.js has invalid values", async ({
    page,
  }) => {
    await page.route("**/runtime-env.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `window.__CARE_RUNTIME_ENV__ = {
          REACT_CARE_API_URL: "not a url",
          REACT_CARE_URL_MAP: "null",
          REACT_CUSTOM_SHORTCUTS: "[",
          // A valid org/repo with a URL that new URL() rejects (bad port).
          REACT_ENABLED_APPS: "ohcnetwork/care_fe@care.example.org:99999",
        };`,
      }),
    );
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/")) apiRequests.push(request.url());
    });
    const stopped = page.waitForEvent("pageerror", (error) =>
      error.message.includes("Invalid settings"),
    );

    await page.goto("/");

    // The app names the invalid settings and stops before any API request.
    await stopped;
    const alert = page.getByRole("alert");
    for (const name of [
      "REACT_CARE_API_URL",
      "REACT_CARE_URL_MAP",
      "REACT_CUSTOM_SHORTCUTS",
      "REACT_ENABLED_APPS",
    ]) {
      await expect(alert).toContainText(name);
    }
    expect(apiRequests).toEqual([]);
  });

  test("stops with a retry screen when the settings check doesn't load", async ({
    page,
  }) => {
    await page.route("**/runtime-env.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: 'window.__CARE_RUNTIME_ENV__ = { REACT_DISABLE_PATIENT_LOGIN: "true" };',
      }),
    );
    // The schema that checks the overrides loads as its own chunk.
    await page.route("**/validate-env*", (route) => route.abort());

    await page.goto("/");

    await expect(page.getByRole("alert")).toHaveText(/couldn't check/i);
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("stops with a retry screen when runtime-env.js doesn't load", async ({
    page,
  }) => {
    await page.route("**/runtime-env.js", (route) => route.abort());
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/")) apiRequests.push(request.url());
    });
    const stopped = page.waitForEvent("pageerror", (error) =>
      error.message.includes("runtime-env.js"),
    );

    await page.goto("/");

    // The app stops instead of starting with the build's values.
    await stopped;
    await expect(page.getByRole("alert")).toHaveText(/couldn't load/i);
    expect(apiRequests).toEqual([]);

    // Once runtime-env.js loads again, "Try again" starts the app.
    await page.unroute("**/runtime-env.js");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(
      page.getByRole("button", { name: /patient sign-in/i }),
    ).toBeVisible();
  });
});
