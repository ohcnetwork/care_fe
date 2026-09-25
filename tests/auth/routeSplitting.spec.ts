import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const json = path.endsWith("/plug_config/")
      ? { configs: [] }
      : path.endsWith("/getcurrentuser/")
        ? {
            id: "route-test",
            username: "route-test",
            first_name: "Route",
            last_name: "Test",
            user_type: "Doctor",
            is_superuser: true,
            permissions: [],
            facilities: [],
            organizations: [],
            preferences: {},
          }
        : { count: 0, results: [] };
    return route.fulfill({ json });
  });
});

test("routes load on demand while the authenticated shell remains visible", async ({
  page,
  context,
}) => {
  const scripts: string[] = [];
  const errors: string[] = [];
  context.on("request", (request) => {
    if (request.url().endsWith(".js")) scripts.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Login", exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem("care_access_token", "route-splitting-test"),
  );
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Admin Dashboard" }),
  ).toBeVisible();
  await page.evaluate(() =>
    navigator.serviceWorker.ready.then(() => undefined),
  );

  expect(
    scripts.filter((url) => /\/vendor-|\/QuestionnaireList-/.test(url)),
  ).toEqual([]);

  const requested = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  await context.route(
    /\/assets\/QuestionnaireList-[^/]+\.js$/,
    async (route) => {
      requested.resolve();
      await release.promise;
      await route.continue();
    },
  );
  await page.getByRole("link", { name: "Admin Dashboard" }).click();
  await requested.promise;
  try {
    await expect(page.locator('[data-sidebar="sidebar"]')).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Questionnaires", exact: true }),
    ).toBeHidden();
  } finally {
    release.resolve();
  }

  await expect(
    page.getByRole("heading", { name: "Questionnaires", exact: true }),
  ).toBeVisible();
  expect(scripts.some((url) => /\/QuestionnaireList-/.test(url))).toBe(true);
  expect(scripts.filter((url) => /\/vendor-/.test(url))).toEqual([]);
  expect(errors).toEqual([]);
});

test("federated routes use the host React and query context", async ({
  page,
  context,
  baseURL,
}) => {
  await context.route("**/api/v1/plug_config/", (route) =>
    route.fulfill({
      json: {
        configs: [
          {
            slug: "route-test",
            meta: { url: `${baseURL}/route-test-remote.js` },
          },
        ],
      },
    }),
  );
  await context.route("**/route-test-remote.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
        let shared;
        export function init(scope) { shared = scope; }
        export async function get() {
          const reactModule = (await Object.values(shared.react)[0].get())();
          const React = reactModule.default ?? reactModule;
          const query = (await Object.values(shared["@tanstack/react-query"])[0].get())();
          function PluginPage() {
            const client = query.useQueryClient();
            const [count, setCount] = React.useState(0);
            return React.createElement("button", { onClick: () => setCount(count + 1) },
              "Shared context " + Boolean(client) + ": " + count);
          }
          return () => ({ __esModule: true, default: {
            plugin: "route-test",
            routes: { "/route-test": () => React.createElement(PluginPage) }
          } });
        }
      `,
    }),
  );
  await context.addInitScript(() =>
    localStorage.setItem("care_access_token", "route-splitting-test"),
  );
  await page.goto("/route-test");
  await page.getByRole("button", { name: "Shared context true: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Shared context true: 1" }),
  ).toBeVisible();
});
