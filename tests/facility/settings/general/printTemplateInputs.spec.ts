import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import type { FacilityRead } from "@/types/facility/facility";
import type { PrintTemplate } from "@/types/facility/printTemplate";
import type { CurrentUserRead } from "@/types/user/user";

test.use({ storageState: { cookies: [], origins: [] } });

let facility: FacilityRead;
let savedTemplates: PrintTemplate[][];

test.beforeEach(async ({ page }) => {
  facility = {
    id: faker.string.uuid(),
    name: faker.company.name(),
    facility_type: "Private Hospital",
    description: "",
    address: "12 Example Road",
    phone_number: "+919876543210",
    latitude: "12.3",
    longitude: "76.6",
    is_public: true,
    features: [],
    geo_organization: {
      id: faker.string.uuid(),
      name: "Kerala",
      org_type: "govt",
      metadata: { govt_org_type: "state" },
      level_cache: 1,
      has_children: false,
      active: true,
      created_at: "",
      updated_at: "",
      permissions: [],
    },
    permissions: [],
    root_org_permissions: ["can_update_facility"],
    child_org_permissions: [],
    print_templates: [
      {
        slug: "default",
        page: { margin: { top: 10, bottom: 10, left: 10, right: 10 } },
        branding: {
          logo: { url: "https://example.com/original.png", alignment: "left" },
        },
      },
      { slug: "invoice", watermark: { enabled: true, text: "Invoice" } },
    ],
    instance_discount_codes: [],
    instance_discount_monetary_components: [],
    instance_informational_codes: [],
    instance_tax_codes: [],
    instance_tax_monetary_components: [],
    invoice_number_expression: "",
    discount_codes: [],
    discount_monetary_components: [],
    discount_configuration: null,
    patient_instance_identifier_configs: [],
    patient_facility_identifier_configs: [],
  };
  const user: CurrentUserRead = {
    id: faker.string.uuid(),
    username: faker.internet.username(),
    first_name: "Template",
    last_name: "Test",
    phone_number: "",
    user_type: "administrator",
    gender: "male",
    last_login: "",
    profile_picture_url: "",
    mfa_enabled: false,
    deleted: false,
    is_service_account: false,
    communication: [],
    qualification: [],
    email: "",
    flags: [],
    permissions: [],
    is_superuser: true,
    facilities: [{ id: facility.id, name: facility.name }],
    organizations: [],
    pf_endpoint: null,
    pf_p256dh: null,
    pf_auth: null,
    preferences: {},
  };
  savedTemplates = [];
  await page.addInitScript(() => {
    localStorage.setItem("care_access_token", "print-template-test");
    localStorage.setItem("i18nextLng", "en");
  });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/users/getcurrentuser/") {
      await route.fulfill({ json: user });
    } else if (path === `/api/v1/facility/${facility.id}/`) {
      if (route.request().method() === "PUT") {
        const { print_templates }: Pick<FacilityRead, "print_templates"> = route
          .request()
          .postDataJSON();
        savedTemplates.push(print_templates);
        facility = { ...facility, print_templates };
      } else {
        expect(route.request().method()).toBe("GET");
      }
      await route.fulfill({ json: facility });
    } else if (path === "/api/v1/plug_config/") {
      await route.fulfill({ json: { configs: [] } });
    } else if (route.request().method() === "GET") {
      await route.fulfill({ json: { count: 0, results: [] } });
    } else {
      throw new Error(
        `Unexpected API mutation in print template test: ${path}`,
      );
    }
  });
});

async function openPrintTemplates(page: Page, keyboard = false) {
  const trigger = page.getByRole("button", {
    name: "Configurations",
    exact: true,
  });
  const item = page.getByRole("menuitem", {
    name: "Print Templates",
    exact: true,
  });
  if (keyboard) {
    await trigger.press("Enter");
    await page.keyboard.press("p");
    await expect(item).toBeFocused();
    await page.keyboard.press("Enter");
  } else {
    await trigger.click();
    await item.click();
  }
  await expect(page.getByRole("menu")).toHaveCount(0);
  const sheet = page.getByRole("dialog", {
    name: "Print Templates",
    exact: true,
  });
  await expect(sheet).toBeVisible();
  return sheet;
}

