import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Creation", () => {
  const FACILITY_TYPES = [
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

  const FACILITY_FEATURES = [
    "CT Scan",
    "Maternity Care",
    "Operation Theater",
    "Neonatal Care",
    "X-Ray",
  ];

  let facilityType: string;
  let facilityName: string;
  let facilityFeatures: string[];
  let description: string;
  let phoneNumber: string;
  let pinCode: string;
  let address: string;

  test.beforeEach(async ({ page }) => {
    // Generate unique test data for each test run
    facilityType = faker.helpers.arrayElement(FACILITY_TYPES);
    facilityName = `${faker.company.name()} ${faker.location.city()}`;
    facilityFeatures = faker.helpers.arrayElements(FACILITY_FEATURES, 2);
    description = faker.lorem.sentence();
    phoneNumber = `987${faker.string.numeric(7)}`.replace(
      /(\d{5})(\d{5})/,
      "$1 $2",
    );
    pinCode = `67${faker.string.numeric(4)}`;
    address = faker.location.streetAddress();

    await page.goto("/");
    await page.getByRole("tab", { name: "Governance" }).click();
    await page
      .getByRole("link", { name: /Government$/ })
      .first()
      .click();
    await page.getByRole("menuitem", { name: "Facilities" }).click();
  });

  test("Create a new facility with all fields", async ({ page }) => {
    await page.getByRole("button", { name: "Add Facility" }).click();
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Facility Type" })
      .click();
    await page.getByPlaceholder("Search facility type").fill(facilityType);
    await page.getByRole("option", { name: facilityType }).click();
    await page
      .getByRole("textbox", { name: "Facility Name *" })
      .fill(facilityName);
    await page.getByRole("textbox", { name: "Description" }).fill(description);
    await page
      .getByRole("button", { name: "Select Facility Features" })
      .click();

    for (const feature of facilityFeatures) {
      await page
        .getByRole("option", { name: new RegExp(`Select ${feature}`) })
        .click();
    }

    await page.getByRole("dialog", { name: "Add New Facility" }).click();
    await page
      .getByRole("textbox", { name: "Phone Number *" })
      .fill(phoneNumber);
    await page.getByRole("spinbutton", { name: "PIN Code *" }).fill(pinCode);
    await page.getByRole("textbox", { name: "Address *" }).fill(address);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Search for a location" })
      .click();
    await page.getByPlaceholder("Search option...").fill("ernakulam");
    const locationOption = page.getByRole("option", {
      name: "Ernakulam, Kerala, India",
    });
    await locationOption.waitFor({ state: "visible" });
    await locationOption.click();
    await page.getByRole("button", { name: "Create Facility" }).click();

    // Verify facility was created successfully
    await expect(page.getByText("Facility created successfully")).toBeVisible();

    // Navigate to the created facility
    await page
      .getByRole("textbox", { name: "Search by facility name" })
      .click();
    await page
      .getByRole("textbox", { name: "Search by facility name" })
      .fill(facilityName);
    await page.getByRole("link", { name: "View Facility" }).click();

    // Verify facility details
    await expect(
      page.getByRole("heading", { name: facilityName }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: facilityType }),
    ).toBeVisible();
    await expect(page.getByText(address)).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
    await expect(
      page.getByRole("link", { name: `Call +91 ${phoneNumber}` }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Show on Map" })).toBeVisible();

    // Verify facility features are displayed
    for (const feature of facilityFeatures) {
      await expect(page.getByText(feature)).toBeVisible();
    }

    await page.getByRole("button", { name: "Edit Facility Details" }).click();

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
    ).toHaveValue(description);

    // Verify facility features are displayed in the form
    for (const feature of facilityFeatures) {
      await expect(editDialog.getByText(feature)).toBeVisible();
    }

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
  });

  test("Create a facility with only mandatory fields", async ({ page }) => {
    await page.getByRole("button", { name: "Add Facility" }).click();
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Facility Type" })
      .click();
    await page.getByPlaceholder("Search facility type").fill(facilityType);
    await page.getByRole("option", { name: facilityType }).click();
    await page
      .getByRole("textbox", { name: "Facility Name *" })
      .fill(facilityName);

    // Skip description field (optional)
    // Skip facility features (optional)

    await page.getByRole("dialog", { name: "Add New Facility" }).click();
    await page
      .getByRole("textbox", { name: "Phone Number *" })
      .fill(phoneNumber);
    await page.getByRole("spinbutton", { name: "PIN Code *" }).fill(pinCode);
    await page.getByRole("textbox", { name: "Address *" }).fill(address);
    // Skip location search (optional)
    await page.getByRole("button", { name: "Create Facility" }).click();

    // Verify facility was created successfully
    await expect(page.getByText("Facility created successfully")).toBeVisible();

    // Navigate to the created facility
    await page
      .getByRole("textbox", { name: "Search by facility name" })
      .click();
    await page
      .getByRole("textbox", { name: "Search by facility name" })
      .fill(facilityName);
    await page.getByRole("link", { name: "View Facility" }).click();

    // Verify facility details - only mandatory fields should be visible
    await expect(
      page.getByRole("heading", { name: facilityName }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: facilityType }),
    ).toBeVisible();
    await expect(page.getByText(address)).toBeVisible();
    await expect(
      page.getByRole("link", { name: `Call +91 ${phoneNumber}` }),
    ).toBeVisible();

    // Verify "Show on Map" is NOT visible since we didn't provide location
    await expect(
      page.getByRole("link", { name: "Show on Map" }),
    ).not.toBeVisible();

    // Verify optional fields are NOT visible (description and features)
    // Description should not be displayed if it was not provided
    const descriptionSection = page.locator("text=Description").first();
    await expect(descriptionSection).not.toBeVisible();

    // Open edit form
    await page.getByRole("button", { name: "Edit Facility Details" }).click();

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
    ).toHaveValue("");

    // Verify no facility features are selected
    const featuresButton = editDialog.getByRole("button", {
      name: /^(Select Facility Features|Features)$/,
    });
    await expect(featuresButton).toBeVisible();

    // Check that no feature badges are displayed in the form
    for (const feature of FACILITY_FEATURES) {
      const featureBadge = editDialog.getByText(feature, { exact: true });
      await expect(featureBadge).not.toBeVisible();
    }
  });

  test("Validate required fields in facility creation form", async ({
    page,
  }) => {
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
    ).not.toBeVisible();

    await expect(dialog.getByText("Features").first()).toBeVisible();
    await expect(
      dialog.locator('p[data-slot="form-message"]', { hasText: /feature/i }),
    ).not.toBeVisible();
  });

  test("Edit a facility and verify changes", async ({ page }) => {
    // Click on the first View Facility link
    await page.getByRole("link", { name: "View Facility" }).first().click();

    // Click Edit Facility Details button
    await page.getByRole("button", { name: "Edit Facility Details" }).click();

    // Wait for edit dialog
    const editDialog = page.getByRole("dialog", { name: "Edit Facility" });
    await expect(editDialog).toBeVisible();

    // Update fields with data from beforeEach
    await editDialog
      .getByRole("textbox", { name: "Description" })
      .fill(description);
    await editDialog
      .getByRole("textbox", { name: "Phone Number" })
      .fill(phoneNumber);
    await editDialog
      .getByRole("spinbutton", { name: "PIN Code" })
      .fill(pinCode);
    await editDialog.getByRole("textbox", { name: "Address" }).fill(address);

    // Save changes
    await editDialog.getByRole("button", { name: "Update Facility" }).click();

    // Verify success message
    await expect(
      page.getByText(/Facility updated successfully|Updated successfully/i),
    ).toBeVisible();

    // Wait for dialog to close
    await expect(editDialog).not.toBeVisible();

    // Verify changes on the facility details page
    await expect(page.getByText(description)).toBeVisible();
    await expect(
      page.getByRole("link", { name: `Call +91 ${phoneNumber}` }),
    ).toBeVisible();
    await expect(page.getByText(address)).toBeVisible();

    // Open edit form again to verify data persistence
    await page.getByRole("button", { name: "Edit Facility Details" }).click();
    await expect(editDialog).toBeVisible();

    // Verify all edited fields contain the new data
    await expect(
      editDialog.getByRole("textbox", { name: "Description" }),
    ).toHaveValue(description);
    await expect(
      editDialog.getByRole("textbox", { name: "Phone Number" }),
    ).toHaveValue(`+91 ${phoneNumber}`);
    await expect(
      editDialog.getByRole("spinbutton", { name: "PIN Code" }),
    ).toHaveValue(pinCode);
    await expect(
      editDialog.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(address);
  });
});
