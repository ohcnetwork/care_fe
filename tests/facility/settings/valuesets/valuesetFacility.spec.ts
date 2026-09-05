import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { expectedSlug } from "tests/helper/utils";
import { deleteFacilityValueSetsBySlug } from "tests/helper/valueSet";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility value sets", () => {
  let facilityId: string;
  let basePath: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    basePath = `/facility/${facilityId}/settings/valuesets`;
    await page.goto(basePath);
  });

  test("create a facility value set and land on its edit page with departments", async ({
    page,
  }) => {
    const name = `Facility VS ${faker.word.words(2)} ${Date.now()}`;
    const description = faker.lorem.sentence();

    await test.step("List shows both sources and a create action", async () => {
      await expect(
        page.getByRole("heading", { name: "ValueSets", level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "This facility" }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Shared catalogue" }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Create ValueSet" }).click();
      await page.waitForURL(/\/settings\/valuesets\/create$/);
    });

    await test.step("Fill the form; a separate value set is selected by default", async () => {
      await page.getByRole("textbox", { name: "Name *" }).fill(name);
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(description);
      await expect(
        page.getByRole("heading", { name: "Starting point", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("radio", { name: "Separate value set", exact: true }),
      ).toBeChecked();
      await expect(
        page.getByRole("radio", {
          name: "Facility customization",
          exact: true,
        }),
      ).toBeDisabled();

      await page.getByRole("button", { name: "Add Rule" }).first().click();
      await page.getByRole("combobox", { name: "System" }).click();
      await page.getByRole("option", { name: "SNOMED" }).click();
      await page.getByRole("button", { name: "Add Concept" }).click();
      await page.getByRole("textbox", { name: "Code" }).fill("386661006");
      await page.getByLabel("Verify code").click();
      await expect(
        page
          .getByRole("listitem")
          .filter({ hasText: "Code verified successfully" }),
      ).toBeVisible();
    });

    await test.step("Save lands on the edit page, where departments are set", async () => {
      await page.getByRole("button", { name: "Save ValueSet" }).click();
      await expectToast(page, /valueset created successfully/i);
      await page.waitForURL(/\/settings\/valuesets\/[0-9a-f-]+\/edit$/);
      await expect(page.getByText("Departments with access")).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Name *" })).toHaveValue(
        name,
      );
      await expect(
        page.getByRole("textbox", { name: "Slug *" }),
      ).toBeDisabled();
    });

    await test.step("It is listed under This facility", async () => {
      await page.goto(basePath);
      await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
      const row = page.getByRole("row").filter({
        has: page.getByText(name, { exact: true }),
      });
      await expect(row).toHaveCount(1);
      await expect(row.getByText(name, { exact: true })).toBeVisible();
      await expect(row.getByText(description, { exact: true })).toBeVisible();
    });
  });

  test("customize an instance value set into a facility override", async ({
    page,
  }) => {
    const parentSlug = "system-nutrients";
    const parentName = "Nutrients";
    const name = `${parentName} for facility ${Date.now()}`;
    await deleteFacilityValueSetsBySlug(facilityId, parentSlug);

    try {
      await test.step("Shared catalogue offers Preview and Customize per row", async () => {
        await page.getByRole("tab", { name: "Shared catalogue" }).click();
        await page
          .getByRole("textbox", { name: "Search ValueSets" })
          .fill(parentName);
        const row = page.getByRole("row").filter({
          has: page.getByText(parentName, { exact: true }),
        });
        await expect(row).toHaveCount(1);
        await expect(
          row.getByRole("button", { name: "Preview" }),
        ).toBeVisible();
        await row.getByRole("button", { name: "Customize" }).click();
        await page.waitForURL(
          /\/settings\/valuesets\/create\?parent=[0-9a-f-]+$/,
        );
      });

      await test.step("The create form is seeded as an override of the parent", async () => {
        await expect(
          page.getByRole("radio", {
            name: "Facility customization",
            exact: true,
          }),
        ).toBeChecked();
        const slug = page.getByRole("textbox", { name: "Slug *" });
        await expect(slug).toBeDisabled();
        await expect(slug).toHaveValue(parentSlug);
        await expect(
          page.getByRole("combobox").filter({ hasText: parentName }),
        ).toBeVisible();
      });

      await test.step("Switching modes preserves a manually authored separate slug", async () => {
        const slug = page.getByRole("textbox", { name: "Slug *" });
        const separate = page.getByRole("radio", {
          name: "Separate value set",
          exact: true,
        });
        const customization = page.getByRole("radio", {
          name: "Facility customization",
          exact: true,
        });
        const separateSlug = `local-${Date.now()}`;

        await separate.click();
        await expect(separate).toBeChecked();
        await expect(slug).toBeEnabled();
        await page.getByRole("textbox", { name: "Name *" }).fill(name);
        await expect(slug).toHaveValue(expectedSlug(name));
        await slug.fill(separateSlug);

        await customization.click();
        await expect(customization).toBeChecked();
        await expect(slug).toBeDisabled();
        await expect(slug).toHaveValue(parentSlug);

        await separate.click();
        await expect(slug).toBeEnabled();
        await expect(slug).toHaveValue(separateSlug);

        await customization.click();
        await expect(slug).toBeDisabled();
        await expect(slug).toHaveValue(parentSlug);
      });

      await test.step("Naming it does not touch the inherited slug; save", async () => {
        await page.getByRole("textbox", { name: "Name *" }).fill(name);
        await expect(page.getByRole("textbox", { name: "Slug *" })).toHaveValue(
          parentSlug,
        );
        await page.getByRole("button", { name: "Save ValueSet" }).click();
        await expectToast(page, /valueset created successfully/i);
        await page.waitForURL(/\/settings\/valuesets\/[0-9a-f-]+\/edit$/);
        await expect(
          page.getByRole("textbox", { name: "Slug *" }),
        ).toBeDisabled();
        await expect(page.getByRole("textbox", { name: "Slug *" })).toHaveValue(
          parentSlug,
        );
      });

      await test.step("The override is listed for this facility under the parent's slug", async () => {
        await page.goto(basePath);
        await page
          .getByRole("textbox", { name: "Search ValueSets" })
          .fill(name);
        const row = page.getByRole("row").filter({
          has: page.getByText(name, { exact: true }),
        });
        await expect(row).toHaveCount(1);
        await expect(row.getByText(parentSlug, { exact: true })).toBeVisible();
      });
    } finally {
      await deleteFacilityValueSetsBySlug(facilityId, parentSlug);
    }
  });
});

