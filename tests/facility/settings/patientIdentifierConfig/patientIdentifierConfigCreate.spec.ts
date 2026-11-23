import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createFacilityPatientIdentifierConfigViaUi,
  createInstancePatientIdentifierConfigViaApi,
} from "tests/helper/facilitySettings";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Patient Identifier Config - Create", () => {
  let facilityId: string;
  let displayName: string;
  let description: string;
  let systemUrl: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    displayName = faker.lorem.words(2);
    description = faker.lorem.sentence();
    systemUrl = faker.internet.url();

    await page.goto(
      `/facility/${facilityId}/settings/patient_identifier_config`,
    );
  });

  test(
    "should create a facility-level patient identifier config",
    {
      tag: ["@atomic", "@cap:facility.patient-identifier-config.create"],
    },
    async ({ page }) => {
      await createFacilityPatientIdentifierConfigViaUi(page, {
        facilityId,
        use: "official",
        display: displayName,
        description,
        system: systemUrl,
        status: "Active",
      });

      await test.step("Verify the config is listed for the facility", async () => {
        await page
          .getByRole("textbox", { name: "Search configs" })
          .fill(displayName);

        const tableBody = page.locator('[data-slot="table-body"]');
        await expect(tableBody).toContainText(displayName);
        await expect(tableBody).toContainText(systemUrl);
        await expect(tableBody).toContainText("official");
        await expect(tableBody).toContainText("Active");
      });

      await test.step("Verify the config is not listed at instance level", async () => {
        await page.goto("/admin/patient_identifier_config");
        await page
          .getByRole("textbox", { name: "Search configs" })
          .fill(displayName);
        await expect(page.getByText("No configs found")).toBeVisible();
      });
    },
  );

  test(
    "should not allow a system already used at instance level",
    {
      tag: ["@atomic", "@cap:facility.patient-identifier-config.create"],
    },
    async ({ page }) => {
      await test.step("Create an instance-level config with a system URL", async () => {
        // A draft config of its own, rather than whichever instance config the
        // environment lists first; drafts never show on registration forms.
        ({ system: systemUrl } =
          await createInstancePatientIdentifierConfigViaApi());
      });

      await test.step("Try to reuse it for the facility", async () => {
        await page.goto(
          `/facility/${facilityId}/settings/patient_identifier_config`,
        );
        await page
          .getByRole("button", { name: "Add patient identifier config" })
          .click();
        await page.getByRole("textbox", { name: "Display" }).fill(displayName);
        await page
          .getByRole("textbox", { name: "Description" })
          .fill(description);
        await page.getByRole("textbox", { name: "System" }).fill(systemUrl);
        await page.getByRole("button", { name: "Create" }).click();

        await expect(
          page.getByText(
            "A patient identifier config with this system already exists",
          ),
        ).toBeVisible();
      });
    },
  );
});
