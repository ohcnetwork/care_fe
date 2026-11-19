import { expect, test, type APIRequestContext } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { testPluginRemoteEntryUrl } from "tests/helper/testPlugin";

test.use({ storageState: "tests/.auth/user.json" });

// A module federation remote with one organization tab. It reads React from
// the host share scope, like `tests/fixtures/plugin/remoteEntry.js`.
const pluginRemoteEntry = `
let shareScope;
export const init = (scope) => { shareScope = scope; };
export const get = () => Promise.resolve(async () => {
  const entry = Object.values(shareScope["react"])[0];
  const module = await (await entry.get())();
  const React = module.default ?? module;
  const Tab = ({ contextId, navOrganizationId }) =>
    React.createElement(
      "div",
      { "data-cy": "plugin-organization-tab" },
      contextId + "|" + (navOrganizationId ?? ""),
    );
  return {
    __esModule: true,
    default: {
      plugin: "care_test_plugin",
      routes: {},
      extends: [],
      components: {},
      organizationTabs: [
        {
          name: "Plugin Tab",
          slug: "plugin-tab",
          icon: React.createElement("span"),
          component: Tab,
        },
      ],
    },
  };
});
`;

interface OrganizationSummary {
  id: string;
  has_children: boolean;
}

async function listOrganizations(
  request: APIRequestContext,
  query: string,
): Promise<OrganizationSummary[]> {
  const response = await request.get(
    `${apiBaseUrl()}/api/v1/organization/?${query}`,
    { headers: adminApiHeaders() },
  );
  expect(response.ok()).toBeTruthy();
  return ((await response.json()) as { results: OrganizationSummary[] })
    .results;
}

test.describe("Organization plugin tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/plug_config/", (route) =>
      route.fulfill({
        json: {
          configs: [
            {
              slug: "care_test_plugin",
              meta: { url: testPluginRemoteEntryUrl },
            },
          ],
        },
      }),
    );
    await page.route(testPluginRemoteEntryUrl, (route) =>
      route.fulfill({
        body: pluginRemoteEntry,
        contentType: "application/javascript",
      }),
    );
  });

  test("renders a plugin tab inside the organization layout", async ({
    page,
    request,
  }) => {
    const [organization] = await listOrganizations(
      request,
      "org_type=govt&limit=1",
    );

    await page.goto(`/organization/${organization.id}/plugin-tab`);

    await expect(page.locator("[data-cy=plugin-organization-tab]")).toHaveText(
      `${organization.id}|`,
    );
  });

  test("renders a plugin tab of a child organization", async ({
    page,
    request,
  }) => {
    const parent = (
      await listOrganizations(request, "org_type=govt&limit=50")
    ).find((organization) => organization.has_children);
    if (!parent) {
      test.skip(true, "No government organization has a child.");
      return;
    }
    const [child] = await listOrganizations(
      request,
      `parent=${parent.id}&limit=1`,
    );

    await page.goto(
      `/organization/${parent.id}/children/${child.id}/plugin-tab`,
    );

    await expect(page.locator("[data-cy=plugin-organization-tab]")).toHaveText(
      `${child.id}|${parent.id}`,
    );
  });

  test("shows not found for an unknown organization tab", async ({
    page,
    request,
  }) => {
    const [organization] = await listOrganizations(
      request,
      "org_type=govt&limit=1",
    );

    await page.goto(`/organization/${organization.id}/unknown-tab`);

    await expect(page.getByText("Page Not Found")).toBeVisible();
  });
});
