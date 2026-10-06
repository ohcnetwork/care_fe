import { faker } from "@faker-js/faker";
import { Page, expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

// Non-superuser: superadmins bypass object permission checks entirely.
test.use({ storageState: "tests/.auth/nurse.json" });

const VIEW_CLINICAL_DATA = "can_view_clinical_data";
const WRITE_PATIENT = "can_write_patient";

/**
 * Overrides the `permissions` array returned by the patient detail endpoint
 * so the Notes tab RBAC can be exercised deterministically (issue #16642).
 */
async function overridePatientPermissions(
  page: Page,
  transform: (permissions: string[]) => string[],
) {
  await page.route(/\/api\/v1\/patient\/[^/?]+\/(\?.*)?$/, async (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    const response = await route.fetch();
    const body = await response.json();
    body.permissions = transform(body.permissions ?? []);
    await route.fulfill({ response, json: body });
  });
}

const withPermissions =
  (include: string[], exclude: string[]) => (permissions: string[]) => [
    ...new Set([
      ...permissions.filter((p) => !exclude.includes(p)),
      ...include,
    ]),
  ];

test.describe("Patient Notes - Permissions (RBAC)", () => {
  let patientUrl: string;

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to the first patient's profile via an encounter
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    );
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();
    await page.getByRole("link", { name: "View Profile" }).click();
    await expect(page.getByRole("tab", { name: "Notes" })).toBeVisible();

    patientUrl = page.url();
  });

  test("should hide Notes tab without can_view_clinical_data", async ({
    page,
  }) => {
    await overridePatientPermissions(
      page,
      withPermissions([], [VIEW_CLINICAL_DATA]),
    );
    await page.goto(patientUrl);

    // Page has loaded (other tabs render) but Notes is not offered
    await expect(page.getByRole("tab").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Notes" })).toHaveCount(0);
  });

  test("should allow read-only access with can_view_clinical_data but without can_write_patient", async ({
    page,
  }) => {
    const threadTitle = `RBAC Thread ${faker.string.alphanumeric(8)}`;
    const message = `RBAC message: ${faker.lorem.sentence()}`;

    await test.step("Seed a thread and message with full access", async () => {
      await page.getByRole("tab", { name: "Notes" }).click();
      await page.getByRole("button", { name: /New/i }).first().click();
      await page
        .getByPlaceholder("Enter discussion title...")
        .fill(threadTitle);
      await page.getByRole("button", { name: /Create/i }).click();
      await expect(page.getByText("Thread created successfully")).toBeVisible();
      await page.getByPlaceholder("Type your message...").fill(message);
      await page.getByRole("button", { name: "Send message" }).click();
      await expect(page.getByText(message)).toBeVisible();
    });

    await test.step("Remove can_write_patient and reload", async () => {
      await overridePatientPermissions(
        page,
        withPermissions([VIEW_CLINICAL_DATA], [WRITE_PATIENT]),
      );
      await page.goto(patientUrl);
      await page.getByRole("tab", { name: "Notes" }).click();
    });

    await test.step("Existing notes are readable", async () => {
      await page.getByRole("button").filter({ hasText: threadTitle }).click();
      await expect(page.getByText(message)).toBeVisible();
    });

    await test.step("Cannot create threads or reply", async () => {
      await expect(
        page.getByRole("button", { name: /^New$/i }),
      ).not.toBeVisible();
      await expect(
        page.getByPlaceholder("Type your message..."),
      ).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Send message" }),
      ).not.toBeVisible();
    });
  });

  test("should retain read/write access with can_view_clinical_data and can_write_patient", async ({
    page,
  }) => {
    const threadTitle = `RBAC Thread ${faker.string.alphanumeric(8)}`;
    const message = `RBAC message: ${faker.lorem.sentence()}`;

    await overridePatientPermissions(
      page,
      withPermissions([VIEW_CLINICAL_DATA, WRITE_PATIENT], []),
    );
    await page.goto(patientUrl);
    await page.getByRole("tab", { name: "Notes" }).click();

    await page.getByRole("button", { name: /New/i }).first().click();
    await page.getByPlaceholder("Enter discussion title...").fill(threadTitle);
    await page.getByRole("button", { name: /Create/i }).click();
    await expect(page.getByText("Thread created successfully")).toBeVisible();
    await expect(
      page.getByRole("button").filter({ hasText: threadTitle }),
    ).toBeVisible();

    const messageInput = page.getByPlaceholder("Type your message...");
    await messageInput.fill(message);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(messageInput).toBeEmpty();
    await expect(page.getByText(message)).toBeVisible();
  });
});
