import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const MIN_SLUG_LENGTH = 5;
const INT_MAX = 100; // Arbitrary upper limit for integer fields
const STATUS_OPTIONS = ["Draft", "Active"];
const typeCollectedOptions = [
  "Abscess",
  "Air Sample",
  "Amputation",
  "Allograft",
  "Amniotic Fluid",
];

const collectionOptions = [
  "Finger stick",
  "Timed urine collection",
  "Biopsy - action",
  "Excision - action",
  "Puncture - action",
];

const preparationOptions = [
  "Full strength dose",
  "Fractionated dose",
  "Day before procedure",
  "Fetal prelabour period",
  "Same day but before procedure",
];

const preferenceOptions = ["Preferred", "Alternate"];

const capOptions = [
  "black cap",
  "brown cap",
  "lavender cap",
  "grey cap",
  "red cap",
];

test.describe("Specimen Definitions Edit", () => {
  let facilityId: string;

  // Faker data - generated fresh for each test
  let definitionTitle: string;
  let definitionDescription: string;
  let definitionSlug: string;
  let status: string;
  let typeCollected: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    definitionTitle = faker.company.name();
    definitionDescription = faker.lorem.sentence();
    const randomHex = faker.string
      .hexadecimal({ length: MIN_SLUG_LENGTH, prefix: "" })
      .toLowerCase();
    definitionSlug = `${faker.science.chemicalElement().symbol.toLowerCase()}-${randomHex}`;
    status = faker.helpers.arrayElement(STATUS_OPTIONS);
    typeCollected = faker.helpers.arrayElement(typeCollectedOptions);

    const targetUrl = `/facility/${facilityId}/settings/specimen_definitions`;
    await page.goto(targetUrl);
  });

  test("should be able to edit specimen definition and verify changes in list", async ({
    page,
  }) => {
    // Select a random existing specimen definition to edit
    const allRows = page.locator('[data-slot="table-body"] tr');
    await allRows.first().waitFor({ state: "visible" }); // Wait for the table to load

    const rowCount = await allRows.count();
    const rowIndex = faker.number.int({ min: 0, max: rowCount - 1 });
    const row = allRows.nth(rowIndex);
    await row.getByRole("link", { name: /edit/i }).click();

    await page.getByRole("textbox", { name: "Title *" }).fill(definitionTitle);
    await page.getByRole("textbox", { name: "Slug *" }).fill(definitionSlug);
    await page
      .getByRole("textbox", { name: "Description *" })
      .fill(definitionDescription);
    await page.getByRole("combobox", { name: "Status *" }).click();
    await page.getByRole("option", { name: status }).click();

    await page.getByRole("combobox", { name: "Type Collected *" }).click();
    await page.getByRole("option", { name: typeCollected }).click();

    const derivedFromURI = faker.internet.url();
    await page
      .getByRole("textbox", { name: "Derived From URI" })
      .fill(derivedFromURI);

    const collectionOption = faker.helpers.arrayElement(collectionOptions);
    await page.getByRole("combobox", { name: "Collection" }).click();
    await page.getByRole("option", { name: collectionOption }).click();

    const preparationOption = faker.helpers.arrayElement(preparationOptions);
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("combobox", { name: "Patient Preparation" }).click();
    await page.getByRole("option", { name: preparationOption }).click();

    await page.getByRole("combobox", { name: "Preference" }).click();
    const preferenceOption = faker.helpers.arrayElement(preferenceOptions);
    await page.getByRole("option", { name: preferenceOption }).click();

    const retentionTime = faker.number.int(INT_MAX);
    await page
      .getByRole("textbox", { name: "Enter Retention Time" })
      .fill(retentionTime.toString());

    const requirement = faker.lorem.sentence();
    await page.getByRole("textbox", { name: "Requirement" }).fill(requirement);

    const containerDescription = faker.lorem.sentence();
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill(containerDescription);

    const capOption = faker.helpers.arrayElement(capOptions);
    await page.getByRole("combobox", { name: "Cap" }).click();
    await page.getByRole("option", { name: capOption }).click();

    const capacity = faker.number.int(INT_MAX);
    await page
      .getByRole("textbox", { name: "Enter Capacity" })
      .fill(capacity.toString());

    const minimumVolume = faker.number.int(INT_MAX);
    await page
      .getByRole("textbox", { name: "Enter Minimum Volume" })
      .fill(minimumVolume.toString());

    const preparationDescription = faker.lorem.sentence();
    await page
      .getByRole("textbox", { name: "Preparation" })
      .fill(preparationDescription);

    // Submit form
    await page.getByRole("button", { name: /save/i }).click();

    // Verify success notification
    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem"),
    ).toContainText(/updated/i);

    // Verify all fields on detail page
    await expect(
      page.getByRole("heading", { name: definitionTitle }),
    ).toBeVisible();
    await expect(page.getByText(definitionDescription)).toBeVisible();
    await expect(page.getByText(status)).toBeVisible();
    await expect(page.getByText(derivedFromURI)).toBeVisible();
    await expect(page.getByText(typeCollected)).toBeVisible();
    await expect(page.getByText(collectionOption)).toBeVisible();
    await expect(page.getByText(preparationOption)).toBeVisible();
    await expect(page.getByText(requirement)).toBeVisible();
    await expect(
      page.getByText(new RegExp(`${retentionTime}\\s+(hours|days)`)),
    ).toBeVisible();
    await expect(page.getByText(containerDescription)).toBeVisible();
    await expect(page.getByText(preparationDescription)).toBeVisible();
    await expect(
      page.getByText(
        new RegExp(`${capacity}\\s+(milligram|gram|milliliter|drop|microgram)`),
      ),
    ).toBeVisible();
    await expect(page.getByText(capOption)).toBeVisible();
    await expect(page.getByText(minimumVolume.toString())).toBeVisible();
  });
});
