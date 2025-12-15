import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { expectedSlug } from "tests/helper/utils";
import {
  LOINC_CODE_NAME,
  SNOMED_CODE_NAME,
  STATUS_OPTIONS,
  SYSTEM_OPTIONS,
  UCUM_CODE_NAME,
  VALID_LOINC_CODES,
  VALID_SNOMED_CODES,
  VALID_UCUM_CODES,
} from "./valuesetConstants";

test.use({ storageState: "tests/.auth/user.json" });

let name: string;
let slug: string;
let status: string;
let description: string;
let code: string;
let system: string;
let codeName: string;

async function createBasicValueSet(page: Page) {
  await page.getByRole("link", { name: "Create ValueSet" }).click();
  await page.getByRole("textbox", { name: "Name *" }).fill(name);
  await page.getByRole("textbox", { name: "Slug *" }).fill(slug);
  await page.getByRole("button", { name: "Save ValueSet" }).click();
}

test.describe("ValueSet Edit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/valuesets");
    name = faker.company.name();
    slug = expectedSlug(name);
    description = faker.lorem.sentence();
    status = faker.helpers.arrayElement(STATUS_OPTIONS);
    system = faker.helpers.arrayElement(SYSTEM_OPTIONS);
    switch (system) {
      case "SNOMED":
        code = faker.helpers.arrayElement(VALID_SNOMED_CODES);
        codeName = SNOMED_CODE_NAME[code];
        break;
      case "LOINC":
        code = faker.helpers.arrayElement(VALID_LOINC_CODES);
        codeName = LOINC_CODE_NAME[code];
        break;
      case "UCUM":
        code = faker.helpers.arrayElement(VALID_UCUM_CODES);
        codeName = UCUM_CODE_NAME[code];
        break;
    }
    await createBasicValueSet(page);
  });

  test("should edit all fields in valueset and verify changes", async ({
    page,
  }) => {
    await page.getByRole("textbox", { name: "Search ValueSets" }).fill(name);
    await page.getByRole("button", { name: /edit/i }).first().click();
    await expect(
      page.getByRole("heading", { name: /edit valueset/i }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Name *" }).fill(`${name}-edited`);
    const editedSlug = expectedSlug(`${name}-edited`);
    await page.getByRole("textbox", { name: "Slug *" }).fill(editedSlug);
    await page.getByRole("textbox", { name: "Description" }).fill(description);
    await page.getByRole("combobox", { name: "Status *" }).click();
    await page.getByRole("option", { name: status }).click();
    await page.getByRole("button", { name: "Add Rule" }).first().click();
    await page.getByRole("combobox", { name: "System" }).click();
    await page.getByRole("option", { name: system }).click();
    await page.getByRole("button", { name: "Add Concept" }).click();
    await page.getByRole("textbox", { name: "Code" }).fill(code);
    await page.getByLabel("Verify code").click();

    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: "Code verified successfully" }),
    ).toBeVisible();

    // Verify the code name is present in the display value
    const displayValue = await page
      .getByRole("textbox", { name: "Unverified" })
      .inputValue();
    expect(displayValue).toContain(codeName);

    await page.getByRole("button", { name: "Save ValueSet" }).click();

    await expect(page.getByText("ValueSet updated successfully")).toBeVisible();

    await page.getByRole("tab", { name: status }).click();

    await page
      .getByRole("textbox", { name: "Search ValueSets" })
      .fill(`${name}-edited`);

    await expect(
      page.getByRole("cell", { name: `${name}-edited` }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: description })).toBeVisible();
    await expect(page.getByRole("cell", { name: status })).toBeVisible();
  });
});
