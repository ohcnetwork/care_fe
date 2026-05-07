import type { Page } from "@playwright/test";

/**
 * Get the patient name from an encounter info card.
 */
export async function getPatientNameFromCard(page: Page): Promise<string> {
  const target = page.locator("[data-slot='card']").first();
  const name = await target.locator("h3").innerText();
  return name.trim();
}

/**
 * Navigate to an organization's patient page
 * Goes through: Home -> Governance -> Organization -> Patients -> First Patient
 */
export async function navigateToOrganizationPatient(page: Page) {
  await page.goto("/");
  await page
    .getByRole("link", { name: /facility with patients/i })
    .first()
    .click();

  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await page.getByRole("button", { name: "Patients", exact: true }).click();
  await page.getByRole("link", { name: /all encounters/i }).click();
  const patientName = await getPatientNameFromCard(page);

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

  await page
    .getByRole("textbox", { name: "Search by patient name" })
    .fill(patientName);
  const patientLink = page
    .getByRole("link")
    .filter({ has: page.locator("h3").filter({ hasText: patientName }) });

  await patientLink.click();
  await page.waitForURL(/\/patient\/([^/]+)/);
}
