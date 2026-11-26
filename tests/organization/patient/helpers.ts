import { expect, type Page } from "@playwright/test";

/**
 * Get the patient name from the first encounter card on All Encounters.
 * The list defaults to today's visits, so widen the dates first: fixture
 * encounters may be older, and the empty state has a heading of its own.
 */
export async function getPatientNameFromCard(page: Page): Promise<string> {
  await page.waitForURL(/created_date_after=/);
  const url = new URL(page.url());
  url.searchParams.set("created_date_after", "2000-01-01");
  await page.goto(url.toString());
  const name = await page
    .getByRole("article")
    .first()
    .getByRole("heading", { level: 3 })
    .innerText();
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

  // The sidebar may already be expanded; only expand it when collapsed.
  const sidebarToggle = page.getByRole("button", {
    name: "Toggle Sidebar",
    exact: true,
  });
  await expect(sidebarToggle).toBeVisible();
  if ((await sidebarToggle.getAttribute("aria-expanded")) !== "true") {
    await sidebarToggle.click();
  }
  await page
    .getByRole("button", { name: "Encounter Types", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "All Encounters" }).click();
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
  await page.getByRole("tab", { name: "Patients" }).click();
  await page.waitForURL(/\/organization\/([^/]+)\/patients/);

  await page
    .getByRole("textbox", { name: "Search by patient name" })
    .fill(patientName);
  const patientLink = page
    .getByRole("link", { name: `Open ${patientName}`, exact: true })
    .first();

  await patientLink.click();
  await page.waitForURL(/\/patient\/([^/]+)/);
}
