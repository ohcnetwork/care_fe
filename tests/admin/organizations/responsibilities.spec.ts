import { faker } from "@faker-js/faker";
import { expect, type Page, test } from "@playwright/test";
import { expectToast, selectFromCommand } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

async function gotoResponsibilities(page: Page) {
  await page.goto("/admin/organizations/role", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("textbox", { name: /search responsibilities/i }),
  ).toBeVisible();
}

function searchInput(page: Page) {
  return page.getByRole("textbox", { name: /search responsibilities/i });
}

async function searchResponsibility(page: Page, term: string) {
  const input = searchInput(page);
  await input.fill("");
  await input.fill(term);
}

/** Locates a responsibility row in the directory list by its (unique) name. */
function listRow(page: Page, name: string) {
  return page.getByRole("button").filter({ hasText: name });
}

async function createResponsibility(
  page: Page,
  { name, description }: { name: string; description?: string },
) {
  await page.getByRole("button", { name: /new responsibility/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/create responsibility/i)).toBeVisible();

  await dialog.getByRole("textbox", { name: /title/i }).fill(name);
  if (description) {
    await dialog
      .getByRole("textbox", { name: /description/i })
      .fill(description);
  }
  await dialog.getByRole("button", { name: /^create$/i }).click();

  await expectToast(page, /organization created successfully/i);
  await expect(dialog).not.toBeVisible();
}

/** Searches for, then selects, a responsibility from the directory list. */
async function selectResponsibility(page: Page, name: string) {
  await searchResponsibility(page, name);
  await listRow(page, name).first().click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

/**
 * The detail panel's description paragraph sits right after the heading, but
 * the sidebar list also renders each item's description text, so a plain
 * `getByText` match is ambiguous. Scope to the sibling of the detail heading.
 */
function detailDescription(page: Page, name: string) {
  return page
    .getByRole("heading", { name, exact: true })
    .locator("xpath=following-sibling::p");
}

test.describe("Admin Responsibilities Page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoResponsibilities(page);
  });

  test("should show the responsibilities directory and support search", async ({
    page,
  }) => {
    const name = faker.word.words(3);

    await expect(
      page.getByRole("heading", { name: "Responsibilities", exact: true }),
    ).toBeVisible();

    await createResponsibility(page, { name });

    await searchResponsibility(page, name);
    await expect(listRow(page, name)).toBeVisible();

    await searchResponsibility(page, faker.string.uuid());
    await expect(page.getByText(/no organizations found/i)).toBeVisible();

    await searchResponsibility(page, name);
    await expect(listRow(page, name)).toBeVisible();
  });

  test("should create a new responsibility and view its details", async ({
    page,
  }) => {
    const name = faker.word.words(3);
    const description = faker.lorem.sentence();

    await createResponsibility(page, { name, description });
    await selectResponsibility(page, name);

    await expect(detailDescription(page, name)).toHaveText(description);
  });

  test("should edit an existing responsibility", async ({ page }) => {
    const name = faker.word.words(3);
    const updatedName = `${name} updated`;
    const updatedDescription = faker.lorem.sentence();

    await createResponsibility(page, { name });
    await selectResponsibility(page, name);

    await page.getByRole("button", { name: /^edit$/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/edit responsibility/i)).toBeVisible();

    const titleInput = dialog.getByRole("textbox", { name: /title/i });
    await expect(titleInput).toHaveValue(name);
    await titleInput.fill(updatedName);
    await dialog
      .getByRole("textbox", { name: /description/i })
      .fill(updatedDescription);
    await dialog.getByRole("button", { name: /^update$/i }).click();

    await expectToast(page, /organizations updated successfully/i);
    await expect(dialog).not.toBeVisible();

    await expect(
      page.getByRole("heading", { name: updatedName, exact: true }),
    ).toBeVisible();
    await expect(detailDescription(page, updatedName)).toHaveText(
      updatedDescription,
    );

    await searchResponsibility(page, updatedName);
    await expect(listRow(page, updatedName)).toBeVisible();
  });

  test("should add and remove a managed responsibility connection", async ({
    page,
  }) => {
    const managerName = faker.word.words(3);
    const managedName = faker.word.words(3);

    await createResponsibility(page, { name: managerName });
    await createResponsibility(page, { name: managedName });

    await selectResponsibility(page, managerName);

    const manageSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /what responsibilities can/i }),
    });
    await expect(manageSection).toBeVisible();
    await expect(
      manageSection.getByText(`${managerName} doesn't manage anyone yet`, {
        exact: false,
      }),
    ).toBeVisible();

    const manageCombobox = manageSection.getByRole("combobox");
    await selectFromCommand(page, manageCombobox, {
      search: managedName,
      itemIndex: 0,
    });

    await expectToast(page, /managed responsibility added successfully/i);
    await expect(manageSection.getByText(managedName)).toBeVisible();

    await manageSection.getByRole("button", { name: /remove/i }).click();
    await expectToast(page, /managed responsibility removed successfully/i);
    await expect(manageSection.getByText(managedName)).not.toBeVisible();
  });
});
