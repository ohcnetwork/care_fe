import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  FACILITY_CITIES,
  FACILITY_FEATURES,
  FACILITY_TYPES,
  createFacilityViaUi,
  deleteFacilityViaUi,
  mockFacilityLocationSearch,
  openFacilityConfigurationsItem,
  openFacilityFromOrganizationList,
  openGovernmentOrganizationTab,
  updateFacilityViaUi,
} from "tests/helper/facility";

test.use({ storageState: "tests/.auth/user.json" });

/** The facility settings header shows the type as a badge on the line under the name heading. */
function facilityTypeLine(page: Page, facilityName: string) {
  return page
    .getByRole("heading", { name: facilityName, exact: true })
    .locator("xpath=following-sibling::div[1]")
    .locator('[data-slot="badge"]');
}

test.describe("Facility Creation", () => {
  let facilityType: string;
  let facilityName: string;
  let facilityFeatures: string[];
  let locationName: string;
  let description: string;
  let phoneNumber: string;
  let pinCode: string;
  let address: string;

  // Helper function to create a facility with mandatory fields only
  async function createFacilityWithMandatoryFields(page: Page) {
    await createFacilityViaUi(page, {
      facilityType,
      name: facilityName,
      phoneNumber,
      pinCode,
      address,
    });
  }

  /** Creates a facility with this test's data and opens its details page.
   *  Tests that edit or read a facility must use their own: the first row of
   *  the shared list is whichever facility a parallel test created last. */
  async function openOwnFacility(page: Page) {
    await createFacilityWithMandatoryFields(page);
    await openFacilityFromOrganizationList(page, { name: facilityName });
  }

  test.beforeEach(async ({ page }) => {
    // Generate unique test data for each test run
    facilityType = faker.helpers.arrayElement(FACILITY_TYPES);
    locationName = faker.helpers.arrayElement(FACILITY_CITIES);
    facilityName = `${faker.company.name()} ${locationName}`;
    facilityFeatures = faker.helpers.arrayElements(FACILITY_FEATURES, 2);
    description = faker.lorem.sentence();
    phoneNumber = `987${faker.string.numeric(7)}`.replace(
      /(\d{5})(\d{5})/,
      "$1 $2",
    );
    pinCode = `67${faker.string.numeric(4)}`;
    address = faker.location.streetAddress();

    await mockFacilityLocationSearch(page);
    await openGovernmentOrganizationTab(page, "Facilities");
  });

  test(
    "Create a new facility with all fields",
    { tag: ["@atomic", "@cap:facility.create"] },
    async ({ page }) => {
      await createFacilityViaUi(page, {
        facilityType,
        name: facilityName,
        description,
        features: facilityFeatures,
        phoneNumber,
        pinCode,
        address,
        location: { search: "ernakulam", option: "Ernakulam, Kerala, India" },
      });

      // Navigate to the created facility (link navigates to /settings/general)
      await openFacilityFromOrganizationList(page, { name: facilityName });

      // Verify facility details
      await expect(facilityTypeLine(page, facilityName)).toHaveText(
        facilityType,
      );
      await expect(page.getByText(address)).toBeVisible();
      await expect(page.getByText(description)).toBeVisible();
      await expect(
        page.getByRole("link", { name: `Call +91 ${phoneNumber}` }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Show on Map" }),
      ).toBeVisible();

      await openFacilityConfigurationsItem(page, "Edit Facility Details");

      // Verify edit form opened
      const editDialog = page.getByRole("dialog", { name: "Edit Facility" });
      await expect(editDialog).toBeVisible();

      // Verify all form fields contain the correct data
      await expect(
        editDialog.getByRole("combobox").filter({ hasText: facilityType }),
      ).toBeVisible();
      await expect(
        editDialog.getByRole("textbox", { name: "Facility Name" }),
      ).toHaveValue(facilityName);
      await expect(
        editDialog.getByRole("textbox", { name: "Description" }),
      ).toHaveText(description);

      // Verify no. of facility features badge is displayed in the form
      await expect(
        editDialog.getByText(`${facilityFeatures.length} features selected`),
      ).toBeVisible();

      // Verify phone number (it's displayed with country code)
      await expect(
        editDialog.getByRole("textbox", { name: "Phone Number" }),
      ).toHaveValue(`+91 ${phoneNumber}`);

      // Verify PIN code
      await expect(
        editDialog.getByRole("spinbutton", { name: "PIN Code" }),
      ).toHaveValue(pinCode);

      // Verify address
      await expect(
        editDialog.getByRole("textbox", { name: "Address" }),
      ).toHaveValue(address);
    },
  );

  test(
    "Create a facility with only mandatory fields",
    { tag: ["@atomic", "@cap:facility.create"] },
    async ({ page }) => {
      await test.step("Create facility with mandatory fields", async () => {
        await openOwnFacility(page);
      });

      // Verify facility details - only mandatory fields should be visible
      await expect(facilityTypeLine(page, facilityName)).toHaveText(
        facilityType,
      );
      await expect(page.getByText(address)).toBeVisible();
      await expect(
        page.getByRole("link", { name: `Call +91 ${phoneNumber}` }),
      ).toBeVisible();

      // Verify "Show on Map" is NOT visible since we didn't provide location
      await expect(
        page.getByRole("link", { name: "Show on Map" }),
      ).toBeHidden();

      // Without a description the details card has no description section.
      await expect(
        page.locator('[data-cy="facility-description"]'),
      ).toHaveCount(0);

      // Open edit form
      await openFacilityConfigurationsItem(page, "Edit Facility Details");

      // Verify edit form opened
      const editDialog = page.getByRole("dialog", { name: "Edit Facility" });
      await expect(editDialog).toBeVisible();

      // Verify mandatory fields contain the correct data
      await expect(
        editDialog.getByRole("combobox").filter({ hasText: facilityType }),
      ).toBeVisible();
      await expect(
        editDialog.getByRole("textbox", { name: "Facility Name" }),
      ).toHaveValue(facilityName);
      await expect(
        editDialog.getByRole("textbox", { name: "Phone Number" }),
      ).toHaveValue(`+91 ${phoneNumber}`);
      await expect(
        editDialog.getByRole("spinbutton", { name: "PIN Code" }),
      ).toHaveValue(pinCode);
      await expect(
        editDialog.getByRole("textbox", { name: "Address" }),
      ).toHaveValue(address);

      // Verify optional fields are empty
      await expect(
        editDialog.getByRole("textbox", { name: "Description" }),
      ).toHaveText("");

      // Verify no facility features are selected
      const featuresButton = editDialog.getByRole("combobox", {
        name: /^(Select Facility Features|Features)$/,
      });
      await expect(featuresButton).toBeVisible();
    },
  );

  test(
    "Validate required fields in facility creation form",
    { tag: ["@atomic", "@cap:facility.create"] },
    async ({ page }) => {
      // Open the add facility form
      await page.getByRole("button", { name: "Add Facility" }).click();

      // Wait for the dialog to be visible
      const dialog = page.getByRole("dialog", { name: "Add New Facility" });
      await expect(dialog).toBeVisible();

      // Click Create Facility button without filling any fields
      await page.getByRole("button", { name: "Create Facility" }).click();

      // Helper function to validate required field errors
      const validateRequiredField = async (
        fieldLabel: string,
        errorMessage: string,
      ) => {
        const formItem = dialog
          .locator('div[data-slot="form-item"]')
          .filter({ hasText: fieldLabel })
          .first();
        await expect(
          formItem.locator('label[data-slot="form-label"]'),
        ).toBeVisible();
        await expect(
          formItem.locator('p[data-slot="form-message"]'),
        ).toContainText(errorMessage);
      };

      // Verify validation error messages are displayed for all required fields
      await validateRequiredField("Facility Type", "Facility type is required");
      await validateRequiredField("Facility Name", "Name is required");
      await validateRequiredField("Phone Number", "This field is required");
      await validateRequiredField("PIN Code", "Required");
      await validateRequiredField("Address", "Address is required");

      // Verify optional fields do NOT show validation errors
      await expect(dialog.getByText("Description").first()).toBeVisible();
      await expect(
        dialog.locator('p[data-slot="form-message"]', {
          hasText: /description/i,
        }),
      ).toBeHidden();

      await expect(dialog.getByText("Features").first()).toBeVisible();
      await expect(
        dialog.locator('p[data-slot="form-message"]', { hasText: /feature/i }),
      ).toBeHidden();
    },
  );

  test(
    "Edit a facility and verify changes",
    { tag: ["@atomic", "@cap:facility.edit"] },
    async ({ page }) => {
      await openOwnFacility(page);
      // Edit with fresh values, so the page can only show them once saved.
      description = faker.lorem.sentence();
      phoneNumber = `986${faker.string.numeric(7)}`.replace(
        /(\d{5})(\d{5})/,
        "$1 $2",
      );
      pinCode = `68${faker.string.numeric(4)}`;
      address = faker.location.streetAddress();

      await updateFacilityViaUi(page, {
        description,
        phoneNumber,
        pinCode,
        address,
      });

      // Verify changes on the facility details page
      await expect(page.getByText(description)).toBeVisible();
      await expect(
        page.getByRole("link", { name: `Call +91 ${phoneNumber}` }),
      ).toBeVisible();
      await expect(page.getByText(address)).toBeVisible();

      // Open edit form again to verify data persistence
      await openFacilityConfigurationsItem(page, "Edit Facility Details");
      const editDialog = page.getByRole("dialog", { name: "Edit Facility" });
      await expect(editDialog).toBeVisible();

      // Verify all edited fields contain the new data
      await expect(
        editDialog.getByRole("textbox", { name: "Description" }),
      ).toHaveText(description);
      await expect(
        editDialog.getByRole("textbox", { name: "Phone Number" }),
      ).toHaveValue(`+91 ${phoneNumber}`);
      await expect(
        editDialog.getByRole("spinbutton", { name: "PIN Code" }),
      ).toHaveValue(pinCode);
      await expect(
        editDialog.getByRole("textbox", { name: "Address" }),
      ).toHaveValue(address);
    },
  );

  test(
    "Verify phone number link redirects to calling app from facility details page",
    { tag: ["@atomic", "@cap:facility.details.view"] },
    async ({ page }) => {
      await openOwnFacility(page);

      const phoneLink = page.getByRole("link", {
        name: `Call +91 ${phoneNumber}`,
      });
      // The href uses the raw E.164 number; the formatted number is display-only
      await expect(phoneLink).toHaveAttribute(
        "href",
        `tel:+91${phoneNumber.replace(/\s/g, "")}`,
      );
      await expect(phoneLink).toHaveText(`+91 ${phoneNumber}`);
    },
  );

  test(
    "Add location to an existing facility and verify Show on Map link redirection",
    { tag: ["@atomic", "@cap:facility.edit"] },
    async ({ page }) => {
      await openOwnFacility(page);

      // A facility created without a location has no map link yet
      await expect(page.getByRole("link", { name: "Show on Map" })).toHaveCount(
        0,
      );

      // Add location to the facility
      await updateFacilityViaUi(page, { locationSearch: locationName });

      // Verify "Show on Map" link is now visible
      const mapLink = page.getByRole("link", { name: "Show on Map" });
      await expect(mapLink).toBeVisible();

      // Verify the href contains a map URL (Google Maps or similar)
      const mapHref = await mapLink.getAttribute("href");
      expect(mapHref).toMatch(/maps\.google\.com|openstreetmap\.org/);
    },
  );

  test(
    "Create facility with mandatory fields and delete it",
    { tag: ["@atomic", "@cap:facility.delete"] },
    async ({ page }) => {
      await test.step("Create facility with mandatory fields", async () => {
        await openOwnFacility(page);
      });

      await deleteFacilityViaUi(page, { name: facilityName });

      // Search for the deleted facility
      await page
        .getByRole("textbox", { name: "Search by facility name" })
        .fill(facilityName);

      // Verify the facility is no longer visible in the list
      await expect(
        page.getByRole("link", { name: "View Facility" }),
      ).toBeHidden();
    },
  );
});