test("keyboard-opened print templates retain typed decimals and URLs and discard cancelled edits", async ({
  page,
}) => {
  await page.goto(`/facility/${facility.id}/settings/general`);
  await expect(page.locator("#app-loading")).toBeHidden();
  const sheet = await openPrintTemplates(page, true);
  const pageSettings = sheet.getByRole("button", { name: "Page Settings" });
  await expect(pageSettings).toHaveCount(2);
  await pageSettings.first().click();
  const margin = sheet.getByRole("spinbutton").first();
  await expect(margin).toHaveValue("10");
  await margin.press("ControlOrMeta+a");
  await margin.pressSequentially("12.5");
  await expect(margin).toHaveValue("12.5");
  await sheet
    .getByRole("button", { name: "Branding", exact: true })
    .first()
    .click();
  const logoUrl = sheet
    .getByPlaceholder("https://...", { exact: true })
    .first();
  await expect(logoUrl).toHaveValue("https://example.com/original.png");
  await logoUrl.clear();
  await logoUrl.pressSequentially("https://example.com/logo.png");
  await expect(logoUrl).toHaveValue("https://example.com/logo.png");
  await expect(logoUrl).toBeFocused();
  await sheet.getByRole("button", { name: "Add Print Template" }).click();
  await expect(pageSettings).toHaveCount(3);
  await sheet.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(sheet).not.toBeVisible();

  await openPrintTemplates(page);
  await expect(pageSettings).toHaveCount(2);
  await pageSettings.first().click();
  await expect(margin).toHaveValue("10");
  await sheet
    .getByRole("button", { name: "Branding", exact: true })
    .first()
    .click();
  await expect(logoUrl).toHaveValue("https://example.com/original.png");
  expect(savedTemplates).toEqual([]);
});

test("saving retains other templates and reopening loads the saved values", async ({
  page,
}) => {
  const originalTemplates = structuredClone(facility.print_templates);
  await page.goto(`/facility/${facility.id}/settings/general`);
  const sheet = await openPrintTemplates(page);
  await sheet
    .getByRole("button", { name: "Page Settings", exact: true })
    .first()
    .click();
  const margin = sheet.getByRole("spinbutton").first();
  await margin.press("ControlOrMeta+a");
  await margin.pressSequentially("12.5");
  await expect(margin).toHaveValue("12.5");
  await sheet.getByRole("button", { name: "Add Print Template" }).click();
  await sheet.getByRole("button", { name: "Save", exact: true }).click();
  await expect(sheet).toBeHidden();
  expect(savedTemplates).toEqual([
    [
      {
        ...originalTemplates[0],
        page: { margin: { top: 12.5, bottom: 10, left: 10, right: 10 } },
      },
      originalTemplates[1],
    ],
  ]);

  await openPrintTemplates(page);
  await expect(
    sheet.getByRole("button", { name: "Page Settings" }),
  ).toHaveCount(2);
  await sheet
    .getByRole("button", { name: "Page Settings", exact: true })
    .first()
    .click();
  await expect(margin).toHaveValue("12.5");
});

for (const printTemplates of [
  null,
  {},
  { default: { page: { size: "A4" } } },
]) {
  test(`legacy templates ${JSON.stringify(printTemplates)} open without crashing`, async ({
    page,
  }) => {
    await page.route(`**/api/v1/facility/${facility.id}/`, (route) =>
      route.fulfill({
        json: { ...facility, print_templates: printTemplates },
      }),
    );
    await page.goto(`/facility/${facility.id}/settings/general`);
    const sheet = await openPrintTemplates(page);
    await expect(
      sheet.getByRole("button", { name: "Page Settings" }),
    ).toHaveCount(0);
    await sheet.getByRole("button", { name: "Add Print Template" }).click();
    await expect(
      sheet.getByRole("button", { name: "Page Settings" }),
    ).toHaveCount(1);
    await sheet.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(sheet).toBeHidden();
    expect(savedTemplates).toEqual([]);
  });
}
