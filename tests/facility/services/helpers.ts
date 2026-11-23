import { expect, Page } from "@playwright/test";

export async function createHealthcareService(
  page: Page,
  facilityId: string,
  serviceName: string,
  servicesUrl: string,
) {
  await page.goto(`/facility/${facilityId}/settings/healthcare_services`);
  await page.getByRole("button", { name: "Add Healthcare Service" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(serviceName);
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select Internal Type" })
    .click();
  await page.getByRole("option", { name: "Pharmacy" }).click();
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select locations" })
    .click();
  await page.getByPlaceholder("Search locations...").fill("Pharmacy");
  await page
    .getByRole("dialog")
    .getByRole("button")
    .filter({ hasText: /^$/ })
    .click();
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(serviceName)).toBeVisible();
  await page.goto(servicesUrl);
}

export async function toggleSidebar(page: Page, expand: boolean) {
  const homeButtonVisible = await page
    .getByRole("button", { name: "Home" })
    .isVisible();
  if ((expand && !homeButtonVisible) || (!expand && homeButtonVisible)) {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  }
}

/**
 * Opens a location from the page of a facility service and returns the
 * location's path (`/facility/<id>/locations/<locationId>`).
 */
export async function openServiceLocation(
  page: Page,
  facilityId: string,
  serviceName: string,
  locationLink: string,
) {
  await openFacilityService(
    page,
    `/facility/${facilityId}/services/`,
    serviceName,
  );
  await page.getByRole("link", { name: locationLink }).click();
  await expect(page).toHaveURL(/\/locations\/[^/]+\/[^/]+/);
  const locationId = new URL(page.url()).pathname.match(
    /\/locations\/([^/]+)\//,
  )![1];
  return `/facility/${facilityId}/locations/${locationId}`;
}

/**
 * Waits for a GET request to an API path (`/order/dispense/`) whose query
 * matches `check`.
 */
export function waitForListRequest(
  page: Page,
  path: string,
  check: (params: URLSearchParams) => boolean = () => true,
) {
  return page.waitForRequest((request) => {
    if (request.method() !== "GET") return false;
    const url = new URL(request.url());
    return (
      url.pathname.startsWith("/api/") &&
      url.pathname.endsWith(path) &&
      check(url.searchParams)
    );
  });
}

/** Records the URLs of the requests to an API path, from now on. */
export function recordRequestUrls(page: Page, path: string) {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith(path))
      urls.push(request.url());
  });
  return urls;
}

/**
 * Opens a facility service from the services list. Services created by other
 * specs can push fixtures off the list's first page, so search by name first.
 */
export async function openFacilityService(
  page: Page,
  servicesUrl: string,
  name: string,
) {
  await page.goto(servicesUrl);
  await page
    .getByRole("textbox", {
      name: "Search healthcare services...",
      exact: true,
    })
    .fill(name);
  await page.getByRole("link", { name }).click();
}
