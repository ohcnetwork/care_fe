import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import type {
  PatientCreate,
  PatientRead,
} from "../../../src/types/emr/patient/patient";
import {
  TagCategory,
  TagResource,
  TagStatus,
  type TagConfig,
} from "../../../src/types/emr/tagConfig/tagConfig";
import type { Organization } from "../../../src/types/organization/organization";

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1440, height: 1000 },
});

test("patient registration sends selected tags as objects without a custom expiry", async ({
  page,
}) => {
  const facilityId = faker.string.uuid();
  const name = faker.person.fullName();
  const tag: TagConfig = {
    id: faker.string.uuid(),
    display: `Registration tag ${faker.word.words(2)} ${faker.string.alphanumeric(6)}`,
    category: TagCategory.CLINICAL,
    description: "",
    level_cache: 0,
    cache_expiry: "2099-01-01T00:00:00Z",
    metadata: {},
    priority: 100,
    status: TagStatus.ACTIVE,
    system_generated: false,
    has_children: false,
    resource: TagResource.PATIENT,
  };
  const organization: Organization = {
    id: faker.string.uuid(),
    name: `Registration state ${faker.word.words(2)}`,
    org_type: "govt",
    level_cache: 0,
    has_children: false,
    active: true,
    metadata: { govt_org_type: "state" },
    permissions: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
  const creates: PatientCreate[] = [];
  let createdPatient: PatientRead | undefined;

  await page.addInitScript(() => {
    localStorage.setItem("care_access_token", "patient-registration-tag-test");
  });
  // Mock every API call, including registration, so this contract test is
  // independent of backend fixtures and cannot change a remote patient record.
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const pathname = url.pathname;
      const method = request.method();

      if (method === "GET" && pathname === "/api/v1/users/getcurrentuser/") {
        await route.fulfill({
          json: {
            id: faker.string.uuid(),
            username: "registration-tags-admin",
            first_name: "Registration",
            last_name: "Admin",
            user_type: "administrator",
            is_superuser: true,
            permissions: [],
            facilities: [],
            organizations: [],
            preferences: {},
            flags: [],
          },
        });
      } else if (method === "GET" && pathname === "/api/v1/plug_config/") {
        await route.fulfill({ json: { configs: [] } });
      } else if (method === "GET" && pathname === "/api/v1/extensions/") {
        await route.fulfill({ json: {} });
      } else if (
        method === "GET" &&
        pathname === `/api/v1/facility/${facilityId}/`
      ) {
        await route.fulfill({
          json: {
            id: facilityId,
            name: `Facility ${faker.word.words(2)}`,
            permissions: [],
            root_org_permissions: [],
            features: [],
            patient_instance_identifier_configs: [],
            patient_facility_identifier_configs: [],
          },
        });
      } else if (method === "GET" && pathname === "/api/v1/organization/") {
        await route.fulfill({ json: { count: 1, results: [organization] } });
      } else if (
        method === "GET" &&
        pathname.startsWith("/api/v1/organization/")
      ) {
        const id = pathname.split("/").filter(Boolean).at(-1)!;
        await route.fulfill({ json: { ...organization, id } });
      } else if (method === "GET" && pathname === "/api/v1/tag_config/") {
        await route.fulfill({ json: { count: 1, results: [tag] } });
      } else if (
        method === "GET" &&
        pathname === `/api/v1/tag_config/${tag.id}/`
      ) {
        await route.fulfill({ json: tag });
      } else if (method === "POST" && pathname === "/api/v1/patient/search/") {
        await route.fulfill({ json: { partial: false, results: [] } });
      } else if (method === "POST" && pathname === "/api/v1/patient/") {
        const body = request.postDataJSON() as PatientCreate;
        creates.push(body);
        createdPatient = {
          ...body,
          id: faker.string.uuid(),
          year_of_birth: 1990,
          created_date: "2026-01-01T00:00:00Z",
          modified_date: "2026-01-01T00:00:00Z",
          geo_organization: organization,
          instance_tags: [tag],
          facility_tags: [],
          instance_identifiers: [],
          facility_identifiers: [],
          permissions: [],
        };
        await route.fulfill({ json: createdPatient });
      } else if (
        method === "POST" &&
        pathname === "/api/v1/patient/search_retrieve/"
      ) {
        await route.fulfill({ json: createdPatient });
      } else {
        await route.abort();
      }
    },
  );

  await test.step("Fill registration details and select a patient tag", async () => {
    await page.goto(`/facility/${facilityId}/patient/create`);
    await page.getByRole("textbox", { name: /name.*\*/i }).fill(name);
    await page
      .getByRole("textbox", { name: /phone number.*\*/i })
      .fill("9876543210");
    await page.getByRole("radio", { name: "Female", exact: true }).click();
    await page.getByPlaceholder("DD", { exact: true }).fill("15");
    await page.getByPlaceholder("MM", { exact: true }).fill("01");
    await page.getByPlaceholder("YYYY", { exact: true }).fill("1990");

    await page.getByRole("button", { name: "Add Tags", exact: true }).click();
    await page
      .getByRole("menu")
      .getByText(tag.display, { exact: true })
      .click();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: tag.display, exact: true }),
    ).toBeVisible();

    const additionalDetails = page.getByRole("button", {
      name: /Additional Details/,
    });
    if ((await additionalDetails.getAttribute("aria-expanded")) === "false") {
      await additionalDetails.click();
    }
    const region = page.getByRole("region", { name: /Additional Details/ });
    await region
      .getByRole("textbox", { name: /Address/ })
      .fill(faker.location.streetAddress());
    await region
      .getByRole("spinbutton", { name: "PIN Code", exact: true })
      .fill("302020");
    await region.getByRole("combobox").click();
    await page
      .getByRole("option", { name: organization.name, exact: true })
      .click();
  });

  await test.step("Register with the nonempty tag object array", async () => {
    await page.getByRole("button", { name: /Register Patient/i }).click();
    await page.waitForURL("**/patients/home**");
    expect(creates).toHaveLength(1);
    expect(creates[0]).toMatchObject({
      name,
      geo_organization: organization.id,
    });
    expect(creates[0].tags).toEqual([{ tag: tag.id }]);
  });
});
