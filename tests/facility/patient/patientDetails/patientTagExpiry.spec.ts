import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import type { PatientRead } from "../../../../src/types/emr/patient/patient";
import {
  TagCategory,
  TagResource,
  TagStatus,
  type TagConfig,
  type TagUpdateRequest,
} from "../../../../src/types/emr/tagConfig/tagConfig";

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1440, height: 1000 },
  timezoneId: "UTC",
});

type TagScope = "instance" | "facility";

interface PatientTagWrite {
  action: string;
  body: TagUpdateRequest & { facility?: string | null };
}

async function mockPatientTags(
  page: Page,
  scope: TagScope,
  modificationAllowed = false,
  holdRefetch = false,
) {
  const facilityId = faker.string.uuid();
  const expiry = "2099-01-02T12:30:00Z";
  const newTag = (tagScope: TagScope): TagConfig => ({
    id: faker.string.uuid(),
    display: `Patient ${tagScope} expiry ${faker.word.words(2)} ${faker.string.alphanumeric(6)}`,
    category: TagCategory.CLINICAL,
    description: faker.lorem.sentence(),
    level_cache: 0,
    cache_expiry: "2099-01-01T00:00:00Z",
    metadata: { color: "#15803D" },
    expiry_metadata: {
      autoset_expiry: true,
      modification_allowed: modificationAllowed,
      expiry_offset: { hours: 8 },
    },
    priority: 100,
    status: TagStatus.ACTIVE,
    system_generated: false,
    has_children: false,
    resource: TagResource.PATIENT,
    ...(tagScope === "facility" && { facility: facilityId }),
  });
  const tag = newTag(scope);
  const otherTag = newTag(scope === "instance" ? "facility" : "instance");
  const sameScopeTag = newTag(scope);
  const patient: PatientRead = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    gender: "female",
    phone_number: "+919876543210",
    date_of_birth: "1990-01-15",
    year_of_birth: 1990,
    created_date: "2026-01-01T00:00:00Z",
    modified_date: "2026-01-01T00:00:00Z",
    instance_tags: scope === "facility" ? [otherTag] : [sameScopeTag],
    facility_tags: scope === "instance" ? [otherTag] : [sameScopeTag],
    instance_identifiers: [],
    facility_identifiers: [],
    permissions: ["can_read_patient", "can_write_patient"],
    extensions: {},
  };
  const detailPath = `/api/v1/patient/${patient.id}/`;
  const writes: PatientTagWrite[] = [];
  let refreshReady = Promise.resolve();
  let releaseRefresh = () => {};

  await page.addInitScript(() => {
    localStorage.setItem("care_access_token", "patient-tag-expiry-test");
  });
  // Keep authentication, reads, and writes independent of backend fixtures.
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      const method = request.method();

      if (method === "GET" && pathname === "/api/v1/users/getcurrentuser/") {
        await route.fulfill({
          json: {
            id: faker.string.uuid(),
            username: "patient-expiry-admin",
            first_name: "Expiry",
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
          },
        });
      } else if (method === "GET" && pathname === detailPath) {
        await refreshReady;
        await route.fulfill({ json: patient });
      } else if (method === "GET" && pathname === "/api/v1/tag_config/") {
        await route.fulfill({
          json: { count: 3, results: [tag, otherTag, sameScopeTag] },
        });
      } else if (
        method === "POST" &&
        [
          "set_instance_tags",
          "remove_instance_tags",
          "set_facility_tags",
          "remove_facility_tags",
        ].some((action) => pathname === `${detailPath}${action}/`)
      ) {
        const action = pathname.split("/").filter(Boolean).at(-1)!;
        const body = request.postDataJSON() as PatientTagWrite["body"];
        writes.push({
          action,
          body,
        });
        const tagsKey = action.includes("facility")
          ? "facility_tags"
          : "instance_tags";
        patient[tagsKey] = action.startsWith("set_")
          ? [...patient[tagsKey], { ...tag, expiry }]
          : patient[tagsKey].filter(
              (current) =>
                !body.tags.some((removed) => removed.tag === current.id),
            );
        if (holdRefetch) {
          refreshReady = new Promise<void>((resolve) => {
            releaseRefresh = resolve;
          });
        }
        // Instance actions return without facility context. They must not erase
        // the facility tags already selected on a facility patient profile.
        await route.fulfill({
          json: action.includes("instance")
            ? { ...patient, facility_tags: [] }
            : patient,
        });
      } else {
        await route.abort();
      }
    },
  );

  return {
    tag,
    otherTag,
    facilityId,
    expiry,
    writes,
    releasePatientRefresh: () => releaseRefresh(),
    url: `/facility/${facilityId}/patient/${patient.id}/demography`,
  };
}

