import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  ValueSetBase,
  ValueSetCreate,
  ValueSetRead,
  ValueSetStatus,
  ValueSetUpdate,
} from "../../../src/types/valueSet/valueSet";

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1440, height: 1000 },
});

test.beforeEach(async ({ page }) => {
  // Keep this API-contract regression independent of backend fixtures.
  await page.addInitScript(() => {
    localStorage.setItem("care_access_token", "valueset-composition-test");
  });
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (
        request.method() === "GET" &&
        pathname === "/api/v1/users/getcurrentuser/"
      ) {
        await route.fulfill({
          json: {
            id: "72ef5cda-7661-496e-a4e1-1837ead7ea9a",
            username: "composition-admin",
            first_name: "Composition",
            last_name: "Admin",
            user_type: "administrator",
            is_superuser: true,
            permissions: [],
            facilities: [],
            organizations: [],
            preferences: {},
            flags: [],
          },
        });
      } else if (
        request.method() === "GET" &&
        pathname === "/api/v1/plug_config/"
      ) {
        await route.fulfill({ json: { configs: [] } });
      } else {
        await route.abort();
      }
    },
  );
});

test("new value sets send the required composition default", async ({
  page,
}) => {
  const creates: ValueSetCreate[] = [];
  const name = `Composition ${faker.word.words(2)}`;
  await page.route(
    (url) => url.pathname.startsWith("/api/v1/valueset/"),
    async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (request.method() === "POST" && pathname === "/api/v1/valueset/") {
        const payload = request.postDataJSON() as ValueSetCreate;
        creates.push(payload);
        await route.fulfill({
          json: {
            ...payload,
            id: faker.string.uuid(),
            created_by: null,
            updated_by: null,
          },
        });
      } else if (
        request.method() === "GET" &&
        pathname === "/api/v1/valueset/"
      ) {
        await route.fulfill({ json: { count: 0, results: [] } });
      } else {
        await route.abort();
      }
    },
  );

  await test.step("Create a value set without a parent or terminology rules", async () => {
    await page.goto("/admin/valuesets/create");
    await page.getByRole("textbox", { name: "Name *" }).fill(name);
    await page
      .getByRole("button", { name: "Save ValueSet", exact: true })
      .click();
    await page.waitForURL("**/admin/valuesets");
    expect(creates).toHaveLength(1);
    expect(creates[0]).toMatchObject({
      name,
      disable_composition: false,
      inherited: false,
      compose: { include: [], exclude: [] },
    });
  });
});

