import { faker } from "@faker-js/faker";
import { createHealthcareServiceViaUi } from "tests/helper/healthcareService";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare service creation", () => {
  test(
    "should create a healthcare service and find it in the services list",
    { tag: ["@atomic", "@cap:service.create"] },
    async ({ page, facilityId }) => {
      const name = `${faker.string.alphanumeric(5)} ${faker.commerce.productName()}`;

      // Creates a Pharmacy service at the Pharmacy location from settings.
      await createHealthcareServiceViaUi(page, { facilityId, name });

      await test.step("Find the service in the services list", async () => {
        await page.goto(`/facility/${facilityId}/services`);
        await page
          .getByRole("textbox", {
            name: "Search healthcare services...",
            exact: true,
          })
          .fill(name);
        await expect(page.getByRole("link", { name })).toBeVisible();
      });

      await test.step("Open the service", async () => {
        await page.getByRole("link", { name }).click();
        await expect(
          page.getByRole("heading", { level: 1, name, exact: true }),
        ).toBeVisible();
      });
    },
  );
});