async function openTagSelector(page: Page) {
  await page
    .locator("#tags")
    .getByRole("button", { name: "Edit", exact: true })
    .click();
}

for (const scope of ["instance", "facility"] as const) {
  test(`patient ${scope} tag set and unset send object requests and preserve the other scope`, async ({
    page,
  }) => {
    const {
      tag,
      otherTag,
      facilityId,
      expiry,
      writes,
      url,
      releasePatientRefresh,
    } = await mockPatientTags(page, scope, false, true);
    await page.goto(url);
    const expectedScope = scope === "facility" ? { facility: facilityId } : {};

    await test.step("Assign the tag with the configured expiry", async () => {
      await openTagSelector(page);
      await page
        .getByRole("menu")
        .getByText(tag.display, { exact: true })
        .click();
      await expect.poll(() => writes.length).toBe(1);
      expect(writes[0]).toEqual({
        action: `set_${scope}_tags`,
        body: {
          tags: [{ tag: tag.id }],
          ...expectedScope,
        },
      });
      try {
        // Hold the refetch so it cannot hide incorrect mutation-response merging.
        await expect(
          page.getByRole("menu").getByRole("checkbox", { checked: true }),
        ).toHaveCount(3);
        await expect(
          page.getByRole("menu").getByText(otherTag.display, { exact: true }),
        ).toBeVisible();
      } finally {
        releasePatientRefresh();
      }
      await page.keyboard.press("Escape");
      const expiryTime = page
        .locator("#tags")
        .locator(`time[datetime="${expiry}"]`);
      await expect(expiryTime).toBeVisible();
      await expect(expiryTime).toHaveAttribute(
        "aria-label",
        "Expires 02 Jan 2099, 12:30 PM",
      );
    });

    await test.step("Remove only the assigned tag with its original scope", async () => {
      await openTagSelector(page);
      await page
        .getByRole("menu")
        .getByText(tag.display, { exact: true })
        .click();
      await expect.poll(() => writes.length).toBe(2);
      expect(writes[1]).toEqual({
        action: `remove_${scope}_tags`,
        body: {
          tags: [{ tag: tag.id }],
          ...expectedScope,
        },
      });
      try {
        await expect(
          page.getByRole("menu").getByRole("checkbox", { checked: true }),
        ).toHaveCount(2);
        await expect(
          page.getByRole("menu").getByText(otherTag.display, { exact: true }),
        ).toBeVisible();
      } finally {
        releasePatientRefresh();
      }
      await page.keyboard.press("Escape");
      await expect(
        page.locator("#tags").locator(`time[datetime="${expiry}"]`),
      ).toHaveCount(0);
    });
  });

  test(`patient ${scope} tags support custom expiry and render the assigned timestamp`, async ({
    page,
  }) => {
    const { tag, facilityId, expiry, writes, url } = await mockPatientTags(
      page,
      scope,
      true,
    );
    await page.goto(url);

    await test.step("Choose a custom expiry before assigning the patient tag", async () => {
      await openTagSelector(page);
      await page
        .getByRole("menu")
        .getByText(tag.display, { exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Tag expiry",
        exact: true,
      });
      await dialog.getByRole("checkbox", { name: "Set custom expiry" }).check();
      await dialog
        .getByRole("spinbutton", { name: "Hours", exact: true })
        .fill("12");
      await dialog
        .getByRole("spinbutton", { name: "minutes", exact: true })
        .fill("30");
      expect(writes).toHaveLength(0);
      await dialog
        .getByRole("button", { name: "Apply tag", exact: true })
        .click();
    });

    await test.step("Preserve the chosen offset and facility scope in the request", async () => {
      await expect.poll(() => writes.length).toBe(1);
      expect(writes[0]).toEqual({
        action: `set_${scope}_tags`,
        body: {
          tags: [
            {
              tag: tag.id,
              expiry_offset: { days: 0, hours: 12, minutes: 30, seconds: 0 },
            },
          ],
          ...(scope === "facility" && { facility: facilityId }),
        },
      });
      await page.keyboard.press("Escape");
      await expect(
        page.locator("#tags").locator(`time[datetime="${expiry}"]`),
      ).toBeVisible();
    });
  });
}