for (const disableComposition of [false, true]) {
  test(`admins can ${disableComposition ? "enable" : "disable"} parent rules in preview and save`, async ({
    page,
  }) => {
    let savedValueSet: ValueSetRead = {
      id: faker.string.uuid(),
      name: `Composition ${faker.word.words(2)}`,
      slug: `composition-${faker.string.alphanumeric(8).toLowerCase()}`,
      description: "",
      status: ValueSetStatus.ACTIVE,
      is_system_defined: false,
      disable_composition: disableComposition,
      compose: {
        include: [
          {
            system: "http://snomed.info/sct",
            version: null,
            filter: [{ property: "concept", op: "is-a", value: "419492006" }],
          },
        ],
        exclude: [],
      },
      created_by: null,
      updated_by: null,
    };
    const detailPath = `/api/v1/valueset/${savedValueSet.id}/`;
    const previewPath = "/api/v1/valueset/preview_search/";
    const updates: ValueSetUpdate[] = [];
    const previews: ValueSetBase[] = [];
    let releaseChangedPreview = () => {};
    const changedPreviewReady = new Promise<void>((resolve) => {
      releaseChangedPreview = resolve;
    });
    const previewDisplay = (disabled: boolean) =>
      disabled ? "Local test concept" : "Inherited test concept";

    // All value-set requests stay local to this test, including writes.
    await page.route(
      (url) => url.pathname.startsWith("/api/v1/valueset/"),
      async (route) => {
        const request = route.request();
        const pathname = new URL(request.url()).pathname;
        if (request.method() === "POST" && pathname === previewPath) {
          const payload = request.postDataJSON() as ValueSetBase;
          previews.push(payload);
          if (previews.length > 1) {
            await changedPreviewReady;
          }
          await route.fulfill({
            json: {
              results: [
                {
                  system: "http://snomed.info/sct",
                  code: "419492006",
                  display: previewDisplay(payload.disable_composition),
                },
              ],
            },
          });
        } else if (request.method() === "PUT" && pathname === detailPath) {
          const payload = request.postDataJSON() as ValueSetUpdate;
          updates.push(payload);
          savedValueSet = { ...savedValueSet, ...payload };
          await route.fulfill({ json: savedValueSet });
        } else if (request.method() === "GET" && pathname === detailPath) {
          await route.fulfill({ json: savedValueSet });
        } else if (
          request.method() === "GET" &&
          pathname === "/api/v1/valueset/"
        ) {
          await route.fulfill({
            json: { count: 1, results: [savedValueSet] },
          });
        } else {
          await route.abort();
        }
      },
    );

    await page.goto(`/admin/valuesets/${savedValueSet.id}/edit`);
    const useParentRules = page.getByRole("switch", {
      name: "Use parent rules",
      exact: true,
    });
    const previewButton = page.getByRole("button", {
      name: /^valueset preview$/i,
    });
    const preview = page.getByRole("dialog", {
      name: /^valueset preview$/i,
    });

    await test.step("Editing metadata preserves the saved composition setting", async () => {
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(faker.lorem.sentence());
      await page
        .getByRole("button", { name: "Save ValueSet", exact: true })
        .click();
      await page.waitForURL("**/admin/valuesets");
      expect(updates).toHaveLength(1);
      expect(updates[0]).toMatchObject({
        disable_composition: disableComposition,
      });
      await page.goto(`/admin/valuesets/${savedValueSet.id}/edit`);
    });

    await test.step("The saved composition setting is used by preview", async () => {
      await expect(useParentRules).toBeChecked({
        checked: !disableComposition,
      });
      await expect(
        page.getByRole("button", { name: "Save ValueSet", exact: true }),
      ).toBeDisabled();
      await previewButton.click();
      await expect(
        preview.getByText(previewDisplay(disableComposition), { exact: true }),
      ).toBeVisible();
      expect(previews).toHaveLength(1);
      expect(previews[0]).toMatchObject({
        disable_composition: disableComposition,
      });
      await preview.getByRole("button", { name: "Close", exact: true }).click();
    });

    await test.step("Changing parent rules invalidates the earlier preview", async () => {
      await useParentRules.click();
      await expect(useParentRules).toBeChecked({ checked: disableComposition });
      try {
        const [previewRequest] = await Promise.all([
          page.waitForRequest(
            (request) =>
              request.method() === "POST" &&
              new URL(request.url()).pathname === previewPath,
          ),
          previewButton.click(),
        ]);
        expect(previewRequest.postDataJSON()).toMatchObject({
          disable_composition: !disableComposition,
        });
        // Hold the replacement response so cached results from the old
        // composition cannot conceal a stale-preview regression.
        await expect(
          preview.getByText(previewDisplay(disableComposition), {
            exact: true,
          }),
        ).not.toBeVisible();
      } finally {
        releaseChangedPreview();
      }
      await expect(
        preview.getByText(previewDisplay(!disableComposition), {
          exact: true,
        }),
      ).toBeVisible();
      await preview.getByRole("button", { name: "Close", exact: true }).click();
    });

    await test.step("Save sends the changed boolean without changing the slug", async () => {
      const originalSlug = savedValueSet.slug;
      await page
        .getByRole("button", { name: "Save ValueSet", exact: true })
        .click();
      await page.waitForURL("**/admin/valuesets");
      expect(updates).toHaveLength(2);
      expect(updates[1]).toMatchObject({
        disable_composition: !disableComposition,
        slug: originalSlug,
      });
    });
  });
}
