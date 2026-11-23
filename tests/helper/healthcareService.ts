import {
  expect,
  request as playwrightRequest,
  test,
  type Page,
} from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";

/**
 * Steps and helpers for the facility services area: healthcare services, the
 * locations they open (pharmacy, labs, inventory) and their list requests.
 */

/** Creates a healthcare service from facility settings (internal type and location: Pharmacy). */
export async function createHealthcareServiceViaUi(
  page: Page,
  {
    facilityId,
    name,
    internalType = "Pharmacy",
    locationName = "Pharmacy",
  }: {
    facilityId: string;
    name: string;
    internalType?: string;
    locationName?: string;
  },
): Promise<{ name: string; serviceId: string }> {
  return await test.step(
    "service.create",
    async () => {
      await page.goto(`/facility/${facilityId}/settings/healthcare_services`);
      await page
        .getByRole("button", { name: "Add Healthcare Service" })
        .click();
      await page.getByRole("textbox", { name: "Name" }).fill(name);
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Internal Type" })
        .click();
      await page.getByRole("option", { name: internalType }).click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select locations" })
        .click();
      await page.getByPlaceholder("Search locations...").fill(locationName);
      await page
        .getByRole("dialog")
        .getByRole("button")
        .filter({ hasText: /^$/ })
        .click();
      const [created] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname.endsWith(
              `/facility/${facilityId}/healthcare_service/`,
            ),
        ),
        page.getByRole("button", { name: "Create" }).click(),
      ]);
      expect(created.ok(), await created.text()).toBe(true);
      const { id: serviceId } = (await created.json()) as { id: string };
      await expect(page.getByText(name)).toBeVisible();
      return { name, serviceId };
    },
    { box: true },
  );
}

/** Creates a healthcare service with no locations through the API. */
export async function createHealthcareServiceViaApi({
  facilityId,
  name,
}: {
  facilityId: string;
  name: string;
}): Promise<{ name: string; serviceId: string }> {
  const request = await playwrightRequest.newContext();
  try {
    const response = await request.post(
      `${getApiUrl()}/api/v1/facility/${facilityId}/healthcare_service/`,
      {
        headers: getApiHeaders(),
        data: {
          name,
          extra_details: "",
          styling_metadata: {},
          locations: [],
          managing_organization: null,
        },
      },
    );
    expect(response.ok(), await response.text()).toBeTruthy();
    const { id: serviceId } = (await response.json()) as { id: string };
    return { name, serviceId };
  } finally {
    await request.dispose();
  }
}

/** Expands (`true`) or collapses (`false`) the app sidebar. */
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
