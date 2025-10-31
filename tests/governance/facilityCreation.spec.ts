import { faker } from "@faker-js/faker";
import { test } from "@playwright/test";

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

  const facilityType = faker.helpers.arrayElement(FACILITY_TYPES);
  const facilityName = `${faker.company.name()} ${faker.location.city()}`;
  const facilityFeatures = faker.helpers.arrayElements(FACILITY_FEATURES, 2);
  const description = faker.lorem.sentence();
  const phoneNumber = faker.string
    .numeric(10)
    .replace(/(\d{5})(\d{5})/, "$1 $2");
  const pinCode = faker.string.numeric(6);
  const address = faker.location.streetAddress();

  test("Create a new facility via organization", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Governance" }).click();
    await page
      .getByRole("link", { name: /Government$/ })
      .first()
      .click();
    await page.getByRole("menuitem", { name: "Facilities" }).click();
    await page.getByRole("button", { name: "Add Facility" }).click();
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Facility Type" })
      .click();
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
    await page.getByRole("button", { name: "Get Current Location" }).click();
    await page.getByRole("button", { name: "Create Facility" }).click();
  });
});
