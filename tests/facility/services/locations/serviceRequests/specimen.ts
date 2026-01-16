import { faker } from "@faker-js/faker";
import { expect, Page } from "@playwright/test";
import { selectFromValueSet } from "tests/helper/ui";

/**
 * Available specimen quantity units for random selection.
 */
export const SPECIMEN_UNITS = [
  "gram",
  "milligram",
  "milliliter",
  "liter",
  "microliter",
] as const;

export interface CollectSpecimenOptions {
  quantityValue: string;
  quantityUnit?: string;
  bodySite?: boolean;
  fastingStatus?: boolean;
  fastingDuration?: string;
  notes?: string;
  useScanMode?: boolean;
  specimenIdentifier?: string;
}

/**
 * Helper function to collect a specimen with configurable options.
 * This can be reused for discard specimen tests and other specimen-related workflows.
 */
export async function collectSpecimen(
  page: Page,
  options: CollectSpecimenOptions,
) {
  const specimensSection = page.locator("div", {
    has: page.getByRole("heading", { name: /specimens/i }),
  });

  // Find the specimen card with "collection pending" status
  const specimenCard = specimensSection
    .locator('[data-slot="card"]')
    .filter({
      has: page.locator('[data-slot="badge"]', {
        hasText: /collection pending/i,
      }),
    })
    .first();
  await expect(specimenCard).toBeVisible();

  await specimenCard.getByRole("button", { name: /collect specimen/i }).click();

  const specimenFormCard = page.locator('[data-slot="card"]', {
    has: page.locator('[data-slot="card-title"]', {
      hasText: /collect specimen:/i,
    }),
  });
  await expect(specimenFormCard).toBeVisible();

  if (!options.useScanMode) {
    await expect(
      specimenFormCard.getByText("QR code generated successfully"),
    ).toBeVisible();
  }

  // If using scan mode, switch to it and enter the identifier
  if (options.useScanMode && options.specimenIdentifier) {
    await specimenFormCard
      .locator('[data-slot="tabs-trigger"]', { hasText: /scan existing/i })
      .click();

    await specimenFormCard
      .getByPlaceholder(/scan or enter specimen identifier/i)
      .fill(options.specimenIdentifier);
  }

  const quantityInput = specimenFormCard.getByRole("spinbutton").first();
  await quantityInput.fill(options.quantityValue);

  // Select quantity unit only if explicitly provided (unit is usually prefilled from specimen definition)
  if (options.quantityUnit) {
    const unitCombobox = specimenFormCard.getByRole("combobox").first();
    await unitCombobox.click();
    await page.getByRole("option", { name: options.quantityUnit }).click();
  }

  if (options.bodySite) {
    const bodySiteTrigger = specimenFormCard
      .locator('button[role="combobox"]')
      .filter({ hasText: /select body site/i });
    await selectFromValueSet(page, bodySiteTrigger, { itemIndex: 0 });
  }

  if (options.fastingStatus) {
    const fastingStatusTrigger = specimenFormCard
      .locator('button[role="combobox"]')
      .filter({ hasText: /select status/i });
    await selectFromValueSet(page, fastingStatusTrigger, { itemIndex: 0 });
  }

  if (options.fastingDuration) {
    const fastingDurationInput = specimenFormCard
      .locator('input[type="number"]')
      .last();
    await fastingDurationInput.fill(options.fastingDuration);
  }

  if (options.notes) {
    await specimenFormCard.locator("textarea").fill(options.notes);
  }

  // Submit the form - button text includes keyboard shortcut badge
  await specimenFormCard.getByRole("button", { name: /collect/i }).click();
}

/**
 * Helper function to open the specimen form for a pending specimen.
 * Useful when you need to interact with the form without submitting.
 */
export async function openSpecimenForm(page: Page) {
  const specimensSection = page.locator("div", {
    has: page.getByRole("heading", { name: /specimens/i }),
  });

  // Find the specimen card with "collection pending" status
  const specimenCard = specimensSection
    .locator('[data-slot="card"]')
    .filter({
      has: page.locator('[data-slot="badge"]', {
        hasText: /collection pending/i,
      }),
    })
    .first();
  await expect(specimenCard).toBeVisible();

  // Click collect specimen button
  await specimenCard.getByRole("button", { name: /collect specimen/i }).click();

  // Wait for the specimen form to appear
  const specimenFormCard = page.locator('[data-slot="card"]', {
    has: page.locator('[data-slot="card-title"]', {
      hasText: /collect specimen:/i,
    }),
  });
  await expect(specimenFormCard).toBeVisible();

  return specimenFormCard;
}

/**
 * Helper to get a random specimen unit.
 */
export function getRandomSpecimenUnit(): string {
  return faker.helpers.arrayElement(SPECIMEN_UNITS);
}

/**
 * Helper to get a random specimen quantity value (1-10).
 */
export function getRandomSpecimenQuantity(): string {
  return faker.number.int({ min: 1, max: 10 }).toString();
}
