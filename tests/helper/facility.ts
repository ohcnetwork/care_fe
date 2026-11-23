import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";

/** Facility types offered by the Add Facility form. */
export const FACILITY_TYPES = [
  "Primary Health Centres",
  "Family Health Centres",
  "Community Health Centres",
  "Women and Child Health Centres",
  "Taluk Hospitals",
  "District Hospitals",
  "Govt Medical College Hospitals",
  "Govt Labs",
  "Private Labs",
  "TeleMedicine",
  "Private Hospital",
  "Autonomous healthcare facility",
  "Shifting Centre",
  "Request Approving Center",
  "Request Fulfilment Center",
  "Other",
  "Clinical Non Governmental Organization",
  "Non Clinical Non Governmental Organization",
  "Community Based Organization",
];

/** Features offered by the Add Facility form's Features picker. */
export const FACILITY_FEATURES = [
  "CT Scan",
  "Maternity Care",
  "Operation Theater",
  "Neonatal Care",
  "X-Ray",
];

/** City names used in generated facility names and location searches. */
export const FACILITY_CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Kochi",
];

/** Opens the first Government organization from the home page's Governance tab and returns its id. */
export async function openGovernmentOrganization(
  page: Page,
): Promise<{ organizationId: string }> {
  await page.goto("/");
  await page.getByRole("tab", { name: "Governance" }).click();
  await page
    .getByRole("link", { name: /Government$/ })
    .first()
    .click();
  await page.waitForURL(/\/organization\/[^/?]+/);
  return { organizationId: new URL(page.url()).pathname.split("/")[2] };
}

/** Opens a tab ("Users", "Facilities", "Patients", …) of the first Government organization. */
export async function openGovernmentOrganizationTab(
  page: Page,
  tab: string,
): Promise<{ organizationId: string }> {
  const { organizationId } = await openGovernmentOrganization(page);
  await page.getByRole("tab", { name: tab }).click();
  return { organizationId };
}

/**
 * Answer the location picker's OpenStreetMap search with one result for the
 * query, so the tests don't depend on the public Nominatim service (which can
 * be slow or rate limited on CI). Any other Nominatim request is aborted, so a
 * change to the picker's search URL fails the tests instead of falling back
 * to the live service.
 */
export async function mockFacilityLocationSearch(page: Page): Promise<void> {
  await page.route("https://nominatim.openstreetmap.org/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname !== "/search") return route.abort();
    const query = url.searchParams.get("q") ?? "";
    const place = query.charAt(0).toUpperCase() + query.slice(1);
    return route.fulfill({
      json: [
        { display_name: `${place}, Kerala, India`, lat: "9.98", lon: "76.28" },
      ],
    });
  });
}

export interface CreateFacilityInput {
  /** One of {@link FACILITY_TYPES}; random when omitted. */
  facilityType?: string;
  name?: string;
  description?: string;
  /** Options of the Features picker ({@link FACILITY_FEATURES}). */
  features?: string[];
  /** Ten digits as the form shows them, e.g. "98765 43210". */
  phoneNumber?: string;
  pinCode?: string;
  address?: string;
  /**
   * Search the location picker and pick this option. Call
   * {@link mockFacilityLocationSearch} first to answer the search offline.
   */
  location?: { search: string; option: string };
}

export interface CreatedFacility {
  facilityId: string;
  name: string;
  facilityType: string;
  phoneNumber: string;
  pinCode: string;
  address: string;
}

/**
 * Creates a facility from the Facilities tab of a governance organization
 * (see {@link openGovernmentOrganizationTab}). Mandatory fields are generated
 * when omitted; the district is the first one under the organization's state.
 */
