import type { Page } from "@playwright/test";

/**
 * Navigate to an organization's patient page
 * Goes through: Home -> Governance -> Organization -> Patients -> First Patient
 */
export async function navigateToOrganizationPatient(page: Page) {
  // Navigate to organization
  await page.goto("/");
  await page.getByRole("tab", { name: "Governance" }).click();

  // Click first organization
  const orgLink = page
    .getByRole("link")
    .filter({ hasText: /Government/i })
    .first();
  await orgLink.click();
  await page.waitForURL(/\/organization\/([^/]+)/);

  // Go to Patients section
  await page.getByRole("menuitem", { name: "Patients" }).click();
  await page.waitForURL(/\/organization\/([^/]+)\/patients/);

  // Click first patient
  const patientLink = page
    .getByRole("link")
    .filter({ has: page.locator("h3") })
    .first();
  await patientLink.click();
  await page.waitForURL(/\/patient\/([^/]+)/);
}