const RETIRED_SHARED_VALUE_SET = {
  id: "fb6dc55c-f5d0-47ae-b180-1d06a32dcbbf",
  slug: "retired-shared-options",
  name: "Retired shared options",
  description: "A retired identifier still participates in slug resolution.",
  status: "retired",
  is_system_defined: false,
  compose: { include: [], exclude: [] },
  created_by: null,
  updated_by: null,
};

/** Mock reads and abort every value-set mutation, even if a guard regresses. */
async function mockSharedCatalogue(
  page: Page,
  shouldFail: () => boolean = () => false,
) {
  const mutations: string[] = [];
  const catalogueQueries: URL[] = [];

  await page.route(
    (url) => url.pathname.startsWith("/api/v1/valueset/"),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== "GET") {
        mutations.push(`${request.method()} ${url.pathname}`);
        await route.abort();
        return;
      }
      if (url.pathname !== "/api/v1/valueset/") {
        await route.fallback();
        return;
      }

      const isShared = url.searchParams.get("auth_context") === "instance";
      const isCatalogue = isShared && !url.searchParams.has("status");
      if (isCatalogue) {
        catalogueQueries.push(url);
        if (shouldFail()) {
          await route.fulfill({
            status: 503,
            json: { detail: "Shared catalogue unavailable" },
          });
          return;
        }
      }

      // The active parent picker cannot see this retired set. Only the
      // all-status identifier check can discover the collision.
      const results = isCatalogue ? [RETIRED_SHARED_VALUE_SET] : [];
      await route.fulfill({ json: { count: results.length, results } });
    },
  );

  return { mutations, catalogueQueries };
}

test.describe("Facility value-set slug safeguards (mocked, no writes)", () => {
  test("a separate value set cannot use a retired shared identifier", async ({
    page,
  }) => {
    const { mutations, catalogueQueries } = await mockSharedCatalogue(page);
    await page.goto(`/facility/${getFacilityId()}/settings/valuesets/create`);

    await expect(
      page.getByRole("radio", { name: "Separate value set", exact: true }),
    ).toBeChecked();
    await expect(
      page.getByRole("radio", {
        name: "Facility customization",
        exact: true,
      }),
    ).toBeDisabled();
    await page.getByRole("textbox", { name: "Name *" }).fill("Local options");
    const slug = page.getByRole("textbox", { name: "Slug *" });
    await slug.fill(RETIRED_SHARED_VALUE_SET.slug);
    const conflict =
      "This slug belongs to a shared value set. Choose a different slug, or select that value set as the parent and use Facility customization.";
    await expect(slug).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(conflict, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Save ValueSet" }).click();
    await expect(
      page.getByText("Review these fields before saving", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/valuesets\/create$/);
    expect(catalogueQueries.length).toBeGreaterThan(0);
    expect(mutations).toHaveLength(0);
  });

  test("a failed shared catalogue check blocks saving until retry succeeds", async ({
    page,
  }) => {
    let failCatalogue = true;
    const { mutations, catalogueQueries } = await mockSharedCatalogue(
      page,
      () => failCatalogue,
    );
    await page.goto(`/facility/${getFacilityId()}/settings/valuesets/create`);
    await page.getByRole("textbox", { name: "Name *" }).fill("Local options");
    const save = page.getByRole("button", { name: "Save ValueSet" });
    const failure = page.getByRole("alert").filter({
      hasText:
        "Could not check this slug. Retry before saving a separate value set.",
    });
    await expect(failure).toBeVisible();
    await expect(save).toBeDisabled();

    failCatalogue = false;
    await page.getByRole("button", { name: "Try Again", exact: true }).click();
    await expect(failure).not.toBeVisible();
    await expect(save).toBeEnabled();
    await expect(page.getByRole("textbox", { name: "Slug *" })).toHaveValue(
      "local-options",
    );
    expect(catalogueQueries.length).toBeGreaterThanOrEqual(2);
    expect(mutations).toHaveLength(0);
  });
});