export async function createFacilityViaUi(
  page: Page,
  input: CreateFacilityInput = {},
): Promise<CreatedFacility> {
  const facilityType =
    input.facilityType ?? faker.helpers.arrayElement(FACILITY_TYPES);
  const name =
    input.name ??
    `${faker.company.name()} ${faker.helpers.arrayElement(FACILITY_CITIES)}`;
  const phoneNumber =
    input.phoneNumber ??
    `987${faker.string.numeric(7)}`.replace(/(\d{5})(\d{5})/, "$1 $2");
  const pinCode = input.pinCode ?? `67${faker.string.numeric(4)}`;
  const address = input.address ?? faker.location.streetAddress();

  return await test.step(
    "facility.create",
    async () => {
      await page.getByRole("button", { name: "Add Facility" }).click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Facility Type" })
        .click();
      await page.getByPlaceholder("Search facility type").fill(facilityType);
      await page
        .getByRole("option", { name: facilityType, exact: true })
        .click();
      await page.getByRole("textbox", { name: "Facility Name *" }).fill(name);
      if (input.description) {
        await page
          .getByRole("textbox", { name: "Description" })
          .fill(input.description);
      }
      if (input.features?.length) {
        await page.getByRole("combobox", { name: "Features" }).click();
        for (const feature of input.features) {
          await page
            .getByRole("option", { name: feature, exact: true })
            .click();
        }
        // Click the Done button to confirm selection
        await page.getByRole("button", { name: "Done" }).click();
      }

      await page
        .getByRole("textbox", { name: "Phone Number *" })
        .fill(phoneNumber);
      await page.getByRole("spinbutton", { name: "PIN Code *" }).fill(pinCode);

      // The form starts in the state the facilities list belongs to, so the
      // first empty level of the government organization picker is the
      // district. Its option list drops down over the fields below it: wait
      // for it to close before opening the location picker.
      await page.getByRole("combobox").filter({ hasText: "Select..." }).click();
      const districtList = page.getByRole("listbox");
      await districtList.getByRole("option").first().click();
      await expect(districtList).toBeHidden();

      await page.getByRole("textbox", { name: "Address *" }).fill(address);
      if (input.location) {
        const locationPicker = page
          .getByRole("combobox")
          .filter({ hasText: "Search for a location" });
        await locationPicker.click();
        await expect(locationPicker).toHaveAttribute("aria-expanded", "true");
        await page
          .getByPlaceholder("Search option...")
          .fill(input.location.search);
        const locationOption = page.getByRole("option", {
          name: input.location.option,
        });
        await locationOption.waitFor({ state: "visible" });
        await locationOption.click();
      }

      const createResponse = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname === "/api/v1/facility/",
      );
      await page.getByRole("button", { name: "Create Facility" }).click();

      // Verify facility was created successfully
      await expect(
        page.getByText("Facility created successfully"),
      ).toBeVisible();
      const { id } = (await (await createResponse).json()) as { id: string };

      return {
        facilityId: id,
        name,
        facilityType,
        phoneNumber,
        pinCode,
        address,
      };
    },
    { box: true },
  );
}

