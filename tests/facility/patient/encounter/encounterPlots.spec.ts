import { expect, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Plots Tab", () => {
  let plotsUrl: string;

  test.beforeEach(() => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();

    plotsUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/plots`;
  });

  test("renders empty state without crashing when plots config is empty", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error);
    });

    await test.step("Stub the plots config endpoint with an empty array", async () => {
      await page.route("**/config/plots.json*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        }),
      );
    });

    await test.step("Navigate to the Plots tab", async () => {
      await page.goto(plotsUrl);
      await expect(page.getByRole("tab", { name: "Plots" })).toHaveAttribute(
        "data-state",
        "active",
      );
    });

    await test.step("Verify the empty state renders", async () => {
      await expect(page.getByText("No plots configured")).toBeVisible();
    });

    await test.step("Verify the tab did not crash", async () => {
      expect(pageErrors).toHaveLength(0);
    });
  });
});