/** Searches an organization's Facilities tab for `name` and opens that facility's details page. */
export async function openFacilityFromOrganizationList(
  page: Page,
  { name }: { name: string },
): Promise<void> {
  await page
    .getByRole("textbox", { name: "Search by facility name" })
    .fill(name);
  await page.getByRole("link", { name: "View Facility" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

/** Opens an item ("Edit Facility Details", "Delete Facility") of the facility details page's Configurations menu. */
export async function openFacilityConfigurationsItem(
  page: Page,
  item: string,
): Promise<void> {
  await page
    .getByRole("button", { name: "Configurations", exact: true })
    .click();
  await page.getByRole("menuitem", { name: item, exact: true }).click();
}

export interface UpdateFacilityInput {
  description?: string;
  /** Ten digits as the form shows them, e.g. "98765 43210". */
  phoneNumber?: string;
  pinCode?: string;
  address?: string;
  /** Search the location picker and pick its first result. */
  locationSearch?: string;
}

/** Edits the open facility's details (Configurations > Edit Facility Details) and saves them. */
export async function updateFacilityViaUi(
  page: Page,
  input: UpdateFacilityInput,
): Promise<void> {
  await test.step(
    "facility.edit",
    async () => {
      await openFacilityConfigurationsItem(page, "Edit Facility Details");

      const editDialog = page.getByRole("dialog", { name: "Edit Facility" });
      await expect(editDialog).toBeVisible();

      if (input.description !== undefined) {
        await editDialog
          .getByRole("textbox", { name: "Description" })
          .fill(input.description);
      }
      if (input.phoneNumber !== undefined) {
        await editDialog
          .getByRole("textbox", { name: "Phone Number" })
          .fill(input.phoneNumber);
      }
      if (input.pinCode !== undefined) {
        await editDialog
          .getByRole("spinbutton", { name: "PIN Code" })
          .fill(input.pinCode);
      }
      if (input.address !== undefined) {
        await editDialog
          .getByRole("textbox", { name: "Address" })
          .fill(input.address);
      }
      if (input.locationSearch !== undefined) {
        await page
          .getByRole("combobox")
          .filter({ hasText: "Search for a location" })
          .click();
        await page
          .getByPlaceholder("Search option...")
          .fill(input.locationSearch);
        // Select the first location option that appears from the search results
        const locationOption = page.getByRole("option").first();
        await locationOption.waitFor({ state: "visible" });
        await locationOption.click();
      }

      const updateButton = editDialog.getByRole("button", {
        name: "Update Facility",
      });
      await updateButton.scrollIntoViewIfNeeded();
      await updateButton.click();

      await expectToast(page, /Facility updated successfully/i);
      await expect(editDialog).toBeHidden();
    },
    { box: true },
  );
}

/** Deletes the open facility (Configurations > Delete Facility) after typing its confirmation text. */
export async function deleteFacilityViaUi(
  page: Page,
  { name }: { name: string },
): Promise<void> {
  await test.step(
    "facility.delete",
    async () => {
      await openFacilityConfigurationsItem(page, "Delete Facility");

      await page
        .getByRole("textbox", { name: `Delete ${name}` })
        .fill(`Delete ${name}`);
      await page.getByRole("button", { name: "Delete Facility" }).click();

      await expect(
        page.getByText(/Facility deleted successfully|Deleted successfully/i),
      ).toBeVisible();
    },
    { box: true },
  );
}

/** Opens the current page's "Pin/Add to Overview" dialog with its Shift+B shortcut. */
export async function openPinPageDialog(page: Page): Promise<Locator> {
  await expect(
    page.getByRole("button", { name: "Pin page", exact: true }),
  ).toBeAttached();
  await page.keyboard.press("Shift+B");
  const dialog = page.getByRole("dialog", { name: "Pin/Add to Overview" });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Saves an open pin dialog under `title` and waits for the user preference to be stored. */
export async function savePinPageDialog(
  page: Page,
  dialog: Locator,
  { title }: { title: string },
): Promise<void> {
  await dialog.getByRole("textbox", { name: "Title" }).fill(title);
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/users/set_preferences/") && res.ok(),
    ),
    dialog.getByRole("button", { name: "Bookmark Page" }).click(),
  ]);
  await expect(dialog).toBeHidden();
}

/** Pins the current facility page to the overview's Pinned Links under `title`. */
export async function pinCurrentPageViaUi(
  page: Page,
  { title }: { title: string },
): Promise<void> {
  await test.step(
    "facility.pinned-link.create",
    async () => {
      const dialog = await openPinPageDialog(page);
      await savePinPageDialog(page, dialog, { title });
    },
    { box: true },
  );
}

/** Unpins the current (pinned) page with Shift+B and waits for the user preference to be stored. */
export async function unpinCurrentPageViaUi(page: Page): Promise<void> {
  await test.step(
    "facility.pinned-link.delete",
    async () => {
      await expect(
        page.getByRole("button", { name: "Unpin page", exact: true }),
      ).toBeAttached();
      await page.keyboard.press("Shift+B");

      const dialog = page.getByRole("dialog", {
        name: "Unpin/Remove from Overview",
      });
      await expect(dialog).toBeVisible();

      await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes("/api/v1/users/set_preferences/") && res.ok(),
        ),
        dialog.getByRole("button", { name: "Unbookmark Page" }).click(),
      ]);
      await expect(dialog).toBeHidden();
    },
    { box: true },
  );
}

/** Unpins the current page when an earlier attempt (e.g. a CI retry) left it pinned. */
export async function ensureCurrentPageUnpinned(page: Page): Promise<void> {
  const pinTrigger = page.getByRole("button", {
    name: "Pin page",
    exact: true,
  });
  const unpinTrigger = page.getByRole("button", {
    name: "Unpin page",
    exact: true,
  });
  await expect(pinTrigger.or(unpinTrigger)).toBeAttached();

  if ((await unpinTrigger.count()) > 0) {
    await unpinCurrentPageViaUi(page);
  }
  await expect(pinTrigger).toBeAttached();
}
